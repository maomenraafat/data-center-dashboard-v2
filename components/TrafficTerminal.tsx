"use client";

import { useRef, useState } from "react";
import { useControl, type SiteId } from "@/hooks/useControl";

type LogLine = { text: string; className: string };

const SITE_ALIASES: Record<string, SiteId> = {
  cairo: "cairo",
  cai: "cairo",
  alexandria: "alexandria",
  alx: "alexandria",
};

const SITE_TAG: Record<SiteId, string> = {
  cairo: "CAI-01",
  alexandria: "ALX-01",
};

const INITIAL_LOG: LogLine[] = [
  { text: "[ 0.000 ] Booting BLOOM-OS Load Balancer...", className: "text-white opacity-90" },
  { text: "[ 0.124 ] Health Check: Mediterranean Nodes...", className: "text-white opacity-90" },
  { text: "[ 0.310 ] CAI-01 nominal. ALX-01 nominal.", className: "text-blue-300" },
  { text: "[ 0.500 ] Traffic shaper online.", className: "text-white opacity-90" },
  { text: "[ 0.820 ] Awaiting operator input...", className: "text-amber-400" },
];

export default function TrafficTerminal({
  onLevelChange,
}: {
  onLevelChange?: (site: SiteId, level: 1 | 2 | 3 | 4 | 5) => void;
}) {
  const [log, setLog] = useState<LogLine[]>(INITIAL_LOG);
  const [value, setValue] = useState("");
  const outputRef = useRef<HTMLDivElement>(null);
  const { send } = useControl();

  const appendLine = (line: LogLine) => {
    setLog((prev) => [...prev, line]);
    requestAnimationFrame(() => {
      if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
    });
  };

  const runSet = (siteArg: string | undefined, levelArg: string | undefined) => {
    const site = siteArg ? SITE_ALIASES[siteArg] : undefined;
    const level = Number(levelArg);

    if (!site) {
      appendLine({
        text: `[ ERR ] Unknown site '${siteArg ?? ""}' (use cairo or alexandria)`,
        className: "text-error/70 mb-1",
      });
      return;
    }
    if (!levelArg || isNaN(level) || level < 1 || level > 5) {
      appendLine({ text: `[ ERR ] Level must be a number 1-5`, className: "text-error/70 mb-1" });
      return;
    }

    const clamped = level as 1 | 2 | 3 | 4 | 5;
    const tag = SITE_TAG[site];

    appendLine({ text: `[ .... ] Pushing level ${clamped} to ${tag}...`, className: "text-amber-400" });

    // Load balancing → /loadbalancing?severity=<clamped> (real) or mock simulator.
    send("loadbalancing", clamped)
      .then((ok) => {
        onLevelChange?.(site, clamped);
        appendLine(
          ok
            ? {
                text: `[ OK ] ${tag} traffic level set to ${clamped}/5`,
                className: "text-green-400 font-bold",
              }
            : { text: `[ ERR ] ${tag} push rejected`, className: "text-error/70 mb-1" },
        );
      })
      .catch((err) => {
        appendLine({ text: `[ ERR ] Push failed: ${String(err)}`, className: "text-error/70 mb-1" });
      });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const raw = value.trim();
    if (!raw) return;

    appendLine({ text: `> ${value}`, className: "text-white/60 mb-1" });

    const parts = raw.toLowerCase().split(/\s+/);
    const cmd = parts[0];

    if (cmd === "help") {
      appendLine({ text: "commands: set <cairo|alexandria> <1-5> | status | clear", className: "text-blue-300" });
    } else if (cmd === "clear") {
      setLog([]);
    } else if (cmd === "set" || cmd === "level") {
      runSet(parts[1], parts[2]);
    } else {
      appendLine({ text: `[ ERR ] Unknown command: '${cmd}'`, className: "text-error/70 mb-1" });
    }

    setValue("");
  };

  return (
    <div className="flex-grow bg-[#0c1c30] rounded-lg border-2 border-outline-variant flex flex-col overflow-hidden shadow-2xl">
      <div className="bg-primary px-3 py-1.5 flex items-center justify-between border-b border-white/10">
        <span className="font-code-sm text-[10px] text-on-primary-container uppercase tracking-widest">
          Traffic Shaper // TTY-02
        </span>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-error/40" />
          <div className="w-2 h-2 rounded-full bg-tertiary-fixed-dim/40" />
          <div className="w-2 h-2 rounded-full bg-green-500/40" />
        </div>
      </div>

      <div
        className="flex-grow flex flex-col p-4 font-code-sm text-[11px] leading-relaxed overflow-hidden"
        onClick={(e) => e.currentTarget.querySelector("input")?.focus()}
      >
        <div ref={outputRef} className="flex-grow overflow-y-auto mb-2 text-on-secondary-fixed">
          {log.map((line, i) => (
            <p key={i} className={`${line.className} mb-1`}>
              {line.text}
            </p>
          ))}
        </div>

        <div className="flex items-center gap-2 text-white border-t border-white/5 pt-2">
          <span className="text-blue-400 opacity-80">root@bloom:~$</span>
          <div className="relative flex-grow">
            <input
              autoComplete="off"
              autoFocus
              className="bg-transparent border-none p-0 w-full focus:ring-0 font-code-sm text-[11px] text-white outline-none"
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="w-1.5 h-3 bg-white/70 cursor-blink ml-[-0.5rem]" />
        </div>
      </div>
    </div>
  );
}