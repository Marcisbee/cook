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
  // Click the physical prepared meal on the canvas rather than its accessible shortcut.
  const canvas = page.locator("canvas"),
    box = (await canvas.boundingBox())!;
  await canvas.click({
    position: { x: (420 / 640) * box.width, y: (170 / 420) * box.height },
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
