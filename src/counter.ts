import type { Point } from "./world";

const pieces = new Map<boolean, HTMLCanvasElement>();
// One module per occupied tile, with an end panel only at the end of a run.
// The worktop meets adjacent modules without a repeated outline or stone joint.
export function drawCounter(
  ctx: CanvasRenderingContext2D,
  p: Point,
  end: boolean,
) {
  let image = pieces.get(end);
  if (!image) {
    image = document.createElement("canvas");
    image.width = 128;
    image.height = 128;
    const c = image.getContext("2d")!;
    c.scale(2, 2);
    const at = (x: number, y: number, z: number) => ({
      x: 32 + (x - y) * 30,
      y: 47 + (x + y) * 15 - z,
    });
    const face = (points: Point[], color: string) => {
      c.fillStyle = color;
      c.beginPath();
      points.forEach((q, i) => (i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y)));
      c.closePath();
      c.fill();
    };
    const panel = (
      side: boolean,
      t: number,
      width: number,
      z: number,
      height: number,
      color: string,
    ) => {
      const q = (u: number, h: number) =>
        side ? at(0.47, u, h) : at(u, 0.5, h);
      face(
        [q(t, z), q(t + width, z), q(t + width, z + height), q(t, z + height)],
        color,
      );
    };
    // Recessed toe kick grounds the cabinet; darker end grain gives depth.
    panel(true, -0.5, 1, 0, 27, "#674c36");
    panel(true, -0.5, 1, 1, 3, "#493e30");
    if (end) {
      panel(false, -0.47, 0.94, 0, 27, "#78573b");
      panel(false, -0.36, 0.72, 5, 18, "#916b48");
      panel(false, -0.32, 0.64, 6, 16, "#826041");
    }
    // One useful drawer above a framed door, rather than repeated wall panels.
    panel(true, -0.45, 0.9, 5, 15, "#a27b50");
    panel(true, -0.38, 0.76, 6, 13, "#594630");
    panel(true, -0.35, 0.7, 7, 11, "#87683f");
    panel(true, -0.34, 0.035, 7, 11, "#b29460");
    panel(true, -0.44, 0.88, 21, 5, "#ab8556");
    panel(true, -0.4, 0.8, 21, 1, "#705235");
    for (let i = 0; i < 9; i++) {
      const t = -0.3 + i * 0.075;
      panel(
        true,
        t,
        0.012,
        8 + (i % 3),
        5 + (i % 4),
        i % 2 ? "#96754b" : "#785c3c",
      );
    }
    // Brass pulls have a dark mounting shadow and a small highlight.
    panel(true, -0.13, 0.26, 22, 1.4, "#51412b");
    panel(true, -0.11, 0.22, 23, 1, "#d3b574");
    panel(true, 0.23, 0.065, 14, 2, "#4c3d2a");
    panel(true, 0.22, 0.06, 15, 1.5, "#d3b574");
    // Thin continuous ivory worktop, a shaded lip and sparse stone flecks.
    panel(true, -0.5, 1, 27, 3, "#b5a98c");
    if (end) panel(false, -0.5, 1, 27, 3, "#d0c3a3");
    face(
      [
        at(-0.5, -0.5, 30),
        at(0.5, -0.5, 30),
        at(0.5, 0.5, 30),
        at(-0.5, 0.5, 30),
      ],
      "#e4dbc1",
    );
    face(
      [
        at(0.47, -0.5, 30),
        at(0.5, -0.5, 30),
        at(0.5, 0.5, 30),
        at(0.47, 0.5, 30),
      ],
      "#f5ecd5",
    );
    for (let i = 0; i < 18; i++) {
      const x = -0.42 + ((i * 17) % 81) / 100,
        y = -0.43 + ((i * 29) % 83) / 100;
      const q = at(x, y, 30);
      c.fillStyle = i % 3 ? "#d9cfb6" : "#eee5ce";
      c.fillRect(
        Math.round(q.x * 2) / 2,
        Math.round(q.y * 2) / 2,
        i % 3 === 0 ? 1 : 0.5,
        0.5,
      );
    }
    pieces.set(end, image);
  }
  ctx.drawImage(image, p.x - 32, p.y - 47, 64, 64);
}
