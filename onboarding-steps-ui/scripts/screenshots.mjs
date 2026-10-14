// Regenerates public/screenshots/*.png and public/social-preview.png from a running dev server.
//   bun run dev            (in one terminal)
//   node scripts/screenshots.mjs
import { mkdir } from "node:fs/promises";

import { chromium } from "playwright";
const baseURL = process.env.WAYPOINT_SCREENSHOT_URL || "http://localhost:3000";
await mkdir("public/screenshots", { recursive: true });
const browser = await chromium.launch();
/** The Nuxt devtools badge only exists in dev; keep it out of the pictures. */
const hideDevtools = (page) =>
  page.addStyleTag({
    content: "#nuxt-devtools-anchor, #nuxt-devtools-container { display: none !important; }",
  });
async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(
    () => !document.getAnimations().some((animation) => animation instanceof CSSTransition)
  );
  await hideDevtools(page);
  await page.mouse.move(700, 500);
}
async function shot(page, name) {
  await settle(page);
  await page.screenshot({ path: `public/screenshots/${name}.png` });
}
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(baseURL + "/", { waitUntil: "networkidle" });
  await shot(page, "account-light");

  await page.getByLabel("Email").fill("jo@example.com");
  await page.getByLabel("Password").first().fill("Sup3r-secret!");
  await page.getByRole("button", { name: "Continue with email" }).click();
  await page.waitForURL(/step=2/);
  await page.getByRole("heading", { name: "Verify your email" }).waitFor();
  await page.locator("input").first().click();
  await page.keyboard.type("48213");
  await shot(page, "verify");
  await page.getByRole("button", { name: "Verify account" }).click();
  await page.waitForURL(/step=3/);
  await page.getByRole("heading", { name: "Invite your team" }).waitFor();
  await page.getByLabel("Teammate 1 email").fill("sam@example.com");
  await page.getByRole("button", { name: "Add another member" }).click();
  await page.getByLabel("Teammate 2 email").fill("lee@example.com");
  await shot(page, "invite");
  await page.getByRole("button", { name: /^Send/ }).click();
  await page.waitForURL(/step=4/);
  await page.getByRole("heading", { name: "Welcome to Waypoint" }).waitFor();
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await page.locator("html.dark").waitFor();
  await shot(page, "welcome-dark");
  await page.setViewportSize({ width: 390, height: 844 });
  await shot(page, "welcome-mobile");

  await page.setViewportSize({ width: 1200, height: 630 });
  await page.goto(baseURL + "/social-preview.svg");
  await page.screenshot({ path: "public/social-preview.png" });
} finally {
  await browser.close();
}
