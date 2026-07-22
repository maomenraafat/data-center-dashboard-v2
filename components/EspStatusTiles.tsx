"use client";

// Live status tiles for the main dashboard. Bound to the preserved global store: the
// security board (ESP 1) is the only one actively polled, so its reachability drives the
// indicator in real mode. The mock simulator always reads as online. The control board
// (ESP 2) uses opaque no-cors sends that can't be health-checked, so it mirrors the same
// environment signal and simply shows its configured target.

import { useEnvironment } from "@/context/EnvironmentContext";
import { STATUS_POLLING_ENABLED } from "@/lib/config";
import LedPulse from "@/components/LedPulse";

export default function EspStatusTiles() {
  const { environment, connected, esp1Ip, controlUrl } = useEnvironment();
  const sim = environment === "mock";
  const online = sim ? true : connected;

  const stateLabel = sim
    ? "SIMULATED"
    : !STATUS_POLLING_ENABLED
      ? "STATUS OFF"
      : online
        ? "ONLINE"
        : "OFFLINE";
  const good = sim || online;

  const tiles = [
    { label: "External System ESP 1", role: "Security Gateway", address: esp1Ip },
    { label: "External System ESP 2", role: "Control Board", address: controlUrl },
  ];

  return (
    <>
      {tiles.map((t) => (
        <div
          key={t.label}
          className="bg-surface-container-low border border-outline-variant p-gutter rounded flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center rounded bg-primary text-secondary">
              <span
                className="material-symbols-outlined text-[32px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                bolt
              </span>
            </div>
            <div>
              <h4 className="text-data-label uppercase font-headline-md">{t.label}</h4>
              <p className="font-code-sm text-[10px] text-on-surface-variant uppercase">
                {t.role} · {t.address}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {good ? (
                  <LedPulse count={1} />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-error shadow-[0_0_8px_#ba1a1a]" />
                )}
                <span className={`font-code-sm font-bold ${good ? "text-[#10B981]" : "text-error"}`}>
                  {stateLabel}
                </span>
              </div>
            </div>
          </div>
          <span className="font-code-sm text-[10px] uppercase text-on-surface-variant opacity-70">
            {sim ? "SIM" : "LIVE"}
          </span>
        </div>
      ))}
    </>
  );
}
