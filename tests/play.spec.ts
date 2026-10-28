import { test, expect } from "@playwright/test";
async function start(page: any) {
  await page.goto("/");
  await page.getByRole("button", { name: "Open the doors" }).click();
}
test("guests choose, order, receive a clicked dish, and leave a table to clean", async ({
  page,
}) => {
  await page.clock.install();
  await start(page);
  await expect(page.getByText("Setting the tables…")).not.toBeVisible();
  await page.clock.runFor(9000);
  const order = page.getByRole("button", { name: "Order · 1", exact: true });
  await expect(order).toBeVisible();
  await page.clock.runFor(10000);
  await expect(order).toBeEnabled();
  await order.click();
  await page.clock.runFor(18000);
  const serve = page.getByRole("button", { name: /Serve · 1/ });
  await expect(serve).toBeVisible();
  await page.keyboard.press("Space");
  await page.clock.runFor(1000);
  await expect(serve).toBeEnabled();
  // Camera transforms must preserve the physical dish target.
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Reset camera", exact: true }),
  ).toHaveText("120%");
  const canvas = page.locator("canvas"),
    box = (await canvas.boundingBox())!;
  await canvas.click({
    position: { x: (616 / 800) * box.width, y: (189.2 / 520) * box.height },
  });
  await expect(serve).not.toBeVisible();
  await page.clock.runFor(15000);
  await expect(
    page.getByRole("button", { name: "Clean · 1", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("1 meals", { exact: false })).toBeVisible();
  await page.clock.runFor(12000);
  await expect(
    page.getByRole("button", { name: "Clean · 1", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Clean · 1", exact: true }).click();
  await page.clock.runFor(12000);
  await expect(
    page.getByRole("button", { name: "Clean · 1", exact: true }),
  ).not.toBeVisible();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const frozen = await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL());
  await page.clock.runFor(2000);
  expect(await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL())).toBe(
    frozen,
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Resume", exact: true }),
  ).toBeVisible();
});
test("compact mobile shop fits, supports keyboard and preserves purchases", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page);
  await page.getByRole("button", { name: "Shop" }).click();
  await page.getByRole("button", { name: "€20", exact: true }).click();
  await expect(
    page.getByText("2/8 tables · More room for guests"),
  ).toBeVisible();
  await page.getByRole("button", { name: "extras", exact: true }).click();
  await expect(page.getByText("QR menus", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "€100", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.waitForTimeout(1100);
  await page.reload();
  await page.getByRole("button", { name: "Shop" }).click();
  await expect(
    page.getByText("2/8 tables · More room for guests"),
  ).toBeVisible();
});

test("canvas renders at display resolution on large and high-DPI screens, including paused resize", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 2285, height: 1386 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await start(page);
  await expect(page.getByText("Setting the tables…")).not.toBeVisible();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const canvas = page.locator("canvas");
  const resolution = () =>
    canvas.evaluate((c: HTMLCanvasElement) => {
      const r = c.getBoundingClientRect();
      return {
        width: c.width,
        height: c.height,
        expectedWidth: Math.round(r.width * devicePixelRatio),
        expectedHeight: Math.round(r.height * devicePixelRatio),
        smoothing: c.getContext("2d")!.imageSmoothingEnabled,
        css: getComputedStyle(c).imageRendering,
      };
    });
  await expect
    .poll(async () => {
      const r = await resolution();
      return (
        r.width === r.expectedWidth &&
        r.height === r.expectedHeight &&
        !r.smoothing &&
        r.css === "auto"
      );
    })
    .toBe(true);
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect
    .poll(async () => {
      const r = await resolution();
      return r.width === r.expectedWidth && r.height === r.expectedHeight;
    })
    .toBe(true);
  await expect(
    page.getByRole("button", { name: "Resume", exact: true }),
  ).toBeVisible();
  await context.close();
});

test("atlas rectangles retain complete character and furniture silhouettes", async ({
  page,
}) => {
  await page.goto("/");
  const clipped = await page.evaluate(async () => {
    const { artReady } = await import("/src/art.ts");
    const art = await artReady;
    const failures: string[] = [];
    for (const [name, sprites] of Object.entries(art) as [string, any[]][]) {
      const image = sprites[0].image,
        canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(image, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const seen = new Uint8Array(canvas.width * canvas.height),
        stack = new Int32Array(seen.length);
      // Check actual connected silhouettes in the shipped artwork, independent of
      // atlas metadata. A crop must contain the whole component, not just its cell.
      for (let k = 0; k < seen.length; k++) {
        if (seen[k] || data[k * 4 + 3] < 16) continue;
        let n = 1,
          count = 0,
          left = canvas.width,
          top = canvas.height,
          right = 0,
          bottom = 0;
        stack[0] = k;
        seen[k] = 1;
        while (n) {
          const i = stack[--n],
            x = i % canvas.width,
            y = Math.floor(i / canvas.width);
          count++;
          left = Math.min(left, x);
          top = Math.min(top, y);
          right = Math.max(right, x);
          bottom = Math.max(bottom, y);
          for (const j of [
            x ? i - 1 : -1,
            x < canvas.width - 1 ? i + 1 : -1,
            i - canvas.width,
            i + canvas.width,
          ])
            if (
              j >= 0 &&
              j < seen.length &&
              !seen[j] &&
              data[j * 4 + 3] >= 16
            ) {
              seen[j] = 1;
              stack[n++] = j;
            }
        }
        if (
          count > 1000 &&
          !sprites.some(
            (s) =>
              s.x <= left &&
              s.y <= top &&
              s.x + s.w > right &&
              s.y + s.h > bottom,
          )
        )
          failures.push(name + ": " + [left, top, right, bottom].join(","));
      }
    }
    return failures;
  });
  expect(clipped).toEqual([]);
});

test("idle gestures change poses without moving planted feet and respect reduced motion", async ({
  page,
}) => {
  await page.clock.install();
  await start(page);
  await expect(page.getByText("Setting the tables…")).not.toBeVisible();
  const crop = (part: "body" | "feet") =>
    page.locator("canvas").evaluate((canvas: HTMLCanvasElement, part) => {
      // Owner's stove position in the displayed restaurant, sampled at output resolution.
      const box =
        part === "feet"
          ? { x: 642, y: 254, w: 20, h: 8 }
          : { x: 637, y: 190, w: 35, h: 45 };
      const c = document.createElement("canvas"),
        sx = canvas.width / 800,
        sy = canvas.height / 520;
      c.width = Math.round(box.w * sx);
      c.height = Math.round(box.h * sy);
      c.getContext("2d")!.drawImage(
        canvas,
        Math.round(box.x * sx),
        Math.round(box.y * sy),
        c.width,
        c.height,
        0,
        0,
        c.width,
        c.height,
      );
      return c.toDataURL();
    }, part);
  await page.clock.runFor(100);
  const feet = await crop("feet"),
    body = await crop("body");
  const poses = new Set([body]);
  for (let i = 0; i < 8; i++) {
    await page.clock.runFor(500);
    expect(await crop("feet")).toBe(feet);
    poses.add(await crop("body"));
  }
  expect(poses.size).toBeGreaterThan(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.runFor(100);
  const still = await crop("body");
  await page.clock.runFor(1000);
  expect(await crop("body")).toBe(still);
});
