import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const issuerUrl =
    process.env.NEXT_PUBLIC_ISSUER_URL ?? "http://localhost:3000";

  const metadata = {
    issuer: issuerUrl,
    token_endpoint: `${issuerUrl}/api/token`,
    response_types_supported: ["none"],
    grant_types_supported: [
      "urn:ietf:params:oauth:grant-type:pre-authorized_code",
    ],
    token_endpoint_auth_methods_supported: ["none"],
    jwks_uri: `${issuerUrl}/.well-known/jwks.json`,
    code_challenge_methods_supported: ["S256"],
  };

  return NextResponse.json(metadata, {
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  });
}
