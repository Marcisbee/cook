// Source atlases are bundled with the game. Crop only transparent cell padding;
// keep the original pixels, palette and alpha intact.
export type Sprite = {
  image: HTMLImageElement;
  x: number;
  y: number;
  w: number;
  h: number;
};
function loadSheet(url: string, cols: number, rows: number): Promise<Sprite[]> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(image, 0, 0);
      const data = ctx.getImageData(0, 0, image.width, image.height).data;
      const cw = image.width / cols,
        ch = image.height / rows;
      const sprites: Sprite[] = [];
      for (let row = 0; row < rows; row++)
        for (let col = 0; col < cols; col++) {
          let x0 = Math.round((col + 1) * cw),
            y0 = Math.round((row + 1) * ch),
            x1 = Math.round(col * cw),
            y1 = Math.round(row * ch);
          for (let y = Math.ceil(row * ch); y < Math.floor((row + 1) * ch); y++)
            for (
              let x = Math.ceil(col * cw);
              x < Math.floor((col + 1) * cw);
              x++
            )
              if (data[(y * image.width + x) * 4 + 3] > 90) {
                x0 = Math.min(x0, x);
                x1 = Math.max(x1, x);
                y0 = Math.min(y0, y);
                y1 = Math.max(y1, y);
              }
          sprites.push({
            image,
            x: x0,
            y: y0,
            w: Math.max(1, x1 - x0 + 1),
            h: Math.max(1, y1 - y0 + 1),
          });
        }
      resolve(sprites);
    };
    image.onerror = () =>
      reject(new Error("Could not load restaurant artwork"));
    image.src = url;
  });
}
export const artReady = Promise.all([
  loadSheet("/art/characters.png", 4, 4),
  loadSheet("/art/restaurant.png", 4, 3),
  loadSheet("/art/diners.png", 4, 4),
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
  const w = width ?? (height * s.w) / s.h;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(
    s.image,
    s.x,
    s.y,
    s.w,
    s.h,
    Math.round(-w / 2),
    -Math.round(height),
    Math.round(w),
    Math.round(height),
  );
  ctx.restore();
}
