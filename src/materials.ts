import type { Art } from "./art";
import type { Point } from "./world";

// Material patches are sampled on a fine, fixed screen-pixel grid before camera
// scaling. Their parallelograms use exactly the same axes as the tile map.
const patches = new Map<string, HTMLCanvasElement>();
export function material(
  ctx: CanvasRenderingContext2D,
  art: Art | null,
  index: number,
  origin: Point,
  u: Point,
  v: Point,
  crop: [number, number, number, number] = [0, 0, 1, 1],
) {
  if (!art) return;
  const key = [index, u.x, u.y, v.x, v.y, ...crop].join(":");
  const minX = Math.min(0, u.x, v.x, u.x + v.x);
  const minY = Math.min(0, u.y, v.y, u.y + v.y);
  const width = Math.ceil(Math.max(0, u.x, v.x, u.x + v.x) - minX);
  const height = Math.ceil(Math.max(0, u.y, v.y, u.y + v.y) - minY);
  let patch = patches.get(key);
  if (!patch) {
    patch = document.createElement("canvas");
    patch.width = width * 2;
    patch.height = height * 2;
    const c = patch.getContext("2d")!;
    c.imageSmoothingEnabled = false;
    c.setTransform(u.x * 2, u.y * 2, v.x * 2, v.y * 2, -minX * 2, -minY * 2);
    const image = art.environment[0].image;
    const sw = image.width / 4,
      sh = image.height / 2;
    c.drawImage(
      image,
      ((index % 4) + crop[0]) * sw,
      (Math.floor(index / 4) + crop[1]) * sh,
      crop[2] * sw,
      crop[3] * sh,
      0,
      0,
      1,
      1,
    );
    patches.set(key, patch);
  }
  ctx.drawImage(patch, origin.x + minX, origin.y + minY, width, height);
}
export function groundMaterial(
  ctx: CanvasRenderingContext2D,
  art: Art | null,
  project: (p: Point) => Point,
  x: number,
  y: number,
  index: number,
  repeat = 2,
) {
  const mod = (n: number) => ((n % repeat) + repeat) % repeat;
  material(
    ctx,
    art,
    index,
    project({ x: x - 0.5, y: y - 0.5 }),
    { x: 30, y: 15 },
    { x: -30, y: 15 },
    [mod(x) / repeat, mod(y) / repeat, 1 / repeat, 1 / repeat],
  );
}
