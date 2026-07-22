"use client";

type AppLauncherProps = {
  name: string;
  description: string;
  icon: string;
  accent: "secondary" | "primary";
  isOpen: boolean;
  onLaunch: () => void;
};

export default function AppLauncher({
  name,
  description,
  icon,
  accent,
  isOpen,
  onLaunch,
}: AppLauncherProps) {
  const iconWrap =
    accent === "secondary" ? "bg-secondary/10 text-secondary" : "bg-primary text-secondary-fixed-dim";

  return (
    <div className="bg-surface-container-low border border-outline-variant p-gutter rounded flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`w-20 h-20 flex items-center justify-center rounded ${iconWrap}`}>
          <span className="material-symbols-outlined text-[28px]">{icon}</span>
        </div>
        <div>
          <h4 className="text-data-label uppercase font-headline-md text-[30px]">{name}</h4>
          <p className="font-code-sm text-[15px] text-on-surface-variant">{description}</p>
        </div>
      </div>

      <button
        onClick={onLaunch}
        disabled={isOpen}
        className="extruded-button bg-secondary text-on-secondary px-4 py-2 flex items-center gap-2 uppercase tracking-widest text-xs font-headline-md rounded-sm disabled:opacity-50 disabled:cursor-not-allowed text-[20px]"
      >
        <span className="material-symbols-outlined text-sm">
          {isOpen ? "check_circle" : "open_in_new"}
        </span>
        {isOpen ? "Open" : "Launch"}
      </button>
    </div>
  );
}
