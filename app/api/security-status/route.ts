// Server-side proxy for the security ESP's /status endpoint.
//
// The browser can't read the ESP's JSON directly: the firmware serves no
// `Access-Control-Allow-Origin` header, so a cross-origin fetch from the page
// (localhost:3000 → 10.x.x.x) is blocked by CORS. Here the Next.js server does
// the fetch instead — server-to-server has no CORS — and hands the JSON back to
// our own origin, which the page is always allowed to read.
//
// The dev/prod server must itself be on the same network as the ESP.

import { normalizeUrl } from "@/lib/esp";

// A live poll — never cache, always run at request time.
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const ip = new URL(request.url).searchParams.get("ip");
  if (!ip) {
    return Response.json({ error: "Missing 'ip' query parameter" }, { status: 400 });
  }

  const target = `${normalizeUrl(ip)}/status`;
  try {
    const res = await fetch(target, {
      cache: "no-store",
      redirect: "follow",
      // Some minimal ESP HTTP servers behave differently for bare requests than
      // for browser requests; send browser-ish headers so we match what worked.
      headers: {
        Accept: "application/json, text/plain, */*",
        "User-Agent": "data-center-app/status-proxy",
      },
      signal: AbortSignal.timeout(2500),
    });

    // Read the body once, as text, so we can report it whatever the status/type.
    const bodyText = await res.text();

    if (!res.ok) {
      console.error(
        `[security-status] ${target} -> HTTP ${res.status}. Body: ${bodyText.slice(0, 200)}`,
      );
      return Response.json(
        {
          error: `ESP at ${ip} answered HTTP ${res.status} for /status (expected 200).`,
          upstreamStatus: res.status,
          upstreamBody: bodyText.slice(0, 300),
        },
        { status: 502 },
      );
    }

    try {
      const data = JSON.parse(bodyText);
      return Response.json(data, { headers: { "Cache-Control": "no-store" } });
    } catch {
      console.error(
        `[security-status] ${target} -> 200 but non-JSON body: ${bodyText.slice(0, 200)}`,
      );
      return Response.json(
        {
          error: `ESP at ${ip} returned 200 but the body isn't JSON.`,
          upstreamBody: bodyText.slice(0, 300),
        },
        { status: 502 },
      );
    }
  } catch (error) {
    const message = (error as Error).message;
    console.error(`[security-status] fetch ${target} failed: ${message}`);
    return Response.json(
      { error: `Could not reach ESP at ${ip}: ${message}` },
      { status: 504 },
    );
  }
}
