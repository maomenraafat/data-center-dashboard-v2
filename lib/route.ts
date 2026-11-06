// Shortest path across Site A. Link weight is the distance on each strip.
// A hop labeled 1 is the request (source → destination). The same strips
// labeled 2 are the response, walked back toward the source.

import { LINKS, NODES, type NodeId } from "@/lib/siteA";

export type RouteHop = { code: string; reverse: boolean; leg: 1 | 2 };

export type ServerRoute = {
  nodes: NodeId[];
  hops: RouteHop[];
  label: string;
  total: number;
  switchScenario: boolean;
  warning: string | null;
};

// Each access link isolates one server. Its partner takes the request when that link is down.
const DISASTER_PAIRS: Partial<Record<NodeId, { link: string; backup: NodeId }>> = {
  s13: { link: "K", backup: "s11" },
  s11: { link: "G", backup: "s13" },
  s14: { link: "J", backup: "s12" },
  s12: { link: "H", backup: "s14" },
};

export function backupServer(id: NodeId): NodeId | null {
  return DISASTER_PAIRS[id]?.backup ?? null;
}

export function disasterDestination(
  destination: NodeId,
  blocked: readonly string[],
): { target: NodeId; note: string | null; blocked: boolean; cut: string | null } {
  const access = DISASTER_PAIRS[destination];
  if (!access || !blocked.includes(access.link)) return { target: destination, note: null, blocked: false, cut: null };
  const partner = DISASTER_PAIRS[access.backup];
  const asked = NODES[destination].l;
  const cover = NODES[access.backup].l;
  if (partner && blocked.includes(partner.link)) {
    return { target: destination, note: `${asked} and ${cover} are both unreachable.`, blocked: true, cut: access.link };
  }
  return { target: access.backup, note: `${access.link} is down. ${asked} routes to ${cover}.`, blocked: false, cut: access.link };
}

export function routeBetween(
  source: NodeId,
  destination: NodeId,
  blocked: readonly string[] = [],
): ServerRoute | null {
  if (source === destination) return null;
  const closed = new Set(blocked);

  const nodes = Object.keys(NODES) as NodeId[];
  const dist = new Map<NodeId, number>();
  const prev = new Map<NodeId, NodeId | null>();
  const queue = new Set<NodeId>(nodes);
  for (const id of nodes) {
    dist.set(id, Number.POSITIVE_INFINITY);
    prev.set(id, null);
  }
  dist.set(source, 0);

  while (queue.size > 0) {
    let current: NodeId | null = null;
    let best = Number.POSITIVE_INFINITY;
    for (const id of queue) {
      const weight = dist.get(id) ?? Number.POSITIVE_INFINITY;
      if (weight < best) {
        best = weight;
        current = id;
      }
    }
    if (current === null || best === Number.POSITIVE_INFINITY) break;
    queue.delete(current);
    if (current === destination) break;

    for (const link of LINKS) {
      // WAN sits outside the site. A failed internal link must not detour through it.
      if (closed.has(link.id) || link.kind === "wan" || link.kind === "wanbk") continue;
      const next = link.a === current ? link.b : link.b === current ? link.a : null;
      if (!next || !queue.has(next)) continue;
      const alt = best + link.weight;
      if (alt < (dist.get(next) ?? Number.POSITIVE_INFINITY)) {
        dist.set(next, alt);
        prev.set(next, current);
      }
    }
  }

  if ((dist.get(destination) ?? Number.POSITIVE_INFINITY) === Number.POSITIVE_INFINITY) return null;

  const path: NodeId[] = [];
  let cursor: NodeId | null = destination;
  while (cursor) {
    path.push(cursor);
    cursor = prev.get(cursor) ?? null;
  }
  path.reverse();

  const request: RouteHop[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    const link = LINKS.find((item) => (item.a === from && item.b === to) || (item.a === to && item.b === from));
    if (!link) return null;
    request.push({ code: link.id, reverse: link.a !== from, leg: 1 });
  }

  const response: RouteHop[] = [...request].reverse().map((hop) => ({
    code: hop.code,
    reverse: !hop.reverse,
    leg: 2,
  }));
  const hops = [...request, ...response];
  const crossesRouter = path.some((id) => NODES[id].t === "rt");

  return {
    nodes: path,
    hops,
    label: hops.map((hop) => `${hop.code}${hop.leg}`).join("-"),
    total: dist.get(destination) ?? 0,
    switchScenario: !crossesRouter,
    warning: crossesRouter
      ? null
      : `Switch scenario — ${NODES[source].l} to ${NODES[destination].l} never passes a router.`,
  };
}
