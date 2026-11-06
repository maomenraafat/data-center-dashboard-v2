// Shared record of ESP calls. Client code emits an entry; the log panel
// subscribes. Server routes print the same shape to the dev terminal.

export type RequestSource = "led" | "security" | "control";

export type RequestLogEntry = {
  id: string;
  at: number;
  source: RequestSource;
  method: string;
  url: string;
  request?: unknown;
  status: number | null;
  ok: boolean;
  durationMs: number;
  response?: unknown;
  error?: string;
};

type Listener = (entry: RequestLogEntry) => void;

const listeners = new Set<Listener>();
let sequence = 0;

export function emitRequestLog(entry: Omit<RequestLogEntry, "id" | "at">): void {
  const full: RequestLogEntry = { ...entry, id: `${Date.now()}-${++sequence}`, at: Date.now() };
  listeners.forEach((listener) => listener(full));
}

export function subscribeRequestLog(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function formatLogValue(value: unknown): string {
  if (value === undefined) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/** Terminal line for a proxy that talked to a board. */
export function logUpstream(
  source: RequestSource,
  method: string,
  url: string,
  status: number | null,
  durationMs: number,
  request?: unknown,
  response?: unknown,
): void {
  const req = request === undefined ? "" : ` req=${formatLogValue(request)}`;
  const res = response === undefined ? "" : ` res=${formatLogValue(response).slice(0, 800)}`;
  console.log(`[${source}] ${method} ${url} -> ${status ?? "ERR"} ${durationMs}ms${req}${res}`);
}
