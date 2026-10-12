import AxeBuilder from "@axe-core/playwright";
import { test, expect, type Page } from "@playwright/test";
async function go(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('[data-demo-ready="true"]')).toBeAttached();
}
test("chat, cancellation, retry, history and preferences survive refresh", async ({ page }) => {
  await go(page, "/");
  await page.getByLabel("Message Orbit").fill("Help me design a better onboarding flow");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page).toHaveURL(/\/chat\//);
  await expect(page.getByText("first five minutes", { exact: false })).toBeVisible();
  await page.getByLabel("Message Orbit").fill("Review Vue code");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await page.getByLabel("Stop response").click();
  await expect(page.getByLabel("Stop response")).not.toBeVisible();
  await page.getByRole("button", { name: "Regenerate reply" }).last().click();
  await expect(page.getByText("Build a component you can trust")).toBeVisible();
  await go(page, "/history");
  await page.getByLabel("Search conversations").fill("Help me design");
  await page.getByRole("button", { name: /Actions for Help/ }).click();
  await page.getByRole("menuitem", { name: "Rename" }).click();
  await page.getByLabel("Conversation name").fill("My portfolio conversation");
  await page.getByRole("button", { name: "Save name" }).click();
  await page.getByLabel("Search conversations").fill("My portfolio");
  await expect(page.getByRole("heading", { name: "My portfolio conversation" })).toBeVisible();
  await page.waitForTimeout(400);
  await page.reload();
  await page.getByLabel("Search conversations").fill("My portfolio");
  await expect(page.getByRole("heading", { name: "My portfolio conversation" })).toBeVisible();
});
test("assistant editor and profile settings persist", async ({ page }) => {
  await go(page, "/assistants/new");
  await page.getByLabel("Assistant name").fill("Portfolio coach");
  await page
    .getByLabel("Description", { exact: true })
    .fill("Thoughtful advice for a portfolio presentation");
  await page
    .getByLabel("Instructions")
    .fill("Help the user design an accessible portfolio and explain tradeoffs.");
  await page.getByRole("button", { name: "Save assistant" }).click();
  await expect(page).toHaveURL("/assistants");
  await expect(page.getByRole("heading", { name: "Portfolio coach" })).toBeVisible();
  await go(page, "/settings");
  await page.getByLabel("Full name").fill("Taylor Demo");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Settings saved")).toBeVisible();
  await page.waitForTimeout(400);
  await page.reload();
  await expect(page.getByLabel("Full name")).toHaveValue("Taylor Demo");
});
test("optional auth validates, signs up, recovers, resets and continues demo", async ({ page }) => {
  await go(page, "/signup");
  await page.getByRole("button", { name: "Create demo account" }).click();
  await expect(page.getByText("Name must be at least 2 characters")).toBeVisible();
  await page.getByLabel("Full name").fill("Jamie Demo");
  await page.getByLabel("Email address").fill("jamie@example.com");
  await page.getByLabel("Password", { exact: true }).fill("fictional123");
  await page.getByRole("button", { name: "Create demo account" }).click();
  await expect(page).toHaveURL("/");
  await page.getByLabel("Open profile menu").click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/login");
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page.getByRole("heading", { name: "Forgot your password?" })).toBeVisible();
  await page.getByLabel("Email address").fill("jamie@example.com");
  await page.getByRole("button", { name: "Get demo reset link" }).click();
  await page.getByRole("link", { name: "Open demo reset link" }).click();
  await expect(page.getByRole("heading", { name: "A fresh start" })).toBeVisible();
  await page.getByLabel("Password", { exact: true }).fill("newfictional123");
  await page.getByRole("button", { name: "Reset demo password" }).click();
  await expect(page.getByText("Demo password reset complete.", { exact: false })).toBeVisible();
  await page.getByRole("link", { name: "Continue demo", exact: true }).last().click();
  await expect(page).toHaveURL("/");
});
test("audio sample transcribes and denied microphone has a usable fallback", async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: () => Promise.reject(new DOMException("Denied", "NotAllowedError")) },
      configurable: true,
    })
  );
  await go(page, "/audio");
  await page.getByRole("button", { name: "Record audio", exact: true }).click();
  await expect(
    page.getByText("Microphone access wasn't available.", { exact: false })
  ).toBeVisible();
  await page.getByRole("button", { name: "Try sample audio" }).click();
  await page.getByRole("button", { name: "Transcribe", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Transcript", exact: true })).toBeVisible();
  await expect(page.getByText("A useful starting point.", { exact: false })).toBeVisible();
});
test("real-time typed session saves summary", async ({ page }) => {
  await go(page, "/realtime");
  await page.getByRole("button", { name: "Start session" }).click();
  await page.getByLabel("Message for real-time session").fill("Help with onboarding");
  await page.getByLabel("Send real-time message").click();
  await expect(page.getByText("first five minutes", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "End session" }).click();
  await expect(page.getByText("Explored 1 ideas.", { exact: false })).toBeVisible();
});
test("all routes render directly without hydration errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (msg) => {
    if (/hydration/i.test(msg.text())) errors.push(msg.text());
  });
  for (const route of [
    "/",
    "/history",
    "/chat/conversation-1",
    "/assistants",
    "/assistants/assistant-1",
    "/audio",
    "/realtime",
    "/metrics",
    "/docs",
    "/docs/architecture",
    "/help",
    "/community",
    "/settings",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password?token=orbit-demo-reset",
  ]) {
    await go(page, route);
    await expect(page.locator("h1").first()).toBeVisible();
  }
  expect(errors).toEqual([]);
  await page.goto("/unknown-route");
  await expect(page.getByRole("heading", { name: "A little lost in orbit?" })).toBeVisible();
});
test("every page exposes complete search and social metadata", async ({ page }) => {
  const meta = (selector: string) =>
    page.locator(`head meta[${selector}]`).first().getAttribute("content");
  for (const route of [
    "/",
    "/history",
    "/assistants",
    "/assistants/new",
    "/audio",
    "/realtime",
    "/metrics",
    "/docs",
    "/docs/architecture",
    "/help",
    "/community",
    "/settings",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password?token=orbit-demo-reset",
  ]) {
    await go(page, route);
    const path = route.split("?")[0];
    const title = await page.title();
    expect(title, route).toMatch(/\S/);
    for (const key of [
      'name="description"',
      'property="og:title"',
      'property="og:description"',
      'property="og:image"',
      'name="twitter:title"',
      'name="twitter:description"',
      'name="twitter:image"',
    ]) {
      expect((await meta(key))?.trim(), `${route} ${key}`).toBeTruthy();
    }
    expect(await meta('property="og:url"'), route).toMatch(
      new RegExp(`^https://[^/]+${path === "/" ? "/" : path}$`)
    );
    expect(await meta('name="twitter:image"'), route).toMatch(/^https:\/\/.+\.png$/);
    expect(await meta('property="og:title"'), route).toBe(await meta('name="twitter:title"'));
  }
});
test("responsive themes, keyboard search and automated accessibility", async ({ page }) => {
  const hydrationErrors: string[] = [];
  page.on("console", (msg) => {
    if (/hydration/i.test(msg.text())) hydrationErrors.push(msg.text());
  });
  page.on("pageerror", (error) => hydrationErrors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await go(page, "/");
    await expect(page.getByLabel("Message Orbit")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
    const result = await new AxeBuilder({ page }).analyze();
    expect(result.violations).toEqual([]);
  }
  expect(hydrationErrors).toEqual([]);
  await page.keyboard.press("Control+k");
  await expect(page.getByLabel("Search pages and conversations")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByLabel("Switch to dark mode").click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations).toEqual([]);
});
test("unavailable storage and request failures are recoverable", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Unavailable", "QuotaExceededError");
    };
  });
  await go(page, "/");
  await page.getByLabel("Message Orbit").fill("A new idea");
  await page.route("**/api/demo/chat", (route) =>
    route.fulfill({
      status: 500,
      body: '{"statusMessage":"Demo request failed"}',
      contentType: "application/json",
    })
  );
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Demo request failed");
  await page.unroute("**/api/demo/chat");
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.getByText("A useful place to start")).toBeVisible();
  await expect(
    page.getByRole("status").filter({ hasText: "Browser storage is unavailable" })
  ).toBeVisible();
});
test("recording produces playable audio and releases microphone tracks", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["microphone"]);
  await page.addInitScript(() => {
    const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async (constraints) => {
      const stream = await original(constraints);
      (window as unknown as { testStream: MediaStream }).testStream = stream;
      return stream;
    };
  });
  await go(page, "/audio");
  await page.getByRole("button", { name: "Record audio", exact: true }).click();
  await expect(page.getByRole("button", { name: /Stop recording/ })).toBeVisible();
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: /Stop recording/ }).click();
  await expect(page.getByRole("heading", { name: /Voice note/ })).toBeVisible();
  expect(
    await page.evaluate(() =>
      (window as unknown as { testStream: MediaStream }).testStream
        .getTracks()
        .every((track) => track.readyState === "ended")
    )
  ).toBe(true);
  await page.locator("audio").evaluate((audio: HTMLAudioElement) => audio.play());
  await expect(page.locator("audio")).toHaveJSProperty("paused", false);
  await page.getByRole("button", { name: "Record audio", exact: true }).click();
  await expect(page.getByRole("button", { name: /Stop recording/ })).toBeVisible();
  await page.getByRole("link", { name: "Metrics", exact: true }).click();
  await expect(page.getByRole("heading", { name: "A clearer picture of your work" })).toBeVisible();
  expect(
    await page.evaluate(() =>
      (window as unknown as { testStream: MediaStream }).testStream
        .getTracks()
        .every((track) => track.readyState === "ended")
    )
  ).toBe(true);
});
test("unsupported recording keeps sample mode available", async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "MediaRecorder", { value: undefined, configurable: true })
  );
  await go(page, "/audio");
  await page.getByRole("button", { name: "Record audio", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Recording isn't supported");
  await page.getByRole("button", { name: "Transcribe", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Transcript", exact: true })).toBeVisible();
});
test("history favorites, exports, confirmed deletion and workspace switching", async ({ page }) => {
  await go(page, "/history");
  await page.getByLabel("Search conversations").fill("A better onboarding");
  await page.getByRole("button", { name: "Unfavorite A better onboarding experience" }).click();
  await page.getByRole("tab", { name: "Favorites", exact: true }).click();
  await expect(page.getByRole("heading", { name: "A fresh page" })).toBeVisible();
  await page.getByRole("tab", { name: /All conversations/ }).click();
  await page.getByRole("button", { name: "Favorite A better onboarding experience" }).click();
  await page.getByRole("button", { name: "Actions for A better onboarding experience" }).click();
  const downloaded = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Export Markdown" }).click();
  expect((await downloaded).suggestedFilename()).toMatch(/\.md$/);
  await page.getByRole("button", { name: "Actions for A better onboarding experience" }).click();
  await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Delete conversation", exact: true }).click();
  await expect(page.getByRole("heading", { name: "A fresh page" })).toBeVisible();
  await page.getByRole("button", { name: /Orbit Studio/ }).click();
  await page.getByRole("menuitem", { name: "Personal space" }).click();
  await expect(page).toHaveURL("/");
  await page.getByLabel("View all conversations").click();
  await expect(page.getByRole("heading", { name: "A weekend project" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Review my Vue component" })).not.toBeVisible();
});
test("attachments remain local and preferences survive conversation refresh", async ({ page }) => {
  await go(page, "/");
  await page.getByRole("combobox", { name: "Writing style", exact: true }).click();
  await page.getByRole("option", { name: "Technical & precise" }).click();
  await page.getByRole("combobox", { name: "Response format" }).click();
  await page.getByRole("option", { name: "JSON" }).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "brief.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("A private local brief"),
  });
  await expect(page.getByText("brief.txt", { exact: true })).toBeVisible();
  await page.getByLabel("Message Orbit").fill("Plan a launch");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page).toHaveURL(/\/chat\//);
  await expect(page.locator(".orbit-prose")).toContainText('"style": "technical"');
  await page.waitForTimeout(400);
  await page.reload();
  await expect(page.getByRole("combobox", { name: "Writing style", exact: true })).toHaveText(
    "Technical & precise"
  );
  await expect(page.getByRole("combobox", { name: "Response format" })).toHaveText("JSON");
  await page.getByLabel("Open brief.txt").click();
  await expect(page.getByRole("dialog")).toContainText("This file stays on your device.");
});
test("duplicated assistant can be deleted after confirming and stays deleted", async ({ page }) => {
  await go(page, "/assistants");
  await page.getByRole("button", { name: "Actions for Design partner" }).click();
  await page.getByRole("menuitem", { name: "Duplicate" }).click();
  await expect(page.getByRole("heading", { name: "Design partner copy" })).toBeVisible();
  await page.getByRole("button", { name: "Actions for Design partner copy" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Delete assistant" }).click();
  await expect(page.getByRole("heading", { name: "Design partner copy" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Design partner", exact: true })).toBeVisible();
  await page.waitForTimeout(400);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Design partner", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Design partner copy" })).toHaveCount(0);
});
test("demo login and confirmed reset work independently of signup", async ({ page }) => {
  await go(page, "/login");
  await page.getByLabel("Email address").fill("visitor@example.com");
  await page.getByLabel("Password", { exact: true }).fill("fictional123");
  await page.getByRole("button", { name: "Log in to demo" }).click();
  await expect(page).toHaveURL("/");
  await go(page, "/settings");
  await expect(page.getByLabel("Full name")).toHaveValue("visitor");
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Reset demo", exact: true })
    .click();
  await expect(page).toHaveURL("/");
  await go(page, "/settings");
  await expect(page.getByLabel("Full name")).toHaveValue("Alex Morgan");
});
test("new conversation cancels an in-flight first reply and opens a fresh composer", async ({
  page,
}) => {
  await go(page, "/");
  await page.getByLabel("Message Orbit").fill("A thought before starting fresh");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await page.getByRole("link", { name: "New conversation N" }).click();
  await expect(page.getByText("Good ideas start", { exact: false })).toBeVisible();
  await expect(page.getByLabel("Message Orbit")).toHaveValue("");
  await page.waitForTimeout(600);
  await expect(page).toHaveURL("/");
  await expect(page.getByText("Good ideas start", { exact: false })).toBeVisible();
});
test("invalid demo reset links explain the problem and offer recovery", async ({ page }) => {
  await go(page, "/reset-password?token=invalid");
  await expect(page.getByRole("alert")).toContainText("This demo reset link is invalid");
  await page.getByRole("link", { name: "Get a new demo reset link" }).click();
  await expect(page.getByRole("heading", { name: "Forgot your password?" })).toBeVisible();
});
