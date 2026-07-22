"use client";

// Global, persisted configuration (environment + ESP addresses + mock code) plus the live
// security status. Everything below the provider consumes this via useEnvironment().

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Esp1Status, EspEnvironment } from "@/lib/types";
import { mockEsp } from "@/lib/mockEsp";
import { useSecurityStatus } from "@/hooks/useSecurityStatus";
import { CONTROL_API_URL, STATUS_POLLING_ENABLED } from "@/lib/config";

interface EnvironmentContextValue {
  environment: EspEnvironment;
  setEnvironment: (env: EspEnvironment) => void;
  esp1Ip: string;
  setEsp1Ip: (ip: string) => void;
  controlUrl: string;
  setControlUrl: (url: string) => void;
  mockCode: string;
  setMockCode: (code: string) => void;
  status: Esp1Status;
  connected: boolean;
  statusError: string | null;
  refreshStatus: () => void;
  syncMockStatus: () => void;
}

const EnvironmentContext = createContext<EnvironmentContextValue | null>(null);

/** localStorage-backed state that stays SSR-safe (defaults on server, hydrate on mount). */
function usePersistentState<T>(key: string, initial: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      // Hydrate browser-only persisted settings after the SSR-safe initial render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw !== null) setValue(JSON.parse(raw) as T);
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

export function EnvironmentProvider({ children }: { children: ReactNode }) {
  const [environment, setEnvironment] = usePersistentState<EspEnvironment>(
    "dca:api-test:environment",
    "real",
  );
  const [esp1Ip, setEsp1Ip] = usePersistentState<string>("dca:esp1Ip", CONTROL_API_URL);
  const [controlUrl, setControlUrl] = usePersistentState<string>(
    "dca:api-test:controlUrl",
    CONTROL_API_URL,
  );
  const [mockCode, setMockCode] = usePersistentState<string>("dca:mockCode", "1234");

  // Keep the mock hardware's accepted code in sync with the setting.
  useEffect(() => {
    mockEsp.setCode(mockCode);
  }, [mockCode]);

  const { status, connected, lastError, refresh, syncFromMock } = useSecurityStatus(
    environment,
    esp1Ip,
    STATUS_POLLING_ENABLED,
  );

  const value: EnvironmentContextValue = {
    environment,
    setEnvironment,
    esp1Ip,
    setEsp1Ip,
    controlUrl,
    setControlUrl,
    mockCode,
    setMockCode,
    status,
    connected,
    statusError: lastError,
    refreshStatus: refresh,
    syncMockStatus: syncFromMock,
  };

  return (
    <EnvironmentContext.Provider value={value}>{children}</EnvironmentContext.Provider>
  );
}

export function useEnvironment(): EnvironmentContextValue {
  const ctx = useContext(EnvironmentContext);
  if (!ctx) {
    throw new Error("useEnvironment must be used within an EnvironmentProvider");
  }
  return ctx;
}
