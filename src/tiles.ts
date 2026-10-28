import { Art, Sprite } from "./art";
import type { Point } from "./world";

export const tileSize = { width: 60, height: 30 };
export const tileToScreen = (p: Point) => ({
  x: 400 + ((p.x - p.y) * tileSize.width) / 2,
  y: 116 + ((p.x + p.y) * tileSize.height) / 2,
});
export type TileProp = {
  x: number;
  y: number;
  atlas: "decor" | "furnishings";
  frame: number;
  width: number;
  ground: number;
  footprint: [number, number];
  solid?: boolean;
};
// Ground is the vertical position of the footprint centre within the image.
// Unlike its lowest opaque pixel, it does not move when a prop has projecting legs.
export const fixtureTiles: TileProp[] = [
  {
    x: 5,
    y: 0,
    atlas: "decor",
    frame: 0,
    width: 39,
    ground: 0.95,
    footprint: [1, 1],
    solid: true,
  },
  {
    x: 0,
    y: 0,
    atlas: "decor",
    frame: 5,
    width: 24,
    ground: 0.96,
    footprint: [0.5, 0.5],
    solid: true,
  },
  {
    x: 0,
    y: 9,
    atlas: "decor",
    frame: 5,
    width: 24,
    ground: 0.96,
    footprint: [0.5, 0.5],
    solid: true,
  },
  {
    x: 7,
    y: 12,
    atlas: "decor",
    frame: 3,
    width: 65,
    ground: 0.87,
    footprint: [1.5, 0.7],
  },
  {
    x: -1,
    y: 11,
    atlas: "furnishings",
    frame: 7,
    width: 20,
    ground: 0.98,
    footprint: [0.3, 0.3],
  },
  {
    x: 13,
    y: 3,
    atlas: "furnishings",
    frame: 7,
    width: 20,
    ground: 0.98,
    footprint: [0.3, 0.3],
  },
];
export const gardenTiles: TileProp[] = [];
for (let x = -12; x <= 24; x += 2)
  for (let y = -12; y <= 24; y += 2) {
    // Leave a terrace, entrance approach and service floor clear.
    if (x >= -2 && x <= 14 && y >= -2 && y <= 14) continue;
    if (x >= 0 && x <= 2 && y > 9) continue;
    const n = Math.abs(x * 17 + y * 31);
    const tree = n % 5 === 0;
    gardenTiles.push({
      x,
      y,
      atlas: "furnishings",
      frame: tree ? 4 : n % 3 ? 5 : 6,
      width: tree ? 110 : n % 3 ? 62 : 40,
      ground: tree ? 0.97 : 0.82,
      footprint: tree ? [2, 2] : [1.4, 1.4],
    });
  }
export const tableTile = (p: Point): TileProp => ({
  ...p,
  atlas: "furnishings",
  frame: 0,
  width: 64,
  ground: 0.82,
  footprint: [1.1, 1.1],
});
export const chairTile = (p: Point): TileProp => ({
  ...p,
  atlas: "furnishings",
  frame: 1,
  width: 27,
  ground: 0.85,
  footprint: [0.6, 0.6],
});
export const kitchenTile = (p: Point): TileProp => ({
  ...p,
  atlas: "furnishings",
  frame: p.x === 11 ? 3 : 2,
  width: p.x === 11 ? 34 : 45,
  ground: p.x === 11 ? 0.92 : 0.78,
  footprint: [1, 1],
});
export function drawTileProp(
  ctx: CanvasRenderingContext2D,
  art: Art,
  prop: TileProp,
) {
  const sprite: Sprite = art[prop.atlas][prop.frame],
    p = tileToScreen(prop);
  const scale = prop.width / (sprite.w - 4);
  const matrix = ctx.getTransform();
  const left = p.x - sprite.anchorX * scale;
  const top = p.y - sprite.h * prop.ground * scale;
  if (
    (left + sprite.w * scale) * matrix.a + matrix.e < 0 ||
    left * matrix.a + matrix.e > ctx.canvas.width ||
    (top + sprite.h * scale) * matrix.d + matrix.f < 0 ||
    top * matrix.d + matrix.f > ctx.canvas.height
  )
    return;
  // Every floor prop receives a contact shadow at its actual tile footprint.
  ctx.fillStyle = "#29352724";
  ctx.beginPath();
  ctx.ellipse(
    p.x,
    p.y,
    prop.footprint[0] * 16,
    prop.footprint[1] * 7,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.drawImage(
    sprite.image,
    sprite.x,
    sprite.y,
    sprite.w,
    sprite.h,
    p.x - sprite.anchorX * scale,
    p.y - sprite.h * prop.ground * scale,
    sprite.w * scale,
    sprite.h * scale,
  );
}
export function groundKind(x: number, y: number) {
  if (x >= 0 && x < 12 && y >= 0 && y < 10) return "room";
  if (x >= -2 && x < 14 && y >= -2 && y < 13) return "stone";
  if ((x >= 0 && x <= 2 && y >= 10) || (y >= 14 && y <= 16)) return "path";
  return "grass";
}
