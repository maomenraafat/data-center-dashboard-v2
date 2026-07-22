"use client";

// Tiny shared store for the most recent control request, so a global on-screen badge can
// show the exact URL each control sends without opening DevTools. Purely presentational —
// it observes the wiring in useControl(); it does not affect what gets sent.

import { createContext, useContext, useState, type ReactNode } from "react";

export interface LastRequest {
  url: string;
  mode: "mock" | "real";
  at: number;
}

interface LastRequestContextValue {
  last: LastRequest | null;
  setLast: (r: LastRequest) => void;
}

const LastRequestContext = createContext<LastRequestContextValue | null>(null);

export function LastRequestProvider({ children }: { children: ReactNode }) {
  const [last, setLast] = useState<LastRequest | null>(null);
  return (
    <LastRequestContext.Provider value={{ last, setLast }}>
      {children}
    </LastRequestContext.Provider>
  );
}

export function useLastRequest(): LastRequestContextValue {
  const ctx = useContext(LastRequestContext);
  if (!ctx) {
    throw new Error("useLastRequest must be used within a LastRequestProvider");
  }
  return ctx;
}
