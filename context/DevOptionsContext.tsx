"use client";

// Small UI-only options store, kept separate from the preserved EnvironmentContext.
// `simSendReal`: when on, control actions in SIM mode ALSO fire the real GET at the board
// (the on-screen simulator still animates) — handy for driving real hardware while keeping
// the mock visuals. Persisted to localStorage, SSR-safe (default on server, hydrate on mount).

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface DevOptionsContextValue {
  simSendReal: boolean;
  setSimSendReal: (v: boolean) => void;
}

const DevOptionsContext = createContext<DevOptionsContextValue | null>(null);

function usePersistentBool(key: string, initial: boolean): [boolean, (v: boolean) => void] {
  const [value, setValue] = useState<boolean>(initial);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw !== null) setValue(JSON.parse(raw) as boolean);
    } catch {
      // ignore malformed/unavailable storage
    }
    // read once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore storage write failures
    }
  }, [key, value]);

  return [value, setValue];
}

export function DevOptionsProvider({ children }: { children: ReactNode }) {
  const [simSendReal, setSimSendReal] = usePersistentBool("dca:simSendReal", false);
  return (
    <DevOptionsContext.Provider value={{ simSendReal, setSimSendReal }}>
      {children}
    </DevOptionsContext.Provider>
  );
}

export function useDevOptions(): DevOptionsContextValue {
  const ctx = useContext(DevOptionsContext);
  if (!ctx) {
    throw new Error("useDevOptions must be used within a DevOptionsProvider");
  }
  return ctx;
}
