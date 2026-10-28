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
  floor(-0.29, 7.36, 1.08, 1.98, "#3d5d52");
  for (let y = 7.43; y < 9.3; y += 0.23) {
    floor(-0.23, y, 0.09, 0.09, "#b7a478");
    floor(0.62, y, 0.09, 0.09, "#b7a478");
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
      "#9b7851",
    );
    face(
      [
        point(length, false, 0),
        point(length, true, 0),
        point(length, true, 90),
        point(length, false, 90),
      ],
      side ? "#896b49" : "#70583d",
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
    panel(side, -0.5, length, 86, 4, "#725437");
    panel(side, -0.5, length, 84, 2, "#b49b70");
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
  // Windows are built on the wall plane, with identical scale and depth.
  // A front-facing image pasted onto a sloping wall cannot align its frame.
  for (const t of [0.7, 3.7, 6.7]) {
    panel(0, t, 1.85, 31, 49, "#755b3d");
    panel(0, t + 0.08, 1.69, 32, 47, "#bfa77d");
    panel(0, t + 0.17, 1.51, 34, 43, "#567b79");
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 6; row++) {
        panel(
          0,
          t + 0.22 + col * 0.36,
          0.31,
          35 + row * 6.8,
          6.1,
          ["#8caba0", "#a7bab0", "#738f8d", "#bac4ad"][(row + col * 3) % 4],
        );
      }
    }
    panel(0, t + 0.87, 0.09, 33, 45, "#d8c6a3");
    panel(0, t - 0.08, 2.01, 30, 2.2, "#e0cba0");
    panel(0, t - 0.06, 1.97, 80, 2, "#e0cba0");
  }
  // Chalkboard and its frame are drawn on the wall rather than importing an
  // already-isometric sprite with a different vanishing direction.
  panel(1, 2.5, 1.25, 36, 28, "#6f5035");
  panel(1, 2.57, 1.11, 38, 24, "#293f36");
  panel(1, 2.58, 1.09, 61, 1, "#b09465");
  for (let i = 0; i < 5; i++) {
    panel(1, 2.7, 0.7 - (i % 3) * 0.12, 56 - i * 3.5, 0.55, "#c2c8aa");
    panel(1, 3.4, 0.12, 56 - i * 3.5, 0.55, "#c2c8aa");
  }
  // Shelves, crockery, framed menu and brass lamps on the kitchen wall.
  for (const t of [6.9, 9.1]) {
    panel(1, t, 1.7, 42, 35, "#81613f");
    panel(1, t + 0.07, 1.56, 44, 31, "#533f30");
    for (const z of [45, 59, 74]) panel(1, t, 1.7, z, 1.8, "#c09a64");
    for (let j = 0; j < 5; j++)
      for (const z of [47, 61]) {
        panel(
          1,
          t + 0.13 + j * 0.29,
          0.18,
          z,
          5 + (j % 2) * 2,
          ["#c4c9ad", "#7e9b8e", "#bb8b65"][j % 3],
        );
        panel(1, t + 0.16 + j * 0.29, 0.035, z + 1, 4, "#e4dabd");
      }
  }
  for (const t of [1, 5.7, 11]) {
    const p = wall(1, t, 58);
    panel(1, t - 0.035, 0.07, 47, 11, "#6c5037");
    panel(1, t - 0.14, 0.28, 57, 2, "#aa8d54");
    panel(1, t - 0.1, 0.2, 59, 9, "#e6d6ab");
    panel(1, t - 0.015, 0.035, 60, 7, "#fff0ca");
    const light = ctx.createRadialGradient(p.x, p.y - 5, 1, p.x, p.y - 5, 21);
    light.addColorStop(0, "#f8d28a26");
    light.addColorStop(1, "#f8d28a00");
    ctx.fillStyle = light;
    ctx.fillRect(p.x - 22, p.y - 27, 44, 44);
  }
}
