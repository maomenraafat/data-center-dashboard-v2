"use client";

import { useState } from "react";
import Link from "next/link";
import SettingsPanel from "@/components/SettingsPanel";
import LockButton from "@/components/LockButton";

type NavItem = {
  label: string;
  icon: string;
  href: string;
  badge?: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Main", icon: "home", href: "/" },
  { label: "Disaster Recovery", icon: "emergency_home", href: "/disaster-recovery" },
  { label: "Load Balancing", icon: "equalizer", href: "/load-balancing" },
  { label: "Infrastructure", icon: "developer_board", href: "/infrastructure" },
  { label: "Topology", icon: "hub", href: "/topology" },
];

export default function Sidebar({ active }: { active: string }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <aside className="w-sidebar_width h-screen fixed left-0 top-0 border-r-4 border-outline-variant bg-primary flex flex-col py-margin px-gutter shadow-[inset_-4px_0_12px_rgba(0,0,0,0.5)] z-50 font-headline-md">
      <div className="mb-margin">
        <h1 className="font-display-lg text-display-lg text-secondary-container tracking-tighter leading-none mb-1 font-bold">
          BLOOM DC
        </h1>
      </div>

      <nav className="flex-grow space-y-unit overflow-y-auto overflow-x-hidden font-headline-md">
        {NAV_ITEMS.map((item) => {
          const isActive = item.label === active;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={
                isActive
                  ? "bg-secondary-container text-on-secondary-container border-l-4 border-secondary-fixed-dim shadow-[0_0_8px_#0070eb] translate-x-1 transition-all flex items-center p-3 gap-unit"
                  : "text-on-primary-container opacity-70 hover:opacity-100 flex items-center p-3 gap-unit hover:bg-primary-container transition-colors cursor-pointer group"
              }
            >
              <span
                className={`material-symbols-outlined ${
                  isActive ? "text-secondary-fixed-dim" : "group-hover:text-secondary-fixed"
                }`}
              >
                {item.icon}
              </span>
              <span className="text-base flex-grow font-headline-md">{item.label}</span>
              {isActive && (
                <div className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981] animate-pulse" />
              )}
              {item.badge && (
                <span className="ml-auto bg-error px-1.5 py-0.5 text-[10px] rounded font-bold">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-primary-container pt-margin">
        <LockButton variant="emergency" />
        <div className="flex justify-between text-on-primary-container">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Open settings"
            className="material-symbols-outlined cursor-pointer hover:text-white bg-transparent border-none p-0"
          >
            settings
          </button>
          <span className="material-symbols-outlined cursor-pointer hover:text-white">
            contact_support
          </span>
        </div>
      </div>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </aside>
  );
}
