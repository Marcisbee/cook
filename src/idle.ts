import { Sprite, drawSprite } from "./art";

// Idle gestures are drawn poses. Their scale and anatomy remain unchanged.
export function drawIdle(
  ctx: CanvasRenderingContext2D,
  frames: Sprite[],
  height: number,
  flip: boolean,
  time: number,
  seed: number,
  seated: boolean,
  reduced: boolean,
) {
  const phase = (((time + seed * 0.71) % 4) + 4) % 4;
  const index = reduced
    ? 0
    : phase < 1
      ? 0
      : phase < 1.25
        ? 1
        : phase < 1.95
          ? 2
          : phase < 2.2
            ? 3
            : phase < 2.5
              ? 2
              : phase < 2.75
                ? 1
                : 0;
  const seam = -height * (seated ? 0.35 : 0.25);
  // Keep the registered resting legs while the authored upper-body gesture plays.
  // Both passes use the same uniform scale; there is no warping or interpolation.
  ctx.save();
  ctx.beginPath();
  ctx.rect(-height, seam, height * 2, height);
  ctx.clip();
  drawSprite(ctx, frames[0], 0, 0, height, flip);
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.rect(-height, -height * 1.2, height * 2, height * 1.2 + seam);
  ctx.clip();
  drawSprite(ctx, frames[index], 0, 0, height, flip);
  ctx.restore();
}
