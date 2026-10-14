// Regenerates public/screenshots/*.png and public/social-preview.png from a running dev server.
//   bun run dev            (in one terminal)
//   node scripts/screenshots.mjs
import { mkdir } from "node:fs/promises";

import { chromium } from "playwright";
const baseURL = process.env.BEACON_SCREENSHOT_URL || "http://localhost:3000";
await mkdir("public/screenshots", { recursive: true });
const browser = await chromium.launch();
/** The Nuxt devtools badge only exists in dev; keep it out of the pictures. */
const hideDevtools = (page) =>
  page.addStyleTag({
    content: "#nuxt-devtools-anchor, #nuxt-devtools-container { display: none !important; }",
  });
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
    ["/", "overview-light"],
    ["/pages", "pages"],
    ["/sources", "sources"],
    ["/goals", "goals"],
    ["/live", "live"],
    ["/reports", "reports"],
    ["/login", "login"],
  ]) {
    await page.goto(baseURL + route);
    if (route !== "/login") await settle(page);
    if (route === "/" || route === "/sources")
      await page.locator(".apexcharts-svg").first().waitFor();
    if (route === "/pages") await page.locator("tbody tr").first().waitFor();
    if (route === "/goals") await page.locator("tbody tr").first().waitFor();
    if (route === "/live")
      await page.getByRole("list", { name: "Recent pageviews" }).locator("li").first().waitFor();
    if (route === "/reports") await page.getByRole("list", { name: "Saved reports" }).waitFor();
    // Let the chart finish drawing, and keep the dev toolbar out of the shot.
    await hideDevtools(page);
    await page.mouse.move(700, 500);
    await page.screenshot({ path: "public/screenshots/" + name + ".png" });
  }

  await page.goto(baseURL + "/");
  await settle(page);
  await page.locator(".apexcharts-svg").first().waitFor();
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await page.locator("html.dark").waitFor();
  await page.waitForFunction(
    () => !document.getAnimations().some((animation) => animation instanceof CSSTransition)
  );
  await page.mouse.move(700, 500);
  await hideDevtools(page);
  await page.screenshot({ path: "public/screenshots/overview-dark.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await page.locator("html.light").waitFor();
  await page.waitForFunction(
    () => !document.getAnimations().some((animation) => animation instanceof CSSTransition)
  );
  await page.screenshot({ path: "public/screenshots/overview-mobile.png" });
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.goto(baseURL + "/social-preview.svg");
  await page.screenshot({ path: "public/social-preview.png" });
} finally {
  await browser.close();
}
