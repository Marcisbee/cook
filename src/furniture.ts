import { Point } from "./world";
type Project = (p: Point) => Point;
// All surfaces use floor coordinates and a vertical height, including chair backs.
export function furniture(
  ctx: CanvasRenderingContext2D,
  project: Project,
  p: Point,
  kind: "table" | "chair" | "counter",
) {
  const at = (x: number, y: number, z: number) => {
    const q = project({ x: p.x + x, y: p.y + y });
    return [q.x, q.y - z];
  };
  const face = (points: number[][], fill: string) => {
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = "#65482d";
    ctx.lineWidth = 0.55;
    ctx.stroke();
  };
  const slab = (
    x: number,
    y: number,
    w: number,
    d: number,
    z: number,
    h: number,
    top: string,
    left: string,
    right: string,
  ) => {
    const a = at(x - w / 2, y - d / 2, z),
      b = at(x + w / 2, y - d / 2, z),
      c = at(x + w / 2, y + d / 2, z),
      e = at(x - w / 2, y + d / 2, z);
    face([e, c, [c[0], c[1] + h], [e[0], e[1] + h]], left);
    face([b, c, [c[0], c[1] + h], [b[0], b[1] + h]], right);
    face([a, b, c, e], top);
  };
  const leg = (x: number, y: number, h: number) =>
    slab(x, y, 0.09, 0.09, h, h, "#b18b59", "#674631", "#90613e");
  if (kind === "counter") {
    slab(0, 0, 0.92, 0.92, 27, 27, "#b4824d", "#986138", "#b47e45");
    // Recessed oak panels follow both visible cabinet planes.
    for (const side of [0, 1])
      for (let i = 0; i < 3; i++) {
        const t = -0.36 + i * 0.25;
        face(
          side === 0
            ? [
                at(t, 0.465, 23),
                at(t + 0.2, 0.465, 23),
                at(t + 0.2, 0.465, 4),
                at(t, 0.465, 4),
              ]
            : [
                at(0.465, t, 23),
                at(0.465, t + 0.2, 23),
                at(0.465, t + 0.2, 4),
                at(0.465, t, 4),
              ],
          side === 0 ? "#a76c3e" : "#946740",
        );
      }
    slab(0, 0, 1, 1, 30, 3, "#f0e5cb", "#c8bba1", "#dbceb4");
    for (let i = 0; i < 9; i++) {
      const t = -0.39 + i * 0.095;
      face(
        [
          at(t, 0.466, 22),
          at(t + 0.008, 0.466, 22),
          at(t + 0.008, 0.466, 5),
          at(t, 0.466, 5),
        ],
        i % 2 ? "#b17b47" : "#a36d3f",
      );
    }
    return;
  }
  if (kind === "chair") {
    for (const x of [-0.22, 0.22]) for (const y of [-0.24, 0.24]) leg(x, y, 13);
    slab(0, 0, 0.6, 0.64, 15, 3, "#997147", "#674631", "#795033");
    slab(0.015, 0, 0.49, 0.53, 17, 2, "#4d6b5c", "#293f37", "#3d5547");
    // Back is on -X. The open side faces +X, toward the diner's table.
    for (const y of [-0.27, 0.27])
      slab(-0.27, y, 0.07, 0.07, 34, 21, "#e0b879", "#99683e", "#b7834c");
    for (const y of [-0.17, 0, 0.17])
      slab(-0.27, y, 0.045, 0.08, 31, 13, "#d6ac70", "#a77343", "#bf9054");
    slab(-0.27, 0, 0.09, 0.67, 35, 3, "#a68350", "#9c693e", "#bd8a50");
    return;
  }
  for (const x of [-0.43, 0.43]) for (const y of [-0.43, 0.43]) leg(x, y, 24);
  slab(0, 0, 1.08, 1.08, 25, 4, "#b5834d", "#946035", "#aa7440");
  slab(0, 0, 1.18, 1.18, 28, 3, "#a77d4f", "#755035", "#946740");
  for (const x of [-0.38, -0.14, 0.12, 0.37])
    face(
      [
        at(x, -0.56, 28.02),
        at(x + 0.012, -0.56, 28.02),
        at(x + 0.012, 0.56, 28.02),
        at(x, 0.56, 28.02),
      ],
      "#8f6844",
    );
  // Fine grain and brass corner pins, all lying on the tabletop plane.
  for (let i = 0; i < 22; i++) {
    const x = -0.51 + (i % 6) * 0.17,
      y = -0.48 + Math.floor(i / 6) * 0.26;
    face(
      [
        at(x, y, 28.03),
        at(x + 0.006, y, 28.03),
        at(x + 0.006, y + 0.13, 28.03),
        at(x, y + 0.13, 28.03),
      ],
      i % 2 ? "#b18a5e" : "#8c6542",
    );
  }
  for (const x of [-0.5, 0.5])
    for (const y of [-0.5, 0.5]) {
      const p = at(x, y, 28.1);
      ctx.fillStyle = "#d3b177";
      ctx.fillRect(p[0], p[1], 0.8, 0.8);
    }
  // Linen stays on the tabletop plane; the meal has clear space in front.
  face(
    [
      at(-0.57, -0.22, 28.1),
      at(0.57, -0.22, 28.1),
      at(0.57, 0.22, 28.1),
      at(-0.57, 0.22, 28.1),
    ],
    "#d4c4a3",
  );
  face(
    [
      at(0.59, -0.22, 28),
      at(0.59, 0.22, 28),
      at(0.59, 0.22, 22),
      at(0.59, -0.22, 22),
    ],
    "#b9a789",
  );
  const vase = at(0.28, -0.3, 28);
  ctx.fillStyle = "#a96540";
  ctx.beginPath();
  ctx.ellipse(vase[0], vase[1] - 3, 3, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#587b49";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(vase[0], vase[1] - 6);
  ctx.lineTo(vase[0] + 1, vase[1] - 12);
  ctx.stroke();
  ctx.fillStyle = "#537b45";
  ctx.beginPath();
  ctx.ellipse(vase[0] + 3, vase[1] - 9, 3, 1.3, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#b65b48";
  ctx.beginPath();
  ctx.arc(vase[0] + 1, vase[1] - 12, 2.5, 0, Math.PI * 2);
  ctx.fill();
}
