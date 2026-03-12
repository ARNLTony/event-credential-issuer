import { NextRequest, NextResponse } from "next/server";
import { createPreAuthorizedCode } from "@/lib/store";

// ---------------------------------------------------------------------------
// POST /api/events
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const ISSUER_URL =
    process.env.NEXT_PUBLIC_ISSUER_URL ?? "http://localhost:3000";

  // --- Parse request body ---------------------------------------------------
  let body: {
    event_name?: string;
    event_date?: string;
    location?: string;
    description?: string;
    attendee_name?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_request", error_description: "Unable to parse JSON body." },
      { status: 400 }
    );
  }

  // --- Validate required fields ---------------------------------------------
  const { event_name, event_date, location, description, attendee_name } = body;

  if (!event_name || !event_date || !location) {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description:
          "Missing required fields: event_name, event_date, and location are required.",
      },
      { status: 400 }
    );
  }

  // --- Create pre-authorized code -------------------------------------------
  const preAuthorizedCode = createPreAuthorizedCode({
    event_name,
    event_date,
    attendee_name: attendee_name ?? "Attendee",
    location,
  });

  // --- Build credential offer -----------------------------------------------
  const credentialOffer = {
    credential_issuer: ISSUER_URL,
    credential_configuration_ids: ["EventAttendanceCredential"],
    grants: {
      "urn:ietf:params:oauth:grant-type:pre-authorized_code": {
        "pre-authorized_code": preAuthorizedCode,
      },
    },
  };

  // Build the openid-credential-offer:// URI
  const credentialOfferUri =
    "openid-credential-offer://?credential_offer=" +
    encodeURIComponent(JSON.stringify(credentialOffer));

  // Generate a simple event ID for reference
  const eventId = crypto.randomUUID();

  return NextResponse.json(
    {
      event_id: eventId,
      credential_offer_uri: credentialOfferUri,
      pre_authorized_code: preAuthorizedCode,
      credential_offer: credentialOffer,
      event: {
        event_name,
        event_date,
        location,
        description: description ?? null,
      },
    },
    { status: 201 }
  );
}
