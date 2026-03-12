import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// GET /.well-known/jwks.json
// Returns the issuer's public key in JWKS format so wallets and verifiers
// can look up the signing key to verify issued credentials.
// ---------------------------------------------------------------------------

export async function GET() {
  const publicJwkRaw = process.env.ISSUER_PUBLIC_JWK;

  if (!publicJwkRaw) {
    console.error("ISSUER_PUBLIC_JWK environment variable is not set.");
    return NextResponse.json(
      { error: "server_error", error_description: "Issuer public key is not configured." },
      { status: 500 }
    );
  }

  let publicJwk: Record<string, unknown>;
  try {
    publicJwk = JSON.parse(publicJwkRaw);
  } catch {
    console.error("ISSUER_PUBLIC_JWK is not valid JSON.");
    return NextResponse.json(
      { error: "server_error", error_description: "Issuer public key configuration is invalid." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { keys: [publicJwk] },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
