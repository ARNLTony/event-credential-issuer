import { NextRequest, NextResponse } from "next/server";
import { addRequestLog } from "@/lib/debug-log";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Log all .well-known and API requests
  if (path.startsWith("/.well-known") || path.startsWith("/api")) {
    await addRequestLog(
      request.method,
      path,
      request.headers.get("user-agent") || "",
      request.headers.get("accept") || ""
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/.well-known/:path*", "/api/:path*"],
};
