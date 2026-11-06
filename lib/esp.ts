// Real-hardware ESP helpers. The request-sending logic is preserved verbatim from the
// original app.js so behaviour against the physical ESP32 is unchanged.

import { emitRequestLog } from "./requestLog";
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
  const started = Date.now();
  try {
    await fetch(requestUrl, {
      method: "GET",
      mode: "no-cors",
      cache: "no-store",
    });
    emitRequestLog({
      source: "control",
      method: "GET",
      url: requestUrl.toString(),
      request: { [cmd.parameter]: cmd.value },
      status: null,
      ok: true,
      durationMs: Date.now() - started,
      response: "dispatched (no-cors, response body not readable)",
    });
  } catch (error) {
    emitRequestLog({
      source: "control",
      method: "GET",
      url: requestUrl.toString(),
      request: { [cmd.parameter]: cmd.value },
      status: null,
      ok: false,
      durationMs: Date.now() - started,
      error: (error as Error).message,
    });
    throw error;
  }
  return requestUrl;
}

/**
 * Poll the security ESP's /status (ported from script.js pollESP1). Goes through our own
 * `/api/security-status` proxy rather than hitting the ESP directly: the browser can't read
 * the ESP's JSON cross-origin (the firmware sends no `Access-Control-Allow-Origin` header),
 * but the Next.js server can fetch it server-to-server and relay it from our own origin.
 */
export async function fetchSecurityStatusReal(esp1Ip: string): Promise<Esp1Status> {
  const target = `${normalizeUrl(esp1Ip)}/status`;
  const url = `/api/security-status?ip=${encodeURIComponent(esp1Ip)}`;
  const started = Date.now();
  const res = await fetch(url, {
    signal: AbortSignal.timeout(3000),
    cache: "no-store",
  });
  const text = await res.text();
  let parsed: { error?: string } & Partial<Esp1Status> | null = null;
  try {
    parsed = text ? (JSON.parse(text) as { error?: string } & Partial<Esp1Status>) : null;
  } catch {
    parsed = null;
  }
  if (!res.ok) {
    const message = parsed?.error ?? `Status proxy returned ${res.status}`;
    emitRequestLog({
      source: "security",
      method: "GET",
      url: target,
      status: res.status,
      ok: false,
      durationMs: Date.now() - started,
      response: parsed ?? text,
      error: message,
    });
    throw new Error(message);
  }
  const data = parsed ?? {};
  const status: Esp1Status = {
    state: data.state ?? "LOCKED",
    greenLed: data.greenLed ?? false,
    timerRunning: data.timerRunning ?? false,
    time: data.time ?? 0,
  };
  emitRequestLog({
    source: "security",
    method: "GET",
    url: target,
    status: res.status,
    ok: true,
    durationMs: Date.now() - started,
    response: status,
  });
  return status;
}
