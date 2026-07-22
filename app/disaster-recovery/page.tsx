// "use client";

// import { useState } from "react";
// import Sidebar from "@/components/Sidebar";
// import RecoveryTerminal from "@/components/RecoveryTerminal";

// export default function DisasterRecoveryPage() {
//   const [recovered, setRecovered] = useState(false);

//   return (
//     <div className="flex h-screen w-screen overflow-hidden">
//       <Sidebar active="Disaster Recovery" />

//       <main className="ml-sidebar_width h-screen overflow-hidden flex flex-col relative bg-surface-container-low flex-1">
//         <header className="h-20 flex items-center px-gutter justify-between border-b border-outline-variant bg-surface">
//           <div className="flex items-center gap-4">
//             <h2 className="font-headline-md text-headline-md uppercase tracking-tight text-primary">
//               Level 1: Disaster Recovery - Power Failure
//             </h2>
//           </div>
//           <div className="flex items-center gap-4 font-data-label text-data-label text-on-surface-variant">
//             <span className="flex items-center gap-2">
//               <div className="w-3 h-3 rounded-sm bg-error animate-blink" /> SIMULATION ACTIVE
//             </span>
//             <span className="border-l border-outline-variant pl-4" />
//           </div>
//         </header>

//         <div className="flex-grow flex p-gutter gap-gutter overflow-hidden">
//           {/* Central Content (Topology View) */}
//           <section className="flex-[3] flex flex-col gap-gutter h-full">
//             <div className="flex-grow relative bg-white/50 rounded-lg border-2 border-outline-variant overflow-hidden">
//               <div className="absolute inset-0 p-margin pointer-events-none">
//                 {/* Node ALX-01 */}
//                 <div className="absolute top-[35%] left-[25%] pointer-events-auto cursor-pointer group">
//                   <div
//                     className={`border-2 p-3 rounded shadow-lg flex flex-col items-center gap-1 transition-all duration-500 ${
//                       recovered
//                         ? "border-outline-variant bg-surface-container-highest"
//                         : "border-error bg-error-container"
//                     }`}
//                   >
//                     <span
//                       className={`material-symbols-outlined text-4xl ${
//                         recovered ? "text-secondary" : "text-error animate-pulse"
//                       }`}
//                     >
//                       {recovered ? "cloud_done" : "cloud_off"}
//                     </span>
//                     <span
//                       className={`font-code-sm text-[10px] font-bold ${
//                         recovered ? "text-primary-container" : "text-error"
//                       }`}
//                     >
//                       {recovered ? "ALX-01: ACTIVE" : "ALX-01: FAULT"}
//                     </span>
//                     <div className="flex gap-1 mt-1">
//                       <div
//                         className={`w-1 h-1 rounded-full ${
//                           recovered ? "bg-green-500 animate-pulse" : "bg-red-500 animate-blink"
//                         }`}
//                       />
//                       <div
//                         className={`w-1 h-1 rounded-full ${
//                           recovered ? "bg-green-500" : "bg-red-500 animate-blink"
//                         }`}
//                       />
//                     </div>
//                   </div>
//                 </div>

//                 {/* Node CAI-01 */}
//                 <div className="absolute top-[45%] left-[65%] pointer-events-auto cursor-pointer group">
//                   <div className="border-2 border-outline-variant bg-surface-container-highest p-3 rounded shadow-lg flex flex-col items-center gap-1 group-hover:border-secondary transition-all">
//                     <span className="material-symbols-outlined text-secondary text-4xl">cloud_done</span>
//                     <span className="font-code-sm text-[10px] text-primary-container">CAI-01: ACTIVE</span>
//                     <div className="flex gap-1 mt-1">
//                       <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
//                       <div className="w-1 h-1 bg-green-500 rounded-full" />
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <div className="absolute top-4 right-4 text-right">
//                 <p className="font-code-sm text-xs text-on-surface-variant">SERIAL: BDC-DR-ALX-CAI</p>
//                 <p className="font-code-sm text-[10px] text-on-surface-variant opacity-60">
//                   REGIONAL FAILOVER LAYER: ACTIVE
//                 </p>
//               </div>
//             </div>

//             {/* Bottom Control Panel */}
//             <div className="h-32 bg-surface-container-high border-t border-outline-variant p-gutter flex items-center justify-center gap-margin shadow-inner">
//               <ControlButton label="Engage Power" icon="play_arrow" text="START" colorClass="border-secondary text-secondary hover:bg-secondary-container" />
//               <ControlButton label="Abort Sequence" icon="stop" text="STOP" colorClass="border-error text-error hover:bg-error" />
//               <ControlButton label="Hard Cycle" icon="refresh" text="REBOOT" colorClass="border-outline text-primary hover:bg-primary-container" />
//               <ControlButton label="Contain Fault" icon="lock" text="ISOLATE" colorClass="border-tertiary text-tertiary hover:bg-tertiary-container" />
//             </div>
//           </section>

//           {/* Sidebar Content */}
//           <section className="flex-1 flex flex-col gap-gutter h-full">
//             {/* Progress Module */}
//             <div className="bg-surface rounded-lg border border-outline-variant p-4 flex flex-col gap-4">
//               <div className="flex justify-between items-center border-b border-outline-variant pb-2">
//                 <h3 className="font-headline-md text-base text-primary uppercase">Scenario Tasks</h3>
//                 <span className="font-code-sm text-xs text-on-surface-variant">
//                   {recovered ? "02 / 03" : "01 / 03"}
//                 </span>
//               </div>
//               <div className="space-y-3">
//                 <div
//                   className={`flex items-center gap-3 p-3 rounded transition-all border ${
//                     recovered
//                       ? "bg-green-50 border-green-200"
//                       : "bg-amber-50 border-amber-200 animate-pulse"
//                   }`}
//                 >
//                   <span className={`material-symbols-outlined ${recovered ? "text-green-600" : "text-amber-600"}`}>
//                     {recovered ? "check_circle" : "radio_button_checked"}
//                   </span>
//                   <div className="flex-grow">
//                     <p className={`text-sm font-headline-md ${recovered ? "text-green-800" : "text-amber-800"}`}>
//                       Task 1: Isolate ALX-01 Fault
//                     </p>
//                     <p className={`font-code-sm text-[10px] ${recovered ? "text-green-600" : "text-amber-600"}`}>
//                       {recovered ? "COMPLETED" : "IN PROGRESS..."}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-3 p-3 bg-surface-container opacity-50 rounded">
//                   <span className="material-symbols-outlined">radio_button_unchecked</span>
//                   <div className="flex-grow">
//                     <p className="text-sm text-on-surface-variant font-headline-md">Task 2: Shift Load to CAI-01</p>
//                     <p className="font-code-sm text-[10px]">LOCKED</p>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-3 p-3 bg-surface-container opacity-50 rounded">
//                   <span className="material-symbols-outlined">radio_button_unchecked</span>
//                   <div className="flex-grow">
//                     <p className="text-sm text-on-surface-variant font-headline-md">
//                       Task 3: Initiate Sequence RECOVER
//                     </p>
//                     <p className="font-code-sm text-[10px]">LOCKED</p>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Terminal Module */}
//             <RecoveryTerminal onRecovered={() => setRecovered(true)} />
//           </section>
//         </div>
//       </main>
//     </div>
//   );
// }

// function ControlButton({
//   label,
//   icon,
//   text,
//   colorClass,
// }: {
//   label: string;
//   icon: string;
//   text: string;
//   colorClass: string;
// }) {
//   return (
//     <div className="flex flex-col items-center gap-3 font-headline-md">
//       <span className="font-data-label text-[11px] uppercase tracking-widest text-on-surface-variant opacity-70">
//         {label}
//       </span>
//       <button
//         className={`w-32 h-12 bg-surface-container border-b-2 flex items-center justify-center gap-2 hover:text-white transition-colors rounded-sm ${colorClass}`}
//       >
//         <span className="material-symbols-outlined text-xl">{icon}</span>
//         <span className="text-xs font-bold tracking-widest">{text}</span>
//       </button>
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import RecoveryTerminal from "@/components/RecoveryTerminal";
import { useControl } from "@/hooks/useControl";

type Phase = "idle" | "disaster" | "recovered";

export default function DisasterRecoveryPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const { send } = useControl();

  const disasterActive = phase !== "idle";
  const recovered = phase === "recovered";

  function triggerDisaster() {
    if (phase !== "idle") return;
    setPhase("disaster");
    // Disaster recovery → /disasterrecovery?disasterrecovery=2 (engage failover).
    void send("disasterrecovery", 2);
  }

  function reboot() {
    setPhase("idle");
    // Restore to normal operation → /disasterrecovery?disasterrecovery=1.
    void send("disasterrecovery", 1);
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar active="Disaster Recovery" />

      <main className="ml-sidebar_width h-screen overflow-hidden flex flex-col relative bg-surface-container-low flex-1">
        <header className="h-20 flex items-center px-gutter justify-between border-b border-outline-variant bg-surface">
          <div className="flex items-center gap-4">
            <h2 className="font-headline-md text-headline-md uppercase tracking-tight text-primary">
              Level 1: Disaster Recovery - Power Failure
            </h2>
          </div>
          <div className="flex items-center gap-4 font-data-label text-data-label text-on-surface-variant">
            <span className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-sm ${
                  disasterActive ? "bg-error animate-blink" : "bg-green-500"
                }`}
              />
              {disasterActive ? "SIMULATION ACTIVE" : "SYSTEM NOMINAL"}
            </span>
            <span className="border-l border-outline-variant pl-4" />
            {/* <button
              onClick={triggerDisaster}
              disabled={disasterActive}
              className="flex items-center gap-2 px-4 py-2 rounded-md border-2 border-error text-error font-bold text-xs uppercase tracking-widest hover:bg-error hover:text-white transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-error disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-lg">bolt</span>
              Trigger Disaster
            </button> */}
          </div>
        </header>

        <div className="flex-grow flex p-gutter gap-gutter overflow-hidden">
          {/* Central Content (Topology View) */}
          <section className="flex-[3] flex flex-col gap-gutter h-full">
            <div className="flex-grow relative bg-white/50 rounded-lg border-2 border-outline-variant overflow-hidden">
              <div className="absolute inset-0 p-margin flex items-center justify-center gap-24">
                  
                 <DataCenterNode
                  image="/images/ciaro-city.jpg"
                   hostname="CAIRO - Data Center"
                   region="Cairo, EG"
                   status="active"
                   detail={disasterActive && !recovered ? "HANDLING FAILOVER" : "ACTIVE"}
                   emphasized={disasterActive && !recovered}
                 />
                  <DataCenterNode
                  image="/images/Alex-castle.avif"
                   hostname="ALEX - Data Center"
                   region="Alexandria, EG"
                   status={disasterActive && !recovered ? "fault" : "active"}
                   detail={
                     disasterActive && !recovered
                       ? "FAULT"
                       : recovered
                       ? "RECOVERED"
                       : "ACTIVE"
                   }
                 />

              </div>

              <div className="absolute top-4 right-4 text-right">
                <p className="font-code-sm text-xs text-on-surface-variant">SERIAL: BDC-DR-ALX-CAI</p>
                <p className="font-code-sm text-[10px] text-on-surface-variant opacity-60">
                  REGIONAL FAILOVER LAYER: {disasterActive ? "ENGAGED" : "ARMED"}
                </p>
              </div>
            </div>

            {/* Bottom Control Panel */}
            <div className="h-32 bg-surface-container-high border-t border-outline-variant p-gutter flex items-center justify-center gap-margin shadow-inner">
              <button
              onClick={triggerDisaster}
              disabled={disasterActive}
              className="flex items-center gap-2 px-5 py-3 rounded-md border-2 border-error text-error font-bold text-xs uppercase tracking-widest hover:bg-error hover:text-white transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-error disabled:cursor-not-allowed"
            >
              {/* <span className="material-symbols-outlined text-lg">bolt</span> */}
              Trigger Disaster
            </button>
            <ControlButton label="Hard Cycle" icon="refresh" text="REBOOT" colorClass="border-outline text-primary hover:bg-primary-container"   onClick={reboot} />

              {/* <ControlButton label="Engage Power" icon="play_arrow" text="START" colorClass="border-secondary text-secondary hover:bg-secondary-container" />
              <ControlButton label="Abort Sequence" icon="stop" text="STOP" colorClass="border-error text-error hover:bg-error" />
              <ControlButton label="Hard Cycle" icon="refresh" text="REBOOT" colorClass="border-outline text-primary hover:bg-primary-container" />
              <ControlButton label="Contain Fault" icon="lock" text="ISOLATE" colorClass="border-tertiary text-tertiary hover:bg-tertiary-container" /> */}
            </div>
          </section>

          {/* Sidebar Content */}
          <section className="flex-1 flex flex-col gap-gutter h-full">
            {/* Progress Module */}
            <div className="bg-surface rounded-lg border border-outline-variant p-4 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-outline-variant pb-2">
                <h3 className="font-headline-md text-base text-primary uppercase">Scenario Tasks</h3>
                <span className="font-code-sm text-xs text-on-surface-variant">
                  {recovered ? "03 / 03" : disasterActive ? "01 / 03" : "00 / 03"}
                </span>
              </div>
              <div className="space-y-3">
                <div
                  className={`flex items-center gap-3 p-3 rounded transition-all border ${
                    !disasterActive
                      ? "bg-surface-container opacity-50"
                      : recovered
                      ? "bg-green-50 border-green-200"
                      : "bg-amber-50 border-amber-200 animate-pulse"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined ${
                      !disasterActive
                        ? ""
                        : recovered
                        ? "text-green-600"
                        : "text-amber-600"
                    }`}
                  >
                    {!disasterActive
                      ? "radio_button_unchecked"
                      : recovered
                      ? "check_circle"
                      : "radio_button_checked"}
                  </span>
                  <div className="flex-grow">
                    <p
                      className={`text-sm font-headline-md ${
                        !disasterActive
                          ? "text-on-surface-variant"
                          : recovered
                          ? "text-green-800"
                          : "text-amber-800"
                      }`}
                    >
                      Task 1: Trigger &amp; Isolate ALX-01 Fault
                    </p>
                    <p
                      className={`font-code-sm text-[10px] ${
                        !disasterActive
                          ? ""
                          : recovered
                          ? "text-green-600"
                          : "text-amber-600"
                      }`}
                    >
                      {!disasterActive ? "WAITING" : recovered ? "COMPLETED" : "IN PROGRESS..."}
                    </p>
                  </div>
                </div>

                <div
                  className={`flex items-center gap-3 p-3 rounded border ${
                    disasterActive
                      ? "bg-blue-50 border-blue-200"
                      : "bg-surface-container opacity-50"
                  }`}
                >
                  <span className="material-symbols-outlined">
                    {disasterActive ? "check_circle" : "radio_button_unchecked"}
                  </span>
                  <div className="flex-grow">
                    <p className="text-sm text-on-surface-variant font-headline-md">Task 2: Shift Load to CAI-01</p>
                    <p className="font-code-sm text-[10px]">{disasterActive ? "COMPLETED" : "LOCKED"}</p>
                  </div>
                </div>

                <div
                  className={`flex items-center gap-3 p-3 rounded border ${
                    recovered
                      ? "bg-green-50 border-green-200"
                      : "bg-surface-container opacity-50"
                  }`}
                >
                  <span className="material-symbols-outlined">
                    {recovered ? "check_circle" : "radio_button_unchecked"}
                  </span>
                  <div className="flex-grow">
                    <p className="text-sm text-on-surface-variant font-headline-md">
                      Task 3: Initiate Sequence RECOVER
                    </p>
                    <p className="font-code-sm text-[10px]">{recovered ? "COMPLETED" : "LOCKED"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Terminal Module */}
            <RecoveryTerminal
              onRecovered={() => {
                setPhase("recovered");
                void send("disasterrecovery", 1);
              }}
            />
          </section>
        </div>
      </main>
    </div>
  );
}

function DataCenterNode({
  image,
  hostname,
  region,
  status,
  detail,
  emphasized = false,
}: {
  image: string;
  hostname: string;
  region: string;
  status: "active" | "fault";
  detail: string;
  emphasized?: boolean;
}) {
  const fault = status === "fault";

  return (
    <div className="pointer-events-auto cursor-pointer group w-80">
      <div
        className={`rounded-2xl border-2 shadow-xl overflow-hidden transition-all duration-500 ${
          fault
            ? "border-error"
            : emphasized
            ? "border-secondary"
            : "border-outline-variant group-hover:border-secondary"
        }`}
      >
        {/* Card header bar */}
        <div
          className={`flex items-center justify-between px-4 py-2 relative z-10 ${
            fault ? "bg-error/10" : "bg-secondary/10"
          }`}
        >
          <span className="font-code-sm text-[20px] font-bold tracking-widest text-on-surface">
            {hostname}
          </span>
          <div className="flex gap-1">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                fault ? "bg-red-500 animate-blink" : "bg-green-500 animate-pulse"
              }`}
            />
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                fault ? "bg-red-500 animate-blink" : "bg-green-500"
              }`}
            />
          </div>
        </div>

        {/* Background image body */}
        <div
          className="relative h-44 bg-cover transition-all duration-500"
          style={{ backgroundImage: `url(${image})`, backgroundPosition: "62% 40%" }}
        >
          {/* color-tint overlay so fault / active state still reads clearly over a photo */}
          <div
            className={`absolute inset-0 transition-colors duration-500 ${
              fault
                ? "bg-gradient-to-t from-error/70 via-error/30 to-transparent"
                : emphasized
                ? "bg-secondary/20"
                : "bg-black/10"
            }`}
          />
          {/* bottom gradient for text legibility */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-3">
            <span
              className={`font-code-sm text-sm font-bold tracking-widest mb-0.5 drop-shadow-md ${
                fault ? "text-red-300" : "text-white"
              }`}
            >
              {detail}
            </span>
            <span className="font-code-sm text-[15px] text-white/80 drop-shadow-md">{region}</span>
          </div>

          {fault && (
            <span className="material-symbols-outlined absolute top-3 right-3 text-error text-3xl animate-pulse drop-shadow-md">
              warning
            </span>
          )}
        </div>

        {/* Footer stats */}
        <div
          className={`grid grid-cols-2 border-t border-outline-variant/50 ${
            fault ? "bg-error-container" : "bg-surface-container-highest"
          }`}
        >
          <div className="flex flex-col items-center py-2 border-r border-outline-variant/50">
            <span className="font-code-sm text-[9px] text-on-surface-variant uppercase tracking-widest">
              Load
            </span>
            <span className={`font-code-sm text-xs font-bold ${fault ? "text-error" : "text-secondary"}`}>
              {fault ? "0%" : emphasized ? "94%" : "31%"}
            </span>
          </div>
          <div className="flex flex-col items-center py-2">
            <span className="font-code-sm text-[9px] text-on-surface-variant uppercase tracking-widest">
              Ping
            </span>
            <span className={`font-code-sm text-xs font-bold ${fault ? "text-error" : "text-secondary"}`}>
              {fault ? "--" : "12ms"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ControlButton({
  label,
  icon,
  text,
  colorClass,
  onClick,
}: {
  label: string;
  icon: string;
  text: string;
  colorClass: string;
  onClick?: () => void;

}) {
  return (
    <div className="flex flex-col items-center gap-3 font-headline-md">
      {/* <span className="font-data-label text-[11px] uppercase tracking-widest text-on-surface-variant opacity-70">
        {label}
      </span> */}
      <button  
        onClick={onClick}
        className={`w-32 h-12 bg-surface-container border-2 flex items-center justify-center gap-2 hover:text-white transition-colors rounded-sm ${colorClass}`}
      >
        <span className="material-symbols-outlined text-xl">{icon}</span>
        <span className="text-xs font-bold tracking-widest">{text}</span>
      </button>
    </div>
  );
}