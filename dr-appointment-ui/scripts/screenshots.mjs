// Regenerates public/screenshots/*.png and public/social-preview.png from a running dev server.
//   bun run dev            (in one terminal)
//   node scripts/screenshots.mjs
import { mkdir } from "node:fs/promises";

import { chromium } from "playwright";
const baseURL = process.env.MENDLY_SCREENSHOT_URL || "http://localhost:3000";
await mkdir("public/screenshots", { recursive: true });
const browser = await chromium.launch();
async function settle(page) {
  await page.locator('[data-demo-ready="true"]').waitFor({ state: "attached" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(
    () => !document.getAnimations().some((animation) => animation instanceof CSSTransition)
  );
}
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  for (const [route, name] of [
    ["/", "today-light"],
    ["/calendar?date=2026-10-14&provider=provider-1", "calendar"],
    ["/appointments", "appointments"],
    ["/waitlist", "waitlist"],
    ["/reports", "reports"],
    ["/book", "booking"],
    ["/login", "login"],
  ]) {
    await page.goto(baseURL + route);
    if (route !== "/login") await settle(page);
    if (route === "/") await page.locator(".apexcharts-svg").first().waitFor();
    if (route === "/reports") await page.locator(".apexcharts-svg").first().waitFor();
    if (route.startsWith("/appointments")) await page.locator("tbody tr").first().waitFor();
    await page.screenshot({ path: "public/screenshots/" + name + ".png" });
  }
  // A step further into the patient booking flow.
  await page.goto(baseURL + "/book");
  await settle(page);
  await page.getByRole("button", { name: /Follow-up visit/ }).click();
  await page.locator("ul.grid button[aria-pressed]").first().waitFor();
  await page.locator("button[aria-pressed]:not([disabled])").first().click();
  await page.screenshot({ path: "public/screenshots/booking-times.png" });

  await page.goto(baseURL + "/");
  await settle(page);
  await page.locator(".apexcharts-svg").first().waitFor();
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await page.locator("html.dark").waitFor();
  await page.waitForFunction(
    () => !document.getAnimations().some((animation) => animation instanceof CSSTransition)
  );
  await page.mouse.move(700, 500);
  await page.screenshot({ path: "public/screenshots/today-dark.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await page.locator("html.light").waitFor();
  await page.waitForFunction(
    () => !document.getAnimations().some((animation) => animation instanceof CSSTransition)
  );
  await page.screenshot({ path: "public/screenshots/today-mobile.png" });
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.goto(baseURL + "/social-preview.svg");
  await page.screenshot({ path: "public/social-preview.png" });
} finally {
  await browser.close();
}
