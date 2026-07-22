"use client";

// Polls the security ESP once per second (mirrors script.js pollESP1's 1000ms interval).
// BOTH mock and real modes contact the real ESP at the configured IP (via the
// /api/security-status proxy) — so the app always uses the IP you provide. Mock mode
// differs only in its fallback: if that IP can't be reached, it drives the on-screen
// simulator (keypad/RFID) so the demo still works with no hardware. Real mode instead
// surfaces the connection error. Updates are de-duped so the tree re-renders only on change.

import { useCallback, useEffect, useState } from "react";
import type { Esp1Status, EspEnvironment } from "@/lib/types";
import { fetchSecurityStatusReal } from "@/lib/esp";
import { mockEsp } from "@/lib/mockEsp";

const LOCKED_STATUS: Esp1Status = {
  state: "LOCKED",
  greenLed: false,
  timerRunning: false,
  time: 0,
};

function statusEqual(a: Esp1Status, b: Esp1Status): boolean {
  return (
    a.state === b.state &&
    a.greenLed === b.greenLed &&
    a.timerRunning === b.timerRunning &&
    a.time === b.time
  );
}

export interface SecurityStatus {
  status: Esp1Status;
  /** True when the real ESP at the configured IP responded (either mode). */
  connected: boolean;
  /** Last connection failure reason (real mode). Null when OK or simulating. */
  lastError: string | null;
  /** Force an immediate network re-poll. */
  refresh: () => void;
  /** Instantly reflect the local simulator (used by the on-screen keypad/RFID fallback). */
  syncFromMock: () => void;
}

export function useSecurityStatus(
  environment: EspEnvironment,
  esp1Ip: string,
  enabled = true,
): SecurityStatus {
  const [status, setStatus] = useState<Esp1Status>(LOCKED_STATUS);
  const [connected, setConnected] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const poll = useCallback(async () => {
    if (!enabled) return;
    try {
      // Always talk to the real ESP at the IP you provide — in both modes.
      const data = await fetchSecurityStatusReal(esp1Ip);
      setStatus((prev) => (statusEqual(prev, data) ? prev : data));
      setConnected((c) => (c ? c : true));
      setLastError((e) => (e === null ? e : null));
    } catch (error) {
      setConnected((c) => (c ? false : c));
      if (environment === "mock") {
        // No hardware at this IP → fall back to the on-screen simulator.
        const next = mockEsp.getStatus();
        setStatus((prev) => (statusEqual(prev, next) ? prev : next));
        setLastError((e) => (e === null ? e : null));
      } else {
        const message = (error as Error).message;
        setLastError((e) => (e === message ? e : message));
      }
    }
  }, [enabled, environment, esp1Ip]);

  // For the simulator fallback: reflect the mock state machine immediately, without
  // waiting on a (failing) network round-trip, so keypad/RFID feel responsive.
  const syncFromMock = useCallback(() => {
    const next = mockEsp.getStatus();
    setStatus((prev) => (statusEqual(prev, next) ? prev : next));
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const initialPoll = window.setTimeout(poll, 0);
    const id = setInterval(poll, 1000);
    return () => {
      clearTimeout(initialPoll);
      clearInterval(id);
    };
  }, [enabled, poll]);

  return { status, connected, lastError, refresh: poll, syncFromMock };
}
