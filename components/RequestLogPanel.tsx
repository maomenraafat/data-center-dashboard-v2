"use client";

import { useState } from "react";
import { useRequestLog } from "@/context/RequestLogContext";
import { formatLogValue, type RequestSource } from "@/lib/requestLog";

const FILTERS: Array<RequestSource | "all"> = ["all", "led", "security", "control"];

export default function RequestLogPanel() {
  const { entries, clear } = useRequestLog();
  const [open, setOpen] = useState(true);
  const [filter, setFilter] = useState<RequestSource | "all">("all");
  const shown = filter === "all" ? entries : entries.filter((entry) => entry.source === filter);

  return (
    <div className="fixed bottom-4 right-4 z-[220] w-[min(440px,calc(100vw-2rem))] pointer-events-auto">
      <div className="rounded-lg border border-outline-variant bg-[#071422]/95 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-outline-variant">
          <button
            onClick={() => setOpen((v) => !v)}
            className="font-code-sm text-[11px] uppercase tracking-widest text-primary"
          >
            {open ? "▾" : "▸"} Request log
            <span className="ml-2 text-on-surface-variant">{entries.length}</span>
          </button>
          <div className="flex-1" />
          <button
            onClick={clear}
            className="font-code-sm text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-primary"
          >
            Clear
          </button>
        </div>

        {open && (
          <>
            <div className="flex gap-1 px-3 py-2 border-b border-outline-variant">
              {FILTERS.map((item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`px-2 py-1 rounded font-code-sm text-[10px] uppercase tracking-wider ${
                    filter === item
                      ? "bg-secondary text-on-secondary"
                      : "text-on-surface-variant hover:text-primary"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="max-h-72 overflow-auto px-3 py-2 space-y-2">
              {shown.length === 0 && (
                <p className="font-code-sm text-[11px] text-on-surface-variant">No requests yet.</p>
              )}
              {shown.map((entry) => (
                <article key={entry.id} className="border-b border-outline-variant/60 pb-2">
                  <p className="font-code-sm text-[11px] text-on-surface">
                    <span className="text-on-surface-variant">
                      {new Date(entry.at).toLocaleTimeString()}
                    </span>{" "}
                    <span className="uppercase text-primary">{entry.source}</span>{" "}
                    {entry.method}{" "}
                    <span className={entry.ok ? "text-emerald-300" : "text-error"}>
                      {entry.status ?? "ERR"}
                    </span>{" "}
                    <span className="text-on-surface-variant">{entry.durationMs}ms</span>
                  </p>
                  <p className="font-code-sm text-[11px] text-secondary-fixed break-all">{entry.url}</p>
                  {entry.request !== undefined && (
                    <pre className="mt-1 font-code-sm text-[10px] text-on-surface-variant whitespace-pre-wrap break-all">
                      req {formatLogValue(entry.request)}
                    </pre>
                  )}
                  <pre className="font-code-sm text-[10px] text-on-surface whitespace-pre-wrap break-all">
                    res {entry.error ?? (formatLogValue(entry.response) || "—")}
                  </pre>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
