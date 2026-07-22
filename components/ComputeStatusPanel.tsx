"use client";

type StatusRowProps = {
  label: string;
  sublabel: string;
  active: boolean;
  activeText: string;
  idleText: string;
};

function StatusRow({ label, sublabel, active, activeText, idleText }: StatusRowProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-surface-container-low border border-outline-variant rounded">
      <div>
        <p className="text-sm font-headline-md text-primary">{label}</p>
        <p className="font-code-sm text-[10px] text-on-surface-variant uppercase tracking-widest">
          {sublabel}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full transition-colors ${
            active ? "bg-[#10B981] shadow-[0_0_8px_#10B981] animate-pulse" : "bg-outline-variant"
          }`}
        />
        <span
          className={`font-code-sm text-xs font-bold uppercase tracking-widest transition-colors ${
            active ? "text-[#10B981]" : "text-on-surface-variant"
          }`}
        >
          {active ? activeText : idleText}
        </span>
      </div>
    </div>
  );
}

export default function ComputeStatusPanel({
  cpuActive,
  gpuActive,
}: {
  cpuActive: boolean;
  gpuActive: boolean;
}) {
  return (
    <div className="bg-surface rounded-lg border border-outline-variant p-4 flex flex-col gap-3">
      <h3 className="font-headline-md text-base text-primary uppercase border-b border-outline-variant pb-2">
        Compute Allocation
      </h3>
      <StatusRow
        label="CPU Servers"
        sublabel="Alexandria cluster · web workloads"
        active={cpuActive}
        activeText="In Use"
        idleText="Idle"
      />
      <StatusRow
        label="GPU Servers"
        sublabel="H100 array · inference workloads"
        active={gpuActive}
        activeText="In Use"
        idleText="Idle"
      />
    </div>
  );
}
