"use client";

import { useRef, useState } from "react";
import Sidebar from "@/components/Sidebar";
import SiteATopology from "@/components/SiteATopology";
import UtcClock from "@/components/UtcClock";
import { useLastRequest } from "@/context/LastRequestContext";
import { useDevOptions } from "@/context/DevOptionsContext";
import { useEnvironment } from "@/context/EnvironmentContext";
import { useControl } from "@/hooks/useControl";
import { playSiteAMode, sendDisasterTrail, sendFailoverTrail, sendLoadBalanceTrail, sendRouteTrail, sendSiteATrail, TRAIL_TEST } from "@/lib/ledBoard";
import { backupServer, disasterDestination, routeBetween, type ServerRoute } from "@/lib/route";
import { NODES, type NodeId } from "@/lib/siteA";

// The network control board accepts a mode 1-5. Labels mirror the scenarios the original
// network diagram drove, so operators get meaningful choices instead of bare numbers.
const MODES = [
  { value: 1, label: "Routing", icon: "route" },
  { value: 2, label: "Switching", icon: "swap_horiz" },
  { value: 3, label: "Failover", icon: "alt_route" },
  { value: 4, label: "Load Balance", icon: "balance" },
  { value: 5, label: "Disaster", icon: "crisis_alert" },
] as const;

export default function TopologyPage() {
  const [mode, setMode] = useState<number>(1);
  const [ledNote, setLedNote] = useState<string | null>(null);
  const [ledPending, setLedPending] = useState(false);
  const [routingOn, setRoutingOn] = useState(false);
  const [failoverOn, setFailoverOn] = useState(false);
  const [disasterOn, setDisasterOn] = useState(false);
  const [balanceOn, setBalanceOn] = useState(false);
  const [partnerRoute, setPartnerRoute] = useState<ServerRoute | null>(null);
  const [redirect, setRedirect] = useState<NodeId | null>(null);
  const [disasterNote, setDisasterNote] = useState<string | null>(null);
  const [failedLinks, setFailedLinks] = useState<string[]>([]);
  const [source, setSource] = useState<NodeId | null>(null);
  const [destination, setDestination] = useState<NodeId | null>(null);
  const [serverRoute, setServerRoute] = useState<ServerRoute | null>(null);
  const ticket = useRef(0);
  const { send, pending, lastResult } = useControl();
  const { environment, controlUrl } = useEnvironment();
  const { simSendReal } = useDevOptions();
  const { setLast } = useLastRequest();
  const live = environment === "real" || simSendReal;

  function apply(value: number) {
    setMode(value);
    // Legacy control board → /network?network=<value>.
    void send("network", value);
    // LED board: the same click chases the strip aliases this mode draws.
    const id = ++ticket.current;
    const live = environment === "real" || simSendReal;
    if (!live) {
      setLedPending(false);
      setLedNote("SIM — LED strips not driven");
      return;
    }
    setLedPending(true);
      setLedNote("Sending trail…");
    void playSiteAMode(controlUrl, value).then((result) => {
      if (id !== ticket.current) return;
      setLedPending(false);
      setLedNote(result.summary);
      setLast({ url: result.url, mode: "real", at: Date.now() });
    });
  }

  function stopRouting() {
    ++ticket.current;
    setRoutingOn(false);
    setSource(null);
    setDestination(null);
    setServerRoute(null);
    setLedPending(false);
    setLedNote("Routing stopped");
  }

  function startRouting() {
    ++ticket.current;
    setMode(1);
    setRoutingOn(true);
    setFailoverOn(false);
    setDisasterOn(false);
    setBalanceOn(false);
    setRedirect(null);
    setDisasterNote(null);
    setFailedLinks([]);
    setSource(null);
    setDestination(null);
    setServerRoute(null);
    setLedPending(false);
    setLedNote("Pick a source server, then a destination.");
  }

  function clearSelection() {
    setSource(null);
    setDestination(null);
    setServerRoute(null);
    setPartnerRoute(null);
    setRedirect(null);
    setDisasterNote(null);
  }

  function stopFailover() {
    ++ticket.current;
    setFailoverOn(false);
    setFailedLinks([]);
    setMode(1);
    clearSelection();
    setLedPending(false);
    setLedNote("Failover stopped");
  }

  function startFailover() {
    ++ticket.current;
    setMode(3);
    setFailoverOn(true);
    setRoutingOn(false);
    setDisasterOn(false);
    setBalanceOn(false);
    setFailedLinks([]);
    clearSelection();
    setLedPending(false);
    setLedNote("Pick any two nodes. Click a link to mark it down.");
  }

  function sendFoundPath(found: ServerRoute, down: string[]) {
    const run = ++ticket.current;
    const avoided = down.length ? ` Path avoids ${down.join(", ")}.` : "";
    if (!live) {
      setLedPending(false);
      setLedNote(`${found.label}.${avoided}`);
      return;
    }
    setLedPending(true);
    setLedNote("Sending trail…");
    // Previous failover call, POST /api/trail with {code, reverse} hops:
    // void sendRouteTrail(controlUrl, found.hops, found.label)
    void sendFailoverTrail(controlUrl, found.hops, found.label, down).then((result) => {
      if (run !== ticket.current) return;
      setLedPending(false);
      setLedNote(`${result.summary}.${avoided}`);
      setLast({ url: result.url, mode: "real", at: Date.now() });
    });
  }

  function applyFailover(src: NodeId, dest: NodeId, down: string[]) {
    const found = routeBetween(src, dest, down);
    setDestination(dest);
    setServerRoute(found);
    if (!found) {
      setLedNote(`No path remains around ${down.join(", ") || "the failed links"}.`);
      if (live && down.length > 0) {
        const run = ++ticket.current;
        setLedPending(true);
        void sendFailoverTrail(controlUrl, [], "No path", down).then((result) => {
          if (run !== ticket.current) return;
          setLedPending(false);
          setLedNote(`${result.summary}. No path remains around ${down.join(", ")}.`);
          setLast({ url: result.url, mode: "real", at: Date.now() });
        });
      }
      return;
    }
    sendFoundPath(found, down);
  }

  function stopDisaster() {
    ++ticket.current;
    setDisasterOn(false);
    setFailedLinks([]);
    setMode(1);
    clearSelection();
    setLedPending(false);
    setLedNote("Disaster stopped");
  }

  function startDisaster() {
    ++ticket.current;
    setMode(1);
    setDisasterOn(true);
    setRoutingOn(false);
    setFailoverOn(false);
    setBalanceOn(false);
    setFailedLinks([]);
    clearSelection();
    setLedPending(false);
    setLedNote("Pick two nodes. Click K, J, H, or G to send the request to the paired server.");
  }

  function stopBalance() {
    ++ticket.current;
    setBalanceOn(false);
    setMode(1);
    clearSelection();
    setLedPending(false);
    setLedNote("Load balance stopped");
  }

  function startBalance() {
    ++ticket.current;
    setMode(1);
    setBalanceOn(true);
    setRoutingOn(false);
    setFailoverOn(false);
    setDisasterOn(false);
    setFailedLinks([]);
    clearSelection();
    setLedPending(false);
    setLedNote("Pick a source, then Server13, Server11, Server14, or Server12.");
  }

  function sendBalancePaths(primary: ServerRoute, secondary: ServerRoute) {
    const run = ++ticket.current;
    const summary = `${primary.label} · ${secondary.label}`;
    if (!live) {
      setLedPending(false);
      setLedNote(summary);
      return;
    }
    setLedPending(true);
    setLedNote("Sending trails…");
    void sendLoadBalanceTrail(controlUrl, primary.hops, secondary.hops, summary).then((result) => {
      if (run !== ticket.current) return;
      setLedPending(false);
      setLedNote(result.summary);
      setLast({ url: result.url, mode: "real", at: Date.now() });
    });
  }

  function applyBalance(src: NodeId, dest: NodeId) {
    const partner = backupServer(dest);
    setDestination(dest);
    if (!partner || partner === src) {
      setPartnerRoute(null);
      setServerRoute(null);
      setLedNote(
        partner === src
          ? `${NODES[partner].l} is the source. Pick another destination.`
          : "Pick Server13, Server11, Server14, or Server12.",
      );
      return;
    }
    const primary = routeBetween(src, dest);
    const secondary = routeBetween(src, partner);
    setServerRoute(primary);
    setPartnerRoute(secondary);
    if (!primary || !secondary) {
      setLedNote("No path remains inside the site.");
      return;
    }
    sendBalancePaths(primary, secondary);
  }

  function pickBalance(id: NodeId) {
    if (!source || destination) {
      setSource(id);
      setDestination(null);
      setServerRoute(null);
      setPartnerRoute(null);
      setLedNote(`Source ${NODES[id].l}. Pick Server13, Server11, Server14, or Server12.`);
      return;
    }
    if (id === source) {
      setSource(null);
      setServerRoute(null);
      setPartnerRoute(null);
      setLedNote("Pick a source, then Server13, Server11, Server14, or Server12.");
      return;
    }
    if (!backupServer(id)) return;
    applyBalance(source, id);
  }

  function applyDisaster(src: NodeId, dest: NodeId, down: string[]) {
    const shift = disasterDestination(dest, down);
    setDestination(dest);
    setDisasterNote(shift.note);
    if (shift.blocked || shift.target === src) {
      setRedirect(null);
      setServerRoute(null);
      setLedNote(shift.note ?? `${NODES[src].l} is already the server that would take this request.`);
      return;
    }
    const found = routeBetween(src, shift.target, down);
    setRedirect(shift.target === dest ? null : shift.target);
    setServerRoute(found);
    if (!found) {
      setLedNote(shift.note ?? `No path remains around ${down.join(", ") || "the failed links"}.`);
      return;
    }
    sendDisasterPath(found, shift.cut ?? down.at(-1));
  }

  function sendDisasterPath(found: ServerRoute, cut: string | undefined) {
    const run = ++ticket.current;
    const solid = cut ? ` Solid ${cut}.` : "";
    if (!live) {
      setLedPending(false);
      setLedNote(`${found.label}.${solid}`);
      return;
    }
    setLedPending(true);
    setLedNote("Sending trail…");
    // Previous disaster call, POST /api/trail with {code, reverse} hops:
    // void sendRouteTrail(controlUrl, found.hops, found.label)
    void sendDisasterTrail(controlUrl, found.hops, found.label, cut).then((result) => {
      if (run !== ticket.current) return;
      setLedPending(false);
      setLedNote(result.summary);
      setLast({ url: result.url, mode: "real", at: Date.now() });
    });
  }

  function pickDisasterNode(id: NodeId) {
    if (!source || destination) {
      setSource(id);
      setDestination(null);
      setRedirect(null);
      setDisasterNote(null);
      setServerRoute(null);
      setLedNote(`Source ${NODES[id].l}. Pick the server the request is for.`);
      return;
    }
    if (id === source) {
      setSource(null);
      setServerRoute(null);
      setRedirect(null);
      setDisasterNote(null);
      setLedNote("Pick two nodes. Click K, J, H, or G to send the request to the paired server.");
      return;
    }
    applyDisaster(source, id, failedLinks);
  }

  function toggleDisasterLink(id: string) {
    const next = failedLinks.includes(id) ? failedLinks.filter((code) => code !== id) : [...failedLinks, id];
    setFailedLinks(next);
    if (source && destination) {
      applyDisaster(source, destination, next);
      return;
    }
    setLedNote(next.length ? `Down ${next.join(", ")}. Pick the server the request is for.` : "Pick two nodes. Click K, J, H, or G to send the request to the paired server.");
  }

  function pickNode(id: NodeId) {
    if (!source || destination) {
      setSource(id);
      setDestination(null);
      setServerRoute(null);
      setLedNote(`Source ${NODES[id].l}. Pick any destination node.`);
      return;
    }
    if (id === source) {
      setSource(null);
      setServerRoute(null);
      setLedNote("Pick any two nodes. Click a link to mark it down.");
      return;
    }
    applyFailover(source, id, failedLinks);
  }

  function toggleFailedLink(id: string) {
    const next = failedLinks.includes(id) ? failedLinks.filter((code) => code !== id) : [...failedLinks, id];
    setFailedLinks(next);
    if (source && destination) {
      applyFailover(source, destination, next);
      return;
    }
    setLedNote(next.length ? `Down ${next.join(", ")}. Pick two nodes.` : "Pick any two nodes. Click a link to mark it down.");
  }

  function pickServer(id: NodeId) {
    if (!source || destination) {
      setSource(id);
      setDestination(null);
      setServerRoute(null);
      setLedNote(`Source ${NODES[id].l}. Pick the destination server.`);
      return;
    }
    if (id === source) {
      setSource(null);
      setLedNote("Pick a source server, then a destination.");
      return;
    }
    const found = routeBetween(source, id);
    setDestination(id);
    setServerRoute(found);
    if (!found) {
      setLedNote("No path between those servers.");
      return;
    }
    const run = ++ticket.current;
    const warning = found.warning ? ` ${found.warning}` : "";
    if (!live) {
      setLedPending(false);
      setLedNote(warning ? `SIM — ${found.label}.${warning}` : `SIM — ${found.label}`);
      return;
    }
    setLedPending(true);
    setLedNote("Sending trail…");
    void sendRouteTrail(controlUrl, found.hops, found.label).then((result) => {
      if (run !== ticket.current) return;
      setLedPending(false);
      setLedNote(warning ? `${result.summary}.${warning}` : result.summary);
      setLast({ url: result.url, mode: "real", at: Date.now() });
    });
  }

  function testTrail() {
    const id = ++ticket.current;
    if (!live) {
      setLedPending(false);
      setLedNote("SIM — LED strips not driven");
      return;
    }
    setLedPending(true);
    setLedNote("Sending trail…");
    void sendSiteATrail(controlUrl).then((result) => {
      if (id !== ticket.current) return;
      setLedPending(false);
      setLedNote(result.summary);
      setLast({ url: result.url, mode: "real", at: Date.now() });
    });
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar active="Topology" />

      <main className="ml-sidebar_width h-screen overflow-hidden flex flex-col relative bg-surface-container-low flex-1">
        <header className="h-20 flex items-center px-gutter justify-between border-b border-outline-variant bg-surface">
          <h2 className="font-headline-md text-headline-md uppercase tracking-tight text-primary">
            Network Topology - Routing Control
          </h2>
          <div className="flex items-center gap-4 font-data-label text-data-label text-on-surface-variant">
            <span className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-sm ${pending ? "bg-tertiary-fixed-dim animate-pulse" : "bg-secondary animate-pulse"}`} />
              {pending ? "DISPATCHING" : "FABRIC ONLINE"}
            </span>
            <span className="border-l border-outline-variant pl-4" />
            <UtcClock />
          </div>
        </header>

        <div className="flex-grow flex p-gutter gap-gutter overflow-hidden">
          {/* Current mode display */}
          <section className="flex-[3] flex flex-col gap-gutter h-full">
            <div className="flex-grow relative topology-grid rounded-lg border-2 border-outline-variant overflow-hidden">
              <SiteATopology
                mode={mode}
                routing={{
                  active: routingOn,
                  source,
                  destination,
                  path: serverRoute?.nodes ?? null,
                  label: serverRoute?.label ?? null,
                  warning: serverRoute?.warning ?? null,
                  onPick: pickServer,
                }}
                failover={{
                  active: failoverOn,
                  source,
                  destination,
                  path: serverRoute?.nodes ?? null,
                  label: serverRoute?.label ?? null,
                  down: failedLinks,
                  note: serverRoute && failedLinks.length ? `Path avoids ${failedLinks.join(", ")}.` : null,
                  onPick: pickNode,
                  onToggleLink: toggleFailedLink,
                }}
                disaster={{
                  active: disasterOn,
                  source,
                  destination,
                  path: serverRoute?.nodes ?? null,
                  label: serverRoute?.label ?? null,
                  down: failedLinks,
                  note: disasterNote,
                  redirect,
                  onPick: pickDisasterNode,
                  onToggleLink: toggleDisasterLink,
                }}
                balance={{
                  active: balanceOn,
                  source,
                  destination,
                  partner: balanceOn && destination ? backupServer(destination) : null,
                  path: serverRoute?.nodes ?? null,
                  partnerPath: partnerRoute?.nodes ?? null,
                  label: serverRoute?.label ?? null,
                  partnerLabel: partnerRoute?.label ?? null,
                  onPick: pickBalance,
                }}
              />
              <div className="absolute top-4 right-4 text-right pointer-events-none">
                <p className="font-code-sm text-xs text-on-surface-variant">SERIAL: BDC-NET-CORE</p>
                <p
                  className={`font-code-sm text-[10px] uppercase ${
                    mode === 5 ? "text-error" : "text-on-surface-variant opacity-60"
                  }`}
                >
                  SPINE / LEAF FABRIC: {mode === 5 ? "DOWN" : "ACTIVE"}
                </p>
              </div>
            </div>
          </section>

          {/* Control panel */}
          <section className="flex-1 flex flex-col gap-gutter h-full min-h-0">
            <div className="bg-surface rounded-lg border border-outline-variant p-gutter flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
              <div>
                <h3 className="font-headline-md text-[40px] text-primary uppercase tracking-tighter font-bold">
                  Fabric Control
                </h3>
                <p className="font-code-sm text-on-surface-variant mt-1">
                  Dispatch a routing mode to the network board
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {MODES.map((m) => {
                  const scenario = routingOn ? 1 : failoverOn ? 3 : balanceOn ? 4 : disasterOn ? 5 : null;
                  const locked = scenario !== null ? m.value !== scenario : (pending || ledPending) && m.value !== 1 && m.value !== 3 && m.value !== 4 && m.value !== 5;
                  const selected = m.value === 1 ? routingOn : m.value === 3 ? failoverOn : m.value === 4 ? balanceOn : m.value === 5 ? disasterOn : mode === m.value && scenario === null;
                  return (
                  <button
                    key={m.value}
                    disabled={locked}
                    onClick={() => {
                      if (m.value === 1) {
                        if (routingOn) stopRouting();
                        else startRouting();
                        return;
                      }
                      if (m.value === 3) {
                        if (failoverOn) stopFailover();
                        else startFailover();
                        return;
                      }
                      if (m.value === 4) {
                        if (balanceOn) stopBalance();
                        else startBalance();
                        return;
                      }
                      if (m.value === 5) {
                        if (disasterOn) stopDisaster();
                        else startDisaster();
                        return;
                      }
                      apply(m.value);
                    }}
                    className={`flex items-center gap-3 py-3 px-4 rounded border uppercase tracking-wider transition-all font-headline-md disabled:opacity-40 disabled:pointer-events-none
                    ${
                      selected
                        ? "bg-secondary text-on-secondary border-secondary shadow-md"
                        : "bg-surface-container-low text-on-surface border-outline-variant hover:border-secondary hover:bg-secondary/10"
                    }
                    ${m.value === 1 && routingOn ? "shadow-[0_0_18px_rgba(34,211,238,0.45)]" : ""}
                    ${m.value === 3 && failoverOn ? "shadow-[0_0_18px_rgba(248,113,113,0.45)]" : ""}
                    ${m.value === 4 && balanceOn ? "shadow-[0_0_18px_rgba(192,132,252,0.45)]" : ""}
                    ${m.value === 5 && disasterOn ? "shadow-[0_0_18px_rgba(248,113,113,0.45)]" : ""}`}
                  >
                    <span className="material-symbols-outlined">{m.icon}</span>
                    <span className="flex-grow text-left">{m.label}</span>
                    <span className="font-code-sm opacity-70">{m.value}</span>
                  </button>
                  );
                })}
              </div>

              {routingOn && (
                <div className="rounded border border-cyan-300/40 bg-cyan-400/5 px-3 py-3">
                  <p className="font-code-sm text-[11px] uppercase tracking-[0.22em] text-cyan-300">dijkstra</p>
                  {serverRoute ? (
                    <>
                      <p className="mt-1 font-mono text-sm text-on-surface break-all">{serverRoute.label}</p>
                      <p className="mt-1 font-code-sm text-[10px] uppercase text-on-surface-variant">
                        {NODES[source ?? serverRoute.nodes[0]].l} → {NODES[destination ?? serverRoute.nodes.at(-1)!].l} · distance {serverRoute.total}
                      </p>
                      {serverRoute.warning && <p className="mt-2 text-[11px] leading-snug text-amber-300">{serverRoute.warning}</p>}
                    </>
                  ) : (
                    <p className="mt-1 font-code-sm text-[10px] uppercase text-on-surface-variant">
                      {source ? `${NODES[source].l} is the source. Pick the destination server.` : "Pick the source server, then the destination."}
                    </p>
                  )}
                  <p className="mt-2 font-code-sm text-[10px] uppercase text-on-surface-variant">Click Routing again to stop.</p>
                </div>
              )}

              {failoverOn && (
                <div className="rounded border border-red-400/40 bg-red-400/5 px-3 py-3">
                  <p className="font-code-sm text-[11px] uppercase tracking-[0.22em] text-red-300">failover</p>
                  {failedLinks.length > 0 && (
                    <p className="mt-1 font-mono text-sm text-red-300">Down {failedLinks.join(", ")}</p>
                  )}
                  {serverRoute ? (
                    <>
                      <p className="mt-1 font-mono text-sm text-on-surface break-all">{serverRoute.label}</p>
                      <p className="mt-1 font-code-sm text-[10px] uppercase text-on-surface-variant">
                        {NODES[source ?? serverRoute.nodes[0]].l} → {NODES[destination ?? serverRoute.nodes.at(-1)!].l} · distance {serverRoute.total}
                      </p>
                      {failedLinks.length > 0 && (
                        <p className="mt-2 text-[11px] leading-snug text-amber-200">Path avoids {failedLinks.join(", ")}.</p>
                      )}
                    </>
                  ) : destination ? (
                    <p className="mt-2 text-[11px] leading-snug text-amber-200">
                      No path remains inside the site{failedLinks.length ? ` around ${failedLinks.join(", ")}` : ""}.
                    </p>
                  ) : (
                    <p className="mt-1 font-code-sm text-[10px] uppercase text-on-surface-variant">
                      {source
                        ? `${NODES[source].l} is the source. Pick any destination.`
                        : failedLinks.length
                          ? "Pick any two nodes."
                          : "Pick any two nodes. Click a link to mark it down."}
                    </p>
                  )}
                  <p className="mt-2 font-code-sm text-[10px] uppercase text-on-surface-variant">Click Failover again to stop.</p>
                </div>
              )}

              {balanceOn && (
                <div className="rounded border border-violet-300/40 bg-violet-400/5 px-3 py-3">
                  <p className="font-code-sm text-[11px] uppercase tracking-[0.22em] text-violet-300">load balance</p>
                  <p className="mt-1 font-code-sm text-[10px] uppercase text-on-surface-variant">
                    Server13 ↔ Server11 · Server14 ↔ Server12
                  </p>
                  {serverRoute && partnerRoute ? (
                    <>
                      <p className="mt-1 font-mono text-sm text-red-300 break-all">{serverRoute.label}</p>
                      <p className="mt-1 font-mono text-sm text-blue-300 break-all">{partnerRoute.label}</p>
                      <p className="mt-1 font-code-sm text-[10px] uppercase text-on-surface-variant">
                        {NODES[serverRoute.nodes[0]].l} → {NODES[destination ?? serverRoute.nodes.at(-1)!].l} and {NODES[partnerRoute.nodes.at(-1)!].l}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 font-code-sm text-[10px] uppercase text-on-surface-variant">
                      {source
                        ? `${NODES[source].l} is the source. Pick Server13, Server11, Server14, or Server12.`
                        : "Pick a source, then one of the paired servers."}
                    </p>
                  )}
                  <p className="mt-2 font-code-sm text-[10px] uppercase text-on-surface-variant">Click Load Balance again to stop.</p>
                </div>
              )}

              {disasterOn && (
                <div className="rounded border border-red-400/40 bg-red-400/5 px-3 py-3">
                  <p className="font-code-sm text-[11px] uppercase tracking-[0.22em] text-red-300">disaster</p>
                  <p className="mt-1 font-code-sm text-[10px] uppercase text-on-surface-variant">
                    Server13 ↔ Server11 · Server14 ↔ Server12
                  </p>
                  {failedLinks.length > 0 && (
                    <p className="mt-1 font-mono text-sm text-red-300">Down {failedLinks.join(", ")}</p>
                  )}
                  {serverRoute ? (
                    <>
                      <p className="mt-1 font-mono text-sm text-on-surface break-all">{serverRoute.label}</p>
                      <p className="mt-1 font-code-sm text-[10px] uppercase text-on-surface-variant">
                        {NODES[serverRoute.nodes[0]].l} → {NODES[serverRoute.nodes.at(-1)!].l} · distance {serverRoute.total}
                      </p>
                      {disasterNote && <p className="mt-2 text-[11px] leading-snug text-amber-200">{disasterNote}</p>}
                    </>
                  ) : destination ? (
                    <p className="mt-2 text-[11px] leading-snug text-amber-200">
                      {disasterNote ?? "No path remains inside the site."}
                    </p>
                  ) : (
                    <p className="mt-1 font-code-sm text-[10px] uppercase text-on-surface-variant">
                      {source
                        ? `${NODES[source].l} is the source. Pick the server the request is for.`
                        : "Pick two nodes. Click K, J, H, or G to mark it down."}
                    </p>
                  )}
                  <p className="mt-2 font-code-sm text-[10px] uppercase text-on-surface-variant">Click Disaster again to stop.</p>
                </div>
              )}

              <button
                disabled={routingOn || failoverOn || balanceOn || disasterOn || pending || ledPending}
                onClick={testTrail}
                className="flex items-center gap-3 py-3 px-4 rounded border border-dashed border-primary/50 text-primary uppercase tracking-wider font-headline-md hover:bg-primary/10 disabled:opacity-50"
              >
                <span className="material-symbols-outlined">timeline</span>
                <span className="flex-grow text-left">
                  Test trail
                  <span className="block font-code-sm text-[10px] normal-case tracking-normal text-on-surface-variant">
                    {TRAIL_TEST.path.join(" → ")}
                  </span>
                </span>
              </button>

              <div className="mt-auto pt-4 border-t border-outline-variant flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${pending || ledPending ? "bg-yellow-400 animate-pulse" : "bg-green-500"}`} />
                  <span className="font-code-sm text-xs uppercase text-on-surface-variant">
                    {lastResult ?? "Ready"}
                  </span>
                </div>
                <p className="font-code-sm text-[10px] uppercase leading-snug text-on-surface-variant break-words">
                  {ledNote ?? "LED strips follow the link codes on the diagram"}
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
