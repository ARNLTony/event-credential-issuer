import { NextRequest, NextResponse } from "next/server";
import { importJWK, SignJWT, jwtVerify, decodeProtectedHeader } from "jose";
import { validateToken, consumeNonce, storeNonce } from "@/lib/store";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ISSUER_URL =
  process.env.NEXT_PUBLIC_ISSUER_URL ?? "http://localhost:3000";

function errorResponse(
  error: string,
  description: string,
  status: number
) {
  return NextResponse.json(
    { error, error_description: description },
    { status }
  );
}

/**
 * Create a single SD-JWT disclosure.
 * A disclosure is a JSON array: [salt, claim_name, claim_value]
 * Base64url-encoded.
 */
function createDisclosure(
  salt: string,
  claimName: string,
  claimValue: string
): string {
  const disclosure = JSON.stringify([salt, claimName, claimValue]);
  return base64UrlEncode(disclosure);
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sha256Hash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Buffer.from(hashBuffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function generateSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// ---------------------------------------------------------------------------
// POST /api/credential
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // --- Extract and validate Bearer token ------------------------------------
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return errorResponse(
      "invalid_token",
      "Missing or malformed Authorization header. Expected: Bearer <token>.",
      401
    );
  }

  const accessToken = authHeader.slice("Bearer ".length).trim();
  const eventData = await validateToken(accessToken);
  if (!eventData) {
    return errorResponse(
      "invalid_token",
      "The access token is invalid or expired.",
      401
    );
  }

  // --- Parse request body ---------------------------------------------------
  let body: {
    format?: string;
    credential_identifier?: string;
    proof?: { proof_type?: string; jwt?: string };
  };

  try {
    body = await request.json();
  } catch {
    return errorResponse(
      "invalid_request",
      "Unable to parse JSON request body.",
      400
    );
  }

  // --- Validate format and credential_identifier ----------------------------
  if (body.format !== "vc+sd-jwt") {
    return errorResponse(
      "unsupported_credential_format",
      'Only format "vc+sd-jwt" is supported.',
      400
    );
  }

  if (body.credential_identifier !== "EventAttendanceCredential") {
    return errorResponse(
      "unsupported_credential_type",
      'Only credential_identifier "EventAttendanceCredential" is supported.',
      400
    );
  }

  // --- Validate proof -------------------------------------------------------
  if (
    !body.proof ||
    body.proof.proof_type !== "jwt" ||
    !body.proof.jwt
  ) {
    return errorResponse(
      "invalid_proof",
      "A valid JWT proof of possession is required.",
      400
    );
  }

  const proofJwt = body.proof.jwt;

  // Decode the protected header to extract the wallet's public key
  let header: { alg?: string; typ?: string; jwk?: JsonWebKey };
  try {
    header = decodeProtectedHeader(proofJwt) as {
      alg?: string;
      typ?: string;
      jwk?: JsonWebKey;
    };
  } catch {
    return errorResponse(
      "invalid_proof",
      "Unable to decode proof JWT header.",
      400
    );
  }

  if (header.typ !== "openid4vci-proof+jwt") {
    return errorResponse(
      "invalid_proof",
      'Proof JWT header "typ" must be "openid4vci-proof+jwt".',
      400
    );
  }

  if (!header.jwk) {
    return errorResponse(
      "invalid_proof",
      "Proof JWT header must contain a \"jwk\" parameter with the holder's public key.",
      400
    );
  }

  // Import the wallet's public key and verify the proof JWT signature
  let proofPayload: { aud?: string; nonce?: string; iat?: number };
  try {
    const walletPublicKey = await importJWK(header.jwk, header.alg || "ES256");
    const { payload } = await jwtVerify(proofJwt, walletPublicKey, {
      typ: "openid4vci-proof+jwt",
    });
    proofPayload = payload as typeof proofPayload;
  } catch (err) {
    return errorResponse(
      "invalid_proof",
      `Proof JWT signature verification failed: ${err instanceof Error ? err.message : "unknown error"}.`,
      400
    );
  }

  // Validate audience
  if (proofPayload.aud !== ISSUER_URL) {
    return errorResponse(
      "invalid_proof",
      `Proof JWT "aud" must be "${ISSUER_URL}".`,
      400
    );
  }

  // Validate and consume the c_nonce
  if (!proofPayload.nonce || !(await consumeNonce(proofPayload.nonce))) {
    return errorResponse(
      "invalid_nonce",
      "The c_nonce in the proof JWT is missing, invalid, expired, or already used.",
      400
    );
  }

  // --- Build SD-JWT VC ------------------------------------------------------
  try {
    const privateJwk = JSON.parse(process.env.ISSUER_PRIVATE_JWK!);
    const signingKey = await importJWK(privateJwk, "ES256");

    // Create disclosures for selectively disclosable claims
    const disclosableClaims: [string, string][] = [
      ["event_name", eventData.event_name],
      ["event_date", eventData.event_date],
      ["attendee_name", eventData.attendee_name],
      ["location", eventData.location],
    ];

    const disclosures: string[] = [];
    const sdHashes: string[] = [];

    for (const [claimName, claimValue] of disclosableClaims) {
      const salt = generateSalt();
      const disclosure = createDisclosure(salt, claimName, claimValue);
      disclosures.push(disclosure);

      const hash = await sha256Hash(disclosure);
      sdHashes.push(hash);
    }

    // Build the SD-JWT payload
    const now = Math.floor(Date.now() / 1000);

    const sdJwtPayload = {
      iss: ISSUER_URL,
      iat: now,
      vct: `${ISSUER_URL}/credentials/EventAttendanceCredential`,
      cnf: {
        jwk: header.jwk,
      },
      _sd: sdHashes,
      _sd_alg: "sha-256",
    };

    // Sign the issuer JWT
    const issuerJwt = await new SignJWT(sdJwtPayload)
      .setProtectedHeader({
        alg: "ES256",
        typ: "vc+sd-jwt",
        kid: privateJwk.kid,
      })
      .sign(signingKey);

    // Assemble the full SD-JWT: <issuer-jwt>~<disclosure1>~<disclosure2>~...~
    const sdJwt = issuerJwt + "~" + disclosures.join("~") + "~";

    // Issue a fresh c_nonce for subsequent requests
    const newNonce = await storeNonce();

    return NextResponse.json(
      {
        credential: sdJwt,
        format: "vc+sd-jwt",
        c_nonce: newNonce,
        c_nonce_expires_in: 300,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          Pragma: "no-cache",
        },
      }
    );
  } catch (err) {
    console.error("Credential issuance error:", err);
    return errorResponse(
      "server_error",
      "An internal error occurred while issuing the credential.",
      500
    );
  }
}
