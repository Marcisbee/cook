import { tileSize, type Point } from "./isometric";
export type Drawable = {
  position: Point;
  footprint: [number, number];
  height: number;
  depth: number;
  draw: () => void;
};
// Non-intersecting footprints impose a partial order. Ground-centre sorting
// alone fails beside the rear corners of long props. Projected prism intervals
// exclude pairs whose silhouettes cannot overlap before adding constraints.
export function depthOrder<T extends Drawable>(items: T[]): T[] {
  const base = [...items].sort((a, b) => a.depth - b.depth);
  const bounds = base.map((a) => {
    const x0 = a.position.x - a.footprint[0] / 2,
      x1 = a.position.x + a.footprint[0] / 2;
    const y0 = a.position.y - a.footprint[1] / 2,
      y1 = a.position.y + a.footprint[1] / 2;
    const z = a.height / tileSize.height;
    return {
      x0,
      x1,
      y0,
      y1,
      h0: x0 - y1,
      h1: x1 - y0,
      u0: x0 - z,
      u1: x1,
      v0: y0 - z,
      v1: y1,
    };
  });
  const outgoing = base.map(() => new Set<number>()),
    incoming = base.map(() => 0);
  for (let i = 0; i < base.length; i++)
    for (let j = i + 1; j < base.length; j++) {
      const a = bounds[i],
        b = bounds[j];
      if (
        a.h1 <= b.h0 ||
        b.h1 <= a.h0 ||
        a.u1 <= b.u0 ||
        b.u1 <= a.u0 ||
        a.v1 <= b.v0 ||
        b.v1 <= a.v0
      )
        continue;
      const before = a.x1 <= b.x0 || a.y1 <= b.y0;
      const after = b.x1 <= a.x0 || b.y1 <= a.y0;
      if (before === after) continue; // Intersecting art stays in stable base order.
      const from = before ? i : j,
        to = before ? j : i;
      outgoing[from].add(to);
      incoming[to]++;
    }
  const remaining = new Set(base.map((_, i) => i)),
    result: T[] = [];
  while (remaining.size) {
    // Cycles need split artwork; keep deterministic order rather than flicker.
    const next =
      [...remaining].find((i) => incoming[i] === 0) ??
      remaining.values().next().value!;
    remaining.delete(next);
    result.push(base[next]);
    for (const to of outgoing[next]) incoming[to]--;
  }
  return result;
}
