import { NextResponse } from "next/server";
import { getRequestLogs, clearRequestLogs } from "@/lib/debug-log";

export async function GET() {
  const logs = await getRequestLogs();
  return NextResponse.json({ logs, count: logs.length }, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function DELETE() {
  await clearRequestLogs();
  return NextResponse.json({ cleared: true });
}
