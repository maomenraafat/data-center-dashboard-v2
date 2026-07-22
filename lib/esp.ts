// Real-hardware ESP helpers. The request-sending logic is preserved verbatim from the
// original app.js so behaviour against the physical ESP32 is unchanged.

import type { ControlCommand, Esp1Status } from "./types";

/** Prepend http:// if the user omitted a scheme (from app.js normalizeUrl). */
export function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
}

/** Validation from app.js: value must be an integer >= 1. */
export function isValidControlValue(value: number): boolean {
  return Number.isInteger(value) && value >= 1;
}

/** Build the request URL exactly like app.js (path + single query parameter). */
export function buildControlUrl(baseUrl: string, cmd: ControlCommand): URL {
  const requestUrl = new URL(normalizeUrl(baseUrl));
  requestUrl.pathname = cmd.path;
  requestUrl.search = "";
  requestUrl.searchParams.set(cmd.parameter, String(cmd.value));
  return requestUrl;
}

/**
 * Fire a GET at the control ESP. Uses `mode: "no-cors"` like app.js, so the response is
 * opaque and this resolves as long as the request leaves the browser.
 */
export async function sendControlReal(baseUrl: string, cmd: ControlCommand): Promise<URL> {
  const requestUrl = buildControlUrl(baseUrl, cmd);
  await fetch(requestUrl, {
    method: "GET",
    mode: "no-cors",
    cache: "no-store",
  });
  return requestUrl;
}

/**
 * Poll the security ESP's /status (ported from script.js pollESP1). Goes through our own
 * `/api/security-status` proxy rather than hitting the ESP directly: the browser can't read
 * the ESP's JSON cross-origin (the firmware sends no `Access-Control-Allow-Origin` header),
 * but the Next.js server can fetch it server-to-server and relay it from our own origin.
 */
export async function fetchSecurityStatusReal(esp1Ip: string): Promise<Esp1Status> {
  const url = `/api/security-status?ip=${encodeURIComponent(esp1Ip)}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(3000),
    cache: "no-store",
  });
  if (!res.ok) {
    // Surface the proxy's reason (wrong board, unreachable, timeout) to the caller.
    const detail = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(detail?.error ?? `Status proxy returned ${res.status}`);
  }
  const data = (await res.json()) as Partial<Esp1Status>;
  return {
    state: data.state ?? "LOCKED",
    greenLed: data.greenLed ?? false,
    timerRunning: data.timerRunning ?? false,
    time: data.time ?? 0,
  };
}
