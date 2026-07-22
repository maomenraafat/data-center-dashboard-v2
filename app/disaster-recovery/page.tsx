"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import RecoveryTerminal from "@/components/RecoveryTerminal";
import RansomwareSim, { type ScenarioStep } from "@/components/RansomwareSim";
import { useControl } from "@/hooks/useControl";

const STEP_ORDER: ScenarioStep[] = ["stable", "breach", "contained", "failover", "restored"];

const STEP_SCRIPT: Record<ScenarioStep, string> = {
  stable:
    "Two datacenters — Cairo and Alexandria — each holding a live copy of the data, replicating to each other constantly. It's Friday afternoon. Everything's green.",
  breach:
    "Weeks ago, someone in Alexandria opened the wrong attachment. The attackers waited, mapped the network, and just now pulled the trigger. Alexandria is encrypting itself. The trap: the replication link is about to copy the damage to Cairo — our last good copy.",
  contained:
    "The first move isn't to fix Alexandria — it's to cut it off. We sever the link and quarantine the node. The spread stops right here. This is the whole game.",
  failover:
    "With Alexandria dark, Cairo takes all the traffic. Load climbs, but the service stays up. Customers barely notice.",
  restored:
    "We don't pay, and we don't trust the infected disks. We wipe Alexandria and rebuild from a clean backup taken before the attack, then re-sync from Cairo. Both regions green again. The order is always contain → failover → restore — never the other way around.",
};

export default function DisasterRecoveryPage() {
  const [step, setStep] = useState<ScenarioStep>("stable");
  const { send } = useControl();

  const contained = step === "contained" || step === "failover" || step === "restored";
  const failedOver = step === "failover" || step === "restored";
  const restored = step === "restored";
  const active = step !== "stable";

  // --- scenario transitions (ESP calls preserved from the original page) ----
  function triggerAttack() {
    if (step !== "stable") return;
    setStep("breach");
    // Disaster recovery → /disasterrecovery?disasterrecovery=2 (engage failover).
    void send("disasterrecovery", 2);
  }
  function isolate() {
    if (step !== "breach") return;
    setStep("contained");
  }
  function restore() {
    if (step !== "failover") return;
    setStep("restored");
    // Restore to normal operation → /disasterrecovery?disasterrecovery=1.
    void send("disasterrecovery", 1);
  }
  function resetScenario() {
    setStep("stable");
    void send("disasterrecovery", 1);
  }

  // Containment automatically triggers failover a beat later ("failover happens
  // automatically" in the narration).
  useEffect(() => {
    if (step !== "contained") return;
    const t = setTimeout(() => setStep("failover"), 2200);
    return () => clearTimeout(t);
  }, [step]);

  const statusPill: Record<ScenarioStep, { cls: string; text: string }> = {
    stable: { cls: "bg-green-500", text: "SYSTEM NOMINAL" },
    breach: { cls: "bg-error animate-blink", text: "BREACH — ENCRYPTING" },
    contained: { cls: "bg-amber-500 animate-pulse", text: "CONTAINED" },
    failover: { cls: "bg-secondary animate-pulse", text: "FAILOVER ACTIVE" },
    restored: { cls: "bg-green-500", text: "RECOVERED" },
  };
  const pill = statusPill[step];

  const action: {
    label: string;
    icon: string;
    onClick?: () => void;
    tone: string;
    disabled?: boolean;
    spin?: boolean;
  } = {
    stable: { label: "Trigger Ransomware", icon: "coronavirus", onClick: triggerAttack, tone: "red" },
    breach: { label: "Isolate ALX-01", icon: "link_off", onClick: isolate, tone: "amber" },
    contained: { label: "Failing over…", icon: "sync", tone: "neutral", disabled: true, spin: true },
    failover: { label: "Restore from Backup", icon: "restore", onClick: restore, tone: "emerald" },
    restored: { label: "Reset Scenario", icon: "restart_alt", onClick: resetScenario, tone: "neutral" },
  }[step];

  const toneCls: Record<string, string> = {
    red: "border-red-500 bg-red-600 text-white hover:bg-red-700 shadow-[0_0_20px_rgba(239,68,68,0.5)]",
    amber: "border-amber-500 bg-amber-500 text-white hover:bg-amber-600 shadow-[0_0_20px_rgba(245,158,11,0.4)]",
    emerald: "border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.35)]",
    neutral: "border-outline text-primary bg-surface-container hover:bg-primary-container",
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar active="Disaster Recovery" />

      <main className="ml-sidebar_width h-screen overflow-hidden flex flex-col relative bg-surface-container-low flex-1">
        <header className="h-20 flex items-center px-gutter justify-between border-b border-outline-variant bg-surface">
          <div className="flex items-center gap-4">
            <h2 className="font-headline-md text-headline-md uppercase tracking-tight text-primary">
              Disaster Recovery — Ransomware Containment Drill
            </h2>
          </div>
          <div className="flex items-center gap-4 font-data-label text-data-label text-on-surface-variant">
            <span className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-sm ${pill.cls}`} />
              {pill.text}
            </span>
            <span className="border-l border-outline-variant pl-4" />
          </div>
        </header>

        <div className="flex-grow flex p-gutter gap-gutter overflow-hidden">
          {/* Central Content (Topology View) */}
          <section className="flex-[3] flex flex-col gap-gutter h-full min-h-0">
            <div className="flex-grow relative rounded-lg border-2 border-outline-variant overflow-hidden">
              <RansomwareSim step={step} />

              <div className="absolute top-3 right-4 text-right pointer-events-none z-20">
                <p className="font-code-sm text-[10px] text-white/50">SERIAL: BDC-DR-ALX-CAI</p>
                <p className="font-code-sm text-[9px] text-white/30 uppercase tracking-wider">
                  Regional Failover Layer: {active ? "Engaged" : "Armed"}
                </p>
              </div>
            </div>

            {/* Scenario controller: step tracker + narration + primary action */}
            <div className="bg-surface-container-high border border-outline-variant rounded-lg p-4 shadow-inner shrink-0 flex items-center gap-6">
              <div className="flex-1 min-w-0 flex flex-col gap-3">
                <StepTracker step={step} />
                <p className="font-code-sm text-[12px] leading-snug text-on-surface-variant">
                  {STEP_SCRIPT[step]}
                </p>
              </div>

              <button
                onClick={action.onClick}
                disabled={action.disabled}
                className={`shrink-0 flex items-center gap-2 px-3 py-3 rounded-lg border-2 font-bold text-sm uppercase tracking-widest transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 ${toneCls[action.tone]}`}
              >
                <span className={`material-symbols-outlined text-xl ${action.spin ? "animate-spin" : ""}`}>
                  {action.icon}
                </span>
                {action.label}
              </button>
            </div>
          </section>

          {/* Sidebar Content */}
          <section className="flex-1 flex flex-col gap-gutter h-full min-h-0">
            {/* Incident Response checklist */}
            <div className="bg-surface rounded-lg border border-outline-variant p-4 flex flex-col gap-4 shrink-0">
              <div className="flex justify-between items-center border-b border-outline-variant pb-2">
                <h3 className="font-headline-md text-base text-primary uppercase">Incident Response</h3>
                <span className="font-code-sm text-xs text-on-surface-variant">
                  {String([contained, failedOver, restored].filter(Boolean).length).padStart(2, "0")} / 03
                </span>
              </div>
              <div className="space-y-3">
                <Task
                  index={1}
                  title="Contain — sever link & quarantine ALX-01"
                  state={contained ? "done" : step === "breach" ? "active" : "locked"}
                />
                <Task
                  index={2}
                  title="Failover — shift all traffic to CAI-01"
                  state={failedOver ? "done" : step === "contained" ? "active" : "locked"}
                />
                <Task
                  index={3}
                  title="Restore — rebuild ALX-01 from clean backup"
                  state={restored ? "done" : step === "failover" ? "active" : "locked"}
                />
              </div>
              <p className="font-code-sm text-[10px] text-on-surface-variant border-t border-outline-variant pt-2 leading-snug">
                <span className="material-symbols-outlined align-middle text-[13px] text-secondary">
                  lightbulb
                </span>{" "}
                The replication that saves you in an outage is what endangers you in ransomware —
                contain <span className="font-bold">before</span> you fail over.
              </p>
            </div>

            {/* Terminal Module */}
            <RecoveryTerminal
              onRecovered={() => {
                setStep("restored");
                void send("disasterrecovery", 1);
              }}
            />
          </section>
        </div>
      </main>
    </div>
  );
}

function StepTracker({ step }: { step: ScenarioStep }) {
  const labels: Record<ScenarioStep, string> = {
    stable: "Stable",
    breach: "Breach",
    contained: "Contain",
    failover: "Failover",
    restored: "Restore",
  };
  const current = STEP_ORDER.indexOf(step);

  return (
    <div className="flex items-center">
      {STEP_ORDER.map((s, i) => {
        const done = i < current;
        const isCurrent = i === current;
        const danger = s === "breach";
        return (
          <div key={s} className="flex items-center">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 font-code-sm text-[11px] font-bold transition-all ${
                  done
                    ? "border-secondary bg-secondary text-white"
                    : isCurrent
                      ? danger
                        ? "border-error bg-error text-white animate-pulse"
                        : "border-secondary bg-secondary/15 text-secondary animate-pulse"
                      : "border-outline-variant text-on-surface-variant"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={`font-data-label text-[11px] uppercase tracking-wider ${
                  isCurrent ? "text-primary font-bold" : "text-on-surface-variant"
                }`}
              >
                {labels[s]}
              </span>
            </div>
            {i < STEP_ORDER.length - 1 && (
              <div className={`mx-2 h-px w-8 ${i < current ? "bg-secondary" : "bg-outline-variant"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Task({
  index,
  title,
  state,
}: {
  index: number;
  title: string;
  state: "done" | "active" | "locked";
}) {
  const cls =
    state === "done"
      ? "bg-green-50 border-green-200"
      : state === "active"
        ? "bg-amber-50 border-amber-200 animate-pulse"
        : "bg-surface-container opacity-50 border-transparent";
  const icon =
    state === "done" ? "check_circle" : state === "active" ? "radio_button_checked" : "lock";
  const iconCls =
    state === "done" ? "text-green-600" : state === "active" ? "text-amber-600" : "text-on-surface-variant";
  const statusText = state === "done" ? "COMPLETED" : state === "active" ? "IN PROGRESS..." : "LOCKED";
  const statusCls =
    state === "done" ? "text-green-600" : state === "active" ? "text-amber-600" : "text-on-surface-variant";

  return (
    <div className={`flex items-center gap-3 p-3 rounded transition-all border ${cls}`}>
      <span className={`material-symbols-outlined ${iconCls}`}>{icon}</span>
      <div className="flex-grow">
        <p className="text-sm font-headline-md text-on-surface">
          Step {index}: {title}
        </p>
        <p className={`font-code-sm text-[10px] ${statusCls}`}>{statusText}</p>
      </div>
    </div>
  );
}
