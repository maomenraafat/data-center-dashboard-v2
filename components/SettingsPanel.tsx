"use client";

// Bloom-styled settings modal. Replaces the old EnvironmentBanner: it edits the same
// preserved global store (mock/real environment, board addresses, mock PIN) via
// useEnvironment(); every field is persisted to localStorage by the provider.

import { useEnvironment } from "@/context/EnvironmentContext";
import { useDevOptions } from "@/context/DevOptionsContext";

export default function SettingsPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    environment,
    setEnvironment,
    esp1Ip,
    setEsp1Ip,
    controlUrl,
    setControlUrl,
    mockCode,
    setMockCode,
  } = useEnvironment();
  const { simSendReal, setSimSendReal } = useDevOptions();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-[460px] max-w-[92vw] bg-surface rounded-lg border-2 border-outline-variant shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-gutter py-4 border-b border-outline-variant bg-surface-container">
          <h3 className="font-headline-md text-headline-md uppercase tracking-tight text-primary">
            System Settings
          </h3>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors"
          >
            close
          </button>
        </div>

        <div className="p-gutter space-y-6">
          {/* Environment mode */}
          <div>
            <label className="font-data-label text-data-label uppercase text-on-surface-variant">
              Environment
            </label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {(["mock", "real"] as const).map((env) => (
                <button
                  key={env}
                  onClick={() => setEnvironment(env)}
                  className={`py-3 rounded border uppercase tracking-wider font-headline-md transition-all ${
                    environment === env
                      ? "bg-secondary text-on-secondary border-secondary shadow-md"
                      : "bg-surface-container-low text-on-surface border-outline-variant hover:border-secondary"
                  }`}
                >
                  {env === "mock" ? "SIM (mock)" : "LIVE (real)"}
                </button>
              ))}
            </div>
          </div>

          {/* Also fire the real GET while in SIM mode (simulator still animates) */}
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <div>
              <span className="font-data-label text-data-label uppercase text-on-surface-variant">
                Send real request in SIM
              </span>
              <p className="font-code-sm text-[10px] text-on-surface-variant">
                Fire the live GET to the board even in SIM mode
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={simSendReal}
              onClick={() => setSimSendReal(!simSendReal)}
              className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${
                simSendReal ? "bg-secondary" : "bg-outline-variant"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  simSendReal ? "translate-x-6" : ""
                }`}
              />
            </button>
          </label>

          <Field
            label="Security Board IP (ESP 1)"
            value={esp1Ip}
            onChange={setEsp1Ip}
            placeholder="192.168.4.50" //10.102.224.43
          />
          <Field
            label="Control Board URL (ESP 2)"
            value={controlUrl}
            onChange={setControlUrl}
            placeholder="192.168.4.50"
          />
          <Field label="Mock 2FA PIN" value={mockCode} onChange={setMockCode} placeholder="1234" />
        </div>

        <div className="px-gutter py-4 border-t border-outline-variant bg-surface-container flex justify-end">
          <button
            onClick={onClose}
            className="extruded-button bg-primary text-on-primary px-6 py-2 uppercase tracking-widest text-xs font-headline-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="font-data-label text-data-label uppercase text-on-surface-variant">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className="mt-2 w-full bg-surface-container-low border border-outline-variant rounded px-3 py-2 font-code-sm text-on-surface focus:outline-none focus:border-secondary"
      />
    </div>
  );
}
