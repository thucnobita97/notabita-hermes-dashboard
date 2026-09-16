// Next.js API route: proxy /api/hermes/* → Hermes backend (port 9119)
// Injects session token server-side (never exposed to browser)

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.HERMES_BACKEND_URL || "http://localhost:9119";
const SESSION_TOKEN = process.env.HERMES_SESSION_TOKEN || "";

async function proxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const backendPath = "/api/" + path.join("/");

  // Forward query string
  const searchParams = request.nextUrl.searchParams.toString();
  const qs = searchParams ? "?" + searchParams : "";
  const targetUrl = BACKEND_URL + backendPath + qs;

  // Build headers (inject auth)
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (SESSION_TOKEN) {
    headers["Authorization"] = "Bearer " + SESSION_TOKEN;
  }

  // Forward request body for POST/PUT/DELETE
  const method = request.method;
  const init: RequestInit = {
    method,
    headers,
  };
  if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    try {
      const body = await request.text();
      if (body) init.body = body;
    } catch {
      // no body
    }
  }

  try {
    const res = await fetch(targetUrl, init);
    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } else {
      const text = await res.text();
      return new NextResponse(text, {
        status: res.status,
        headers: { "Content-Type": contentType },
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Backend unreachable: " + message },
      { status: 502 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const PATCH = proxy;
