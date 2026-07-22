"use client";

// Exposes the AccessGate's lock() action to the unlocked app (e.g. the Emergency Shutdown
// and power buttons). Provided by AccessGate only while unlocked, so consumers always sit
// inside it.

import { createContext, useContext } from "react";

export interface AccessContextValue {
  /** Re-secure the facility: reset the mock hardware and drop back to the 2FA gate. */
  lock: () => void;
}

export const AccessContext = createContext<AccessContextValue | null>(null);

export function useAccess(): AccessContextValue {
  const ctx = useContext(AccessContext);
  if (!ctx) {
    throw new Error("useAccess must be used within the AccessGate");
  }
  return ctx;
}
