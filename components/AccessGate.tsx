"use client";

// Bloom-styled 2FA entrance gate. Wired to the preserved security seam:
//  • mock mode  → mockEsp.enterCode()/scanRfid() + syncMockStatus() drive the on-screen flow.
//  • real mode  → fetchSecurityStatusReal(esp1Ip) reflects the physical mantrap board.
// Global status polling is disabled by config (STATUS_POLLING_ENABLED=false), so the gate
// polls the board itself in real mode. Renders children only once state === "UNLOCKED".

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useEnvironment } from "@/context/EnvironmentContext";
import { AccessContext } from "@/context/AccessContext";
import { mockEsp } from "@/lib/mockEsp";
import { fetchSecurityStatusReal } from "@/lib/esp";
import type { SecurityState } from "@/lib/types";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "enter"] as const;

export function AccessGate({ children }: { children: ReactNode }) {
  const { environment, setEnvironment, status, syncMockStatus, esp1Ip } = useEnvironment();

  const [entry, setEntry] = useState("");
  const [denied, setDenied] = useState(false);
  const [realState, setRealState] = useState<SecurityState>("LOCKED");
  const [realError, setRealError] = useState<string | null>(null);

  const state: SecurityState = environment === "mock" ? status.state : realState;

  // Emergency shutdown / power off: re-secure the facility. In mock mode this fully re-locks
  // (mockEsp.reset drives status back to LOCKED). In real mode the gate then reflects the
  // board again on the next poll.
  const lock = useCallback(() => {
    mockEsp.reset();
    syncMockStatus();
    setRealState("LOCKED");
    setEntry("");
    setDenied(false);
  }, [syncMockStatus]);

  // Real mode: poll the board directly (the global 1s poll is disabled by config).
  useEffect(() => {
    if (environment !== "real" || state === "UNLOCKED") return;
    let active = true;
    const tick = async () => {
      try {
        const s = await fetchSecurityStatusReal(esp1Ip);
        if (!active) return;
        setRealState(s.state);
        setRealError(null);
      } catch (e) {
        if (active) setRealError((e as Error).message);
      }
    };
    void tick();
    const id = setInterval(tick, 1500);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [environment, esp1Ip, state]);

  if (state === "UNLOCKED") {
    return <AccessContext.Provider value={{ lock }}>{children}</AccessContext.Provider>;
  }

  function press(key: string) {
    setDenied(false);
    if (key === "clear") return setEntry("");
    if (key === "enter") return submitCode();
    setEntry((e) => (e.length >= 8 ? e : e + key));
  }

  function submitCode() {
    // Factor 1 — keypad PIN against the mock hardware.
    const ok = mockEsp.enterCode(entry);
    syncMockStatus();
    setEntry("");
    if (!ok) setDenied(true);
  }

  function scanCard() {
    // Factor 2 — RFID proximity scan.
    mockEsp.scanRfid();
    syncMockStatus();
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-primary overflow-hidden">
      <div className="absolute inset-0 bg-venting opacity-10" />

      <div className="relative w-[420px] max-w-[92vw] bg-surface rounded-lg border-2 border-outline-variant shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-gutter py-5 border-b border-outline-variant bg-surface-container text-center">
          <h1 className="font-display-lg text-display-lg color-primary tracking-tighter leading-none font-bold">
            BLOOM DC
          </h1>
          <p className="font-code-sm text-on-surface-variant uppercase tracking-widest mt-1">
            Secure Entry · 2FA Mantrap
          </p>
        </div>

        {/* Environment toggle (also reachable here so an operator is never locked out) */}
        <div className="px-gutter pt-4 grid grid-cols-2 gap-2">
          {(["mock", "real"] as const).map((env) => (
            <button
              key={env}
              onClick={() => setEnvironment(env)}
              className={`py-2 rounded border font-code-sm uppercase tracking-wider transition-all ${
                environment === env
                  ? "bg-secondary text-on-secondary border-secondary"
                  : "bg-surface-container-low text-on-surface-variant border-outline-variant hover:border-secondary"
              }`}
            >
              {env === "mock" ? "SIM" : "LIVE"}
            </button>
          ))}
        </div>

        {/* Status well */}
        <div className="px-gutter pt-4">
          <div className="rounded border border-outline-variant bg-surface-container-low px-4 py-3 flex items-center justify-between">
            <span className="font-code-sm uppercase tracking-widest text-on-surface-variant">
              Status
            </span>
            <span
              className={`font-code-sm font-bold uppercase tracking-widest ${
                state === "SCAN_RFID" ? "text-tertiary-fixed-dim" : "text-error"
              }`}
            >
              {state === "SCAN_RFID" ? "Factor 2 — Scan RFID" : "Locked"}
            </span>
          </div>
        </div>

        {/* Body: mock keypad/RFID or real waiting panel */}
        {environment === "mock" ? (
          <div className="p-gutter">
            {state === "LOCKED" ? (
              <>
                <div className="flex justify-center gap-2 mb-4 h-6 items-center">
                  {Array.from({ length: Math.max(entry.length, 4) }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${
                        i < entry.length ? "bg-secondary" : "bg-outline-variant"
                      }`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {KEYS.map((k) => (
                    <button
                      key={k}
                      onClick={() => press(k)}
                      className={`h-14 rounded border font-headline-md text-xl transition-all active:scale-95 ${
                        k === "enter"
                          ? "bg-secondary text-on-secondary border-secondary"
                          : k === "clear"
                            ? "bg-surface-container text-on-surface-variant border-outline-variant"
                            : "bg-surface-container-low text-on-surface border-outline-variant hover:border-secondary"
                      }`}
                    >
                      {k === "clear" ? "C" : k === "enter" ? "↵" : k}
                    </button>
                  ))}
                </div>
                {denied && (
                  <p className="mt-4 text-center font-code-sm text-error uppercase tracking-widest animate-blink">
                    Access Denied
                  </p>
                )}
              </>
            ) : (
              // SCAN_RFID
              <button
                onClick={scanCard}
                className="w-full flex flex-col items-center gap-3 py-8 rounded border-2 border-secondary bg-secondary/10 hover:bg-secondary/20 transition-all"
              >
                <span className="material-symbols-outlined text-secondary text-[64px]">contactless</span>
                <span className="font-headline-md uppercase tracking-widest text-primary">
                  Present RFID Credential
                </span>
              </button>
            )}
          </div>
        ) : (
          <div className="p-gutter text-center">
            <span className="material-symbols-outlined text-secondary text-[64px] animate-pulse">
              sensor_door
            </span>
            <p className="font-headline-md uppercase tracking-widest text-primary mt-2">
              Awaiting Mantrap Authentication
            </p>
            <p className="font-code-sm text-on-surface-variant mt-1">
              Board {esp1Ip} · use the physical keypad + RFID
            </p>
            {realError && (
              <>
                <p className="mt-3 font-code-sm text-error break-words">{realError}</p>
                <button
                  onClick={() => setRealState("UNLOCKED")}
                  className="mt-4 w-full py-3 rounded border border-secondary bg-secondary text-on-secondary font-code-sm uppercase tracking-widest"
                >
                  Continue in LIVE
                </button>
                <p className="mt-2 font-code-sm text-on-surface-variant">
                  Security board did not answer. The dashboard stays LIVE and still drives the LED controller.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
