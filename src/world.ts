import { fixtureTiles } from "./tiles";
export type Point = { x: number; y: number };
export const tables: Point[] = [
  { x: 2, y: 2 },
  { x: 5, y: 2 },
  { x: 2, y: 4 },
  { x: 5, y: 4 },
  { x: 2, y: 6 },
  { x: 5, y: 6 },
  { x: 2, y: 8 },
  { x: 5, y: 8 },
];
export const door = { x: 1, y: 10.5 };
export const chefSpot = { x: 9, y: 0.6 };
export const secondChefSpot = { x: 8, y: 0.6 };
export const cookSpot = (id: string): Point =>
  id === "owner"
    ? chefSpot
    : id === "rodrigo"
      ? secondChefSpot
      : { x: 10, y: 0.6 };
export const foodSpot = (seat: number): Point =>
  seat < 4 ? { x: 7, y: seat + 1 } : { x: 10, y: seat - 1 };
export const pickupSpot = (seat: number): Point =>
  seat < 4 ? { x: 6, y: seat + 1 } : { x: 9, y: seat - 1 };
export const pass = { x: 6, y: 5 };
const blocked = (x: number, y: number) =>
  fixtureTiles.some((p) => p.solid && p.x === x && p.y === y) ||
  tables.some((t) => (t.x === x || t.x - 1 === x) && t.y === y) ||
  (x === 7 && y < 5) ||
  (x === 10 && y >= 3 && y <= 6) ||
  (x >= 8 && y === 0);

// Routes use the same floor collision map for simulation timing and rendering.
export function route(start: Point, end: Point): Point[] {
  const a = {
    x: Math.max(0, Math.min(11, Math.round(start.x))),
    y: Math.max(0, Math.min(9, Math.round(start.y))),
  };
  const b = {
    x: Math.max(0, Math.min(11, Math.round(end.x))),
    y: Math.max(0, Math.min(9, Math.round(end.y))),
  };
  const key = (p: Point) => `${p.x},${p.y}`;
  const queue = [a];
  const seen = new Map<string, Point | null>([[key(a), null]]);
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    if (key(p) === key(b)) break;
    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ]) {
      const next = { x: p.x + dx, y: p.y + dy };
      if (
        next.x < 0 ||
        next.x > 11 ||
        next.y < 0 ||
        next.y > 9 ||
        (blocked(next.x, next.y) && key(next) !== key(b)) ||
        seen.has(key(next))
      )
        continue;
      seen.set(key(next), p);
      queue.push(next);
    }
  }
  const path: Point[] = [end];
  let p: Point | null = b;
  while (p) {
    path.unshift(p);
    p = seen.get(key(p)) ?? null;
  }
  path.unshift(start);
  return path.filter(
    (p, i) => !i || p.x !== path[i - 1].x || p.y !== path[i - 1].y,
  );
}
export function pathLength(path: Point[]) {
  return path
    .slice(1)
    .reduce((n, p, i) => n + Math.hypot(p.x - path[i].x, p.y - path[i].y), 0);
}
export function along(path: Point[], progress: number) {
  let distance = pathLength(path) * Math.max(0, Math.min(1, progress));
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1],
      b = path[i],
      length = Math.hypot(b.x - a.x, b.y - a.y);
    if (distance <= length && length > 0)
      return {
        x: a.x + ((b.x - a.x) * distance) / length,
        y: a.y + ((b.y - a.y) * distance) / length,
        dx: b.x - a.x,
        dy: b.y - a.y,
      };
    distance -= length;
  }
  const end = path[path.length - 1];
  return { ...end, dx: 0, dy: -1 };
}
const guestPaths = tables.map((t) => route(door, { x: t.x - 1, y: t.y }));
export const guestRoute = (seat: number) => guestPaths[seat];
