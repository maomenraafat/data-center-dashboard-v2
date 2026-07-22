"use client";

// UI-facing adapter that every Bloom control screen calls. It translates a simple
// (kind, value) request into the app's existing ESP control logic — real hardware GET in
// "real" mode, the mock hardware simulator in "mock" mode. All wiring lives here so the
// presentational Bloom components stay almost unchanged. It also records the exact request
// URL into LastRequestContext so the on-screen badge can display it.

import { useState } from "react";
import { useEnvironment } from "@/context/EnvironmentContext";
import { useLastRequest } from "@/context/LastRequestContext";
import { useDevOptions } from "@/context/DevOptionsContext";
import { CONTROL_DEFINITIONS, type ControlCommand, type ControlKind } from "@/lib/types";
import { buildControlUrl, isValidControlValue, sendControlReal } from "@/lib/esp";
import { mockEsp } from "@/lib/mockEsp";

/** Cosmetic site selector used by the load-balancing UI. Both sites currently share the
 *  single configured control board; per-site URLs can be added to Settings later. */
export type SiteId = "cairo" | "alexandria";

export interface UseControl {
  /** Fire one control command. Resolves true when it was dispatched, false if rejected. */
  send: (kind: ControlKind, value: number) => Promise<boolean>;
  pending: boolean;
  lastResult: string | null;
}

export function useControl(): UseControl {
  const { environment, controlUrl } = useEnvironment();
  const { setLast } = useLastRequest();
  const { simSendReal } = useDevOptions();
  const [pending, setPending] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  async function send(kind: ControlKind, value: number): Promise<boolean> {
    const def = CONTROL_DEFINITIONS.find((d) => d.kind === kind);
    if (!def || !isValidControlValue(value)) {
      setLastResult(`invalid command (${kind}=${value})`);
      return false;
    }
    const cmd: ControlCommand = { path: def.path, parameter: def.parameter, value };

    // Compute the exact URL up front (same builder the real send uses) so the badge shows
    // what would be sent in either mode. A malformed control URL is reported, not thrown.
    let url: string;
    try {
      url = buildControlUrl(controlUrl, cmd).toString();
    } catch {
      setLastResult(`invalid control URL: "${controlUrl}"`);
      return false;
    }

    // A live GET goes out in real mode, or in SIM mode when "send real in SIM" is enabled.
    const sendLive = environment === "real" || simSendReal;
    setLast({ url, mode: sendLive ? "real" : "mock", at: Date.now() });

    setPending(true);
    try {
      // The simulator still animates whenever we're in mock mode.
      const simMsg = environment === "mock" ? mockEsp.simulateControl(cmd).message : null;
      if (sendLive) {
        await sendControlReal(controlUrl, cmd);
        setLastResult(
          simMsg ? `${simMsg} · sent LIVE` : `sent ${def.parameter}=${value} → ${def.path}`,
        );
      } else {
        setLastResult(simMsg);
      }
      return true;
    } catch (e) {
      setLastResult(`send failed: ${(e as Error).message}`);
      return false;
    } finally {
      setPending(false);
    }
  }

  return { send, pending, lastResult };
}
