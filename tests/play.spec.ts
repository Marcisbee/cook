import { expect, test } from "@playwright/test";

test("open, serve, grow, hire, pause and continue a real restaurant", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.clock.install();
  await page.goto("/");
  await page.getByLabel("Restaurant name").fill("The Little Olive");
  await page.getByLabel("Your name").fill("Mira");
  await page.getByRole("button", { name: "Open for business" }).click();
  await expect(
    page.getByText("The Little Olive", { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add a seat" }).click();
  await expect(page.getByTestId("cash")).toHaveText("€0");
  for (let i = 0; i < 8; i++) {
    await page.clock.runFor(8000);
    if (await page.getByRole("button", { name: "Serve a meal" }).isEnabled())
      await page.getByRole("button", { name: "Serve a meal" }).click();
  }
  await page.clock.runFor(8000);
  await expect(page.getByTestId("served")).not.toHaveText("0");
  await page.getByRole("tab", { name: "Team", exact: true }).click();
  await page.getByRole("button", { name: "Hire Luna" }).click();
  const before = Number(await page.getByTestId("served").textContent());
  await page.clock.runFor(40000);
  expect(
    Number(await page.getByTestId("served").textContent()),
  ).toBeGreaterThan(before);
  await page.getByRole("button", { name: "Let Luna go" }).click();
  await expect(page.getByRole("button", { name: "Hire Luna" })).toBeVisible();
  await page.getByRole("button", { name: "Pause service" }).click();
  const cash = await page.getByTestId("cash").textContent();
  await page.clock.runFor(70000);
  await expect(page.getByTestId("cash")).toHaveText(cash!);
  await page.reload();
  await page.getByRole("button", { name: "Continue your restaurant" }).click();
  await expect(page.getByTestId("cash")).toHaveText(cash!);
  await expect(page.getByText("Service paused")).toBeVisible();
  expect(errors).toEqual([]);
});

test("mobile controls fit, keyboard starts play, and reset requires an explicit new opening", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByLabel("Restaurant name").fill("A very little café");
  await page.getByLabel("Your name").fill("Alex");
  await page.getByLabel("Your name").press("Enter");
  await expect(
    page.getByRole("button", { name: "Serve a meal" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByRole("button", { name: "Start a new restaurant" }).click();
  await expect(
    page.getByText("Opening a new restaurant replaces your saved progress."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Keep my restaurant" }).click();
  await expect(
    page.getByRole("heading", { name: "A very little café" }),
  ).toBeVisible();
});
