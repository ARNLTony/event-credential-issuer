import { NextResponse } from "next/server";

export async function GET() {
  const issuerUrl =
    process.env.NEXT_PUBLIC_ISSUER_URL ?? "http://localhost:3000";

  const metadata = {
    credential_issuer: issuerUrl,
    authorization_servers: [issuerUrl],
    credential_endpoint: `${issuerUrl}/api/credential`,
    token_endpoint: `${issuerUrl}/api/token`,
    display: [
      {
        name: "EUDI Event Attendance Credential Issuer",
        locale: "en",
      },
    ],
    credential_configurations_supported: {
      EventAttendanceCredential: {
        format: "vc+sd-jwt",
        scope: "EventAttendanceCredential",
        cryptographic_binding_methods_supported: ["jwk"],
        credential_signing_alg_values_supported: ["ES256"],
        proof_types_supported: {
          jwt: {
            proof_signing_alg_values_supported: ["ES256"],
          },
        },
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
        credential_definition: {
          type: ["VerifiableCredential", "EventAttendanceCredential"],
          credentialSubject: {
            event_name: {
              display: [{ name: "Event Name", locale: "en" }],
            },
            event_date: {
              display: [{ name: "Event Date", locale: "en" }],
            },
            attendee_name: {
              display: [{ name: "Attendee Name", locale: "en" }],
            },
            location: {
              display: [{ name: "Location", locale: "en" }],
            },
          },
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
