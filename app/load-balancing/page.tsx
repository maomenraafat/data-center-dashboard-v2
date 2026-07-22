"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TrafficControl from "@/components/TrafficControl";
import TrafficTerminal from "@/components/TrafficTerminal";
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
          <section className="flex-[3] flex flex-col gap-gutter h-full">
            <div className="flex-grow relative bg-white/50 rounded-lg border-2 border-outline-variant overflow-hidden">
              <div className="absolute inset-0 p-margin pointer-events-none flex items-center justify-center gap-16">
                {/* Node ALX-01 */}
                {/* <NodeCard
                  label="ESP-ALX"
                  site="alexandria"
                  level={levels.alexandria}
                  positionClass="top-[35%] left-[25%]"
                /> */}

                {/* Node CAI-01 */}
                {/* <NodeCard
                  label="ESP-CAI"
                  site="cairo"
                  level={levels.cairo}
                  positionClass="top-[45%] left-[65%]"
                /> */}
                <DataCenterNode
                    image="/images/ciaro-city.jpg"
                    imagePosition="50% 35%"
                    hostname="CAIRO - Data Center"
                    region="Cairo, EG"
                    level={levels.cairo}
                    detail={`Load ${levels.cairo}/5`}
                    />
                <DataCenterNode
                image="/images/Alex-castle.avif"
                imagePosition="62% 40%"
                hostname="ALEX - Data Center"
                region="Alexandria, EG"
                level={levels.alexandria}
                detail={`Load ${levels.alexandria}/5`}
                    />

              </div>

              <div className="absolute top-4 right-4 text-right">
                <p className="font-code-sm text-xs text-on-surface-variant">SERIAL: BDC-TC-ALX-CAI</p>
                <p className="font-code-sm text-[10px] text-on-surface-variant opacity-60">
                  REGIONAL LOAD BALANCER: ACTIVE
                </p>
              </div>
            </div>

            {/* Bottom summary bar */}
            <div className="h-24 bg-surface-container-high border-t border-outline-variant rounded-lg p-gutter flex items-center justify-around gap-margin shadow-inner">
              <LevelSummary label="ESP-CAI" level={levels.cairo} />
              <div className="w-px h-12 bg-outline-variant" />
              <LevelSummary label="ESP-ALX" level={levels.alexandria} />
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

function DataCenterNode({
  image,
  imagePosition = "center",
  hostname,
  region,
  level,
  detail,
}: {
  image: string;
  imagePosition?: string;
  hostname: string;
  region: string;
  level: number;
  detail: string;
}) {
  const hot = level >= 4;

  return (
    <div className="pointer-events-auto cursor-pointer group w-80">
      <div
        className={`rounded-2xl border-2 shadow-xl overflow-hidden transition-all duration-500 ${
          hot ? "border-error" : "border-outline-variant group-hover:border-secondary"
        }`}
      >
        <div className={`flex items-center justify-between px-4 py-2 ${hot ? "bg-error/10" : "bg-secondary/10"}`}>
          <span className="font-code-sm text-[20px] font-bold tracking-widest text-on-surface">{hostname}</span>
          <div className="flex gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${hot ? "bg-red-500 animate-blink" : "bg-green-500 animate-pulse"}`} />
            <div className={`w-1.5 h-1.5 rounded-full ${hot ? "bg-red-500 animate-blink" : "bg-green-500"}`} />
          </div>
        </div>

        <div
          className="relative h-44 bg-cover transition-all duration-500"
          style={{ backgroundImage: `url(${image})`, backgroundPosition: imagePosition }}
        >
          <div className={`absolute inset-0 ${hot ? "bg-gradient-to-t from-error/70 via-error/30 to-transparent" : "bg-black/10"}`} />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-3">
            <span className={`font-code-sm text-sm text-[15px] font-bold tracking-widest mb-0.5 drop-shadow-md ${hot ? "text-red-300" : "text-white"}`}>
              {detail}
            </span>
            <span className="font-code-sm text-[15px] text-white/80 drop-shadow-md">{region}</span>
          </div>
          {hot && (
            <span className="material-symbols-outlined absolute top-3 right-3 text-error text-3xl animate-pulse drop-shadow-md">
              local_fire_department
            </span>
          )}
        </div>

        <div className="grid grid-cols-5 gap-1 border-t border-outline-variant/50 p-2 bg-surface-container-highest">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full ${i < level ? (hot ? "bg-red-500" : "bg-green-500") : "bg-outline-variant"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

function NodeCard({
  label,
  site,
  level,
  positionClass,
}: {
  label: string;
  site: SiteId;
  level: number;
  positionClass: string;
}) {
  const hot = level >= 4;

  return (
    <div className={`absolute ${positionClass} pointer-events-auto cursor-pointer group`}>
      <div
        className={`border-2 p-3 rounded shadow-lg flex flex-col items-center gap-1 transition-all duration-500 ${
          hot
            ? "border-error bg-error-container"
            : "border-outline-variant bg-surface-container-highest"
        }`}
      >
        <span
          className={`material-symbols-outlined text-4xl ${
            hot ? "text-error animate-pulse" : "text-secondary"
          }`}
        >
          {hot ? "local_fire_department" : "cloud_done"}
        </span>
        <span
          className={`font-code-sm text-[10px] font-bold ${
            hot ? "text-error" : "text-primary-container"
          }`}
        >
          {label}: LVL {level}/5
        </span>
        <div className="flex gap-1 mt-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`w-1 h-1 rounded-full ${
                i < level ? (hot ? "bg-red-500" : "bg-green-500") : "bg-outline-variant"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function LevelSummary({ label, level }: { label: string; level: number }) {
  return (
    <div className="flex flex-col items-center gap-2 font-headline-md w-32">
      <span className="font-data-label text-[11px] uppercase tracking-widest text-on-surface-variant opacity-70">
        {label}
      </span>
      <div className="h-2 w-full rounded-full bg-surface-container overflow-hidden border border-outline-variant">
        <div
          className="h-full bg-secondary transition-all duration-300"
          style={{ width: `${level * 20}%` }}
        />
      </div>
      <span className="font-code-sm text-xs text-on-surface-variant">{level}/5</span>
    </div>
  );
}