import { Point } from "./world";
import { Art } from "./art";
import { material } from "./materials";

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
  // Board edges are geometry, not perspective baked into a texture. A single
  // world-space seam continues across tile boundaries and clips at the border.
  floor(-0.5, -0.5, 7, 10, "#68472f");
  const boards = ["#b9884d", "#c79858", "#ad7b43", "#c39352", "#d1a261"];
  for (let row = 0; row < 25; row++) {
    const y = -0.5 + row * 0.4;
    for (let col = -1; col < 4; col++) {
      const start = -0.5 + col * 2.5 + (row % 3) * 0.8;
      const x = Math.max(-0.5, start),
        end = Math.min(6.5, start + 2.5);
      if (end <= x) continue;
      const width = end - x;
      floor(
        x + 0.018,
        y + 0.018,
        width - 0.036,
        0.364,
        boards[(row * 3 + col + 6) % 5],
      );
      floor(x + 0.025, y + 0.025, width - 0.05, 0.018, "#dfb576");
      for (let grain = 0; grain < 3; grain++) {
        const gx = x + 0.1 + (grain * width) / 3;
        if (gx + 0.3 < end)
          floor(
            gx,
            y + 0.12 + grain * 0.06,
            Math.min(0.45, end - gx - 0.03),
            0.012,
            "#9a6d3c",
          );
      }
    }
  }
  // Actual one-tile checker squares, sharing the board boundary at x=6.5.
  for (let x = 7; x < 12; x++)
    for (let y = 0; y < 10; y++) {
      floor(x - 0.5, y - 0.5, 1, 1, "#91866c");
      floor(
        x - 0.485,
        y - 0.485,
        0.97,
        0.97,
        (x + y) % 2 ? "#738c83" : "#e4d6ae",
      );
    }
  floor(6.44, -0.5, 0.12, 10, "#543c2c");
  floor(6.46, -0.5, 0.045, 10, "#ceab67");
  // Perimeter inlay and contact shade connect the floor to the wall footing.
  floor(-0.5, -0.5, 0.22, 10, "#594334");
  floor(-0.5, -0.5, 12, 0.22, "#594334");
  floor(-0.26, -0.26, 0.035, 9.7, "#d1ad71");
  floor(-0.26, -0.26, 11.7, 0.035, "#d1ad71");
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
        ? raised(t, outer ? -1.05 : -0.5, z)
        : raised(outer ? -1.05 : -0.5, t, z);
    face(
      [
        point(-0.5, false, 0),
        point(length, false, 0),
        point(length, false, 90),
        point(-0.5, false, 90),
      ],
      side ? "#b2b398" : "#d5cfaa",
    );
    face(
      [
        point(-1.05, true, 90),
        point(length, true, 90),
        point(length, false, 90),
        point(-1.05, false, 90),
      ],
      "#765234",
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
  // Extruded wall fixtures. The front plane is displaced into the room;
  // exposed top/return faces and a cast shadow give every fitting thickness.
  const solid = (
    side: number,
    t: number,
    w: number,
    z: number,
    h: number,
    depth: number,
    front: string,
    top = "#be965b",
    edge = "#503929",
  ) => {
    const at = (u: number, height: number, d: number) => {
      const p = project(side ? { x: u, y: -0.5 + d } : { x: -0.5 + d, y: u });
      return { x: p.x, y: p.y - height };
    };
    face(
      [
        at(t, z, depth),
        at(t + w, z, depth),
        at(t + w, z + h, depth),
        at(t, z + h, depth),
      ],
      front,
    );
    face(
      [
        at(t, z + h, 0),
        at(t + w, z + h, 0),
        at(t + w, z + h, depth),
        at(t, z + h, depth),
      ],
      top,
    );
    const end = side ? t + w : t;
    face(
      [
        at(end, z, 0),
        at(end, z, depth),
        at(end, z + h, depth),
        at(end, z + h, 0),
      ],
      edge,
    );
  };
  for (const side of [0, 1]) {
    const length = side ? 12 : 10;
    for (let t = -0.5; t < length - 0.5; t += 2) {
      const a = wall(side, t, 83),
        b = wall(side, t + 2, 83);
      material(ctx, art, 4, a, { x: b.x - a.x, y: b.y - a.y }, { x: 0, y: 56 });
    }
    // The northeast wall receives less light than the southwest wall.
    if (side) panel(side, -0.5, length, 27, 56, "#292c3d30");
    panel(side, -0.5, length, 0, 28, "#59402c");
    for (let t = -0.4; t < length - 0.5; t += 0.8) {
      panel(side, t, 0.67, 5, 17, "#382e27");
      panel(side, t + 0.045, 0.58, 6, 15, side ? "#785333" : "#936b3c");
      panel(side, t + 0.045, 0.58, 21, 0.7, "#c09a5a");
      panel(side, t + 0.045, 0.025, 6, 15, "#bc9258");
    }
    solid(side, -0.5, length, 0, 4, 0.11, "#513b2c", "#a47b47");
    solid(side, -0.5, length, 26, 3, 0.16, "#785330", "#d0a766");
    solid(side, -0.5, length, 83, 7, 0.22, "#533929", "#bb9256");
    panel(side, -0.5, length, 80, 3, "#372c293a");
    // Fine moulding lines and broken woodgrain retain the pixel-art material
    // scale on large beams instead of leaving untextured vector slabs.
    panel(side, -0.5, length, 85, 0.65, "#c49a59");
    panel(side, -0.5, length, 88.2, 0.55, "#392b23");
    panel(side, -0.5, length, 27, 0.5, "#dfb776");
    for (let t = -0.4; t < length - 0.7; t += 0.36) {
      panel(
        side,
        t,
        0.18,
        86.4 + (Math.floor(t * 10) % 2) * 0.4,
        0.35,
        "#815a34",
      );
      panel(side, t, 0.23, 3, 0.35, "#aa8049");
    }
    // Regular timber bays support the wall instead of unrelated vertical props.
    for (const t of side ? [-0.5, 3, 6.1, 9, 11.3] : [-0.5, 2.7, 5.9, 9.3]) {
      panel(side, t + 0.08, 0.25, 0, 83, "#382b263f");
      solid(side, t, 0.2, 0, 84, 0.17, "#67482d", "#bd9355", "#423026");
      solid(side, t - 0.05, 0.3, 77, 5, 0.24, "#896036", "#c19b61");
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
    depth = 0.12,
  ) => {
    if (!art) return;
    const sprite = art.wallDecor[index];
    panel(side, t + 0.08, width + 0.08, z - 3, height + 2, "#31292355");
    solid(side, t, width, z, height, depth, "#392d28", "#bc965b", "#513b2c");
    const offset = project(side ? { x: 0, y: depth } : { x: depth, y: 0 });
    const origin = project({ x: 0, y: 0 });
    const shift = (p: Point) => ({
      x: p.x + offset.x - origin.x,
      y: p.y + offset.y - origin.y,
    });
    const a = shift(wall(side, t, z + height)),
      b = shift(wall(side, t + width, z + height));
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
  // Dining wall: recessed windows alternate with a grounded crockery cabinet.
  decor(0, 0.1, 2.1, 32, 46, 1, 0.05);
  decor(0, 3.3, 2.05, 3, 75, 0, 0.28);
  decor(0, 6.55, 2.05, 32, 46, 1, 0.05);
  // Back wall: one pantry bay, then purposeful storage above the cook line.
  decor(1, 0.15, 2.35, 3, 76, 0, 0.28);
  decor(1, 3.5, 1.8, 42, 34, 1, 0.05);
  decor(1, 6.55, 1.95, 44, 29, 2, 0.14);
  decor(1, 9.45, 1.5, 44, 29, 2, 0.14);
  for (const side of [0, 1])
    for (const t of side ? [3.03, 6.13, 9.03] : [2.73, 5.93]) {
      decor(side, t, 0.26, 46, 20, 3, 0.3);
    }
}
