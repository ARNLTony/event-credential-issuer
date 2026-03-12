import { NextRequest, NextResponse } from "next/server";
import { getPreAuthorizedCodeData } from "@/lib/store";
import { addRequestLog } from "@/lib/debug-log";

// ---------------------------------------------------------------------------
// GET /api/credential-offer/:code
// Returns the credential offer JSON for a given pre-authorized code.
// This enables shorter QR codes: instead of embedding the entire offer in the
// openid-credential-offer:// URI, a QR can point to this HTTPS URL.
//
// This endpoint does NOT consume the code -- consumption happens at the
// token endpoint when the wallet exchanges it for an access token.
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  await addRequestLog("GET", `/api/credential-offer/${code}`, _request.headers.get("user-agent") || "");

  if (!code) {
    return NextResponse.json(
      { error: "invalid_request", error_description: "Missing code parameter." },
      { status: 400 }
    );
  }

  const eventData = await getPreAuthorizedCodeData(code);
  if (!eventData) {
    return NextResponse.json(
      {
        error: "invalid_grant",
        error_description: "The credential offer code is invalid, expired, or has already been used.",
      },
      { status: 404 }
    );
  }

  const issuerUrl =
    process.env.NEXT_PUBLIC_ISSUER_URL ?? "http://localhost:3000";

  const credentialOffer = {
    credential_issuer: issuerUrl,
    credential_configuration_ids: ["EventAttendanceCredential"],
    grants: {
      "urn:ietf:params:oauth:grant-type:pre-authorized_code": {
        "pre-authorized_code": code,
      },
    },
  };

  return NextResponse.json(credentialOffer, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
