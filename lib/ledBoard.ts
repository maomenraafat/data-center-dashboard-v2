// Drives the ESP32 board from a Site A scenario.
// Calls go through /api/led so the browser can read the result. Scenario
// paths are POST /api/trail comets, one request per flow.

import { normalizeUrl } from "@/lib/esp";
import { emitRequestLog } from "@/lib/requestLog";
import { sceneTrails } from "@/lib/siteA";

type LedResult = { ok: true; summary: string; url: string } | { ok: false; summary: string; url: string };

async function callBoard(ip: string, method: "GET" | "POST", path: string, body?: unknown): Promise<unknown> {
  const url = `${new URL(normalizeUrl(ip)).origin}${path}`;
  const started = Date.now();
  let status: number | null = null;
  let data: { error?: string } | null = null;
  try {
    const res = await fetch("/api/led", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ ip, method, path, body }),
    });
    status = res.status;
    data = (await res.json().catch(() => null)) as { error?: string } | null;
    emitRequestLog({
      source: "led",
      method,
      url,
      request: body,
      status,
      ok: res.ok,
      durationMs: Date.now() - started,
      response: data,
      error: res.ok ? undefined : (data?.error ?? `HTTP ${res.status}`),
    });
    if (!res.ok) {
      throw new Error(data?.error ?? `LED board returned HTTP ${res.status}`);
    }
    return data;
  } catch (error) {
    if (status === null) {
      emitRequestLog({
        source: "led",
        method,
        url,
        request: body,
        status: null,
        ok: false,
        durationMs: Date.now() - started,
        error: (error as Error).message,
      });
    }
    throw error;
  }
}

const TRAIL_SHAPE = {
  trailLength: 8,
  fade: true,
  intensity: 255,
  speed: 20,
} as const;

function trailUrl(ip: string) {
  return `${new URL(normalizeUrl(ip)).origin}/api/trail`;
}

// '1' is forward along the strip, '2' is reversed. The board also still accepts
// the older [{code, reverse}] path, which is why those calls returned 200.
function trailPath(hops: { code: string; reverse: boolean }[]) {
  return hops.map((hop) => `${hop.code}${hop.reverse ? "2" : "1"}`).join(" ");
}

async function postTrail(ip: string, hops: { code: string; reverse: boolean }[], color: string) {
  await callBoard(ip, "POST", "/api/trail", { path: trailPath(hops), ...TRAIL_SHAPE, color });
}

/** Push one topology mode onto the board as trail comets. One POST /api/trail per flow. */
export async function playSiteAMode(ip: string, mode: number): Promise<LedResult> {
  const url = trailUrl(ip);
  const trails = sceneTrails(mode);
  if (trails.length === 0) {
    return { ok: false, url, summary: "No trail for this scenario" };
  }
  try {
    for (const trail of trails) {
      await postTrail(ip, trail.hops, trail.color);
    }
    return { ok: true, url, summary: `Trail sent: ${trails.map((trail) => trail.label).join(" · ")}` };
  } catch (error) {
    return { ok: false, url, summary: (error as Error).message };
  }
}

/** Sample POST /api/trail body from the board docs: one comet across three Site A links. */
export const TRAIL_TEST = {
  path: ["WAN-R5", "B", "A"],
  trailLength: 8,
  fade: true,
  color: "#00E5FF",
  intensity: 255,
  speed: 20,
  reverse: false,
} as const;

export async function sendSiteATrail(ip: string): Promise<LedResult> {
  const url = trailUrl(ip);
  try {
    await postTrail(
      ip,
      TRAIL_TEST.path.map((code) => ({ code, reverse: false })),
      TRAIL_TEST.color,
    );
    return { ok: true, url, summary: `Trail sent: ${TRAIL_TEST.path.join(" → ")}` };
  } catch (error) {
    return { ok: false, url, summary: (error as Error).message };
  }
}

export type TrailHop = { code: string; reverse: boolean };

/** Round-trip comet. 1 follows the strip, 2 walks it backward. */
export async function sendRouteTrail(ip: string, hops: TrailHop[], label: string): Promise<LedResult> {
  const url = trailUrl(ip);
  try {
    await postTrail(ip, hops, "#00E5FF");
    return { ok: true, url, summary: `Trail sent: ${label}` };
  } catch (error) {
    return { ok: false, url, summary: (error as Error).message };
  }
}

type DisasterHop = { code: string; reverse: boolean };

/**
 * Disaster uses POST /api/v2/trail. The cut link stays solid red while the comet runs the path.
 * The path digits match /api/trail: 1 forward, 2 reversed. Routing still uses sendRouteTrail.
 */
export async function sendDisasterTrail(
  ip: string,
  hops: DisasterHop[],
  label: string,
  cutLink: string | undefined,
): Promise<LedResult> {
  const url = `${new URL(normalizeUrl(ip)).origin}/api/v2/trail`;
  const body: {
    path: string;
    trailLength: number;
    fade: boolean;
    color: string;
    intensity: number;
    speed: number;
    solid?: { strip: string; color: string; autoOff: boolean };
  } = {
    path: trailPath(hops),
    trailLength: 8,
    fade: true,
    color: "#00E5FF",
    intensity: 255,
    speed: 20,
  };
  if (cutLink) {
    body.solid = { strip: cutLink, color: "#FF0000", autoOff: true };
  }
  try {
    await callBoard(ip, "POST", "/api/v2/trail", body);
    const solid = cutLink ? ` · solid ${cutLink}` : "";
    return { ok: true, url, summary: `Trail sent: ${label}${solid}` };
  } catch (error) {
    return { ok: false, url, summary: (error as Error).message };
  }
}

/**
 * Failover uses POST /api/v2/trail. Every link still marked down is a solid red strip.
 * The previous call is sendRouteTrail (POST /api/trail), left in place on the page.
 */
export async function sendFailoverTrail(
  ip: string,
  hops: { code: string; reverse: boolean }[],
  label: string,
  cutLinks: readonly string[],
): Promise<LedResult> {
  const url = `${new URL(normalizeUrl(ip)).origin}/api/v2/trail`;
  const body: {
    path: string;
    trailLength: number;
    fade: boolean;
    color: string;
    intensity: number;
    speed: number;
    solid?: { strip: string; color: string; autoOff: boolean }[];
  } = {
    path: trailPath(hops),
    trailLength: 8,
    fade: true,
    color: "#00E5FF",
    intensity: 255,
    speed: 20,
  };
  if (cutLinks.length > 0) {
    body.solid = cutLinks.map((strip) => ({ strip, color: "#FF0000", autoOff: true }));
  }
  try {
    await callBoard(ip, "POST", "/api/v2/trail", body);
    const solid = cutLinks.length > 0 ? ` · solid ${cutLinks.join(", ")}` : "";
    return { ok: true, url, summary: `Trail sent: ${label}${solid}` };
  } catch (error) {
    return { ok: false, url, summary: (error as Error).message };
  }
}

/** Two comets at once. trail1 is the chosen server, trail2 is its backup. */
export async function sendLoadBalanceTrail(
  ip: string,
  primary: { code: string; reverse: boolean }[],
  secondary: { code: string; reverse: boolean }[],
  label: string,
): Promise<LedResult> {
  const url = `${new URL(normalizeUrl(ip)).origin}/api/v3/trail`;
  const body = {
    trail1: { path: trailPath(primary), color: "#FF0000", speed: 30, length: 8, fade: true },
    trail2: { path: trailPath(secondary), color: "#0000FF", speed: 30, length: 8, fade: true },
  };
  try {
    await callBoard(ip, "POST", "/api/v3/trail", body);
    return { ok: true, url, summary: `Load balance sent: ${label}` };
  } catch (error) {
    return { ok: false, url, summary: (error as Error).message };
  }
}
