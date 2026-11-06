"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { subscribeRequestLog, type RequestLogEntry } from "@/lib/requestLog";

const MAX_ENTRIES = 80;

interface RequestLogContextValue {
  entries: RequestLogEntry[];
  clear: () => void;
}

const RequestLogContext = createContext<RequestLogContextValue | null>(null);

export function RequestLogProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<RequestLogEntry[]>([]);

  useEffect(() => {
    return subscribeRequestLog((entry) => {
      setEntries((prev) => [entry, ...prev].slice(0, MAX_ENTRIES));
    });
  }, []);

  const value = useMemo(() => ({ entries, clear: () => setEntries([]) }), [entries]);

  return <RequestLogContext.Provider value={value}>{children}</RequestLogContext.Provider>;
}

export function useRequestLog(): RequestLogContextValue {
  const ctx = useContext(RequestLogContext);
  if (!ctx) throw new Error("useRequestLog must be used within a RequestLogProvider");
  return ctx;
}
