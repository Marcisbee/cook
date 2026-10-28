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
const dinerActionBounds: Bounds[] = [
  [89, 14, 218, 234],
  [295, 14, 415, 227],
  [497, 14, 619, 234],
  [702, 13, 821, 227],
  [90, 242, 216, 478],
  [298, 242, 419, 477],
  [496, 242, 619, 477],
  [704, 242, 823, 478],
  [85, 485, 214, 709],
  [293, 486, 414, 706],
  [494, 485, 619, 710],
  [699, 486, 820, 707],
  [82, 718, 214, 926],
  [287, 718, 416, 926],
  [489, 718, 620, 926],
  [696, 718, 827, 929],
  [62, 943, 216, 1149],
  [284, 943, 411, 1148],
  [496, 944, 621, 1149],
  [705, 943, 856, 1148],
  [55, 1148, 212, 1364],
  [278, 1148, 411, 1364],
  [489, 1150, 622, 1364],
  [705, 1150, 861, 1363],
  [57, 1366, 213, 1572],
  [281, 1368, 410, 1572],
  [491, 1368, 622, 1572],
  [706, 1368, 861, 1572],
  [58, 1576, 220, 1764],
  [282, 1577, 421, 1765],
  [493, 1576, 632, 1765],
  [710, 1576, 870, 1765],
];
const actionBounds: Bounds[] = [
  [119, 10, 310, 309],
  [431, 10, 617, 306],
  [725, 10, 902, 309],
  [1024, 10, 1222, 310],
  [116, 321, 272, 617],
  [421, 319, 580, 616],
  [720, 319, 874, 616],
  [1030, 320, 1177, 615],
  [51, 622, 304, 894],
  [382, 628, 598, 898],
  [704, 629, 922, 896],
  [1022, 627, 1214, 894],
  [109, 906, 257, 1206],
  [411, 911, 562, 1209],
  [724, 910, 872, 1207],
  [1034, 910, 1180, 1209],
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
  loadSheet("/art/actions.png", actionBounds, true),
  loadSheet("/art/diner-actions.png", dinerActionBounds, true),
]).then(([characters, props, diners, actions, dinerActions]) => ({
  characters,
  props,
  diners,
  actions,
  dinerActions,
}));
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
