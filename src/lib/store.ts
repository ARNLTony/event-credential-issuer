import { randomBytes, randomUUID } from "crypto";
import { Redis } from "@upstash/redis";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EventData {
  event_name: string;
  event_date: string;
  attendee_name: string;
  location: string;
}

interface PreAuthorizedCodeEntry {
  eventData: EventData;
  consumed: boolean;
}

interface TokenEntry {
  eventData: EventData;
  expiresAt: number;
}

// ---------------------------------------------------------------------------
// Redis client (optional — falls back to in-memory for local dev)
// ---------------------------------------------------------------------------

const redis =
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    ? new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
      })
    : null;

// In-memory fallback stores (local dev only)
const memCodes = new Map<string, PreAuthorizedCodeEntry>();
const memTokens = new Map<string, TokenEntry>();
const memNonces = new Set<string>();

// ---------------------------------------------------------------------------
// TTL constants
// ---------------------------------------------------------------------------

const CODE_TTL_S = 5 * 60; // 5 minutes
const TOKEN_TTL_S = 86_400; // 24 hours
const NONCE_TTL_S = 5 * 60; // 5 minutes

// ---------------------------------------------------------------------------
// Pre-authorized code helpers
// ---------------------------------------------------------------------------

export async function createPreAuthorizedCode(eventData: EventData): Promise<string> {
  const code = randomUUID();
  const entry: PreAuthorizedCodeEntry = { eventData, consumed: false };

  if (redis) {
    await redis.set(`code:${code}`, JSON.stringify(entry), { ex: CODE_TTL_S });
  } else {
    memCodes.set(code, entry);
    setTimeout(() => memCodes.delete(code), CODE_TTL_S * 1000);
  }

  return code;
}

export async function consumePreAuthorizedCode(code: string): Promise<EventData | null> {
  if (redis) {
    const raw = await redis.get<string>(`code:${code}`);
    if (!raw) return null;
    const entry: PreAuthorizedCodeEntry = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (entry.consumed) return null;
    // Mark consumed and keep for a short time so we can detect replay
    entry.consumed = true;
    await redis.set(`code:${code}`, JSON.stringify(entry), { ex: 60 });
    return entry.eventData;
  } else {
    const entry = memCodes.get(code);
    if (!entry || entry.consumed) return null;
    entry.consumed = true;
    return entry.eventData;
  }
}

export async function getPreAuthorizedCodeData(code: string): Promise<EventData | null> {
  if (redis) {
    const raw = await redis.get<string>(`code:${code}`);
    if (!raw) return null;
    const entry: PreAuthorizedCodeEntry = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (entry.consumed) return null;
    return entry.eventData;
  } else {
    const entry = memCodes.get(code);
    if (!entry || entry.consumed) return null;
    return entry.eventData;
  }
}

// ---------------------------------------------------------------------------
// Access token helpers
// ---------------------------------------------------------------------------

export async function storeToken(eventData: EventData): Promise<{
  token: string;
  cNonce: string;
}> {
  const token = randomBytes(32).toString("hex");
  const entry: TokenEntry = {
    eventData,
    expiresAt: Date.now() + TOKEN_TTL_S * 1000,
  };

  if (redis) {
    await redis.set(`token:${token}`, JSON.stringify(entry), { ex: TOKEN_TTL_S });
  } else {
    memTokens.set(token, entry);
    setTimeout(() => memTokens.delete(token), TOKEN_TTL_S * 1000);
  }

  const cNonce = await storeNonce();
  return { token, cNonce };
}

export async function validateToken(token: string): Promise<EventData | null> {
  if (redis) {
    const raw = await redis.get<string>(`token:${token}`);
    if (!raw) return null;
    const entry: TokenEntry = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Date.now() > entry.expiresAt) return null;
    return entry.eventData;
  } else {
    const entry = memTokens.get(token);
    if (!entry || Date.now() > entry.expiresAt) return null;
    return entry.eventData;
  }
}

export function getTokenTtlSeconds(): number {
  return TOKEN_TTL_S;
}

// ---------------------------------------------------------------------------
// Nonce helpers (c_nonce for proof-of-possession)
// ---------------------------------------------------------------------------

export async function storeNonce(): Promise<string> {
  const nonce = randomBytes(16).toString("base64url");

  if (redis) {
    await redis.set(`nonce:${nonce}`, "1", { ex: NONCE_TTL_S });
  } else {
    memNonces.add(nonce);
    setTimeout(() => memNonces.delete(nonce), NONCE_TTL_S * 1000);
  }

  return nonce;
}

export async function consumeNonce(nonce: string): Promise<boolean> {
  if (redis) {
    // DEL returns number of keys removed — 1 means it existed
    const removed = await redis.del(`nonce:${nonce}`);
    return removed === 1;
  } else {
    if (!memNonces.has(nonce)) return false;
    memNonces.delete(nonce);
    return true;
  }
}
