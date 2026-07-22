"use client";

type AppWindowProps = {
  title: string;
  subtitle?: string;
  icon: string;
  src: string;
  onClose: () => void;
};

export default function AppWindow({ title, subtitle, icon, src, onClose }: AppWindowProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
      <div className="w-full h-full max-w-6xl bg-surface-container-lowest rounded-lg border-2 border-outline-variant shadow-2xl flex flex-col overflow-hidden">
        {/* Title bar, matching the terminal chrome from Disaster Recovery */}
        <div className="bg-primary px-4 py-2.5 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2 text-on-primary-container">
            <span className="material-symbols-outlined text-secondary-fixed-dim text-xl">{icon}</span>
            <div>
              <p className="font-code-sm text-[11px] uppercase tracking-widest text-white leading-tight">
                {title}
              </p>
              {subtitle && (
                <p className="font-code-sm text-[10px] text-on-primary-container/70 leading-tight">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-error/40" />
              <div className="w-2 h-2 rounded-full bg-tertiary-fixed-dim/40" />
              <div className="w-2 h-2 rounded-full bg-green-500/40" />
            </div>
            <button
              onClick={onClose}
              aria-label="Close window"
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-error hover:text-white text-on-primary-container transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Embedded page content, kept in its own iframe so it can carry its own theme */}
        <iframe
          src={src}
          title={title}
          className="flex-1 w-full border-none bg-white"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>
    </div>
  );
}
