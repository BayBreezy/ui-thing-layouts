import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const heading = (page: Page, name: string) =>
  expect(page.getByRole("heading", { level: 1, name })).toBeVisible();

/** Opens a route and waits for hydration, so typing is not lost to a page that is still booting. */
async function open(page: Page, path = "/") {
  await page.goto(path);
  await expect(page.locator('[data-app-ready="true"]')).toBeAttached();
}
async function register(page: Page, email = "jo@example.com") {
  await open(page);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").first().fill("Sup3r-secret!");
  await page.getByRole("button", { name: "Continue with email" }).click();
}
async function enterCode(page: Page, code: string) {
  await page.locator("input").first().click();
  await page.keyboard.type(code);
  await page.getByRole("button", { name: "Verify account" }).click();
}
async function a11y(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    // The dev-only Nuxt devtools badge is not part of the product.
    .exclude("#nuxt-devtools-anchor")
    .exclude("nuxt-devtools-frame")
    .exclude("[class*='nuxt-devtools']")
    .analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes[0]?.html}`)).toEqual([]);
}

test("walks all four steps", async ({ page }) => {
  await register(page);
  await heading(page, "Verify your email");
  await expect(page).toHaveURL(/step=2/);
  await expect(page.getByText("We sent a code to jo@example.com")).toBeVisible();

  await enterCode(page, "48213");
  await heading(page, "Invite your team");

  await page.getByLabel("Teammate 1 email").fill("sam@example.com");
  await page.getByRole("button", { name: "Add another member" }).click();
  await page.getByLabel("Teammate 2 email").fill("lee@example.com");
  await page.getByRole("button", { name: "Send invites and continue" }).click();

  await heading(page, "Welcome to Waypoint");
  await expect(page.getByText("2 teammates have been invited")).toBeVisible();
  await expect(page.getByTestId("progress").locator("[data-active=true]")).toHaveCount(4);
});

test("shows field errors before anything is sent", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "Continue with email" }).click();
  await expect(page.getByText("Enter your email address")).toBeVisible();
  await expect(page.getByText("Choose a password", { exact: true })).toBeVisible();
  await page.getByLabel("Email").fill("jo@example.com");
  await page.getByLabel("Password").first().fill("short");
  await page.getByRole("button", { name: "Continue with email" }).click();
  await expect(page.getByText("Use at least 8 characters")).toBeVisible();
  await expect(page).not.toHaveURL(/step=/);
});

test("shows the server's error for an address that is taken", async ({ page }) => {
  await register(page, "taken@example.com");
  await expect(page.getByText("That email is already registered. Try signing in.")).toBeVisible();
  await heading(page, "Create a free account");
});

test("rejects a wrong code and accepts the next one", async ({ page }) => {
  await register(page);
  await heading(page, "Verify your email");
  await enterCode(page, "00000");
  await expect(page.getByText("That code didn't match. Check it and try again.")).toBeVisible();
  await expect(page).toHaveURL(/step=2/);
});

test("cannot jump ahead by editing the URL", async ({ page }) => {
  await open(page, "/?step=4");
  await heading(page, "Create a free account");
});

test("back keeps what was typed and skipping invites still finishes", async ({ page }) => {
  await register(page);
  await heading(page, "Verify your email");
  await page.getByRole("button", { name: "Back" }).click();
  await heading(page, "Create a free account");
  await expect(page.getByLabel("Email")).toHaveValue("jo@example.com");
  await page.getByLabel("Password").first().fill("Sup3r-secret!");
  await page.getByRole("button", { name: "Continue with email" }).click();
  await heading(page, "Verify your email");
  await enterCode(page, "12345");
  await heading(page, "Invite your team");
  await page.getByRole("button", { name: "Skip for now" }).click();
  await heading(page, "Welcome to Waypoint");
  await expect(page.getByText("You're set up and ready to go")).toBeVisible();
});

test("start over returns to a blank first step", async ({ page }) => {
  await register(page);
  await enterCode(page, "12345");
  await page.getByRole("button", { name: "Skip for now" }).click();
  await page.getByRole("button", { name: "Start over" }).click();
  await heading(page, "Create a free account");
  await expect(page.getByLabel("Email")).toHaveValue("");
});

test("moves focus to the new step's heading", async ({ page }) => {
  await register(page);
  await heading(page, "Verify your email");
  await expect(page.locator("#step-heading")).toBeFocused();
});

test("switches theme", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: /Switch to dark mode/ }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("uses a compact header instead of the sidebar on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await expect(page.getByRole("navigation", { name: "Onboarding progress" })).toBeHidden();
  await expect(page.getByText("Step 1 of 4").first()).toBeVisible();
});

test("has no detectable accessibility violations on any step", async ({ page }) => {
  await open(page);
  await heading(page, "Create a free account");
  await a11y(page);
  await register(page);
  await heading(page, "Verify your email");
  await a11y(page);
  await enterCode(page, "12345");
  await heading(page, "Invite your team");
  await a11y(page);
  await page.getByRole("button", { name: "Skip for now" }).click();
  await heading(page, "Welcome to Waypoint");
  await a11y(page);
});
