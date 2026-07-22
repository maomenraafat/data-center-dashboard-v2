"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import UtcClock from "@/components/UtcClock";
import { useControl } from "@/hooks/useControl";

// The network control board accepts a mode 1-5. Labels mirror the scenarios the original
// network diagram drove, so operators get meaningful choices instead of bare numbers.
const MODES = [
  { value: 1, label: "Routing", icon: "route" },
  { value: 2, label: "Switching", icon: "swap_horiz" },
  { value: 3, label: "Failover", icon: "alt_route" },
  { value: 4, label: "Load Balance", icon: "balance" },
  { value: 5, label: "Disaster", icon: "crisis_alert" },
] as const;

export default function TopologyPage() {
  const [mode, setMode] = useState<number>(1);
  const { send, pending, lastResult } = useControl();

  function apply(value: number) {
    setMode(value);
    // Network control → /network?network=<value> (real) or mock simulator.
    void send("network", value);
  }

  const active = MODES.find((m) => m.value === mode);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar active="Topology" />

      <main className="ml-sidebar_width h-screen overflow-hidden flex flex-col relative bg-surface-container-low flex-1">
        <header className="h-20 flex items-center px-gutter justify-between border-b border-outline-variant bg-surface">
          <h2 className="font-headline-md text-headline-md uppercase tracking-tight text-primary">
            Network Topology - Routing Control
          </h2>
          <div className="flex items-center gap-4 font-data-label text-data-label text-on-surface-variant">
            <span className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-sm ${pending ? "bg-tertiary-fixed-dim animate-pulse" : "bg-secondary animate-pulse"}`} />
              {pending ? "DISPATCHING" : "FABRIC ONLINE"}
            </span>
            <span className="border-l border-outline-variant pl-4" />
            <UtcClock />
          </div>
        </header>

        <div className="flex-grow flex p-gutter gap-gutter overflow-hidden">
          {/* Current mode display */}
          <section className="flex-[3] flex flex-col gap-gutter h-full">
            <div className="flex-grow relative bg-white/50 rounded-lg border-2 border-outline-variant overflow-hidden flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <span className="material-symbols-outlined text-secondary text-[96px]">
                  {active?.icon ?? "hub"}
                </span>
                <span className="font-display-lg text-display-lg text-primary uppercase tracking-tighter">
                  {active?.label ?? "—"}
                </span>
                <span className="font-code-sm text-on-surface-variant uppercase tracking-widest">
                  Network mode {mode} / 5
                </span>
              </div>
              <div className="absolute top-4 right-4 text-right">
                <p className="font-code-sm text-xs text-on-surface-variant">SERIAL: BDC-NET-CORE</p>
                <p className="font-code-sm text-[10px] text-on-surface-variant opacity-60">
                  SPINE / LEAF FABRIC: ACTIVE
                </p>
              </div>
            </div>
          </section>

          {/* Control panel */}
          <section className="flex-1 flex flex-col gap-gutter h-full min-h-0">
            <div className="bg-surface rounded-lg border border-outline-variant p-gutter flex flex-col gap-6">
              <div>
                <h3 className="font-headline-md text-[40px] text-primary uppercase tracking-tighter font-bold">
                  Fabric Control
                </h3>
                <p className="font-code-sm text-on-surface-variant mt-1">
                  Dispatch a routing mode to the network board
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {MODES.map((m) => (
                  <button
                    key={m.value}
                    disabled={pending}
                    onClick={() => apply(m.value)}
                    className={`flex items-center gap-3 py-3 px-4 rounded border uppercase tracking-wider transition-all font-headline-md disabled:opacity-50
                    ${
                      mode === m.value
                        ? "bg-secondary text-on-secondary border-secondary shadow-md"
                        : "bg-surface-container-low text-on-surface border-outline-variant hover:border-secondary hover:bg-secondary/10"
                    }`}
                  >
                    <span className="material-symbols-outlined">{m.icon}</span>
                    <span className="flex-grow text-left">{m.label}</span>
                    <span className="font-code-sm opacity-70">{m.value}</span>
                  </button>
                ))}
              </div>

              <div className="mt-auto pt-4 border-t border-outline-variant flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${pending ? "bg-yellow-400 animate-pulse" : "bg-green-500"}`} />
                <span className="font-code-sm text-xs uppercase text-on-surface-variant">
                  {lastResult ?? "Ready"}
                </span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
