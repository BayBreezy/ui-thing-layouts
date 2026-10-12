import { mkdir } from "node:fs/promises";

import { chromium } from "playwright";
const baseURL = process.env.ORBIT_SCREENSHOT_URL || "http://127.0.0.1:3000";
await mkdir("public/screenshots", { recursive: true });
const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
    colorScheme: "light",
  });
  const page = await context.newPage();
  for (const [route, name] of [
    ["/", "workspace-light"],
    ["/assistants", "assistants"],
    ["/metrics", "metrics"],
    ["/audio", "audio"],
    ["/login", "login"],
  ]) {
    await page.goto(baseURL + route);
    await page.waitForSelector('[data-demo-ready="true"]');
    await page.waitForTimeout(700);
    await page.screenshot({ path: `public/screenshots/${name}.png` });
  }
  await page.goto(baseURL + "/");
  await page.waitForSelector('[data-demo-ready="true"]');
  await page.getByLabel("Switch to dark mode").click();
  await page.mouse.move(700, 500);
  await page.waitForTimeout(300);
  await page.screenshot({ path: "public/screenshots/workspace-dark.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel("Switch to light mode").click();
  await page.mouse.move(240, 32);
  await page.waitForTimeout(300);
  await page.screenshot({ path: "public/screenshots/workspace-mobile.png" });
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.goto(baseURL + "/social-preview.svg");
  await page.screenshot({ path: "public/social-preview.png" });
} finally {
  await browser.close();
}
