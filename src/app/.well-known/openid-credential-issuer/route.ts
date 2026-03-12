import { NextRequest, NextResponse } from "next/server";
import { addRequestLog } from "@/lib/debug-log";

export async function GET(request: NextRequest) {
  await addRequestLog("GET", "/.well-known/openid-credential-issuer", request.headers.get("user-agent") || "");
  const issuerUrl =
    process.env.NEXT_PUBLIC_ISSUER_URL ?? "http://localhost:3000";

  const metadata = {
    credential_issuer: issuerUrl,
    credential_endpoint: `${issuerUrl}/api/credential`,
    display: [
      {
        name: "Event Credential Issuer",
        locale: "en",
        logo: {
          uri: `${issuerUrl}/logo.svg`,
          alt_text: "Event Credential Issuer logo",
        },
      },
    ],
    credential_configurations_supported: {
      EventAttendanceCredential: {
        format: "dc+sd-jwt",
        vct: "urn:credential:event-attendance:1",
        scope: "EventAttendanceCredential",
        cryptographic_binding_methods_supported: ["jwk"],
        credential_signing_alg_values_supported: ["ES256"],
        proof_types_supported: {
          jwt: {
            proof_signing_alg_values_supported: ["ES256"],
          },
        },
        credential_metadata: {
          claims: [
            {
              path: ["event_name"],
              display: [{ name: "Event Name", locale: "en" }],
              value_type: "string",
            },
            {
              path: ["event_date"],
              display: [{ name: "Event Date", locale: "en" }],
              value_type: "string",
            },
            {
              path: ["attendee_name"],
              display: [{ name: "Attendee Name", locale: "en" }],
              value_type: "string",
            },
            {
              path: ["location"],
              display: [{ name: "Location", locale: "en" }],
              value_type: "string",
            },
          ],
          display: [
            {
              name: "Event Attendance",
              description:
                "A verifiable credential proving attendance at an event.",
              locale: "en",
              background_color: "#1a1a2e",
              text_color: "#f0a500",
            },
          ],
        },
      },
    },
  };

  return NextResponse.json(metadata, {
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  });
}
