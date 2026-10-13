import { mkdir } from "node:fs/promises";

import { chromium } from "playwright";
const baseURL = process.env.LAUNCHPAD_SCREENSHOT_URL || "http://localhost:3000";
await mkdir("public/screenshots", { recursive: true });
const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  for (const [route, name] of [
    ["/", "workspace-light"],
    ["/campaigns", "campaigns"],
    ["/leads", "leads"],
    ["/documents/document-1", "brief"],
    ["/login", "login"],
  ]) {
    await page.goto(baseURL + route);
    if (route !== "/login")
      await page.locator('[data-demo-ready="true"]').waitFor({ state: "attached" });
    await page.evaluate(() => document.fonts.ready);
    if (route === "/") await page.locator(".apexcharts-svg").waitFor();
    await page.screenshot({ path: "public/screenshots/" + name + ".png" });
  }
  await page.goto(baseURL + "/");
  await page.locator(".apexcharts-svg").waitFor();
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await page.locator("html.dark").waitFor();
  await page.waitForFunction(
    () => !document.getAnimations().some((animation) => animation instanceof CSSTransition)
  );
  await page.mouse.move(700, 500);
  await page.screenshot({ path: "public/screenshots/workspace-dark.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await page.locator("html.light").waitFor();
  await page.waitForFunction(
    () => !document.getAnimations().some((animation) => animation instanceof CSSTransition)
  );
  await page.screenshot({ path: "public/screenshots/workspace-mobile.png" });
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.goto(baseURL + "/social-preview.svg");
  await page.screenshot({ path: "public/social-preview.png" });
} finally {
  await browser.close();
}
