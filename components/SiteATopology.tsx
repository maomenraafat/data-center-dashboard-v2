"use client";

// Site A primary fabric. Geometry and which aliases each mode lights live in
// lib/siteA.ts, shared with the ESP32 packet calls. Devices can be dragged;
// each move recomputes the distance weight of the links that touch them.

import { useEffect, useRef, useState } from "react";
import {
  LINKS,
  NODES,
  SCENES,
  linkDistance,
  syncLinkWeights,
  type LinkKind,
  type NodeId,
  type NodeType,
} from "@/lib/siteA";

export type RoutingPick = {
  active: boolean;
  source: NodeId | null;
  destination: NodeId | null;
  path: NodeId[] | null;
  label: string | null;
  warning: string | null;
  onPick: (id: NodeId) => void;
};

export type FailoverPick = {
  active: boolean;
  source: NodeId | null;
  destination: NodeId | null;
  path: NodeId[] | null;
  label: string | null;
  down: string[];
  note: string | null;
  onPick: (id: NodeId) => void;
  onToggleLink: (id: string) => void;
};

export type DisasterPick = FailoverPick & {
  redirect: NodeId | null;
};

export type LoadBalancePick = {
  active: boolean;
  source: NodeId | null;
  destination: NodeId | null;
  partner: NodeId | null;
  path: NodeId[] | null;
  partnerPath: NodeId[] | null;
  label: string | null;
  partnerLabel: string | null;
  onPick: (id: NodeId) => void;
};

const PAIRED_SERVERS = new Set<NodeId>(["s13", "s11", "s14", "s12"]);

type Point = { x: number; y: number };
type Positions = Record<NodeId, Point>;

const NODE_FILL: Record<NodeType, string> = {
  srv: "#0ea5a4",
  sw: "#2563eb",
  rt: "#7c3aed",
  cloud: "#64748b",
};

function linkByEnds(a: NodeId, b: NodeId) {
  return LINKS.find((l) => (l.a === a && l.b === b) || (l.a === b && l.b === a));
}

// Original viewBox center. A quarter-turn counterclockwise puts WAN (the left side) at the bottom.
const CX = 410;
const CY = 384;

function turn(x: number, y: number) {
  return { x: CX + (y - CY), y: CY - (x - CX) };
}

function unturn(x: number, y: number) {
  return { x: CX + CY - y, y: x - CX + CY };
}

function pathOf(nodes: NodeId[], points: Positions) {
  return nodes
    .map((id, i) => {
      const p = turn(points[id].x, points[id].y);
      return `${i === 0 ? "M" : "L"}${p.x} ${p.y}`;
    })
    .join(" ");
}

function sourceFirst(nodes: NodeId[], source: NodeId | null) {
  if (source && nodes[nodes.length - 1] === source && nodes[0] !== source) return [...nodes].reverse();
  return nodes;
}

function roundTripPath(nodes: NodeId[], points: Positions) {
  const back = [...nodes].reverse().slice(1);
  return `${pathOf(nodes, points)} ${back
    .map((id) => {
      const p = turn(points[id].x, points[id].y);
      return `L${p.x} ${p.y}`;
    })
    .join(" ")}`;
}

function RoutePacket({ nodes, points, color = "#22d3ee" }: { nodes: NodeId[]; points: Positions; color?: string }) {
  const dur = Math.max(2.8, (nodes.length - 1) * 1.15);
  const d = roundTripPath(nodes, points);
  return (
    <g key={`${color}-${nodes.join("-")}`}>
      <circle
        r={7}
        fill={color}
        filter="url(#siteA-glow)"
        style={{
          offsetPath: `path('${d}')`,
          offsetRotate: "0deg",
          animation: `site-a-packet ${dur}s linear infinite`,
        }}
      />
    </g>
  );
}

function clientToSvg(svg: SVGSVGElement, clientX: number, clientY: number) {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: clientX, y: clientY };
  const local = pt.matrixTransform(ctm.inverse());
  return { x: local.x, y: local.y };
}

function initialPositions(): Positions {
  return Object.fromEntries(
    (Object.keys(NODES) as NodeId[]).map((id) => [id, { x: NODES[id].x, y: NODES[id].y }]),
  ) as Positions;
}

function seconds(value: string) {
  return Number.parseFloat(value);
}

function baseStroke(kind: LinkKind) {
  if (kind === "wan" || kind === "wanbk" || kind === "serial") return "#ef4444";
  return "#7c8ea3";
}

function Glyph({ type, fill }: { type: NodeType; fill: string }) {
  if (type === "cloud") {
    return (
      <path
        d="M-22 10C-34 10-34-8-20-8C-18-22 2-26 8-14C22-18 32-4 24 10Z"
        fill={fill}
        stroke="#fff"
        strokeWidth={2}
      />
    );
  }
  if (type === "rt") {
    return (
      <g>
        <circle r={22} fill={fill} />
        <path
          d="M-11 0H11M7-4L11 0L7 4M-7-4L-11 0L-7 4M0-11V11M-4-7L0-11L4-7M-4 7L0 11L4 7"
          stroke="#fff"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    );
  }
  if (type === "sw") {
    return (
      <g>
        <rect x={-32} y={-15} width={64} height={30} rx={7} fill={fill} />
        <path
          d="M-16-4H16M11-9L16-4L11 1M16 5H-16M-11 0L-16 5L-11 10"
          stroke="#fff"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(0 -1) scale(0.9)"
        />
      </g>
    );
  }
  return (
    <g>
      <rect x={-16} y={-22} width={32} height={44} rx={6} fill={fill} />
      {[-12, -3, 6].map((y) => (
        <g key={y}>
          <rect x={-10} y={y} width={20} height={6} rx={2} fill="#fff" opacity={0.9} />
          <circle cx={6} cy={y + 3} r={1.4} fill={fill} />
        </g>
      ))}
    </g>
  );
}

function LinkCode({
  x1,
  y1,
  x2,
  y2,
  text,
  distance,
  nodes,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  text: string;
  distance: number;
  nodes: { x: number; y: number }[];
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  let x = (x1 + x2) / 2;
  let y = (y1 + y2) / 2 - 18;
  if (len >= 8) {
    let best = 0;
    for (const t of [0.5, 0.35, 0.65, 0.28]) {
      for (const dist of [22, -22, 36]) {
        const cx = x1 + dx * t + (-dy / len) * dist;
        const cy = y1 + dy * t + (dx / len) * dist;
        const clearance = Math.min(...nodes.map((n) => Math.hypot(n.x - cx, n.y - cy)));
        if (clearance > best) {
          best = clearance;
          x = cx;
          y = cy;
        }
      }
    }
  }
  const distanceLabel = String(distance);
  const w = Math.max(text.length, distanceLabel.length) * 6.4 + 14;
  return (
    <g style={{ pointerEvents: "none" }}>
      <rect x={x - w / 2} y={y - 16} width={w} height={28} rx={6} fill="#051424" stroke="#3b494c" />
      <text
        x={x}
        y={y - 3}
        textAnchor="middle"
        fontSize={9}
        fill="#d4e4fa"
        fontFamily="var(--font-mono), ui-monospace, monospace"
      >
        {text}
      </text>
      <text
        x={x}
        y={y + 9}
        textAnchor="middle"
        fontSize={9}
        fill="#7dd3fc"
        fontFamily="var(--font-mono), ui-monospace, monospace"
      >
        {distanceLabel}
      </text>
    </g>
  );
}

export default function SiteATopology({
  mode,
  routing,
  failover,
  disaster,
  balance,
}: {
  mode: number;
  routing?: RoutingPick;
  failover?: FailoverPick;
  disaster?: DisasterPick;
  balance?: LoadBalancePick;
}) {
  const scene = SCENES[mode] ?? SCENES[1];
  const down = new Set(scene.down);
  const dead = new Set(scene.dead);
  const siteDown = scene.dead.length > 0;
  const [pos, setPos] = useState<Positions>(initialPositions);
  const [dragging, setDragging] = useState<NodeId | null>(null);
  const dragRef = useRef<{ id: NodeId; pointerId: number; dx: number; dy: number; originX: number; originY: number } | null>(null);
  const movedRef = useRef(0);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    syncLinkWeights(pos);
  }, [pos]);

  useEffect(() => {
    function moveDrag(event: PointerEvent) {
      const drag = dragRef.current;
      const svg = svgRef.current;
      if (!drag || !svg || event.pointerId !== drag.pointerId) return;
      movedRef.current = Math.hypot(event.clientX - drag.originX, event.clientY - drag.originY);
      const pointer = clientToSvg(svg, event.clientX, event.clientY);
      const next = unturn(pointer.x - drag.dx, pointer.y - drag.dy);
      setPos((prev) => ({ ...prev, [drag.id]: next }));
    }
    function endDrag(event: PointerEvent) {
      if (!dragRef.current || event.pointerId !== dragRef.current.pointerId) return;
      dragRef.current = null;
      setDragging(null);
    }
    window.addEventListener("pointermove", moveDrag);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    return () => {
      window.removeEventListener("pointermove", moveDrag);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, []);

  function startDrag(event: React.PointerEvent<SVGGElement>, id: NodeId) {
    const svg = svgRef.current;
    if (!svg) return;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Capture is unavailable for this pointer. Window listeners still follow it.
    }
    movedRef.current = 0;
    const pointer = clientToSvg(svg, event.clientX, event.clientY);
    const at = turn(pos[id].x, pos[id].y);
    dragRef.current = {
      id,
      pointerId: event.pointerId,
      dx: pointer.x - at.x,
      dy: pointer.y - at.y,
      originX: event.clientX,
      originY: event.clientY,
    };
    setDragging(id);
  }

  const placed = (Object.keys(pos) as NodeId[]).map((id) => turn(pos[id].x, pos[id].y));
  const failing = failover?.active ?? false;
  const recovering = disaster?.active ?? false;
  const balancing = balance?.active ?? false;
  const marking = failing || recovering;
  const livePick = recovering ? disaster : failing ? failover : null;
  const picking = (routing?.active ?? false) || marking || balancing;
  const activeSource = balancing ? (balance?.source ?? null) : livePick ? (livePick.source ?? null) : (routing?.source ?? null);
  const requested = recovering && disaster?.redirect ? disaster.destination : null;
  const activeDestination = balancing
    ? (balance?.destination ?? null)
    : recovering
      ? (disaster?.redirect ?? disaster?.destination ?? null)
      : livePick
        ? (livePick.destination ?? null)
        : (routing?.destination ?? null);
  const activePath = balancing ? (balance?.path ?? null) : livePick ? (livePick.path ?? null) : (routing?.path ?? null);
  const manualDown = new Set(livePick?.down ?? []);
  const routePath = activePath ? sourceFirst(activePath, activeSource) : null;
  const partnerPath = balancing && balance?.partnerPath ? sourceFirst(balance.partnerPath, activeSource) : null;
  const routeLinks = new Set<string>();
  const partnerLinks = new Set<string>();
  const routeNodes = new Set<NodeId>(routePath ?? []);
  if (routePath) {
    for (let i = 0; i < routePath.length - 1; i++) {
      const link = linkByEnds(routePath[i], routePath[i + 1]);
      if (link) routeLinks.add(link.id);
    }
  }
  if (partnerPath) {
    partnerPath.forEach((id) => routeNodes.add(id));
    for (let i = 0; i < partnerPath.length - 1; i++) {
      const link = linkByEnds(partnerPath[i], partnerPath[i + 1]);
      if (link) partnerLinks.add(link.id);
    }
  }
  const active = new Map<string, string>();
  const lit = new Set<NodeId>();
  if (!picking) {
    for (const flow of scene.flows) {
      flow.nodes.forEach((id) => lit.add(id));
      for (let i = 0; i < flow.nodes.length - 1; i++) {
        const link = linkByEnds(flow.nodes[i], flow.nodes[i + 1]);
        if (link && !active.has(link.id)) active.set(link.id, flow.color);
      }
    }
  }

  return (
    <div className="absolute inset-0 flex flex-col px-3 pt-12 pb-3">
      {picking && routing?.active && routing.label && (
        <div className="pointer-events-none absolute left-4 top-14 z-10 max-w-[min(520px,70%)] rounded border border-cyan-300/50 bg-[#051424]/90 px-3 py-2">
          <p className="font-code-sm text-[11px] uppercase tracking-[0.22em] text-cyan-300">dijkstra</p>
          <p className="mt-1 font-mono text-sm text-white break-all">{routing.label}</p>
          {routing.warning && <p className="mt-1 text-[11px] leading-snug text-amber-300">{routing.warning}</p>}
        </div>
      )}
      {recovering && (disaster?.label || (disaster?.down.length ?? 0) > 0 || disaster?.note) && (
        <div className="pointer-events-none absolute left-4 top-14 z-10 max-w-[min(520px,70%)] rounded border border-red-400/50 bg-[#051424]/90 px-3 py-2">
          <p className="font-code-sm text-[11px] uppercase tracking-[0.22em] text-red-300">disaster</p>
          {disaster?.down.length ? (
            <p className="mt-1 font-mono text-sm text-red-300">Down {disaster.down.join(", ")}</p>
          ) : null}
          {disaster?.label && <p className="mt-1 font-mono text-sm text-white break-all">{disaster.label}</p>}
          {disaster?.note && <p className="mt-1 text-[11px] leading-snug text-amber-200">{disaster.note}</p>}
        </div>
      )}
      {balancing && (balance?.label || balance?.partnerLabel) && (
        <div className="pointer-events-none absolute left-4 top-14 z-10 max-w-[min(520px,70%)] rounded border border-violet-300/50 bg-[#051424]/90 px-3 py-2">
          <p className="font-code-sm text-[11px] uppercase tracking-[0.22em] text-violet-300">load balance</p>
          {balance?.label && <p className="mt-1 font-mono text-sm text-red-300 break-all">{balance.label}</p>}
          {balance?.partnerLabel && <p className="mt-1 font-mono text-sm text-blue-300 break-all">{balance.partnerLabel}</p>}
        </div>
      )}
      {failing && (failover?.label || (failover?.down.length ?? 0) > 0 || failover?.note) && (
        <div className="pointer-events-none absolute left-4 top-14 z-10 max-w-[min(520px,70%)] rounded border border-red-400/50 bg-[#051424]/90 px-3 py-2">
          <p className="font-code-sm text-[11px] uppercase tracking-[0.22em] text-red-300">failover</p>
          {failover?.down.length ? (
            <p className="mt-1 font-mono text-sm text-red-300">Down {failover.down.join(", ")}</p>
          ) : null}
          {failover?.label && <p className="mt-1 font-mono text-sm text-white break-all">{failover.label}</p>}
          {failover?.note && <p className="mt-1 text-[11px] leading-snug text-amber-200">{failover.note}</p>}
        </div>
      )}
      <svg
        ref={svgRef}
        viewBox="10 -56 780 880"
        className="min-h-0 w-full flex-1"
        role="group"
        aria-label="Site A primary network topology"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="siteA-shadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodOpacity="0.45" />
          </filter>
          <filter id="siteA-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect
          x={71}
          y={-36}
          width={655}
          height={735}
          rx={16}
          fill={scene.zone}
          fillOpacity={0.06}
          stroke={scene.zone}
          strokeOpacity={0.55}
          strokeDasharray="6 5"
        />
        <text
          x={83}
          y={-14}
          fontSize={13}
          fontWeight={700}
          fill={scene.zone}
          fontFamily="var(--font-hanken), sans-serif"
        >
          SITE A  PRIMARY
        </text>

        {siteDown && (
          <g>
            <rect x={315} y={-28} width={168} height={24} rx={6} fill="#450a0a" stroke="#ef4444" />
            <text
              x={399}
              y={-12}
              textAnchor="middle"
              fontSize={12}
              fontWeight={700}
              fill="#fecaca"
              fontFamily="var(--font-mono), ui-monospace, monospace"
            >
              SITE A DOWN
            </text>
          </g>
        )}

        {LINKS.map((link) => {
          const A = turn(pos[link.a].x, pos[link.a].y);
          const B = turn(pos[link.b].x, pos[link.b].y);
          const isDown = marking ? manualDown.has(link.id) : down.has(link.id);
          const routed = routeLinks.has(link.id);
          const shared = partnerLinks.has(link.id);
          const fromA = !routePath || routePath.indexOf(link.a) < routePath.indexOf(link.b);
          const color = isDown ? undefined : routed ? (balancing ? "#FF0000" : "#22d3ee") : shared ? "#0000FF" : active.get(link.id);
          const idleDash = link.kind === "bk" || link.kind === "wanbk" ? "8 6" : undefined;
          const faded = !marking && !routed && !shared && (siteDown || isDown);
          const midX = (A.x + B.x) / 2;
          const midY = (A.y + B.y) / 2;
          return (
            <g key={link.id} opacity={faded ? 0.28 : 1}>
              <line
                x1={A.x}
                y1={A.y}
                x2={B.x}
                y2={B.y}
                stroke={isDown ? "#ef4444" : routed ? (balancing ? "#FF0000" : "#22d3ee") : shared ? "#0000FF" : baseStroke(link.kind)}
                strokeWidth={isDown || routed || shared ? 5 : 3}
                strokeLinecap="round"
                strokeDasharray={isDown ? undefined : idleDash}
              />
              {color && !isDown && (
                <line
                  x1={A.x}
                  y1={A.y}
                  x2={B.x}
                  y2={B.y}
                  stroke={color}
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeDasharray="7 7"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="0"
                    to={routed && !fromA ? "28" : "-28"}
                    dur="0.7s"
                    repeatCount="indefinite"
                  />
                </line>
              )}
              {balancing && routed && shared && !isDown && (
                <line
                  x1={A.x}
                  y1={A.y}
                  x2={B.x}
                  y2={B.y}
                  stroke="#0000FF"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeDasharray="4 8"
                />
              )}
              <LinkCode
                x1={A.x}
                y1={A.y}
                x2={B.x}
                y2={B.y}
                text={link.id}
                distance={linkDistance(link.a, link.b, pos)}
                nodes={placed}
              />
              {isDown && (
                <g>
                  <circle cx={midX} cy={midY} r={12} fill="#450a0a" stroke="#ef4444" />
                  <text
                    x={midX}
                    y={midY + 5}
                    textAnchor="middle"
                    fontSize={16}
                    fontWeight={700}
                    fill="#fecaca"
                  >
                    ✕
                  </text>
                </g>
              )}
              {marking && (
                <line
                  x1={A.x}
                  y1={A.y}
                  x2={B.x}
                  y2={B.y}
                  stroke="transparent"
                  strokeWidth={18}
                  strokeLinecap="round"
                  role="button"
                  aria-label={isDown ? `Restore ${link.id}` : `Fail ${link.id}`}
                  style={{ cursor: "pointer" }}
                  onClick={(event) => {
                    event.stopPropagation();
                    livePick?.onToggleLink(link.id);
                  }}
                />
              )}
            </g>
          );
        })}

        {!picking && (
        <g key={mode}>
          {scene.flows.flatMap((flow, index) => {
            const d = pathOf(flow.nodes, pos);
            const half = seconds(flow.dur) / 2;
            const base = seconds(flow.begin ?? "0");
            return [0, 1].map((copy) => (
              <circle key={`${index}-${copy}`} r={5.5} fill={flow.color} filter="url(#siteA-glow)">
                <animateMotion
                  dur={flow.dur}
                  repeatCount="indefinite"
                  begin={`${base + copy * half}s`}
                  path={d}
                />
              </circle>
            ));
          })}
        </g>
        )}

        {(Object.keys(NODES) as NodeId[]).map((id) => {
          const node = NODES[id];
          const at = turn(pos[id].x, pos[id].y);
          const isDead = dead.has(id);
          const onRoute = routeNodes.has(id);
          const partner = balancing ? (balance?.partner ?? null) : null;
          const chosen = id === activeSource || id === activeDestination || id === requested || id === partner;
          const selectable =
            node.t !== "cloud" &&
            (balancing
              ? !balance?.source || PAIRED_SERVERS.has(id) || id === balance.source
              : marking || (picking && node.t === "srv"));
          const dim = picking ? Boolean(activePath) && !onRoute && id !== requested : lit.size > 0 && !lit.has(id) && !isDead;
          const ring = isDead ? 0 : lit.has(id) ? 1 : 0;
          const glow =
            selectable && (!activePath || chosen)
              ? id === partner
                ? "#0000FF"
                : id === requested
                  ? "#f87171"
                  : id === activeSource
                    ? "#fbbf24"
                    : id === activeDestination
                      ? balancing
                        ? "#FF0000"
                        : "#34d399"
                      : balancing
                        ? "#c084fc"
                        : recovering
                          ? "#fb7185"
                          : failing
                            ? "#f59e0b"
                            : "#22d3ee"
              : null;
          return (
            <g
              key={id}
              role="button"
              aria-label={selectable ? `Select ${node.l}` : `Drag ${node.l}`}
              transform={`translate(${at.x} ${at.y})`}
              opacity={isDead ? 0.38 : dim ? 0.42 : 1}
              style={{ cursor: dragging === id ? "grabbing" : selectable ? "pointer" : "grab", touchAction: "none" }}
              onPointerDown={(event) => startDrag(event, id)}
              onClick={() => {
                if (!selectable) return;
                if (movedRef.current > 6) {
                  movedRef.current = 0;
                  return;
                }
                (balancing ? balance?.onPick : livePick ? livePick.onPick : routing?.onPick)?.(id);
              }}
            >
              <circle r={36} fill="transparent" />
              {glow && (
                <circle r={46} fill="none" stroke={glow} strokeWidth={chosen ? 4 : 2.5} filter="url(#siteA-glow)">
                  {!chosen && <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />}
                </circle>
              )}
              <circle
                r={node.t === "sw" ? 38 : 30}
                fill="none"
                stroke={scene.zone}
                strokeWidth={2.5}
                opacity={ring}
              />
              <g filter={isDead ? undefined : "url(#siteA-shadow)"} style={isDead ? { filter: "grayscale(1)" } : undefined}>
                <Glyph type={node.t} fill={NODE_FILL[node.t]} />
              </g>
              <text
                y={node.t === "srv" ? 40 : 38}
                textAnchor="middle"
                fontSize={12}
                fontWeight={700}
                fill="#e2e8f0"
                fontFamily="var(--font-hanken), sans-serif"
              >
                {node.l}
              </text>
              {isDead && (
                <text y={8} textAnchor="middle" fontSize={28} fontWeight={700} fill="#ef4444">
                  ✕
                </text>
              )}
            </g>
          );
        })}

        {routePath && routePath.length > 1 && <RoutePacket nodes={routePath} points={pos} color={balancing ? "#FF0000" : "#22d3ee"} />}
        {partnerPath && partnerPath.length > 1 && <RoutePacket nodes={partnerPath} points={pos} color="#0000FF" />}
      </svg>

      <div className="mt-2 flex items-center justify-between gap-4">
        <p className="font-code-sm text-[11px] uppercase tracking-wide text-on-surface-variant">
          {balancing
            ? activePath
              ? "Load balance — red is the server you picked. Blue is its backup."
              : "Load balance — pick a source, then Server13, Server11, Server14, or Server12."
            : recovering
            ? activePath
              ? "Disaster — a down K, J, H, or G link sends the request to the paired server."
              : disaster?.destination
                ? "Disaster — no route remains inside the site."
                : "Disaster — Server13 ↔ Server11, Server14 ↔ Server12. Click K, J, H, or G to mark it down."
            : failing
            ? activeDestination && activePath
              ? "Failover — red links are down. The path uses the next route around them."
              : activeDestination
                ? "Failover — no route remains inside the site."
                : "Failover — pick any two nodes, and click a link to mark it down."
            : picking
              ? routing?.destination
                ? "Routing — dijkstra scored the path by distance. Click Routing again to stop."
                : "Routing — choose the source server, then the destination."
              : scene.caption}
        </p>
        <div className="flex shrink-0 items-center gap-3 font-code-sm text-[10px] uppercase tracking-wider text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-0 w-4 border-t-[3px] border-[#7c8ea3]" />
            Primary
          </span>
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-0 w-4 border-t-[3px] border-dashed border-[#7c8ea3]" />
            Backup
          </span>
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-0 w-4 border-t-[3px] border-[#ef4444]" />
            Serial
          </span>
        </div>
      </div>
    </div>
  );
}
