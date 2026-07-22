"use client";

// Presentation-only visualization for the guided ransomware DR scenario.
// It renders purely from the `step` prop that the page's scenario controller
// produces — it does NOT send commands or change any control logic. Every
// counter/timer below is cosmetic animation state.
//
// The five beats follow the operator narration:
//   stable    — two live, replicating copies; everything green
//   breach    — Alexandria is encrypting; the replication link now threatens
//               to copy the damage to Cairo (the trap)
//   contained — the link is severed and ALX quarantined; the spread stops
//   failover  — with ALX dark, Cairo absorbs 100% of traffic (load climbs)
//   restored  — ALX wiped + rebuilt from a clean backup, then re-synced

import { useEffect, useState } from "react";

export type ScenarioStep = "stable" | "breach" | "contained" | "failover" | "restored";

type NodeVisual = "secure" | "encrypting" | "at-risk" | "quarantined" | "surging" | "restored";

const FILE_TARGET = 148_920;
const RANSOM_SECONDS = 71 * 3600 + 59 * 60 + 42;
const BASE_LOAD = 31;
const SURGE_LOAD = 88;

export default function RansomwareSim({ step }: { step: ScenarioStep }) {
  const breach = step === "breach";
  const attackActive = step === "breach"; // ransom note only while actively encrypting

  // --- cosmetic-only animated counters -------------------------------------
  const [encFiles, setEncFiles] = useState(0);
  const [countdown, setCountdown] = useState(RANSOM_SECONDS);
  const [cpu, setCpu] = useState(98);
  const [caiLoad, setCaiLoad] = useState(BASE_LOAD);

  // Reset the counters the moment we enter a new phase. This is React's
  // "adjust state while rendering when a value changes" pattern (not an effect),
  // so re-running the drill always starts fresh.
  const [trackedStep, setTrackedStep] = useState(step);
  if (step !== trackedStep) {
    setTrackedStep(step);
    if (step === "breach") {
      setEncFiles(0);
      setCountdown(RANSOM_SECONDS);
      setCpu(98);
    }
    setCaiLoad(step === "restored" ? 38 : BASE_LOAD);
  }

  // Timers are external systems; state is only updated inside their callbacks.
  useEffect(() => {
    if (!breach) return;
    const ramp = setInterval(() => {
      setEncFiles((p) =>
        p >= FILE_TARGET ? FILE_TARGET : Math.min(FILE_TARGET, p + Math.floor(Math.random() * 2200 + 600)),
      );
    }, 70);
    const tick = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    const jitter = setInterval(() => setCpu(96 + Math.floor(Math.random() * 4)), 400);
    return () => {
      clearInterval(ramp);
      clearInterval(tick);
      clearInterval(jitter);
    };
  }, [breach]);

  useEffect(() => {
    if (step !== "failover") return;
    const id = setInterval(() => setCaiLoad((v) => Math.min(SURGE_LOAD, v + 4)), 80);
    return () => clearInterval(id);
  }, [step]);

  const alxVisual: NodeVisual =
    step === "breach"
      ? "encrypting"
      : step === "contained" || step === "failover"
        ? "quarantined"
        : step === "restored"
          ? "restored"
          : "secure";

  const caiVisual: NodeVisual =
    step === "breach"
      ? "at-risk"
      : step === "failover"
        ? "surging"
        : "secure";

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="noc-grid absolute inset-0" />
      {breach && <div className="alert-vignette pointer-events-none absolute inset-0" />}

      <div className="relative z-10 flex h-full flex-col text-white">
        <AlertBanner step={step} />

        {/* Topology: ALX (origin, left) — replication link — CAI (right) */}
        <div className="flex min-h-0 flex-1 items-center justify-center gap-3 px-4">
          <DataCenterNode
            code="ALX-01"
            name="ALEXANDRIA"
            region="Alexandria, EG"
            image="/images/Alex-castle.avif"
            imagePosition="62% 40%"
            visual={alxVisual}
            cpuPct={cpu}
          />
          <InterLink step={step} />
          <DataCenterNode
            code="CAI-01"
            name="CAIRO"
            region="Cairo, EG"
            image="/images/ciaro-city.jpg"
            imagePosition="50% 35%"
            visual={caiVisual}
            loadPct={caiLoad}
          />
        </div>

        {attackActive ? (
          <RansomNote encFiles={encFiles} countdown={countdown} cpu={cpu} />
        ) : (
          <StatusStrip step={step} caiLoad={caiLoad} />
        )}
      </div>
    </div>
  );
}

function AlertBanner({ step }: { step: ScenarioStep }) {
  const map: Record<ScenarioStep, { cls: string; dot: string; icon: string; text: string }> = {
    stable: {
      cls: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
      dot: "bg-emerald-400 led-glow-green",
      icon: "verified_user",
      text: "ALL SYSTEMS SECURE · LIVE REPLICATION HEALTHY · THREAT LEVEL LOW",
    },
    breach: {
      cls: "border-red-500/50 bg-red-600/15 text-red-300",
      dot: "bg-red-500 led-glow-red animate-blink",
      icon: "coronavirus",
      text: "RANSOMWARE ACTIVE — ALX-01 ENCRYPTING · CONTAIN BEFORE IT REPLICATES TO CAIRO",
    },
    contained: {
      cls: "border-amber-400/50 bg-amber-500/10 text-amber-300",
      dot: "bg-amber-400 led-glow-amber",
      icon: "gpp_maybe",
      text: "SPREAD CONTAINED — ALX-01 QUARANTINED · REPLICATION LINK SEVERED",
    },
    failover: {
      cls: "border-sky-400/40 bg-sky-500/10 text-sky-300",
      dot: "bg-sky-400 led-glow-green",
      icon: "swap_horizontal_circle",
      text: "FAILOVER ACTIVE — CAIRO ABSORBING 100% OF TRAFFIC · SERVICE UP",
    },
    restored: {
      cls: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
      dot: "bg-emerald-400 led-glow-green",
      icon: "shield_lock",
      text: "RECOVERED — ALX-01 REBUILT FROM CLEAN BACKUP · BOTH REGIONS GREEN",
    },
  };
  const m = map[step];
  return (
    <div className={`mx-4 mt-4 flex items-center gap-3 rounded-lg border px-4 py-2 font-code-sm ${m.cls}`}>
      <span className="material-symbols-outlined text-xl">{m.icon}</span>
      <span className={`h-2 w-2 shrink-0 rounded-full ${m.dot}`} />
      <span className="text-[11px] font-bold uppercase tracking-wider">{m.text}</span>
    </div>
  );
}

function DataCenterNode({
  code,
  name,
  region,
  image,
  imagePosition,
  visual,
  cpuPct,
  loadPct,
}: {
  code: string;
  name: string;
  region: string;
  image: string;
  imagePosition: string;
  visual: NodeVisual;
  cpuPct?: number;
  loadPct?: number;
}) {
  const cfg = NODE_CFG[visual];
  const load = loadPct ?? BASE_LOAD;

  return (
    <div className="w-72 max-w-[42%] animate-fade-rise">
      <div
        className={`overflow-hidden rounded-xl border-2 shadow-xl transition-all duration-500 ${cfg.border}`}
      >
        {/* header */}
        <div className={`flex items-center justify-between px-3 py-2 ${cfg.headerBg}`}>
          <span className="font-code-sm text-[13px] font-bold tracking-widest text-white">{code}</span>
          <div className="flex items-center gap-2">
            {cfg.tag && (
              <span className={`rounded px-1.5 py-0.5 font-code-sm text-[8px] font-bold uppercase tracking-wider ${cfg.tagCls}`}>
                {cfg.tag}
              </span>
            )}
            <span className={`h-2 w-2 rounded-full ${cfg.led}`} />
          </div>
        </div>

        {/* image body */}
        <div className="relative h-40 overflow-hidden">
          <div
            className={`absolute inset-0 bg-cover transition-all duration-500 ${cfg.imgFilter}`}
            style={{ backgroundImage: `url(${image})`, backgroundPosition: imagePosition }}
          />
          <div className={`absolute inset-0 ${cfg.overlay}`} />

          {visual === "encrypting" && (
            <div className="scan-sweep absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-red-400/40 to-transparent" />
          )}

          {/* centre glyph + state word */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <span className={`material-symbols-outlined text-4xl drop-shadow ${cfg.glyphCls}`}>
              {cfg.glyph}
            </span>
            {cfg.centerLabel && (
              <span className={`font-code-sm text-[11px] font-bold tracking-[0.2em] drop-shadow ${cfg.centerLabelCls}`}>
                {cfg.centerLabel}
              </span>
            )}
          </div>

          {cfg.cornerWarn && (
            <span className="material-symbols-outlined absolute right-2 top-2 animate-pulse text-2xl text-red-400 drop-shadow">
              warning
            </span>
          )}

          {/* bottom label */}
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-6">
            <div className="leading-tight">
              <p className="font-headline-md text-base font-bold text-white">{name}</p>
              <p className="font-code-sm text-[10px] text-white/70">{region}</p>
            </div>
            <span className={`text-right font-code-sm text-[11px] font-bold tracking-widest ${cfg.statusCls}`}>
              {cfg.status}
            </span>
          </div>
        </div>

        {/* footer stats + bar */}
        <div className="bg-black/40 px-3 py-2">
          <div className="mb-1.5 flex items-center justify-between font-code-sm text-[9px] uppercase tracking-wider">
            <span className="text-white/50">
              Integrity <span className={cfg.integrityCls}>{cfg.integrity}</span>
            </span>
            <span className={cfg.statCls}>
              {visual === "encrypting"
                ? `CPU ${cpuPct ?? 98}%`
                : visual === "surging"
                  ? `Load ${load}%`
                  : cfg.stat}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            {visual === "encrypting" ? (
              <div className="encrypt-fill h-full rounded-full bg-gradient-to-r from-red-500 to-purple-500" />
            ) : visual === "quarantined" ? (
              <div className="h-full w-0 rounded-full bg-zinc-600" />
            ) : visual === "surging" ? (
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-200"
                style={{ width: `${load}%` }}
              />
            ) : visual === "restored" ? (
              <div className="h-full w-full rounded-full bg-emerald-400 transition-all duration-500" />
            ) : visual === "at-risk" ? (
              <div className="h-full rounded-full bg-amber-400 transition-all duration-500" style={{ width: `${load}%` }} />
            ) : (
              <div className="h-full rounded-full bg-sky-400 transition-all duration-500" style={{ width: `${load}%` }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const NODE_CFG: Record<
  NodeVisual,
  {
    border: string;
    headerBg: string;
    led: string;
    tag?: string;
    tagCls?: string;
    imgFilter: string;
    overlay: string;
    glyph: string;
    glyphCls: string;
    centerLabel?: string;
    centerLabelCls?: string;
    cornerWarn?: boolean;
    status: string;
    statusCls: string;
    integrity: string;
    integrityCls: string;
    stat: string;
    statCls: string;
  }
> = {
  secure: {
    border: "border-emerald-400/40",
    headerBg: "bg-white/5",
    led: "bg-emerald-400 led-glow-green",
    imgFilter: "",
    overlay: "bg-black/25",
    glyph: "verified_user",
    glyphCls: "text-emerald-300/80",
    status: "SECURE",
    statusCls: "text-emerald-300",
    integrity: "100%",
    integrityCls: "text-emerald-300",
    stat: "Nominal",
    statCls: "text-white/50",
  },
  encrypting: {
    border: "border-red-500/70",
    headerBg: "bg-red-600/20",
    led: "bg-red-500 led-glow-red animate-blink",
    tag: "Patient Zero",
    tagCls: "bg-red-500/30 text-red-200",
    imgFilter: "",
    overlay: "encrypted-texture bg-gradient-to-t from-red-950/90 via-red-900/50 to-purple-950/40",
    glyph: "lock",
    glyphCls: "text-red-300 glitch",
    centerLabel: "ENCRYPTED",
    centerLabelCls: "text-red-300 glitch",
    cornerWarn: true,
    status: "ENCRYPTING",
    statusCls: "text-red-300",
    integrity: "0%",
    integrityCls: "text-red-300",
    stat: "AES-256",
    statCls: "text-red-300",
  },
  "at-risk": {
    border: "border-amber-400/70 animate-pulse",
    headerBg: "bg-amber-500/15",
    led: "bg-amber-400 led-glow-amber animate-blink",
    tag: "At Risk",
    tagCls: "bg-amber-500/25 text-amber-200",
    imgFilter: "",
    overlay: "bg-gradient-to-t from-amber-950/70 via-amber-900/25 to-transparent",
    glyph: "warning",
    glyphCls: "text-amber-300",
    centerLabel: "INBOUND REPLICATION",
    centerLabelCls: "text-amber-200",
    status: "AT RISK",
    statusCls: "text-amber-300",
    integrity: "100%",
    integrityCls: "text-emerald-300",
    stat: "Guard armed",
    statCls: "text-amber-300",
  },
  quarantined: {
    border: "border-dashed border-zinc-500/60",
    headerBg: "bg-zinc-800/40",
    led: "bg-zinc-600",
    tag: "Isolated",
    tagCls: "bg-zinc-600/40 text-zinc-300",
    imgFilter: "grayscale brightness-50",
    overlay: "hazard-stripes bg-black/60",
    glyph: "block",
    glyphCls: "text-zinc-300",
    centerLabel: "QUARANTINED",
    centerLabelCls: "text-zinc-300",
    status: "OFFLINE",
    statusCls: "text-zinc-400",
    integrity: "—",
    integrityCls: "text-zinc-400",
    stat: "Severed",
    statCls: "text-zinc-400",
  },
  surging: {
    border: "border-sky-400/70",
    headerBg: "bg-sky-500/15",
    led: "bg-emerald-400 led-glow-green animate-pulse",
    tag: "Primary",
    tagCls: "bg-sky-500/25 text-sky-200",
    imgFilter: "",
    overlay: "bg-gradient-to-t from-sky-950/70 via-sky-900/20 to-transparent",
    glyph: "trending_up",
    glyphCls: "text-sky-200",
    centerLabel: "ABSORBING ALL TRAFFIC",
    centerLabelCls: "text-sky-100",
    status: "ONLINE",
    statusCls: "text-emerald-300",
    integrity: "100%",
    integrityCls: "text-emerald-300",
    stat: "",
    statCls: "text-amber-300",
  },
  restored: {
    border: "border-emerald-400/60",
    headerBg: "bg-emerald-500/10",
    led: "bg-emerald-400 led-glow-green",
    tag: "Rebuilt",
    tagCls: "bg-emerald-500/25 text-emerald-200",
    imgFilter: "",
    overlay: "bg-gradient-to-t from-emerald-950/70 via-emerald-900/25 to-transparent",
    glyph: "shield_lock",
    glyphCls: "text-emerald-300",
    centerLabel: "RESTORED FROM BACKUP",
    centerLabelCls: "text-emerald-200",
    status: "SECURE",
    statusCls: "text-emerald-300",
    integrity: "100%",
    integrityCls: "text-emerald-300",
    stat: "Verified",
    statCls: "text-emerald-300",
  },
};

function InterLink({ step }: { step: ScenarioStep }) {
  const cfg = {
    stable: { color: "#38bdf8", icon: "swap_horiz", label: "REPLICATING", severed: false, dur: "1.8s", reverse: false, blink: false },
    breach: { color: "#ef4444", icon: "coronavirus", label: "SPREADING", severed: false, dur: "0.45s", reverse: false, blink: true },
    contained: { color: "#ef4444", icon: "link_off", label: "LINK SEVERED", severed: true, dur: "0s", reverse: false, blink: true },
    failover: { color: "#a1a1aa", icon: "link_off", label: "ISOLATED", severed: true, dur: "0s", reverse: false, blink: false },
    restored: { color: "#34d399", icon: "sync", label: "RE-SYNCING", severed: false, dur: "1.1s", reverse: true, blink: false },
  }[step];

  return (
    <div className="flex w-24 shrink-0 flex-col items-center gap-2">
      <span className="material-symbols-outlined text-lg" style={{ color: cfg.color }}>
        {cfg.icon}
      </span>

      <div className="relative flex h-3 w-full items-center overflow-hidden rounded-full border border-white/10 bg-black/40">
        {cfg.severed ? (
          <>
            <div className="h-[2px] flex-1 bg-zinc-600/50" />
            <span className="material-symbols-outlined px-0.5 text-[13px]" style={{ color: cfg.color }}>
              close
            </span>
            <div className="h-[2px] flex-1 bg-zinc-600/50" />
          </>
        ) : (
          <div
            className="malware-stream absolute inset-0 opacity-90"
            style={{ color: cfg.color, animationDuration: cfg.dur, animationDirection: cfg.reverse ? "reverse" : "normal" }}
          />
        )}
      </div>

      <span
        className={`text-center font-code-sm text-[8px] font-bold uppercase leading-tight tracking-wider ${cfg.blink ? "animate-blink" : ""}`}
        style={{ color: cfg.color }}
      >
        {cfg.label}
      </span>
    </div>
  );
}

function RansomNote({ encFiles, countdown, cpu }: { encFiles: number; countdown: number; cpu: number }) {
  return (
    <div className="animate-fade-rise m-4 mt-3 overflow-hidden rounded-lg border-2 border-red-500/60 bg-gradient-to-br from-[#1a0508] to-[#12040a] shadow-2xl">
      <div className="flex items-center justify-between border-b border-red-500/30 bg-red-600/15 px-4 py-1.5">
        <span className="flex items-center gap-2 font-code-sm text-[10px] font-bold uppercase tracking-widest text-red-300">
          <span className="material-symbols-outlined text-base">skull</span>
          BloomCrypt Ransom Note
        </span>
        <span className="font-code-sm text-[9px] uppercase tracking-widest text-red-400/60">
          {"// Training Simulation — no real systems affected"}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
        <div className="min-w-0">
          <h4 className="glitch font-headline-md text-lg font-bold tracking-tight text-red-300">
            YOUR FILES HAVE BEEN ENCRYPTED
          </h4>
          <p className="font-code-sm text-[10px] text-white/60">
            ALX-01 is encrypting itself — the replication link will copy the damage to{" "}
            <span className="text-red-300">CAI-01</span>, our last good copy.
          </p>
          <p className="mt-1 font-code-sm text-[10px] font-bold text-amber-300">
            <span className="material-symbols-outlined align-middle text-[13px]">bolt</span> Contain
            first — isolate ALX-01 before it spreads.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Metric label="ALX-01 CPU" value={`${cpu}%`} tone="text-red-300" />
          <div className="h-10 w-px bg-red-500/20" />
          <Metric label="Files encrypted" value={encFiles.toLocaleString("en-US")} tone="text-red-300" />
          <div className="h-10 w-px bg-red-500/20" />
          <Metric label="Until data wipe" value={fmtDuration(countdown)} tone="text-amber-300" />
        </div>
      </div>
    </div>
  );
}

function StatusStrip({ step, caiLoad }: { step: ScenarioStep; caiLoad: number }) {
  const cfg: Record<
    Exclude<ScenarioStep, "breach">,
    { icon: string; iconCls: string; title: string; subtitle: string; metrics: { label: string; value: string; tone: string }[] }
  > = {
    stable: {
      icon: "shield",
      iconCls: "text-emerald-300",
      title: "Perimeter secure · both regions live",
      subtitle: "Cairo and Alexandria each hold a live copy, replicating constantly. Backups armed.",
      metrics: [
        { label: "Sites live", value: "2 / 2", tone: "text-emerald-300" },
        { label: "Replication", value: "⇄ Healthy", tone: "text-sky-300" },
        { label: "Last backup", value: "00:04 ago", tone: "text-white/80" },
      ],
    },
    contained: {
      icon: "gpp_good",
      iconCls: "text-amber-300",
      title: "Spread contained — the blast radius is frozen",
      subtitle: "Replication link severed and ALX-01 quarantined. The infection cannot reach Cairo.",
      metrics: [
        { label: "Spread", value: "Stopped", tone: "text-emerald-300" },
        { label: "Nodes isolated", value: "1", tone: "text-amber-300" },
        { label: "Cairo copy", value: "Clean", tone: "text-emerald-300" },
      ],
    },
    failover: {
      icon: "swap_horizontal_circle",
      iconCls: "text-sky-300",
      title: "Cairo is carrying the whole region",
      subtitle: "With Alexandria dark, Cairo absorbs 100% of traffic. Load climbs, but the service stays up.",
      metrics: [
        { label: "Cairo load", value: `${caiLoad}%`, tone: "text-amber-300" },
        { label: "Service", value: "UP", tone: "text-emerald-300" },
        { label: "Downtime", value: "0s", tone: "text-emerald-300" },
      ],
    },
    restored: {
      icon: "task_alt",
      iconCls: "text-emerald-300",
      title: "Incident closed — both regions green",
      subtitle: "We didn't pay. ALX-01 was wiped, rebuilt from a clean pre-attack backup, and re-synced from Cairo.",
      metrics: [
        { label: "Sites live", value: "2 / 2", tone: "text-emerald-300" },
        { label: "Ransom paid", value: "0 BTC", tone: "text-emerald-300" },
        { label: "Data lost", value: "None", tone: "text-emerald-300" },
      ],
    },
  };
  const m = cfg[step as Exclude<ScenarioStep, "breach">];
  if (!m) return null;

  return (
    <div className="m-4 mt-3 flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 font-code-sm">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`material-symbols-outlined text-xl ${m.iconCls}`}>{m.icon}</span>
        <div className="min-w-0 leading-tight">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/90">{m.title}</p>
          <p className="truncate text-[10px] text-white/50">{m.subtitle}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        {m.metrics.map((mt, i) => (
          <div key={mt.label} className="flex items-center gap-4">
            {i > 0 && <div className="h-10 w-px bg-white/10" />}
            <Metric label={mt.label} value={mt.value} tone={mt.tone} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="text-right">
      <p className={`font-display-lg text-base font-bold leading-none ${tone}`}>{value}</p>
      <p className="font-code-sm text-[9px] uppercase tracking-wider text-white/40">{label}</p>
    </div>
  );
}

function fmtDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
