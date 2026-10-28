import { Point } from "./world";
import { Art, drawSprite } from "./art";

// Detail stays in floor/wall coordinates, so borders, boards and fixtures retain
// the same perspective as furniture and navigation at every camera zoom.
export function interior(
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
  // Narrow staggered oak planks, with grain following the boards rather than
  // screen-horizontal marks. The kitchen has glazed green/ivory tile borders.
  for (let x = 0; x < 7; x++)
    for (let y = 0; y < 10; y++) {
      for (let n = 0; n < 4; n++) {
        const a = x - 0.5 + n * 0.25,
          b = y - 0.5;
        const palette = ["#a4774d", "#af8054", "#9b704b", "#b0865a"];
        floor(a, b, 0.246, 0.99, palette[(x * 3 + y + n) % 4]);
        for (let k = 0; k < 3; k++)
          floor(
            a + 0.035 + k * 0.055,
            b + 0.1 + ((x + y + n + k) % 4) * 0.12,
            0.009,
            0.27,
            k % 2 ? "#b68b60" : "#916746",
          );
        floor(a + 0.015, b + 0.03, 0.012, 0.02, "#6b4e38");
        floor(a + 0.015, b + 0.93, 0.012, 0.02, "#6b4e38");
      }
    }
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
    panel(side, -0.5, length, 0, 27, side ? "#35554c" : "#406357");
    panel(side, -0.5, length, 25, 2, "#a59060");
    panel(side, -0.5, length, 29, 1, "#e0c99d");
    panel(side, -0.5, length, 0, 4, "#293e37");
    panel(side, -0.5, length, 86, 4, "#8a6b48");
    panel(side, -0.5, length, 84, 2, "#e2cda9");
    for (let t = -0.38; t < length - 0.5; t += 0.8) {
      panel(side, t, 0.65, 6, 15, "#29473f");
      panel(side, t + 0.04, 0.57, 7, 13, side ? "#426658" : "#4e7260");
      panel(side, t, 0.65, 21, 0.6, "#a28c57");
      panel(side, t + 0.02, 0.025, 7, 13, "#6f8364");
    }
    // Fine plaster variation and dado trim.
    for (let i = 0; i < 120; i++) {
      const t = -0.45 + (((i * 37) % 100) / 100) * (length - 0.1),
        z = 33 + ((i * 17) % 48);
      panel(side, t, 0.025, z, 0.65, i % 2 ? "#d3bf9e" : "#e2ceb0");
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
  if (art) {
    const menu = wall(1, 3.3, 32);
    drawSprite(ctx, art.decor[6], menu.x, menu.y, 37);
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
    ctx.fillStyle = "#6c5037";
    ctx.fillRect(p.x - 1, p.y, 2, 11);
    ctx.fillStyle = "#c19d5e";
    ctx.fillRect(p.x - 4, p.y - 1, 8, 3);
    ctx.fillStyle = "#efdcb0";
    ctx.fillRect(p.x - 3, p.y - 10, 6, 9);
    ctx.fillStyle = "#fff0ca";
    ctx.fillRect(p.x - 1, p.y - 8, 2, 6);
    const light = ctx.createRadialGradient(p.x, p.y - 5, 1, p.x, p.y - 5, 21);
    light.addColorStop(0, "#f8d28a26");
    light.addColorStop(1, "#f8d28a00");
    ctx.fillStyle = light;
    ctx.fillRect(p.x - 22, p.y - 27, 44, 44);
  }
}
