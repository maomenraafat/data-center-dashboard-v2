"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import UtcClock from "@/components/UtcClock";
import AppLauncher from "@/components/AppLauncher";
import AppWindow from "@/components/AppWindow";
import ComputeStatusPanel from "@/components/ComputeStatusPanel";
import ComputeStatusBadge from "@/components/ComputeStatusBadge";
import { useControl } from "@/hooks/useControl";

export default function InfrastructurePage() {
  const [bloomOpen, setBloomOpen] = useState(false);
  const [aiTutorOpen, setAiTutorOpen] = useState(false);
  const { send } = useControl();

  // Launching an app routes its workload to the matching compute cluster:
  // Bloom Webpage → CPU (value 1), ISM AI Tutor → GPU (value 2).
  function launchBloom() {
    setBloomOpen(true);
    void send("workloadrouting", 1);
  }
  function launchAiTutor() {
    setAiTutorOpen(true);
    void send("workloadrouting", 2);
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar active="Infrastructure" />
      <ComputeStatusBadge cpuActive={bloomOpen} gpuActive={aiTutorOpen}   isVisible={bloomOpen || aiTutorOpen}/>

      <main className="flex-1 ml-sidebar_width flex flex-col h-full bg-surface-bright/10 relative">
        <header className="flex justify-between items-center px-gutter h-16 border-b border-outline-variant shadow-[0_1px_2px_rgba(0,0,0,0.1)] bg-surface backdrop-blur-md z-40">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-primary font-bold">
              {/* <span className="material-symbols-outlined">developer_board</span> */}
              {/* <span className="font-display-lg text-[20px] tracking-tight uppercase">CORE_OS v2.4</span> */}
              <span className="font-display-lg text-[25px] tracking-tight uppercase">Level 2: CPU and GPU usage</span>

            </div>
            <div className="h-4 w-px bg-outline-variant" />
            {/* <div className="flex items-center gap-2 text-on-surface-variant font-code-sm uppercase">
              <span>Root</span>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
              <span className="text-secondary font-bold">Infr_Compute</span>
            </div> */}
          </div>

          <div className="flex items-center gap-6">
            <UtcClock />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-gutter relative z-10">
          <div className="grid grid-cols-12 gap-gutter">
            {/*  Applications Launcher */}
            <section className="col-span-12 lg:col-span-8 space-y-gutter">
              <div className="bg-surface rounded-lg border border-outline-variant p-4">
                <h3 className="font-headline-md text-base text-primary text-[35px] uppercase border-b border-outline-variant pb-2 mb-4">
                  Launch Applications
                </h3>
                <div className="space-y-6">
                  <AppLauncher
                    name="Bloom Webpage"
                    description="Bloom's Website runs on CPU cluster"
                    icon="local_florist"
                    accent="secondary"
                    isOpen={bloomOpen}
                    onLaunch={launchBloom}
                  />
                  <AppLauncher
                    name="ISM AI Tutor"
                    description="AI tutor runs on GPU cluster"
                    icon="smart_toy"
                    accent="primary"
                    isOpen={aiTutorOpen}
                    onLaunch={launchAiTutor}
                  />
                </div>
              </div>
            </section>

            <section className="col-span-12 lg:col-span-4">
              <ComputeStatusPanel cpuActive={bloomOpen} gpuActive={aiTutorOpen} />
            </section>
          </div>
        </div>

        <footer className="p-gutter border-t border-outline-variant bg-surface-bright/50 backdrop-blur-sm z-40 flex justify-between items-center">
          <span className="font-code-sm text-xs text-on-surface-variant uppercase">
            BLOOM DC // Compute Allocation
          </span>
        </footer>
      </main>

      {bloomOpen && (
        <AppWindow
          title="Bloom Webpage"
          subtitle="CPU cluster · Alexandria"
          icon="local_florist"
          src="/apps/bloom-landing.html"
          onClose={() => setBloomOpen(false)}
        />
      )}

      {aiTutorOpen && (
        <AppWindow
          title="ISM AI Tutor"
          subtitle="GPU cluster · Cairo"
          icon="smart_toy"
          src="/apps/ism-ai-tutor.html"
          onClose={() => setAiTutorOpen(false)}
        />
      )}
    </div>
  );
}
