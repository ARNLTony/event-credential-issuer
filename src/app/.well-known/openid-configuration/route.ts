import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// GET /.well-known/openid-configuration
// Standard OAuth 2.0 Authorization Server Metadata (RFC 8414) discovery
// endpoint. Wallets and verifiers use this to discover the issuer's
// token endpoint, credential endpoint, supported grant types, etc.
// ---------------------------------------------------------------------------

export async function GET() {
  const issuerUrl =
    process.env.NEXT_PUBLIC_ISSUER_URL ?? "http://localhost:3000";

  const configuration = {
    issuer: issuerUrl,
    token_endpoint: `${issuerUrl}/api/token`,
    credential_endpoint: `${issuerUrl}/api/credential`,
    jwks_uri: `${issuerUrl}/.well-known/jwks.json`,
    grant_types_supported: [
      "urn:ietf:params:oauth:grant-type:pre-authorized_code",
    ],
    response_types_supported: ["none"],
    token_endpoint_auth_methods_supported: ["none"],
  };

  return NextResponse.json(configuration, {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  });
}
