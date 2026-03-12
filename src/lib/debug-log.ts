import { Redis } from "@upstash/redis";

const redis =
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    ? new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
      })
    : null;

export interface LogEntry {
  timestamp: string;
  method: string;
  path: string;
  userAgent?: string;
  extra?: string;
}

const LOG_KEY = "debug:request_logs";

export async function addRequestLog(method: string, path: string, userAgent?: string, extra?: string) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    method,
    path,
    userAgent: userAgent || undefined,
    extra: extra || undefined,
  };

  if (redis) {
    await redis.lpush(LOG_KEY, JSON.stringify(entry));
    await redis.ltrim(LOG_KEY, 0, 99); // keep last 100
  }
}

export async function getRequestLogs(): Promise<LogEntry[]> {
  if (!redis) return [];
  const raw = await redis.lrange(LOG_KEY, 0, 99);
  return raw.map((r) => (typeof r === "string" ? JSON.parse(r) : r) as LogEntry);
}

export async function clearRequestLogs() {
  if (redis) await redis.del(LOG_KEY);
}
