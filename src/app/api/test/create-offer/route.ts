import { NextResponse } from "next/server";
import { createPreAuthorizedCode } from "@/lib/store";

/**
 * DEV-ONLY: Create a pre-authorized code for testing the token endpoint.
 * This will be replaced by the real event creation flow in Day 2.
 */
export async function POST() {
  const code = await createPreAuthorizedCode({
    event_name: "Amsterdam Blockchain Summit 2026",
    event_date: "2026-06-15",
    attendee_name: "Test Attendee",
    location: "Amsterdam, Netherlands",
  });

  const issuerUrl = process.env.NEXT_PUBLIC_ISSUER_URL || "http://localhost:3000";

  return NextResponse.json({
    pre_authorized_code: code,
    credential_offer: {
      credential_issuer: issuerUrl,
      credential_configuration_ids: ["EventAttendanceCredential"],
      grants: {
        "urn:ietf:params:oauth:grant-type:pre-authorized_code": {
          "pre-authorized_code": code,
        },
      },
    },
  });
}
