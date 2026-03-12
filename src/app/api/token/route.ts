import { NextRequest, NextResponse } from "next/server";
import {
  consumePreAuthorizedCode,
  storeToken,
  getTokenTtlSeconds,
} from "@/lib/store";

const PRE_AUTH_GRANT_TYPE =
  "urn:ietf:params:oauth:grant-type:pre-authorized_code";

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

export async function POST(request: NextRequest) {
  // OID4VCI token requests use application/x-www-form-urlencoded
  let body: URLSearchParams;
  try {
    const text = await request.text();
    body = new URLSearchParams(text);
  } catch {
    return errorResponse(
      "invalid_request",
      "Unable to parse request body.",
      400
    );
  }

  // --- Validate grant_type ---------------------------------------------------
  const grantType = body.get("grant_type");
  if (!grantType) {
    return errorResponse(
      "invalid_request",
      "Missing required parameter: grant_type.",
      400
    );
  }
  if (grantType !== PRE_AUTH_GRANT_TYPE) {
    return errorResponse(
      "unsupported_grant_type",
      `Only "${PRE_AUTH_GRANT_TYPE}" is supported.`,
      400
    );
  }

  // --- Validate pre-authorized_code ------------------------------------------
  const preAuthorizedCode = body.get("pre-authorized_code");
  if (!preAuthorizedCode) {
    return errorResponse(
      "invalid_request",
      "Missing required parameter: pre-authorized_code.",
      400
    );
  }

  const eventData = await consumePreAuthorizedCode(preAuthorizedCode);
  if (!eventData) {
    return errorResponse(
      "invalid_grant",
      "The pre-authorized code is invalid, expired, or has already been used.",
      400
    );
  }

  // --- Issue access token ----------------------------------------------------
  const { token: accessToken, cNonce } = await storeToken(eventData);

  return NextResponse.json(
    {
      access_token: accessToken,
      token_type: "bearer",
      expires_in: getTokenTtlSeconds(),
      c_nonce: cNonce,
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
}
