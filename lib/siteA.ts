// Site A primary fabric. Link ids are the ESP32 strip connection codes
// (WAN-R5, R5-SA, …) from the commissioning board and API_DETAILS.md.
// The topology drawing and the LED packet calls both read this graph,
// so a mode button lights the same aliases the diagram animates.

export type NodeId =
  | "cl"
  | "r5"
  | "r4"
  | "sa"
  | "s1"
  | "s2"
  | "s15"
  | "s13"
  | "s14"
  | "s11"
  | "s12";

export type NodeType = "cloud" | "rt" | "sw" | "srv";

export type NodeDef = { x: number; y: number; t: NodeType; l: string };

export const NODES: Record<NodeId, NodeDef> = {
  cl: { x: 45, y: 120, t: "cloud", l: "WAN" },
  r5: { x: 125, y: 218, t: "rt", l: "Router1" },
  r4: { x: 128, y: 362, t: "rt", l: "Router2" },
  sa: { x: 578, y: 218, t: "sw", l: "SW for AI" },
  s15: { x: 580, y: 75, t: "srv", l: "Server15 (GPU)" },
  s1: { x: 555, y: 435, t: "sw", l: "Switch2" },
  s2: { x: 410, y: 530, t: "sw", l: "Switch1" },
  s13: { x: 760, y: 378, t: "srv", l: "Server13" },
  s14: { x: 760, y: 482, t: "srv", l: "Server14" },
  s11: { x: 390, y: 655, t: "srv", l: "Server11" },
  s12: { x: 462, y: 655, t: "srv", l: "Server12" },
};

export type LinkKind = "primary" | "serial" | "bk" | "wan" | "wanbk";

/** Cost inputs for one link. Add fields here when routing needs more than distance. */
export type LinkCriteria = {
  distance: number;
};

export type LinkDef = {
  id: string;
  a: NodeId;
  b: NodeId;
  pa: string;
  pb: string;
  kind: LinkKind;
  criteria: LinkCriteria;
  /** Score used by routing and switching. Distance until more criteria are combined. */
  weight: number;
};

export function linkDistance(
  a: NodeId,
  b: NodeId,
  points: Record<NodeId, { x: number; y: number }> = NODES,
) {
  const from = points[a];
  const to = points[b];
  return Math.round(Math.hypot(to.x - from.x, to.y - from.y));
}

/** Write the current endpoint positions back onto every link's distance and weight. */
export function syncLinkWeights(points: Record<NodeId, { x: number; y: number }>) {
  for (const link of LINKS) {
    link.criteria.distance = linkDistance(link.a, link.b, points);
    link.weight = linkWeight(link.criteria);
  }
}

/** Single place that turns criteria into the weight a path search will add up. */
export function linkWeight(criteria: LinkCriteria) {
  return criteria.distance;
}

function defineLink(link: Omit<LinkDef, "criteria" | "weight">): LinkDef {
  const criteria = { distance: linkDistance(link.a, link.b) };
  return { ...link, criteria, weight: linkWeight(criteria) };
}

export const LINKS: LinkDef[] = [
  defineLink({ id: "WAN-R5", a: "cl", b: "r5", pa: "Se0/1/1", pb: "", kind: "wan" }),
  defineLink({ id: "WAN-R4", a: "cl", b: "r4", pa: "Se0/1/1", pb: "", kind: "wanbk" }),
  defineLink({ id: "B", a: "r5", b: "sa", pa: "Gig0/0/0", pb: "Fa0/1", kind: "primary" }),
  defineLink({ id: "E", a: "r5", b: "r4", pa: "Se0/1/0", pb: "Se0/1/0", kind: "serial" }),
  defineLink({ id: "C", a: "r4", b: "sa", pa: "Gig0/2/0", pb: "Fa0/3", kind: "bk" }),
  defineLink({ id: "D", a: "r5", b: "s1", pa: "Gig0/0/1", pb: "Fa0/1", kind: "primary" }),
  defineLink({ id: "F", a: "r4", b: "s2", pa: "Gig0/0/1", pb: "Fa0/1", kind: "primary" }),
  defineLink({ id: "I", a: "s1", b: "s2", pa: "Fa0/4", pb: "Fa0/4", kind: "bk" }),
  defineLink({ id: "A", a: "sa", b: "s15", pa: "Fa0/2", pb: "Fa0", kind: "primary" }),
  defineLink({ id: "K", a: "s1", b: "s13", pa: "Fa0/2", pb: "Fa0", kind: "primary" }),
  defineLink({ id: "J", a: "s1", b: "s14", pa: "Fa0/3", pb: "Fa0", kind: "primary" }),
  defineLink({ id: "G", a: "s2", b: "s11", pa: "Fa0/3", pb: "Fa0", kind: "primary" }),
  defineLink({ id: "H", a: "s2", b: "s12", pa: "Fa0/2", pb: "Fa0", kind: "primary" }),
];

const SITE_A: NodeId[] = ["r5", "r4", "sa", "s1", "s2", "s15", "s11", "s12", "s13", "s14"];

export type Flow = { nodes: NodeId[]; color: string; dur: string; begin?: string };

export type Scene = {
  caption: string;
  down: string[];
  dead: NodeId[];
  flows: Flow[];
  zone: string;
};

export const SCENES: Record<number, Scene> = {
  1: {
    caption: "Routing — primary path only. WAN enters Router1. Backup links stay idle.",
    down: [],
    dead: [],
    zone: "#60a5fa",
    flows: [
      { nodes: ["cl", "r5", "sa", "s15"], color: "#22d3ee", dur: "3.2s" },
      { nodes: ["cl", "r5", "s1", "s13"], color: "#22d3ee", dur: "4.2s", begin: "0.5s" },
      { nodes: ["cl", "r5", "s1", "s14"], color: "#67e8f9", dur: "4.4s", begin: "1.4s" },
      { nodes: ["cl", "r5", "r4", "s2", "s11"], color: "#22d3ee", dur: "4.2s", begin: "0.9s" },
      { nodes: ["cl", "r5", "r4", "s2", "s12"], color: "#67e8f9", dur: "4.4s", begin: "1.8s" },
    ],
  },
  2: {
    caption: "Switching — access switches forward between servers. Routers are off the path.",
    down: [],
    dead: [],
    zone: "#60a5fa",
    flows: [
      { nodes: ["s13", "s1", "s14"], color: "#60a5fa", dur: "2.4s" },
      { nodes: ["s11", "s2", "s12"], color: "#60a5fa", dur: "2.4s", begin: "0.4s" },
      { nodes: ["s13", "s1", "s2", "s11"], color: "#38bdf8", dur: "3.2s", begin: "0.2s" },
      { nodes: ["s15", "sa"], color: "#93c5fd", dur: "1.8s", begin: "0.7s" },
    ],
  },
  3: {
    caption: "Failover — WAN–R5 and B are down. Traffic uses Router2 and the backup links.",
    down: ["WAN-R5", "B"],
    dead: [],
    zone: "#f59e0b",
    flows: [
      { nodes: ["cl", "r4", "sa", "s15"], color: "#f59e0b", dur: "3.6s" },
      { nodes: ["cl", "r4", "r5", "s1", "s14"], color: "#fbbf24", dur: "3.4s", begin: "0.6s" },
      { nodes: ["cl", "r4", "s2", "s12"], color: "#f59e0b", dur: "3.4s", begin: "1.1s" },
      { nodes: ["s13", "s1", "s2", "s11"], color: "#fbbf24", dur: "3.2s", begin: "0.3s" },
    ],
  },
  4: {
    caption: "Load balance — flows split across Router1 and Router2 at the same time.",
    down: [],
    dead: [],
    zone: "#c084fc",
    flows: [
      { nodes: ["cl", "r5", "sa", "s15"], color: "#22d3ee", dur: "3.2s" },
      { nodes: ["cl", "r4", "sa", "s15"], color: "#c084fc", dur: "3.6s", begin: "0.45s" },
      { nodes: ["cl", "r5", "s1", "s13"], color: "#22d3ee", dur: "4.2s", begin: "0.8s" },
      { nodes: ["cl", "r5", "s1", "s14"], color: "#67e8f9", dur: "4.4s", begin: "1.5s" },
      { nodes: ["cl", "r4", "s2", "s11"], color: "#c084fc", dur: "3.4s", begin: "1.15s" },
      { nodes: ["cl", "r4", "s2", "s12"], color: "#d8b4fe", dur: "3.6s", begin: "1.7s" },
    ],
  },
  5: {
    caption: "Disaster — Site A primary is down. No path remains through the fabric.",
    down: [],
    dead: SITE_A,
    zone: "#f87171",
    flows: [],
  },
};

export type TrailStep = { code: string; reverse: boolean };

export type SceneTrail = { hops: TrailStep[]; color: string; label: string };

/** One /api/trail body per animated flow. Direction follows the flow, not the link's stored order. */
export function sceneTrails(mode: number): SceneTrail[] {
  const scene = SCENES[mode] ?? SCENES[1];
  const trails: SceneTrail[] = [];
  for (const flow of scene.flows) {
    const hops: TrailStep[] = [];
    for (let i = 0; i < flow.nodes.length - 1; i++) {
      const from = flow.nodes[i];
      const to = flow.nodes[i + 1];
      const link = LINKS.find((item) => (item.a === from && item.b === to) || (item.a === to && item.b === from));
      if (!link) continue;
      hops.push({ code: link.id, reverse: link.a !== from });
    }
    if (hops.length === 0) continue;
    trails.push({ hops, color: flow.color, label: hops.map((hop) => hop.code).join("-") });
  }
  return trails;
}

export type LedHop = { code: string; reverse: boolean; color: string };

export type LedCues = { hops: LedHop[]; down: string[]; disaster: boolean };

/** The strips a mode button should drive, in diagram order. */
export function ledCues(mode: number): LedCues {
  const scene = SCENES[mode] ?? SCENES[1];
  if (scene.dead.length > 0) return { hops: [], down: [], disaster: true };

  const hops: LedHop[] = [];
  const seen = new Set<string>();
  for (const flow of scene.flows) {
    for (let i = 0; i < flow.nodes.length - 1; i++) {
      const from = flow.nodes[i];
      const to = flow.nodes[i + 1];
      const link = LINKS.find(
        (l) => (l.a === from && l.b === to) || (l.a === to && l.b === from),
      );
      if (!link || seen.has(link.id)) continue;
      seen.add(link.id);
      // Code "R5-SA" means R5 -> SA. reverse is set when the flow runs the other way.
      hops.push({ code: link.id, reverse: link.a !== from, color: flow.color });
    }
  }
  return { hops, down: scene.down, disaster: false };
}
