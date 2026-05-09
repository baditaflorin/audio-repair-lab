import { expect, test } from "@playwright/test";

test("loads, generates demo audio, processes, and exposes project links", async ({ page }) => {
  await page.goto(process.env.PLAYWRIGHT_BASE_URL ?? "/audio-repair-lab/");

  await expect(page.getByRole("heading", { name: "Audio Repair Lab" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Star on GitHub" })).toHaveAttribute(
    "href",
    "https://github.com/baditaflorin/audio-repair-lab"
  );
  await expect(page.getByRole("link", { name: "PayPal" })).toHaveAttribute(
    "href",
    "https://www.paypal.com/paypalme/florinbadita"
  );
  await expect(page.getByText(/Version 0\.2\.0 · Commit/)).toBeVisible();

  await page.getByRole("button", { name: "Demo" }).click();
  await expect(page.locator(".panel-kicker", { hasText: "demo-noisy-vocal.wav" })).toBeVisible();

  await page.getByRole("button", { name: "Process" }).click();
  await expect(page.getByRole("button", { name: "Export WAV" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/FFT spectral noise reduction/)).toBeVisible();
});
