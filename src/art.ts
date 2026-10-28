// Explicit source rectangles follow complete silhouettes, not nominal grid cells.
// Several supplied figures cross their grid boundaries (notably waiter heads).
type Bounds = [number, number, number, number];
const characterBounds: Bounds[] = [
  [126, 19, 265, 305],
  [419, 24, 553, 305],
  [723, 22, 858, 305],
  [1032, 21, 1166, 305],
  [115, 321, 254, 605],
  [425, 321, 557, 604],
  [720, 321, 859, 606],
  [1034, 321, 1166, 604],
  [115, 620, 269, 894],
  [426, 620, 568, 892],
  [723, 621, 870, 896],
  [1037, 620, 1179, 899],
  [121, 910, 303, 1207],
  [420, 911, 604, 1208],
  [723, 911, 908, 1206],
  [1038, 910, 1218, 1209],
];
const dinerBounds: Bounds[] = [
  [106, 30, 267, 292],
  [410, 30, 550, 290],
  [707, 30, 861, 294],
  [1020, 30, 1154, 289],
  [118, 316, 268, 612],
  [421, 314, 560, 608],
  [726, 316, 870, 613],
  [1029, 316, 1167, 608],
  [106, 626, 265, 904],
  [409, 626, 546, 899],
  [707, 629, 862, 904],
  [1024, 626, 1152, 899],
  [82, 921, 281, 1202],
  [397, 920, 566, 1198],
  [697, 921, 885, 1202],
  [1013, 920, 1180, 1198],
];
const propBounds: Bounds[] = [
  [27, 39, 373, 372],
  [432, 29, 654, 361],
  [767, 39, 1041, 373],
  [1117, 43, 1413, 373],
  [51, 385, 348, 719],
  [451, 374, 643, 727],
  [733, 400, 1082, 732],
  [1133, 395, 1417, 711],
  [28, 718, 368, 1057],
  [411, 733, 730, 1039],
  [770, 789, 1050, 1026],
  [1106, 773, 1422, 1035],
];
export type Sprite = {
  image: HTMLImageElement;
  x: number;
  y: number;
  w: number;
  h: number;
  anchorX: number;
  anchorY: number;
  referenceHeight: number;
};
function loadSheet(
  url: string,
  bounds: Bounds[],
  animated = false,
): Promise<Sprite[]> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(image, 0, 0);
      const data = ctx.getImageData(0, 0, image.width, image.height).data;
      resolve(
        bounds.map(([left, top, right, bottom], index) => {
          const x = Math.max(0, left - 2),
            y = Math.max(0, top - 2),
            w = Math.min(image.width - 1, right + 2) - x + 1,
            h = Math.min(image.height - 1, bottom + 2) - y + 1;
          let anchorX = (left + right) / 2 - x;
          if (animated) {
            let total = 0,
              weight = 0;
            for (
              let yy = Math.round(top + (bottom - top) * 0.6);
              yy < top + (bottom - top) * 0.78;
              yy++
            )
              for (let xx = left; xx <= right; xx++) {
                const alpha = data[(yy * image.width + xx) * 4 + 3];
                if (alpha > 90) {
                  total += xx * alpha;
                  weight += alpha;
                }
              }
            if (weight) anchorX = total / weight - x;
          }
          const row = bounds.slice(
            Math.floor(index / 4) * 4,
            Math.floor(index / 4) * 4 + 4,
          );
          return {
            image,
            x,
            y,
            w,
            h,
            anchorX,
            anchorY: bottom - y,
            referenceHeight: animated
              ? Math.max(...row.map((b) => b[3] - b[1] + 1))
              : bottom - top + 1,
          };
        }),
      );
    };
    image.onerror = () =>
      reject(new Error("Could not load restaurant artwork"));
    image.src = url;
  });
}
export const artReady = Promise.all([
  loadSheet("/art/characters.png", characterBounds, true),
  loadSheet("/art/restaurant.png", propBounds),
  loadSheet("/art/diners.png", dinerBounds, true),
]).then(([characters, props, diners]) => ({ characters, props, diners }));
export type Art = Awaited<typeof artReady>;
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  s: Sprite,
  x: number,
  y: number,
  height: number,
  flip = false,
  width?: number,
) {
  // A single uniform scale preserves the source projection and animation anatomy.
  const scale =
    width === undefined ? height / s.referenceHeight : width / (s.w - 4);
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(
    s.image,
    s.x,
    s.y,
    s.w,
    s.h,
    -s.anchorX * scale,
    -s.anchorY * scale,
    s.w * scale,
    s.h * scale,
  );
  ctx.restore();
}
