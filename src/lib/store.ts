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

interface NonceEntry {
  nonce: string;
  createdAt: number;
  consumed: boolean;
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

/** Maps pre-authorized code -> entry */
const preAuthorizedCodes = new Map<string, PreAuthorizedCodeEntry>();

/** Maps access_token -> entry */
const accessTokens = new Map<string, TokenEntry>();

/** Maps c_nonce -> entry */
const nonces = new Map<string, NonceEntry>();

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
 * Also creates and returns a c_nonce for proof-of-possession.
 * Returns an object with the token and the nonce.
 */
export function storeToken(eventData: EventData): {
  token: string;
  cNonce: string;
} {
  const token = randomBytes(32).toString("hex");
  const now = Date.now();

  accessTokens.set(token, {
    token,
    eventData,
    createdAt: now,
    expiresAt: now + TOKEN_TTL_S * 1000,
  });

  const cNonce = storeNonce();

  return { token, cNonce };
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

// ---------------------------------------------------------------------------
// Nonce helpers (c_nonce for proof-of-possession)
// ---------------------------------------------------------------------------

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Create and store a cryptographically random nonce with a 5-minute TTL.
 * Returns the nonce string.
 */
export function storeNonce(): string {
  const nonce = randomBytes(16).toString("base64url");

  nonces.set(nonce, {
    nonce,
    createdAt: Date.now(),
    consumed: false,
  });

  return nonce;
}

/**
 * Validate and consume a c_nonce. Returns true if the nonce was valid
 * and has been consumed, false otherwise (unknown, expired, or already used).
 */
export function consumeNonce(nonce: string): boolean {
  const entry = nonces.get(nonce);
  if (!entry) return false;
  if (entry.consumed) return false;
  if (Date.now() - entry.createdAt > NONCE_TTL_MS) {
    nonces.delete(nonce);
    return false;
  }

  entry.consumed = true;
  return true;
}
