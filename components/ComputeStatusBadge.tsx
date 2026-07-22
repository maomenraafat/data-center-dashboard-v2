"use client";

type BadgeProps = {
  label: string;
  active: boolean;
  activeText: string;
  idleText: string;
};

function Pill({ label, active, activeText, idleText }: BadgeProps) {
  return (
    <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant rounded-full pl-18 pr-19 py-6 shadow-lg">
      <div
        className={`w-5 h-5 rounded-full ${
          active ? "bg-[#10B981] shadow-[0_0_8px_#10B981] animate-pulse" : "bg-outline-variant"
        }`}
      />
      <span className="font-code-sm text-[25px] font-bold text-on-surface-variant uppercase tracking-widest">
        {label}
      </span>
      <span
        className={`font-code-sm text-[25px] font-bold uppercase tracking-widest ${
          active ? "text-[#10B981]" : "text-on-surface-variant"
        }`}
      >
        {active ? activeText : idleText}
      </span>
    </div>
  );
}

/**
 * Renders above the AppWindow overlay (higher z-index) so it stays
 * crisp and readable even while the backdrop-blur modal is open.
 */
export default function ComputeStatusBadge({
  cpuActive,
  gpuActive,
  isVisible,
}: {
  cpuActive: boolean;
  gpuActive: boolean;
  isVisible: boolean;
}) {
  if (!isVisible) return null;
  return (
    <div className="fixed top-4 right-4 z-[110] flex flex-col gap-2 items-end pointer-events-none">
      <Pill label="CPU" active={cpuActive} activeText="In Use" idleText="Idle" />
      <Pill label="GPU" active={gpuActive} activeText="In Use" idleText="Idle" />
    </div>
  );
}
