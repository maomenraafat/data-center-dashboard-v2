"use client";

import { useState, useTransition } from "react";
import { useControl, type SiteId } from "@/hooks/useControl";

const LEVELS = [1, 2, 3, 4, 5] as const;

export default function TrafficControl({
  onChange,
}: {
  onChange?: (site: SiteId, level: 1 | 2 | 3 | 4 | 5) => void;
}) {
  const [site, setSite] = useState<SiteId>("cairo");
  const [level, setLevel] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [isPending, startTransition] = useTransition();
  const [lastSent, setLastSent] = useState<string | null>(null);
  const { send } = useControl();

  function apply(l: typeof level) {
    setLevel(l);

    startTransition(async () => {
      // Load balancing → /loadbalancing?severity=<l> (real) or mock simulator. Site is
      // cosmetic for now: both sites share the single configured control board.
      await send("loadbalancing", l);

      onChange?.(site, l);

      setLastSent(
        `ESP-${site === "cairo" ? "CAI" : "ALX"} updated • ${new Date().toLocaleTimeString()}`
      );
    });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-headline-md text-[40px] text-primary uppercase tracking-tighter font-bold">
            Load Balancer
          </h3>

          <p className="font-code-sm text-on-surface-variant mt-1">
            Set simulated traffic level for each ESP board
          </p>
        </div>

        <div className="px-3 py-1 rounded border border-outline-variant bg-surface-container font-code-sm text-secondary uppercase">
          {site === "cairo" ? "ESP-CAI" : "ESP-ALX"}
        </div>
      </div>

      {/* Site Selection */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {(["cairo", "alexandria"] as SiteId[]).map((s) => (
          <button
            key={s}
            disabled={isPending}
            onClick={() => setSite(s)}
            className={`py-4 rounded border uppercase tracking-wider transition-all font-headline-md
            ${
              site === s
                ? "bg-primary text-on-primary border-primary shadow-md"
                : "bg-surface-container text-on-surface border-outline-variant hover:bg-surface-container-high"
            }`}
          >
            {s === "cairo" ? "CAIRO" : "ALEXANDRIA"}
          </button>
        ))}
      </div>

      {/* Traffic Levels */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {LEVELS.map((l) => (
          <button
            key={l}
            disabled={isPending}
            onClick={() => apply(l)}
            className={`w-20 h-20  rounded-lg border transition-all active:scale-95 disabled:opacity-50
            flex items-center justify-center
            font-display-lg text-2xl font-bold
            ${
              level === l
                ? "bg-secondary text-on-secondary border-secondary shadow-lg"
                : "bg-surface-container-low border-outline-variant text-on-surface hover:border-secondary hover:bg-secondary/10"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Traffic Indicator */}
      <div className="mb-6">
        <div className="flex justify-between font-code-sm text-on-surface-variant mb-2 uppercase">
          <span>Traffic Load</span>
          <span>Level {level}/5</span>
        </div>

        <div className="h-3 rounded-full bg-surface-container overflow-hidden border border-outline-variant">
          <div
            className="h-full bg-secondary transition-all duration-300"
            style={{ width: `${level * 20}%` }}
          />
        </div>
      </div>

      {/* Status */}
      <div className="mt-auto pt-4 border-t border-outline-variant flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isPending ? "bg-yellow-400 animate-pulse" : "bg-green-500"
            }`}
          />

          <span className="font-code-sm text-xs uppercase text-on-surface-variant">
            {isPending ? "Sending Command..." : "Ready"}
          </span>
        </div>

        <span className="font-code-sm text-xs text-on-surface-variant">
          {lastSent}
        </span>
      </div>
    </div>
  );
}