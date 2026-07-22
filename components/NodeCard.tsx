type NodeCardProps = {
  name: string;
  serial: string;
  subtitle: string;
  accent: "secondary" | "primary";
  cpuLabel: string;
  cpuPct: number;
  gpuLabel: string;
  gpuPct: number;
  temp: string;
  power: string;
  net: string;
};

export default function NodeCard({
  name,
  serial,
  subtitle,
  accent,
  cpuLabel,
  cpuPct,
  gpuLabel,
  gpuPct,
  temp,
  power,
  net,
}: NodeCardProps) {
  const accentBorder = accent === "secondary" ? "border-l-secondary" : "border-l-primary";
  const accentText = accent === "secondary" ? "text-secondary" : "text-primary";
  const badgeClasses =
    accent === "secondary" ? "bg-secondary text-on-secondary" : "bg-primary text-on-primary";
  const cpuBar = accent === "secondary" ? "bg-secondary" : "bg-primary";
  const gpuBar = accent === "secondary" ? "bg-tertiary-fixed-dim" : "bg-secondary";

  return (
    <article
      className={` glass-card bg-surface-container-high border border-outline-variant rounded p-gutter relative group overflow-hidden shadow-lg border-l-4 ${accentBorder}`}
    >
      <div className="absolute top-2 right-4 font-code-sm text-[10px] text-on-surface-variant opacity-50 uppercase tracking-tighter font-data-label">
        SN: {serial}
      </div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`material-symbols-outlined ${accentText}`}>location_on</span>
            <h3 className="font-headline-md text-[40px] text-primary font-bold">{name}</h3>
          </div>
          <p className="font-code-sm text-on-surface-variant">{subtitle}</p>
        </div>
        <span className={`px-2 py-1 ${badgeClasses} font-code-sm text-[10px] rounded uppercase`}>
          Tier 4 Site
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-end mb-1">
            <span className="text-xs uppercase text-on-surface-variant font-headline-md">{cpuLabel}</span>
            <span className="font-code-sm text-primary">{cpuPct}%</span>
          </div>
          <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
            <div className={`h-full ${cpuBar} transition-all duration-1000`} style={{ width: `${cpuPct}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-end mb-1">
            <span className="text-xs uppercase text-on-surface-variant font-headline-md">{gpuLabel}</span>
            <span className="font-code-sm text-primary">{gpuPct}%</span>
          </div>
          <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
            <div className={`h-full ${gpuBar} transition-all duration-1000`} style={{ width: `${gpuPct}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-outline-variant/30 grid grid-cols-3 gap-2">
        <div className="p-2 bg-surface-container-low border border-outline-variant rounded text-center">
          <p className="text-[10px] font-code-sm text-on-surface-variant uppercase font-headline-md">Temp</p>
          <p className="text-sm font-bold text-primary">{temp}</p>
        </div>
        <div className="p-2 bg-surface-container-low border border-outline-variant rounded text-center">
          <p className="text-[10px] font-code-sm text-on-surface-variant uppercase font-headline-md">Pwr</p>
          <p className="text-sm font-bold text-[#10B981]">{power}</p>
        </div>
        <div className="p-2 bg-surface-container-low border border-outline-variant rounded text-center">
          <p className="text-[10px] font-code-sm text-on-surface-variant uppercase font-headline-md">Net</p>
          <p className="text-sm font-bold text-primary">{net}</p>
        </div>
      </div>
    </article>
  );
}
