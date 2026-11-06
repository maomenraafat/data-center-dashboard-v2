// Same-origin proxy for the ESP32 LED board (API_DETAILS.md).
// The page posts here; this server calls the board, so a timeout or a
// non-JSON body comes back as a readable error instead of a hung browser fetch.

import { normalizeUrl } from "@/lib/esp";
import { logUpstream } from "@/lib/requestLog";

export const dynamic = "force-dynamic";

const ALLOWED_PATHS = new Set(["/api/status", "/api/packet", "/api/trail", "/api/v2/trail", "/api/leds", "/api/led", "/api/test"]);

type LedProxyBody = {
  ip?: string;
  method?: string;
  path?: string;
  body?: unknown;
};

export async function POST(request: Request): Promise<Response> {
  let payload: LedProxyBody;
  try {
    payload = (await request.json()) as LedProxyBody;
  } catch {
    return Response.json({ error: "LED proxy expected a JSON body" }, { status: 400 });
  }

  const path = payload.path ?? "";
  const method = (payload.method ?? "POST").toUpperCase();
  if (!ALLOWED_PATHS.has(path) || (method !== "GET" && method !== "POST")) {
    return Response.json({ error: `LED path not allowed: ${method} ${path}` }, { status: 400 });
  }
  if (!payload.ip?.trim()) {
    return Response.json({ error: "Missing LED board address" }, { status: 400 });
  }

  let target: string;
  try {
    target = `${new URL(normalizeUrl(payload.ip)).origin}${path}`;
  } catch {
    return Response.json({ error: `Invalid LED board address: ${payload.ip}` }, { status: 400 });
  }

  const started = Date.now();
  const requestBody = method === "POST" ? (payload.body ?? {}) : undefined;
  try {
    const res = await fetch(target, {
      method,
      cache: "no-store",
      headers: {
        Accept: "application/json, text/plain, */*",
        ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
      },
      body: method === "POST" ? JSON.stringify(requestBody) : undefined,
      signal: AbortSignal.timeout(2500),
    });
    const text = await res.text();
    logUpstream("led", method, target, res.status, Date.now() - started, requestBody, text.slice(0, 800));
    if (!res.ok) {
      return Response.json(
        { error: `LED board answered HTTP ${res.status} for ${path}`, upstreamBody: text.slice(0, 300) },
        { status: 502 },
      );
    }
    try {
      return Response.json(text ? JSON.parse(text) : { status: "success" }, {
        headers: { "Cache-Control": "no-store" },
      });
    } catch {
      return Response.json(
        { error: `LED board returned a non-JSON body for ${path}`, upstreamBody: text.slice(0, 300) },
        { status: 502 },
      );
    }
  } catch (error) {
    const message = (error as Error).message;
    logUpstream("led", method, target, null, Date.now() - started, requestBody, message);
    return Response.json(
      { error: `Could not reach LED board at ${payload.ip}: ${message}` },
      { status: 504 },
    );
  }
}
