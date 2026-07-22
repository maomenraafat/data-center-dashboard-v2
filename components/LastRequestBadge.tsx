"use client";

// Unobtrusive bottom-right badge showing the exact URL of the most recent control request
// (e.g. http://10.102.224.43/network?network=3), plus whether it was SIM or LIVE. Sits below
// the 2FA gate's z-index, so it only appears once the app is unlocked and a control fires.

import { useLastRequest } from "@/context/LastRequestContext";

export default function LastRequestBadge() {
  const { last } = useLastRequest();
  if (!last) return null;

  const live = last.mode === "real";

  return (
    <div className="fixed bottom-4 right-4 z-[100] max-w-[92vw] pointer-events-none">
      <div className="flex items-center gap-3 rounded-md border border-outline-variant bg-[#0c1c30] px-3 py-2 shadow-2xl">
        <span
          className={`font-code-sm text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
            live ? "bg-error text-white" : "bg-secondary text-on-secondary"
          }`}
        >
          {live ? "LIVE" : "SIM"}
        </span>
        <code className="font-code-sm text-[11px] text-secondary-fixed break-all">
          {last.url}
        </code>
        <span className="font-code-sm text-[10px] text-white/40 whitespace-nowrap">
          {new Date(last.at).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
