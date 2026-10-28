export type Point = { x: number; y: number };
export const tileSize = { width: 60, height: 30 };
export const origin = { x: 400, y: 116 };
export function project(p: Point, elevation = 0): Point {
  return {
    x: origin.x + ((p.x - p.y) * tileSize.width) / 2,
    y: origin.y + ((p.x + p.y) * tileSize.height) / 2 - elevation,
  };
}
export function unproject(p: Point, elevation = 0): Point {
  const x = (p.x - origin.x) / (tileSize.width / 2),
    y = (p.y - origin.y + elevation) / (tileSize.height / 2);
  return { x: (x + y) / 2, y: (y - x) / 2 };
}
export function footprintCorners(p: Point, size: [number, number]): Point[] {
  return [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([x, y]) =>
    project({ x: p.x + (x * size[0]) / 2, y: p.y + (y * size[1]) / 2 }),
  );
}
