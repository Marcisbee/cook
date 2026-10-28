import { Sprite, drawSprite } from "./art";

type Point = { x: number; y: number };
export type Walker = {
  shirt: string;
  trousers: string;
  skin: string;
  apron?: string;
  skirt?: boolean;
  chef?: boolean;
  tray?: boolean;
};

// A complete body rig in the same floor projection as the restaurant. The
// source head retains the character identity; all moving joints belong to one
// skeleton, rather than placing unrelated stick legs under a fixed torso.
export function drawWalk(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  height: number,
  flip: boolean,
  dx: number,
  dy: number,
  distance: number,
  look: Walker,
) {
  const h = height;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length,
    uy = dy / length;
  const forward = { x: (ux - uy) * 30, y: (ux + uy) * 15 };
  const across = { x: (-uy - ux) * 30, y: (-uy + ux) * 15 };
  const phase = (((distance / 1.6) % 1) + 1) % 1;
  const wave = Math.sin(phase * Math.PI * 2);
  const rise = Math.cos(phase * Math.PI * 4) * h * 0.009;
  const neck = h * (look.chef ? 0.52 : 0.58);
  const at = (side: number, advance: number, z: number): Point => ({
    x: across.x * side * 1.6 + forward.x * advance,
    y: across.y * side * 1.6 + forward.y * advance - z,
  });
  const shade = (color: string, amount: number) => {
    const n = parseInt(color.slice(1), 16);
    return `rgb(${[16, 8, 0].map((s) => Math.max(0, Math.min(255, ((n >> s) & 255) + amount))).join(",")})`;
  };
  const line = (a: Point, b: Point, width: number, color: string) => {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineWidth = width + 1.3;
    ctx.strokeStyle = "#3d302c";
    ctx.stroke();
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.stroke();
  };
  const polygon = (points: Point[], fill: string) => {
    ctx.beginPath();
    points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = "#3d302c";
    ctx.lineWidth = 0.8;
    ctx.stroke();
  };
  const sides = [-1, 1].sort((a, b) => across.y * (a - b));
  const legs = sides.map((side) => {
    const cycle = (phase + (side === 1 ? 0.5 : 0)) % 1;
    // During stance the foot cancels world travel exactly. During swing it
    // advances with eased lift, then returns to ground for the opposite step.
    const stance = cycle < 0.5;
    const t = stance ? cycle * 2 : (cycle - 0.5) * 2;
    const advance = stance ? 0.4 - 0.8 * t : -0.4 + 0.8 * (t * t * (3 - 2 * t));
    const lift = stance ? 0 : Math.sin(t * Math.PI) * h * 0.075;
    const hip = at(side * 0.105, 0, h * 0.26 + rise);
    const foot = at(side * 0.105, advance, lift + 1);
    const knee = {
      x:
        (hip.x + foot.x) * 0.5 +
        forward.x * (stance ? 0.025 : 0.11 * Math.sin(t * Math.PI)),
      y:
        (hip.y + foot.y) * 0.5 -
        (stance ? 0 : h * 0.035 * Math.sin(t * Math.PI)),
    };
    return { side, hip, knee, foot };
  });
  const arm = (side: number) => {
    const swing = -wave * side;
    const shoulder = at(side * 0.2, 0, neck - h * 0.035 + rise);
    const carrying = look.tray && side === 1;
    const elbow = at(
      side * 0.25,
      carrying ? 0.13 : swing * 0.11,
      h * 0.38 + rise,
    );
    const hand = at(
      side * 0.25,
      carrying ? 0.3 : swing * 0.23,
      (carrying ? h * 0.39 : h * 0.25 + Math.max(0, swing) * h * 0.025) + rise,
    );
    line(
      shoulder,
      elbow,
      h * 0.095,
      shade(look.shirt, side === sides[0] ? -18 : 0),
    );
    line(elbow, hand, h * 0.085, look.apron ? look.skin : look.shirt);
    ctx.fillStyle = shade(look.shirt, 20);
    ctx.beginPath();
    ctx.arc(elbow.x, elbow.y, h * 0.047, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = look.skin;
    ctx.strokeStyle = "#51372b";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.ellipse(hand.x, hand.y, h * 0.042, h * 0.048, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (carrying) {
      const tx = hand.x + forward.x * 0.11,
        ty = hand.y - 2;
      ctx.fillStyle = "#604736";
      ctx.strokeStyle = "#392d26";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(tx, ty, h * 0.17, h * 0.055, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#b19575";
      ctx.beginPath();
      ctx.ellipse(tx, ty - 1, h * 0.14, h * 0.036, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  };
  ctx.save();
  arm(sides[0]);
  for (const leg of legs) {
    const color = shade(look.trousers, leg.side === sides[0] ? -16 : 0);
    line(leg.hip, leg.knee, h * 0.105, color);
    line(leg.knee, leg.foot, h * 0.085, color);
    const toe = {
      x: leg.foot.x + forward.x * 0.07,
      y: leg.foot.y + forward.y * 0.07,
    };
    line(leg.foot, toe, h * 0.075, "#775039");
    ctx.strokeStyle = "#ad8257";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(leg.foot.x - 1, leg.foot.y - 1.5);
    ctx.lineTo(toe.x, toe.y - 1.5);
    ctx.stroke();
  }
  const leftShoulder = at(-0.2, 0, neck - h * 0.02 + rise),
    rightShoulder = at(0.2, 0, neck - h * 0.02 + rise);
  const leftHip = at(-0.16, 0, h * 0.24 + rise),
    rightHip = at(0.16, 0, h * 0.24 + rise);
  polygon([leftShoulder, rightShoulder, rightHip, leftHip], look.shirt);
  // A seam and a shaded side panel give the garment the same directional volume
  // as the shoulders, without skewing or stretching the source artwork.
  polygon(
    [
      at(sides[0] * 0.2, 0, neck - h * 0.02 + rise),
      at(sides[0] * 0.13, 0.025, neck - h * 0.04 + rise),
      at(sides[0] * 0.11, 0.025, h * 0.24 + rise),
      at(sides[0] * 0.16, 0, h * 0.24 + rise),
    ],
    shade(look.shirt, -24),
  );
  // Collar, front seam and hem keep the walking costume readable at game scale.
  if (dx >= 0 && dy >= 0) {
    polygon(
      [
        at(-0.08, 0.035, neck + rise),
        at(0.08, 0.035, neck + rise),
        at(0, 0.07, neck - h * 0.08 + rise),
      ],
      "#eee0c6",
    );
    if (!look.apron) {
      const seamTop = at(0, 0.05, neck - h * 0.08 + rise),
        seamEnd = at(0, 0.05, h * 0.25 + rise);
      ctx.strokeStyle = shade(look.shirt, -32);
      ctx.lineWidth = 0.65;
      ctx.beginPath();
      ctx.moveTo(seamTop.x, seamTop.y);
      ctx.lineTo(seamEnd.x, seamEnd.y);
      ctx.stroke();
      for (let i = 0; i < 3; i++) {
        const button = at(0.025, 0.055, neck - h * (0.14 + i * 0.065) + rise);
        ctx.fillStyle = "#d6b978";
        ctx.fillRect(button.x, button.y, 0.8, 0.8);
      }
    }
  }
  if (look.apron) {
    const back = dx < 0 || dy < 0;
    const hem = wave * h * 0.008;
    if (!back) {
      polygon(
        [
          at(-0.1, 0.06, neck - h * 0.07 + rise),
          at(0.1, 0.06, neck - h * 0.07 + rise),
          at(0.16, 0.07, h * 0.22 + rise + hem),
          at(-0.16, 0.07, h * 0.22 + rise - hem),
        ],
        look.apron,
      );
      line(
        at(-0.12, 0.05, neck + rise),
        at(-0.09, 0.06, neck - h * 0.12 + rise),
        h * 0.026,
        look.apron,
      );
      line(
        at(0.12, 0.05, neck + rise),
        at(0.09, 0.06, neck - h * 0.12 + rise),
        h * 0.026,
        look.apron,
      );
      const pocket = at(0, 0.075, h * 0.31 + rise);
      ctx.strokeStyle = shade(look.apron, -25);
      ctx.lineWidth = 0.7;
      ctx.strokeRect(pocket.x - h * 0.055, pocket.y, h * 0.11, h * 0.05);
    } else {
      line(leftShoulder, at(0.12, 0, h * 0.34 + rise), h * 0.027, look.apron);
      line(rightShoulder, at(-0.12, 0, h * 0.34 + rise), h * 0.027, look.apron);
      line(
        at(-0.16, 0, h * 0.34 + rise),
        at(0.16, 0, h * 0.34 + rise),
        h * 0.035,
        look.apron,
      );
    }
  }
  if (look.skirt)
    polygon(
      [
        at(-0.16, 0, h * 0.28 + rise),
        at(0.16, 0, h * 0.28 + rise),
        at(0.22, wave * 0.025, h * 0.12 + rise),
        at(-0.22, wave * 0.025, h * 0.12 + rise),
      ],
      look.trousers,
    );
  arm(sides[1]);
  // Only a rigid head translation: no whole-sprite scaling, skewing or limb cuts.
  ctx.save();
  ctx.translate(0, rise);
  ctx.beginPath();
  ctx.rect(-h, -h * 1.2, h * 2, h * 1.2 - neck + 0.9);
  ctx.clip();
  drawSprite(ctx, sprite, 0, 0, h, flip);
  ctx.restore();
  ctx.restore();
}
