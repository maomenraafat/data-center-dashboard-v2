"use client";

// Emergency-shutdown / power control. Re-secures the facility via the AccessGate's lock():
// resets the mock hardware and returns to the 2FA entrance gate. Confirms first to avoid
// accidental lockouts.

import { useAccess } from "@/context/AccessContext";

export default function LockButton({ variant = "icon" }: { variant?: "icon" | "emergency" }) {
  const { lock } = useAccess();

  function handle() {
    if (
      typeof window !== "undefined" &&
      window.confirm("Emergency shutdown — lock the facility and return to secure entry?")
    ) {
      lock();
    }
  }

  if (variant === "emergency") {
    return (
      <button
        type="button"
        onClick={handle}
        className="w-full bg-error text-white font-bold py-3 mb-gutter text-sm tracking-widest active:translate-y-px transition-all shadow-[0_4px_0_#93000a] active:shadow-none uppercase font-headline-md"
      >
        EMERGENCY SHUTDOWN
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handle}
      aria-label="Emergency shutdown"
      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-error-container hover:text-error transition-transform active:scale-95 text-on-surface-variant"
    >
      <span className="material-symbols-outlined">power_settings_new</span>
    </button>
  );
}
