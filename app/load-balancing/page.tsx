"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TrafficControl from "@/components/TrafficControl";
import TrafficTerminal from "@/components/TrafficTerminal";
import LoadBalancingSim from "@/components/LoadBalancingSim";
import type { SiteId } from "@/hooks/useControl";

type Levels = Record<SiteId, 1 | 2 | 3 | 4 | 5>;

export default function TrafficControlPage() {
  const [levels, setLevels] = useState<Levels>({
    cairo: 2,
    alexandria: 2,
  });

  function handleLevelChange(site: SiteId, level: 1 | 2 | 3 | 4 | 5) {
    setLevels((prev) => ({ ...prev, [site]: level }));
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar active="Traffic Control" />

      <main className="ml-sidebar_width h-screen overflow-hidden flex flex-col relative bg-surface-container-low flex-1">
        <header className="h-20 flex items-center px-gutter justify-between border-b border-outline-variant bg-surface">
          <div className="flex items-center gap-4">
            <h2 className="font-headline-md text-headline-md uppercase tracking-tight text-primary">
              Load Balancing - Traffic Control
            </h2>
          </div>
          <div className="flex items-center gap-4 font-data-label text-data-label text-on-surface-variant">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-secondary animate-pulse" /> LIVE SIMULATION
            </span>
            <span className="border-l border-outline-variant pl-4" />
          </div>
        </header>

        <div className="flex-grow flex p-gutter gap-gutter overflow-hidden">
          {/* Central Content (Node Topology View) */}
          <section className="flex-[3] flex flex-col gap-gutter h-full min-h-0">
            <div className="flex-grow relative noc-grid rounded-lg border-2 border-outline-variant overflow-hidden">
              <LoadBalancingSim levels={levels} />

              <div className="absolute top-3 right-4 text-right pointer-events-none">
                <p className="font-code-sm text-[10px] text-white/50">SERIAL: BDC-TC-ALX-CAI</p>
                <p className="font-code-sm text-[9px] text-white/30 uppercase tracking-wider">
                  Regional Load Balancer: Active
                </p>
              </div>
            </div>
          </section>

          {/* Sidebar Content */}
          <section className="flex-1 flex flex-col gap-gutter h-full min-h-0">
            {/* Control Module */}
            <div className=" bg-surface rounded-lg border border-outline-variant p-4 w-[500px] ">
              <TrafficControl onChange={handleLevelChange} />
            </div>

            {/* Terminal Module */}
            <TrafficTerminal onLevelChange={handleLevelChange} />
          </section>
        </div>
      </main>
    </div>
  );
}