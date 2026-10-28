import { Sprite } from "./art";

// Deform the upper silhouette around planted feet (or a seated pelvis).
// Sampling one registered pose avoids cycling through walking/eating frames.
export function drawIdle(
  ctx: CanvasRenderingContext2D,
  s: Sprite,
  height: number,
  flip: boolean,
  time: number,
  seed: number,
  seated: boolean,
) {
  const scale = height / s.referenceHeight;
  const cycle = time + seed * 1.73;
  const breath = Math.sin((cycle * Math.PI) / 2.1) * (seated ? 0.65 : 1);
  const sway = Math.sin((cycle * Math.PI) / 3.4) * (seated ? 0.6 : 1.1);
  const beat = ((cycle % 9) + 9) % 9;
  const settle =
    beat < 2 ? Math.sin(beat * Math.PI) * Math.sin((beat * Math.PI) / 2) : 0;
  const weight = (v: number) => {
    const t = Math.max(0, Math.min(1, (v - (seated ? 0.36 : 0.23)) / 0.6));
    return t * t * (3 - 2 * t);
  };
  const yAt = (row: number) => {
    const y = (row - s.anchorY) * scale;
    return (
      y - breath * weight(-y / height) - settle * 0.7 * weight(-y / height)
    );
  };
  ctx.save();
  if (flip) ctx.scale(-1, 1);
  // Contiguous mapped strips preserve the complete silhouette, including hats.
  const strip = Math.max(1, Math.round(s.referenceHeight / 40));
  for (let row = 0; row < s.h; row += strip) {
    const next = Math.min(s.h, row + strip),
      top = yAt(row),
      bottom = yAt(next);
    const influence = weight(((s.anchorY - (row + next) / 2) * scale) / height);
    ctx.drawImage(
      s.image,
      s.x,
      s.y + row,
      s.w,
      next - row,
      -s.anchorX * scale + sway * influence + settle * 0.55 * influence,
      top,
      s.w * scale,
      bottom - top,
    );
  }
  ctx.restore();
}
