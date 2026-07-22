// Shared types for the data-center app.

/** Which backend the UI talks to. */
export type EspEnvironment = "mock" | "real";

/** Level 1 security-entrance (2FA) states, mirrored from the ESP firmware. */
export type SecurityState = "LOCKED" | "SCAN_RFID" | "UNLOCKED";

/** Shape of the JSON returned by the security ESP's `/status` endpoint. */
export interface Esp1Status {
  state: SecurityState;
  greenLed: boolean;
  timerRunning: boolean;
  time: number;
}

/** A single GET command sent to the control ESP (ported from app.js). */
export interface ControlCommand {
  /** URL path, e.g. "/network". */
  path: string;
  /** Query-string parameter name, e.g. "network" or "severity". */
  parameter: string;
  /** Integer value (>= 1). */
  value: number;
}

/** The control actions, matching the original app.js path/parameter mapping.
 *  `workloadrouting` steers each request to the right compute pool — general web
 *  traffic to the CPU racks, LLM / AI inference to the GPU racks. */
export type ControlKind =
  | "network"
  | "loadbalancing"
  | "disasterrecovery"
  | "workloadrouting";

export interface ControlDefinition {
  kind: ControlKind;
  label: string;
  path: string;
  parameter: string;
}

export const CONTROL_DEFINITIONS: ControlDefinition[] = [
  { kind: "network", label: "Network", path: "/network", parameter: "network" },
  { kind: "loadbalancing", label: "Load balancing", path: "/loadbalancing", parameter: "severity" },
  { kind: "disasterrecovery", label: "Disaster recovery", path: "/disasterrecovery", parameter: "disasterrecovery" },
  { kind: "workloadrouting", label: "Workload routing", path: "/workloadrouting", parameter: "workload" },
];
