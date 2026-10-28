// Explicit source rectangles follow complete silhouettes, not nominal grid cells.
// Several supplied figures cross their grid boundaries (notably waiter heads).
type Bounds = [number, number, number, number];
const characterBounds: Bounds[] = [
  [245, 41, 353, 292],
  [473, 43, 568, 289],
  [695, 43, 805, 293],
  [915, 43, 1011, 289],
  [236, 333, 344, 586],
  [466, 330, 552, 582],
  [689, 330, 802, 586],
  [925, 333, 1030, 583],
  [251, 637, 362, 884],
  [467, 634, 565, 883],
  [690, 641, 803, 887],
  [915, 635, 1010, 882],
  [241, 934, 370, 1181],
  [457, 935, 590, 1179],
  [683, 935, 821, 1182],
  [914, 935, 1050, 1179],
];
const dinerBounds: Bounds[] = [
  [368, 33, 476, 243],
  [599, 33, 692, 243],
  [825, 33, 929, 243],
  [1067, 33, 1158, 243],
  [371, 275, 471, 496],
  [602, 275, 700, 496],
  [831, 275, 935, 497],
  [1057, 277, 1161, 497],
  [366, 525, 472, 743],
  [593, 524, 693, 744],
  [819, 525, 932, 744],
  [1059, 525, 1163, 744],
  [367, 769, 475, 990],
  [596, 769, 701, 993],
  [826, 769, 927, 994],
  [1059, 770, 1166, 993],
];
const dinerActionBounds: Bounds[] = [
  [99, 20, 193, 215],
  [291, 21, 400, 212],
  [485, 21, 588, 215],
  [692, 21, 794, 215],
  [95, 228, 193, 435],
  [295, 228, 396, 430],
  [488, 228, 587, 435],
  [692, 228, 792, 435],
  [97, 452, 193, 651],
  [288, 452, 393, 651],
  [483, 452, 587, 651],
  [689, 452, 794, 652],
  [97, 672, 196, 880],
  [289, 672, 402, 880],
  [484, 672, 588, 880],
  [686, 672, 794, 881],
  [102, 905, 209, 1106],
  [298, 904, 407, 1106],
  [496, 904, 601, 1106],
  [691, 905, 798, 1106],
  [98, 1115, 206, 1323],
  [296, 1115, 402, 1323],
  [491, 1115, 597, 1323],
  [689, 1115, 794, 1323],
  [98, 1336, 210, 1537],
  [296, 1336, 406, 1537],
  [491, 1336, 602, 1537],
  [689, 1336, 798, 1537],
  [99, 1555, 206, 1761],
  [296, 1555, 406, 1761],
  [494, 1555, 598, 1761],
  [692, 1555, 795, 1761],
];
const actionBounds: Bounds[] = [
  [247, 37, 381, 296],
  [468, 37, 608, 296],
  [708, 43, 837, 300],
  [933, 45, 1071, 300],
  [226, 353, 349, 610],
  [471, 354, 566, 612],
  [711, 355, 815, 616],
  [938, 353, 1059, 611],
  [177, 666, 363, 902],
  [458, 665, 603, 903],
  [670, 661, 862, 898],
  [943, 662, 1093, 901],
  [228, 939, 347, 1194],
  [465, 939, 588, 1196],
  [693, 939, 811, 1192],
  [939, 939, 1052, 1198],
];
const idleStaffBounds: Bounds[] = [
  [233, 31, 338, 309],
  [464, 32, 572, 311],
  [696, 32, 811, 311],
  [936, 32, 1048, 311],
  [233, 341, 350, 610],
  [463, 338, 572, 610],
  [698, 337, 816, 610],
  [934, 337, 1052, 610],
  [227, 632, 397, 901],
  [467, 632, 632, 902],
  [693, 632, 866, 902],
  [932, 632, 1102, 902],
  [180, 926, 341, 1197],
  [417, 927, 568, 1196],
  [651, 927, 810, 1196],
  [889, 927, 1048, 1196],
];
const idleDinerBounds: Bounds[] = [
  [359, 24, 486, 248],
  [594, 24, 727, 248],
  [837, 24, 966, 248],
  [1083, 24, 1213, 248],
  [344, 262, 490, 502],
  [584, 261, 730, 503],
  [827, 263, 971, 504],
  [1074, 263, 1216, 504],
  [351, 513, 491, 749],
  [592, 513, 734, 749],
  [833, 513, 975, 749],
  [1081, 513, 1218, 749],
  [347, 760, 498, 1004],
  [590, 759, 740, 1007],
  [832, 761, 981, 1007],
  [1079, 761, 1227, 1007],
];
const propBounds: Bounds[] = [
  [63, 69, 328, 337],
  [454, 63, 642, 328],
  [805, 80, 1027, 354],
  [1145, 85, 1386, 354],
  [79, 433, 322, 708],
  [464, 394, 636, 698],
  [778, 430, 1054, 708],
  [1148, 431, 1389, 694],
  [57, 747, 336, 1033],
  [432, 773, 696, 1019],
  [786, 812, 1025, 1006],
  [1138, 801, 1391, 1013],
];
const decorBounds: Bounds[] = [
  [37, 23, 357, 578],
  [464, 16, 731, 549],
  [848, 95, 982, 530],
  [1103, 155, 1505, 549],
  [41, 634, 512, 986],
  [548, 568, 696, 982],
  [842, 589, 1136, 991],
  [1253, 616, 1475, 953],
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
  loadSheet("/art/idle-staff.png", idleStaffBounds, true),
  loadSheet("/art/idle-diners.png", idleDinerBounds, true),
  loadSheet("/art/decor.png", decorBounds),
  loadSheet("/art/furnishings.png", [
    [81, 125, 444, 443],
    [576, 98, 791, 436],
    [955, 119, 1236, 465],
    [1388, 44, 1575, 464],
    [19, 471, 510, 908],
    [520, 540, 1008, 908],
    [1057, 667, 1364, 902],
    [1434, 485, 1554, 898],
  ]),
]).then(
  ([
    characters,
    props,
    diners,
    actions,
    dinerActions,
    idleStaff,
    idleDiners,
    decor,
    furnishings,
  ]) => ({
    characters,
    props,
    diners,
    actions,
    dinerActions,
    idleStaff,
    idleDiners,
    decor,
    furnishings,
  }),
);
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
