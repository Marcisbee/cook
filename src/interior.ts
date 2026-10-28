import { Point } from "./world";
import { Art } from "./art";
import { material, groundMaterial } from "./materials";

// Detail stays in floor/wall coordinates, so borders, boards and fixtures retain
// the same perspective as furniture and navigation at every camera zoom.
export function interior(
  ctx: CanvasRenderingContext2D,
  project: (p: Point) => Point,
  art: Art | null,
) {
  // Draw architectural detail to the same fine pixel grid as material patches.
  // The outer scenery cache handles camera changes; typography stays full-res.
  const pixels = document.createElement("canvas");
  pixels.width = 1600;
  pixels.height = 1040;
  const painter = pixels.getContext("2d")!;
  painter.scale(2, 2);
  painter.imageSmoothingEnabled = false;
  paintInterior(painter, project, art);
  ctx.drawImage(pixels, 0, 0, 800, 520);
}
function paintInterior(
  ctx: CanvasRenderingContext2D,
  project: (p: Point) => Point,
  art: Art | null,
) {
  const face = (points: Point[], color: string) => {
    ctx.beginPath();
    points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };
  const floor = (
    x: number,
    y: number,
    w: number,
    d: number,
    color: string,
    z = 0,
  ) =>
    face(
      [
        { x, y },
        { x: x + w, y },
        { x: x + w, y: y + d },
        { x, y: y + d },
      ].map((p) => {
        const q = project(p);
        return { x: q.x, y: q.y - z };
      }),
      color,
    );
  for (let x = 0; x < 12; x++)
    for (let y = 0; y < 10; y++)
      groundMaterial(ctx, art, project, x, y, x < 7 ? 0 : 7, x < 7 ? 2 : 4);
  for (let y = 0; y < 10; y++) {
    floor(6.39, y - 0.5, 0.1, 1, "#d5c39b");
    floor(6.49, y - 0.5, 0.12, 1, "#365952");
    floor(6.61, y - 0.5, 0.05, 1, "#b49a62");
    floor(6.4, y - 0.43, 0.09, 0.13, "#365952");
  }
  // Patterned entrance runner, kept clear of the service lanes.
  floor(-0.35, 7.3, 1.2, 2.1, "#b9a37b");
  floor(-0.29, 7.36, 1.08, 1.98, "#7a293b");
  for (let y = 7.43; y < 9.3; y += 0.23) {
    floor(-0.23, y, 0.09, 0.09, "#b7a478");
    floor(0.62, y, 0.09, 0.09, "#b7a478");
  }
  // Burgundy service runner with woven gold borders, below all actors.
  floor(8.05, 1.6, 1.3, 6.8, "#d4af6e");
  floor(8.1, 1.65, 1.2, 6.7, "#653045");
  floor(8.16, 1.71, 1.08, 6.58, "#9a3948");
  for (let y = 1.85; y < 8.2; y += 0.25) {
    floor(8.2, y, 0.045, 0.1, "#d0a36a");
    floor(9.15, y, 0.045, 0.1, "#d0a36a");
  }
  // Wall solids use the same floor grid as their fixtures: inner face, cap,
  // and exposed end return. The two caps meet at one continuous corner.
  const raised = (x: number, y: number, z: number) => {
    const p = project({ x, y });
    return { x: p.x, y: p.y - z };
  };
  for (const side of [0, 1]) {
    const length = side ? 11.5 : 9.5;
    const point = (t: number, outer: boolean, z: number) =>
      side
        ? raised(t, outer ? -0.74 : -0.5, z)
        : raised(outer ? -0.74 : -0.5, t, z);
    face(
      [
        point(-0.5, false, 0),
        point(length, false, 0),
        point(length, false, 90),
        point(-0.5, false, 90),
      ],
      side ? "#d5c3a1" : "#c7b793",
    );
    face(
      [
        point(-0.74, true, 90),
        point(length, true, 90),
        point(length, false, 90),
        point(-0.74, false, 90),
      ],
      "#4b3329",
    );
    face(
      [
        point(length, false, 0),
        point(length, true, 0),
        point(length, true, 90),
        point(length, false, 90),
      ],
      side ? "#47352e" : "#352b2b",
    );
  }
  // Panels and mouldings on both back walls.
  const wall = (side: number, t: number, z: number) => {
    const q = project(side ? { x: t, y: -0.51 } : { x: -0.51, y: t });
    return { x: q.x, y: q.y - z };
  };
  const panel = (
    side: number,
    t: number,
    w: number,
    z: number,
    h: number,
    color: string,
  ) =>
    face(
      [
        wall(side, t, z),
        wall(side, t + w, z),
        wall(side, t + w, z + h),
        wall(side, t, z + h),
      ],
      color,
    );
  for (const side of [0, 1]) {
    const length = side ? 12 : 10;
    panel(side, -0.5, length, 0, 27, side ? "#465a48" : "#3e5141");
    panel(side, -0.5, length, 25, 2, "#8a7450");
    panel(side, -0.5, length, 29, 1, "#bda37b");
    panel(side, -0.5, length, 0, 4, "#293e37");
    panel(side, -0.5, length, 86, 4, "#483125");
    panel(side, -0.5, length, 84, 2, "#b28a4f");
    for (let t = -0.38; t < length - 0.5; t += 0.8) {
      panel(side, t, 0.65, 6, 15, "#29473f");
      panel(side, t + 0.04, 0.57, 7, 13, side ? "#426658" : "#4e7260");
      panel(side, t, 0.65, 21, 0.6, "#a28c57");
      panel(side, t + 0.02, 0.025, 7, 13, "#6f8364");
    }
    // Continuous textured wall strips, sampled in wall coordinates. Material
    // orientation follows each wall, with a shared height and corner baseline.
    for (let t = -0.5; t < length - 0.5; t += 2) {
      const a = wall(side, t, 84),
        b = wall(side, t + 2, 84);
      material(ctx, art, 4, a, { x: b.x - a.x, y: b.y - a.y }, { x: 0, y: 54 });
      const base = wall(side, t, 25),
        end = wall(side, t + 2, 25);
      material(
        ctx,
        art,
        5,
        base,
        { x: end.x - base.x, y: end.y - base.y },
        { x: 0, y: 21 },
      );
    }
  }
  // Decorations are authored as front elevations, then projected once onto
  // the wall; this avoids applying a second isometric angle to a sprite.
  const decor = (
    side: number,
    t: number,
    width: number,
    z: number,
    height: number,
    index: number,
  ) => {
    if (!art) return;
    const sprite = art.wallDecor[index];
    const a = wall(side, t, z + height),
      b = wall(side, t + width, z + height);
    ctx.save();
    ctx.transform(b.x - a.x, b.y - a.y, 0, height, a.x, a.y);
    ctx.drawImage(
      sprite.image,
      sprite.x,
      sprite.y,
      sprite.w,
      sprite.h,
      0,
      0,
      1,
      1,
    );
    ctx.restore();
  };
  for (const t of [0.5, 3.5, 6.5]) decor(0, t, 1.85, 29, 54, 1);
  decor(1, 0.8, 2.1, 7, 76, 0);
  decor(1, 3.2, 1.4, 34, 47, 1);
  decor(1, 6.6, 1.9, 40, 40, 2);
  decor(1, 9, 1.9, 40, 40, 2);
  for (const side of [0, 1]) {
    const positions = side ? [0.15, 5.8, 11.05] : [2.7, 5.7, 8.8];
    for (const t of positions) {
      decor(side, t, 0.35, 45, 24, 3);
      const p = wall(side, t + 0.17, 56);
      const glow = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, 32);
      glow.addColorStop(0, "#ffce6d32");
      glow.addColorStop(1, "#ffce6d00");
      ctx.fillStyle = glow;
      ctx.fillRect(p.x - 32, p.y - 32, 64, 64);
    }
  }
}
