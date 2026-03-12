import { randomBytes, randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EventData {
  event_name: string;
  event_date: string;
  attendee_name: string;
  location: string;
}

export interface PreAuthorizedCodeEntry {
  code: string;
  eventData: EventData;
  createdAt: number;
  consumed: boolean;
}

export interface TokenEntry {
  token: string;
  eventData: EventData;
  createdAt: number;
  expiresAt: number;
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

/** Maps pre-authorized code -> entry */
const preAuthorizedCodes = new Map<string, PreAuthorizedCodeEntry>();

/** Maps access_token -> entry */
const accessTokens = new Map<string, TokenEntry>();

// ---------------------------------------------------------------------------
// Pre-authorized code helpers
// ---------------------------------------------------------------------------

const CODE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Create a new pre-authorized code for an event.
 * Returns the code string that the wallet will present at the token endpoint.
 */
export function createPreAuthorizedCode(eventData: EventData): string {
  const code = randomUUID();

  preAuthorizedCodes.set(code, {
    code,
    eventData,
    createdAt: Date.now(),
    consumed: false,
  });

  return code;
}

/**
 * Validate and consume a pre-authorized code.
 * Returns the associated event data on success, or null if the code is
 * invalid, expired, or already consumed.
 */
export function consumePreAuthorizedCode(
  code: string
): EventData | null {
  const entry = preAuthorizedCodes.get(code);
  if (!entry) return null;
  if (entry.consumed) return null;
  if (Date.now() - entry.createdAt > CODE_TTL_MS) {
    preAuthorizedCodes.delete(code);
    return null;
  }

  entry.consumed = true;
  return entry.eventData;
}

// ---------------------------------------------------------------------------
// Access token helpers
// ---------------------------------------------------------------------------

const TOKEN_TTL_S = 86_400; // 24 hours

/**
 * Generate and store an access token associated with event data.
 * Returns the opaque token string.
 */
export function storeToken(eventData: EventData): string {
  const token = randomBytes(32).toString("hex");
  const now = Date.now();

  accessTokens.set(token, {
    token,
    eventData,
    createdAt: now,
    expiresAt: now + TOKEN_TTL_S * 1000,
  });

  return token;
}

/**
 * Validate an access token and return its associated event data,
 * or null if the token is invalid or expired.
 */
export function validateToken(token: string): EventData | null {
  const entry = accessTokens.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    accessTokens.delete(token);
    return null;
  }
  return entry.eventData;
}

/**
 * Return the token TTL in seconds (used by the token endpoint response).
 */
export function getTokenTtlSeconds(): number {
  return TOKEN_TTL_S;
}
