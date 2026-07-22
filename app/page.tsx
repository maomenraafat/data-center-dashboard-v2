import Sidebar from "@/components/Sidebar";
import UtcClock from "@/components/UtcClock";
import LedPulse from "@/components/LedPulse";
import NodeCard from "@/components/NodeCard";
import TrafficControlPanel from "@/components/TrafficControl";
import EspStatusTiles from "@/components/EspStatusTiles";
import LockButton from "@/components/LockButton";

const TRAFFIC_BARS = [40, 55, 45, 70, 85, 60, 75, 90, 65, 50, 40, 35, 60, 95, 80];

export default function MainPage() {

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar active="Main" />

      <main className="flex-1 ml-sidebar_width flex flex-col h-full bg-surface-bright relative">
        <header className="flex justify-between items-center px-gutter h-16 border-b border-outline-variant shadow-[0_1px_2px_rgba(0,0,0,0.1)] bg-surface-bright/80 backdrop-blur-md z-40">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-primary font-bold">
              {/* <span className="material-symbols-outlined">terminal</span> */}
              {/* <span className="font-display-lg text-[20px] tracking-tight uppercase">CORE_OS v2.4</span> */}
              <span className="font-display-lg text-[20px] tracking-tight uppercase">Bloom Data Center Control</span>
            </div>
            <div className="h-4 w-px bg-outline-variant" />
            <div className="flex items-center gap-2 text-on-surface-variant font-code-sm uppercase">
              <span className="material-symbols-outlined">terminal</span>
              <span>Root</span>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
              <span className="text-secondary font-bold">Infr_Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <UtcClock />
            <div className="flex items-center gap-3">
              <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-transform active:scale-95 text-on-surface-variant">
                <span className="material-symbols-outlined">notifications_active</span>
              </button>
              <LockButton variant="icon" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-gutter relative z-10">
          <div className="grid grid-cols-12 gap-gutter">
            {/* Global Traffic Widget */}
            {/* <section className="col-span-12 lg:col-span-8 bg-surface-container-lowest border border-outline-variant p-gutter rounded relative overflow-hidden recessed-panel">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-headline-md text-primary uppercase tracking-tighter font-bold">
                    Global Network Traffic
                  </h3>
                  <p className="font-code-sm text-on-surface-variant">
                    Aggregate bandwidth throughput across all active nodes
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="px-3 py-1 bg-surface-container rounded border border-outline-variant font-code-sm text-primary">
                    L-AVG: 842Gbps
                  </div>
                  <div className="px-3 py-1 bg-secondary-container/10 border border-secondary/30 rounded font-code-sm text-secondary">
                    PEAK: 1.2Tbps
                  </div>
                </div>
              </div>

              <div className="h-48 flex items-end gap-1 mb-4">
                {TRAFFIC_BARS.map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-secondary/10 hover:bg-secondary/30 transition-all rounded-t-sm"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>

              <div className="flex justify-between font-code-sm text-[10px] text-on-surface-variant border-t border-outline-variant pt-2 uppercase">
                <span>00:00:00 MST</span>
                <span>06:00:00 MST</span>
                <span>12:00:00 MST</span>
                <span>18:00:00 MST</span>
                <span>Present</span>
              </div>
            </section> */}

                          {/* Rack Status Cards */}
            <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-gutter">
                           <NodeCard
                name="CAIRO"
                serial="CAI-9900-DC"
                subtitle="Central Regional Hub - Giza Data Park"
                accent="primary"
                cpuLabel="CPU Clusters (128 Nodes)"
                cpuPct={67}
                gpuLabel="GPU Compute (H100 Array)"
                gpuPct={12}
                temp="20.1°C"
                power="STABLE"
                net="240Gbps"
              />
              <NodeCard
                name="ALEXANDRIA"
                serial="ALX-7700-DC"
                subtitle="Primary Mediterranean Gateway Node"
                accent="secondary"
                cpuLabel="CPU Clusters (72 Nodes)"
                cpuPct={42}
                gpuLabel="GPU Compute (A100 Array)"
                gpuPct={88}
                temp="18.4°C"
                power="STABLE"
                net="92Gbps"
              />
 
            </div>
            {/* Status Sidebar Widget — bound to the live environment store */}
            <section className="col-span-12 lg:col-span-4 space-y-gutter">
              <EspStatusTiles />
            </section>


                        {/* Traffic Control Panel */}
              <section className="col-span-12 lg:col-span-4">
                <div className="bg-surface-container-lowest border border-outline-variant p-gutter rounded recessed-panel">
                  <TrafficControlPanel />
                </div>
              </section>

            {/* Visual Texture Section */}
            <section className="col-span-12 flex gap-gutter">
              <div className="flex-1 h-32 bg-venting border border-outline-variant rounded opacity-20" />
              <div className="flex-1 h-32 bg-venting border border-outline-variant rounded opacity-20 hidden md:block" />
              <div className="flex-1 h-32 bg-venting border border-outline-variant rounded opacity-20 hidden lg:block" />
            </section>
          </div>
        </div>

        <footer className="p-gutter border-t border-outline-variant bg-surface-bright/50 backdrop-blur-sm z-40 flex justify-between items-center">
          <div className="flex gap-4">
            <button className="extruded-button bg-primary text-on-primary px-6 py-2 flex items-center gap-2 uppercase tracking-widest text-xs font-headline-md">
              <span className="material-symbols-outlined text-sm">rocket_launch</span>
              Run Diagnostics
            </button>
            <button className="extruded-button bg-surface-container text-primary px-6 py-2 flex items-center gap-2 uppercase tracking-widest text-xs border border-outline-variant font-headline-md">
              <span className="material-symbols-outlined text-sm">print</span>
              Export Manifest
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <LedPulse count={1} />
              <span className="font-code-sm text-xs text-on-surface-variant uppercase">Sys_Kernel: Nominal</span>
            </div>
            <div className="flex items-center gap-2">
              <LedPulse count={1} />
              <span className="font-code-sm text-xs text-on-surface-variant uppercase">Sync: Locked</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
