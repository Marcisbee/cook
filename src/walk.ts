import { Sprite, drawSprite } from "./art";
// A full stride has two alternating contacts, not repeated leading-leg images.
// Its phase is travelled distance, so faster staff take faster steps.
export function drawWalk(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  x: number,
  y: number,
  height: number,
  flip: boolean,
  dx: number,
  dy: number,
  distance: number,
  pants: string,
  skirt: boolean,
) {
  const phase = (distance / 1.6) * Math.PI * 2;
  const length = Math.hypot(dx, dy) || 1,
    ux = dx / length,
    uy = dy / length;
  const forward = { x: (ux - uy) * 30, y: (ux + uy) * 15 };
  const across = { x: (-uy - ux) * 30, y: (-uy + ux) * 15 };
  const bob = -Math.abs(Math.sin(phase)) * 1.1;
  const hips = { x, y: y - height * 0.23 + bob };
  const legs = [0, 1]
    .map((i) => {
      const cycle = (((phase / (Math.PI * 2) + i * 0.5) % 1) + 1) % 1;
      // Ground contact moves backwards relative to the travelling pelvis.
      const stride =
        cycle < 0.5 ? 0.4 - cycle * 1.6 : -0.4 + (cycle - 0.5) * 1.6;
      const lift = cycle < 0.5 ? 0 : Math.sin((cycle - 0.5) * Math.PI * 2) * 6;
      const side = i === 0 ? -1 : 1;
      return {
        hip: {
          x: hips.x + across.x * 0.065 * side,
          y: hips.y + across.y * 0.065 * side,
        },
        foot: {
          x: x + forward.x * stride + across.x * 0.09 * side,
          y: y + forward.y * stride + across.y * 0.09 * side - lift,
        },
      };
    })
    .sort((a, b) => a.foot.y - b.foot.y);
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const { hip, foot } of legs) {
    const reach = Math.hypot(foot.x - hip.x, foot.y - 2 - hip.y);
    const bend = Math.sqrt(
      Math.max(0, (height * 0.15) ** 2 - (reach / 2) ** 2),
    );
    const facing = forward.x < 0 ? -1 : 1;
    const knee = {
      x: (hip.x + foot.x) / 2 + facing * bend,
      y: (hip.y + foot.y - 2) / 2 - bend * 0.15,
    };
    for (const [color, width] of [
      ["#3d302c", 7],
      [pants, 5],
    ] as const) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(hip.x, hip.y);
      ctx.lineTo(knee.x, knee.y);
      ctx.lineTo(foot.x, foot.y - 2);
      ctx.stroke();
    }
    ctx.strokeStyle = "#ffffff20";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(hip.x - 1, hip.y);
    ctx.lineTo(knee.x - 1, knee.y);
    ctx.lineTo(foot.x - 1, foot.y - 3);
    ctx.stroke();
    ctx.fillStyle = "#49362b";
    ctx.beginPath();
    ctx.ellipse(
      foot.x + forward.x * 0.035,
      foot.y - 1,
      4.5,
      2.5,
      Math.atan2(forward.y, forward.x),
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.strokeStyle = "#805a3c";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(foot.x - 2, foot.y);
    ctx.lineTo(foot.x + 3, foot.y);
    ctx.stroke();
  }
  // Keep the head, torso, apron and arms registered to one pose. Only the
  // articulated legs cross, eliminating atlas-to-atlas body size jitter.
  ctx.beginPath();
  ctx.rect(
    x - height,
    y - height - 4,
    height * 2,
    height * (skirt ? 0.83 : 0.76) + bob + 4,
  );
  ctx.clip();
  drawSprite(ctx, sprite, x, y + bob, height, flip);
  ctx.restore();
}
