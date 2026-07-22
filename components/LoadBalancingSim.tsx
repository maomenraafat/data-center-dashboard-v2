"use client";

// Interactive, presentation-only load-balancing simulation.
//
// This component does NOT talk to the backend. It reads the per–data-center
// traffic level (1-5) that the existing TrafficControl / TrafficTerminal
// already drive through useControl, and visualises how that incoming load is
// spread across each site's 3 servers.
//
// Model: every data center receives `level * PER_LEVEL_DEMAND` units of demand.
// That demand is shared *equally* across the servers that are still healthy, so
//   load-per-server = demand / (healthy servers).
// Click a server to fail it — its share is instantly redistributed to the
// surviving nodes, which can tip them into overload. Everything here is local
// UI state, so nothing about the backend calls changes.

import { useState } from "react";
import type { SiteId } from "@/hooks/useControl";

const SERVER_COUNT = 3;
const PER_LEVEL_DEMAND = 45; // demand units per traffic level; total = level * this
const SERVER_CAPACITY = 100; // a server is at 100% when it carries this many units

type DcConfig = {
  site: SiteId;
  code: string;
  hostname: string;
  region: string;
  image: string;
  imagePosition: string;
};

const DATA_CENTERS: DcConfig[] = [
  {
    site: "cairo",
    code: "CAI",
    hostname: "CAIRO",
    region: "Cairo, EG",
    image: "/images/ciaro-city.jpg",
    imagePosition: "50% 35%",
  },
  {
    site: "alexandria",
    code: "ALX",
    hostname: "ALEXANDRIA",
    region: "Alexandria, EG",
    image: "/images/Alex-castle.avif",
    imagePosition: "62% 40%",
  },
];

type Status = "healthy" | "busy" | "hot" | "overload" | "offline";

const STATUS_META: Record<
  Status,
  { label: string; bar: string; text: string; dot: string; ring: string; hex: string }
> = {
  healthy: {
    label: "HEALTHY",
    bar: "from-emerald-400 to-emerald-500",
    text: "text-emerald-300",
    dot: "bg-emerald-400 led-glow-green",
    ring: "border-emerald-400/40",
    hex: "#34d399",
  },
  busy: {
    label: "NOMINAL",
    bar: "from-sky-400 to-blue-500",
    text: "text-sky-300",
    dot: "bg-sky-400",
    ring: "border-sky-400/40",
    hex: "#38bdf8",
  },
  hot: {
    label: "HIGH LOAD",
    bar: "from-amber-400 to-orange-500",
    text: "text-amber-300",
    dot: "bg-amber-400 led-glow-amber",
    ring: "border-amber-400/50",
    hex: "#fbbf24",
  },
  overload: {
    label: "OVERLOAD",
    bar: "from-red-500 to-rose-600",
    text: "text-red-300",
    dot: "bg-red-500 led-glow-red",
    ring: "border-red-500/70",
    hex: "#ef4444",
  },
  offline: {
    label: "OFFLINE",
    bar: "from-zinc-600 to-zinc-700",
    text: "text-zinc-400",
    dot: "bg-zinc-500",
    ring: "border-white/10",
    hex: "#52525b",
  },
};

function classify(active: boolean, util: number): Status {
  if (!active) return "offline";
  if (util > 100) return "overload";
  if (util >= 80) return "hot";
  if (util >= 50) return "busy";
  return "healthy";
}

export default function LoadBalancingSim({
  levels,
}: {
  levels: Record<SiteId, number>;
}) {
  return (
    <div className="flex h-full flex-col text-white">
      <TipBar />
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-gutter overflow-auto p-4 pt-3">
        {DATA_CENTERS.map((dc) => (
          <DataCenterCluster key={dc.site} dc={dc} level={levels[dc.site]} />
        ))}
      </div>
    </div>
  );
}

function TipBar() {
  const legend: { s: Status }[] = [
    { s: "healthy" },
    { s: "busy" },
    { s: "hot" },
    { s: "overload" },
    { s: "offline" },
  ];
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-black/20 px-4 py-2 font-code-sm">
      <span className="flex items-center gap-2 text-[11px] text-white/70">
        <span className="material-symbols-outlined text-[16px] text-sky-300">touch_app</span>
        Click a server to simulate a failure — its traffic reroutes to the healthy nodes.
      </span>
      <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider">
        {legend.map(({ s }) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${STATUS_META[s].dot}`} />
            <span className={STATUS_META[s].text}>{STATUS_META[s].label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function DataCenterCluster({ dc, level }: { dc: DcConfig; level: number }) {
  const [health, setHealth] = useState<boolean[]>(
    Array.from({ length: SERVER_COUNT }, () => true),
  );

  const activeCount = health.filter(Boolean).length;
  const demand = level * PER_LEVEL_DEMAND;
  const perServer = activeCount > 0 ? demand / activeCount : 0;
  const anyOverload = activeCount > 0 && perServer > SERVER_CAPACITY;

  const dcStatus: "OPTIMAL" | "DEGRADED" | "OUTAGE" =
    activeCount === 0 ? "OUTAGE" : anyOverload || activeCount < SERVER_COUNT ? "DEGRADED" : "OPTIMAL";

  const toggle = (i: number) =>
    setHealth((h) => h.map((v, idx) => (idx === i ? !v : v)));

  const recoverAll = () =>
    setHealth(Array.from({ length: SERVER_COUNT }, () => true));

  const failRandom = () => {
    const healthyIdx = health.flatMap((v, i) => (v ? [i] : []));
    if (healthyIdx.length <= 1) return; // never take the whole site down at once
    const pick = healthyIdx[Math.floor(Math.random() * healthyIdx.length)];
    toggle(pick);
  };

  const dcTone =
    dcStatus === "OUTAGE"
      ? "text-red-300"
      : dcStatus === "DEGRADED"
        ? "text-amber-300"
        : "text-emerald-300";

  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
      {/* Site banner */}
      <div className="relative h-20 overflow-hidden rounded-lg border border-white/10">
        <div
          className="absolute inset-0 bg-cover"
          style={{ backgroundImage: `url(${dc.image})`, backgroundPosition: dc.imagePosition }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b1a2c]/95 via-[#0b1a2c]/60 to-transparent" />
        <div className="relative flex h-full items-center justify-between px-3">
          <div>
            <p className="font-code-sm text-[10px] uppercase tracking-[0.2em] text-white/60">
              {dc.code} · Data Center
            </p>
            <h3 className="font-headline-md text-xl font-bold tracking-tight text-white">
              {dc.hostname}
            </h3>
            <p className="font-code-sm text-[10px] text-white/60">{dc.region}</p>
          </div>
          <div className="text-right">
            <p className={`font-code-sm text-[11px] font-bold tracking-widest ${dcTone}`}>
              {dcStatus}
            </p>
            <p className="font-code-sm text-[10px] text-white/60">
              {activeCount}/{SERVER_COUNT} nodes online
            </p>
          </div>
        </div>
      </div>

      {/* Incoming traffic → Load balancer */}
      <div className="flex flex-col items-center">
        <span className="font-code-sm text-[9px] uppercase tracking-[0.2em] text-sky-300/70">
          Incoming Traffic · Lvl {level}/5
        </span>
        <div
          className="traffic-line h-4 w-[2px] text-sky-400/80"
          style={{ animationDuration: `${flowDuration(demand / SERVER_COUNT)}s` }}
        />
        <LoadBalancerNode
          level={level}
          demand={demand}
          perServer={perServer}
          activeCount={activeCount}
          status={dcStatus}
        />
        <div className="mt-0.5 h-3 w-[2px] bg-white/20" />
      </div>

      {/* Distribution bus + servers */}
      <div className="relative">
        {activeCount > 1 && (
          <div className="pointer-events-none absolute left-[16.6667%] right-[16.6667%] top-0 h-[2px] bg-white/15" />
        )}
        <div className="grid grid-cols-3 gap-2">
          {health.map((isUp, i) => {
            const util = isUp ? perServer : 0;
            return (
              <div key={i} className="flex min-w-0 flex-col items-center gap-2">
                <Connector active={isUp} util={util} />
                <ServerNode
                  id={`${dc.code}-S${i + 1}`}
                  active={isUp}
                  util={util}
                  onToggle={() => toggle(i)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Explainer + controls */}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/10 pt-2">
        <p className="font-code-sm text-[10px] leading-tight text-white/60">
          {activeCount === 0 ? (
            <span className="text-red-300">No healthy nodes — traffic dropped.</span>
          ) : (
            <>
              <span className="text-white/80">{demand}</span> units ÷{" "}
              <span className="text-white/80">{activeCount}</span> node
              {activeCount > 1 ? "s" : ""} ={" "}
              <span className={anyOverload ? "text-red-300" : "text-emerald-300"}>
                {Math.round(perServer)}%
              </span>{" "}
              / node
            </>
          )}
        </p>
        <div className="flex shrink-0 gap-1.5">
          <button
            onClick={failRandom}
            disabled={activeCount <= 1}
            className="flex items-center gap-1 rounded border border-white/15 bg-white/5 px-2 py-1 font-code-sm text-[10px] uppercase tracking-wider text-white/80 transition-colors hover:border-red-400/60 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <span className="material-symbols-outlined text-[14px]">bolt</span>
            Fail node
          </button>
          <button
            onClick={recoverAll}
            disabled={activeCount === SERVER_COUNT}
            className="flex items-center gap-1 rounded border border-white/15 bg-white/5 px-2 py-1 font-code-sm text-[10px] uppercase tracking-wider text-white/80 transition-colors hover:border-emerald-400/60 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <span className="material-symbols-outlined text-[14px]">restart_alt</span>
            Recover
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadBalancerNode({
  level,
  demand,
  perServer,
  activeCount,
  status,
}: {
  level: number;
  demand: number;
  perServer: number;
  activeCount: number;
  status: "OPTIMAL" | "DEGRADED" | "OUTAGE";
}) {
  const tone =
    status === "OUTAGE"
      ? "border-red-500/70 bg-red-500/10"
      : status === "DEGRADED"
        ? "border-amber-400/60 bg-amber-400/10"
        : "border-secondary-container/60 bg-secondary-container/10";

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-4 py-2 shadow-lg backdrop-blur ${tone}`}
    >
      <span
        className={`material-symbols-outlined text-2xl ${
          status === "OUTAGE"
            ? "text-red-400 animate-blink"
            : status === "DEGRADED"
              ? "text-amber-300"
              : "text-sky-300"
        }`}
      >
        lan
      </span>
      <div className="leading-tight">
        <p className="font-code-sm text-[11px] font-bold uppercase tracking-widest text-white">
          Regional LB
        </p>
        <p className="font-code-sm text-[9px] text-white/60">
          {activeCount > 0
            ? `${demand}u split → ${Math.round(perServer)}% ea`
            : "awaiting healthy nodes"}
        </p>
      </div>
      <div className="ml-1 flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`h-4 w-1 rounded-full ${
              i < level ? "bg-sky-400" : "bg-white/15"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function Connector({ active, util }: { active: boolean; util: number }) {
  if (!active) {
    // Broken link into a downed server.
    return (
      <div className="flex h-6 w-[2px] flex-col items-center justify-between opacity-60">
        <div className="h-2 w-[2px] bg-red-500/40" />
        <div className="h-2 w-[2px] bg-red-500/40" />
      </div>
    );
  }
  const meta = STATUS_META[classify(true, util)];
  return (
    <div
      className="traffic-line h-6 w-[2px]"
      style={{ color: meta.hex, animationDuration: `${flowDuration(util)}s` }}
    />
  );
}

function ServerNode({
  id,
  active,
  util,
  onToggle,
}: {
  id: string;
  active: boolean;
  util: number;
  onToggle: () => void;
}) {
  const status = classify(active, util);
  const meta = STATUS_META[status];
  const overload = status === "overload";
  const fill = Math.min(util, 100);

  return (
    <button
      type="button"
      onClick={onToggle}
      title={active ? `${id} — click to simulate failure` : `${id} — click to recover`}
      className={`animate-fade-rise group relative flex w-full min-w-0 flex-col items-stretch gap-1.5 overflow-hidden rounded-lg border p-2 text-left transition-all
        ${active ? `bg-white/[0.04] ${meta.ring} hover:bg-white/[0.07]` : "border-white/10 bg-black/40"}
        ${overload ? "animate-blink" : ""}`}
    >
      {/* header row */}
      <div className="flex items-center justify-between">
        <span className="font-code-sm text-[10px] font-bold tracking-wider text-white/90">
          {id}
        </span>
        <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
      </div>

      {/* utilisation readout */}
      <div className="flex items-end justify-between">
        <span
          className={`font-display-lg text-lg font-bold leading-none ${
            active ? meta.text : "text-zinc-500"
          }`}
        >
          {active ? `${Math.round(util)}%` : "—"}
        </span>
        <span className={`font-code-sm text-[8px] uppercase tracking-wider ${meta.text}`}>
          {meta.label}
        </span>
      </div>

      {/* load bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out ${meta.bar}`}
          style={{ width: `${active ? fill : 0}%` }}
        />
      </div>

      {overload && (
        <span className="font-code-sm text-[8px] font-bold text-red-300">
          +{Math.round(util - 100)}% over capacity
        </span>
      )}

      {/* offline overlay */}
      {!active && (
        <div className="hazard-stripes absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/40">
          <span className="material-symbols-outlined text-2xl text-red-400">power_off</span>
          <span className="font-code-sm text-[9px] font-bold uppercase tracking-widest text-red-300">
            Offline
          </span>
          <span className="font-code-sm text-[7px] uppercase tracking-wider text-white/50">
            tap to recover
          </span>
        </div>
      )}
    </button>
  );
}

/** Higher utilisation → faster packet flow (shorter duration), clamped to a
 *  readable range. */
function flowDuration(util: number): number {
  const clamped = Math.max(0, Math.min(util, 150));
  return +(1.1 - (clamped / 150) * 0.8).toFixed(2); // 1.1s (idle) → 0.3s (max)
}
