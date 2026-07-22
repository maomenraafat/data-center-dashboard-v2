"use client";

import { useRef, useState } from "react";

type LogLine = { text: string; className: string };

const INITIAL_LOG: LogLine[] = [
  { text: "[ 0.000 ] Booting BLOOM-OS Regional Fabric...", className: "text-white opacity-90" },
  { text: "[ 0.124 ] Health Check: Mediterranean Nodes...", className: "text-white opacity-90" },
  { text: "[ 0.442 ] ALX-01 CRITICAL FAULT DETECTED", className: "text-error font-bold" },
  { text: "[ 0.450 ] Redirecting traffic to Cairo (CAI-01)", className: "text-amber-400" },
  { text: "[ 0.820 ] Load balancer re-syncing...", className: "text-white opacity-90" },
  { text: "[ 1.209 ] Connection established: CAI-01 active.", className: "text-blue-300" },
  { text: "[ 1.450 ] Simulation: Alexandria Node Failure initiated.", className: "text-white opacity-90" },
  { text: "[ 2.500 ] Awaiting Recovery Command...", className: "text-amber-400" },
];

const RECOVER_SEQUENCE: LogLine[] = [
  { text: "[ 3.120 ] Initiating ALX-01 reboot...", className: "text-amber-400" },
  { text: "[ 4.500 ] ALX-01 heartbeat detected.", className: "text-blue-300" },
  { text: "[ 5.000 ] System recovered. All nodes operational.", className: "text-green-400 font-bold" },
];

export default function RecoveryTerminal({
  onRecovered,
}: {
  onRecovered: () => void;
}) {
  const [log, setLog] = useState<LogLine[]>(INITIAL_LOG);
  const [value, setValue] = useState("");
  const outputRef = useRef<HTMLDivElement>(null);

  const appendLine = (line: LogLine) => {
    setLog((prev) => [...prev, line]);
    requestAnimationFrame(() => {
      if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
    });
  };

  const handleRecover = () => {
    RECOVER_SEQUENCE.forEach((line, index) => {
      setTimeout(() => {
        appendLine(line);
        if (index === RECOVER_SEQUENCE.length - 1) onRecovered();
      }, (index + 1) * 800);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const command = value.trim().toLowerCase();
    if (!command) return;

    appendLine({ text: `> ${value}`, className: "text-white/60 mb-1" });

    if (command === "recover") {
      handleRecover();
    } else {
      appendLine({ text: `[ ERR ] Unknown command: '${command}'`, className: "text-error/70 mb-1" });
    }

    setValue("");
  };

  return (
    <div className="flex-grow bg-[#0c1c30] rounded-lg border-2 border-outline-variant flex flex-col overflow-hidden shadow-2xl">
      <div className="bg-primary px-3 py-1.5 flex items-center justify-between border-b border-white/10">
        <span className="font-code-sm text-[10px] text-on-primary-container uppercase tracking-widest">
          System Logs // TTY-01
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
        <div
          ref={outputRef}
          className="flex-grow overflow-y-auto mb-2 text-on-secondary-fixed"
        >
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
