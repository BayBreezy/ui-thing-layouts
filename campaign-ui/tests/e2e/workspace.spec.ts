import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";
async function ready(page: import("@playwright/test").Page) {
  await expect(page.locator('[data-demo-ready="true"]')).toBeAttached();
}
test("campaign, lead, brief, chat, archive, refresh, and reset form a connected workflow", async ({
  page,
}) => {
  await page.goto("/campaigns/new");
  await ready(page);
  await page.getByLabel("Campaign name", { exact: true }).fill("Portfolio launch");
  await page.getByLabel("Objective", { exact: true }).fill("Grow the creative community");
  await page.getByLabel("Budget (USD)").fill("2500");
  await page.getByRole("button", { name: "Save campaign", exact: true }).click();
  await expect(page).toHaveURL(/\/campaigns\/[a-f0-9-]+$/);
  const campaignUrl = page.url();
  await page.getByRole("tab", { name: "Results", exact: true }).click();
  await expect(page.getByTestId("revenue")).toHaveText("$0");
  await page.getByRole("tab", { name: "Leads", exact: true }).click();
  await page.getByRole("link", { name: "Add a lead" }).click();
  await page.getByLabel("Full name").fill("Jamie Demo");
  await page.getByLabel("Email", { exact: true }).fill("jamie@example.com");
  await page.getByLabel("Company", { exact: true }).fill("Creative Co");
  await page.getByRole("button", { name: "Save lead", exact: true }).click();
  await expect(page).toHaveURL(/\/leads\/[a-f0-9-]+$/);
  const leadUrl = page.url();
  await page.getByRole("combobox", { name: "Stage", exact: true }).selectOption("Qualified");
  await page.getByRole("button", { name: "Save lead", exact: true }).click();
  await expect(page.getByRole("button", { name: "Save lead", exact: true })).toBeEnabled();
  await page.goto(campaignUrl);
  await ready(page);
  await page.getByRole("tab", { name: "Documents", exact: true }).click();
  await page.getByRole("link", { name: "Create a brief" }).click();
  await page.getByLabel("Document title").fill("Portfolio launch brief");
  await page
    .getByLabel("Content", { exact: true })
    .fill("# Our launch\n\nA thoughtful start.\n\n<script>alert('unsafe')</script>");
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(page.getByText("<script>alert('unsafe')</script>", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Save document", exact: true }).click();
  await expect(page).toHaveURL(/\/documents\/[a-f0-9-]+$/);
  const briefUrl = page.url();
  await page.reload();
  await ready(page);
  await expect(page.getByLabel("Document title")).toHaveValue("Portfolio launch brief");
  await page.goto(leadUrl);
  await ready(page);
  await expect(page.getByRole("combobox", { name: "Stage", exact: true })).toHaveValue("Qualified");
  await page.goto("/chat/thread-1");
  await ready(page);
  await page.getByLabel("Message your team").fill("The brief is ready.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("The brief is ready.", { exact: true })).toBeVisible();
  await expect(page.getByText("Thanks for the update.", { exact: false })).toBeVisible();
  await page.goto(campaignUrl);
  await ready(page);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Archive campaign", exact: true }).click();
  await expect(page.getByText("This campaign is archived.", { exact: false })).toBeVisible();
  await page.goto("/archive");
  await ready(page);
  await page.getByRole("button", { name: "Restore", exact: true }).first().click();
  // Scoped to the page body: the context rail also lists the "Portfolio launch brief" document.
  await expect(
    page.locator("#main-content").getByRole("link", { name: "Portfolio launch", exact: false })
  ).toHaveCount(0);
  await page.goto(campaignUrl);
  await ready(page);
  await expect(page.getByRole("heading", { name: "Portfolio launch", exact: true })).toBeVisible();
  await page.goto("/settings");
  await ready(page);
  await page.getByRole("tab", { name: "Your data" }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export workspace JSON" }).click();
  expect((await download).suggestedFilename()).toBe("launchpad-workspace.json");
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await page.getByRole("button", { name: "Reset workspace", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await page.goto(briefUrl);
  await ready(page);
  await expect(page.getByRole("heading", { name: "We couldn't find that record" })).toBeVisible();
});
test("failed saves preserve input and retry, and unsaved navigation can be cancelled", async ({
  page,
}) => {
  await page.goto("/campaigns/new");
  await ready(page);
  await page.getByLabel("Campaign name", { exact: true }).fill("Retry campaign");
  await page.getByLabel("Objective", { exact: true }).fill("Keep the visitor's work");
  await page.route("**/api/demo/campaigns/save", (route) => route.abort());
  await page.getByRole("button", { name: "Save campaign", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("try again");
  await expect(page.getByLabel("Campaign name", { exact: true })).toHaveValue("Retry campaign");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("link", { name: "Back to campaigns", exact: true }).click();
  await expect(page).toHaveURL(/campaigns\/new/);
  await page.unroute("**/api/demo/campaigns/save");
  await page.getByRole("button", { name: "Save campaign", exact: true }).click();
  await expect(page).toHaveURL(/\/campaigns\/[a-f0-9-]+$/);
});
test("search, filters, chart table, exports, docs, support, and account flows work", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  const revenue = await page.getByTestId("revenue").textContent();
  await page.getByRole("combobox", { name: "Channel", exact: true }).selectOption("Email");
  await expect(page.getByTestId("revenue")).not.toHaveText(revenue!);
  await page.getByRole("button", { name: "View data table" }).click();
  await expect(page.getByRole("table")).toBeVisible();
  const exported = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV", exact: true }).click();
  expect((await exported).suggestedFilename()).toBe("launchpad-results.csv");
  await page.keyboard.press("Control+k");
  await page.getByLabel("Search pages and records").fill("Audience research");
  await page.getByRole("option", { name: /Audience research notes/ }).click();
  await expect(page).toHaveURL(/documents\/document-2/);
  await page.goto("/docs/architecture");
  await expect(page.getByRole("heading", { name: "Layers", exact: true })).toBeVisible();
  await page.goto("/support");
  await ready(page);
  await page.getByLabel("Subject", { exact: true }).fill("A demo question");
  await page.getByLabel("How can we help?").fill("How do I explore reporting?");
  await page.getByRole("button", { name: "Create demo ticket" }).click();
  await expect(page).toHaveURL(/support\/tickets\/[a-f0-9-]+/);
  await expect(page.getByText("Simulated support response", { exact: true })).toBeVisible();
  await page.goto("/signup");
  await ready(page);
  await page.getByLabel("Name", { exact: true }).fill("Demo Visitor");
  await page.getByLabel("Email", { exact: true }).fill("visitor@example.com");
  await page.getByLabel("Demo password", { exact: true }).fill("fictional123");
  await page.getByRole("button", { name: "Create demo identity" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("button", { name: "Open profile menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/login/);
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page).toHaveURL(/forgot-password$/);
  await expect(page.getByRole("heading", { name: "A fresh start is easy." })).toBeVisible();
  await page.getByLabel("Email", { exact: true }).fill("visitor@example.com");
  await page.getByRole("button", { name: "Get demo reset link" }).click();
  await page.getByRole("link", { name: "Open demo reset link" }).click();
  await expect(page).toHaveURL(/reset-password\?token=/);
  await page.getByLabel("Demo password", { exact: true }).fill("anotherfictional123");
  await page.getByRole("button", { name: "Complete demo reset" }).click();
  await expect(page.getByText("Your demo reset is complete.", { exact: false })).toBeVisible();
});
test("real routes, responsive themes, and keyboard controls meet accessibility checks", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const route of [
    "/",
    "/campaigns",
    "/leads",
    "/documents",
    "/chat",
    "/team",
    "/archive",
    "/activity",
    "/docs",
    "/support",
    "/settings",
    "/login",
  ]) {
    await page.goto(route);
    await ready(page);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await page.waitForFunction(
      () => !document.getAnimations().some((animation) => animation instanceof CSSTransition)
    );
    const scan = await new AxeBuilder({ page })
      .exclude("nuxt-devtools-frame")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(scan.violations, route).toEqual([]);
  }
  await page.goto("/");
  await ready(page);
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Toggle navigation", exact: true }).click();
  await expect(page.getByRole("link", { name: "Campaigns", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Campaigns", exact: true }).click();
  await expect(page).toHaveURL(/campaigns$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
test("unavailable or corrupt browser storage leaves a usable workspace", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error("storage denied");
    };
  });
  await page.goto("/chat/thread-1");
  await ready(page);
  await page.getByLabel("Message your team").fill("A session-only update");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Browser storage is unavailable.", { exact: false })).toBeVisible();
  await expect(page.getByText("A session-only update", { exact: true })).toBeVisible();
});

test("campaign checklist, status, duplication, and section guards stay coherent", async ({
  page,
}) => {
  await page.goto("/campaigns/campaign-1");
  await ready(page);
  await page.getByLabel("Define the audience").check();
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("tab", { name: "Results", exact: true }).click();
  await expect(page.getByRole("button", { name: "Save campaign", exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "Status", exact: true }).selectOption("In progress");
  await page.getByRole("button", { name: "Save campaign", exact: true }).click();
  await expect(page.getByText("Campaign saved", { exact: true })).toBeVisible();
  await page.reload();
  await ready(page);
  await expect(page.getByLabel("Define the audience")).toBeChecked();
  await expect(page.getByRole("combobox", { name: "Status", exact: true })).toHaveValue(
    "In progress"
  );
  await page.getByRole("button", { name: "Duplicate", exact: true }).click();
  await expect(page).toHaveURL(/\/campaigns\/[a-f0-9-]+$/);
  await expect(page.getByRole("combobox", { name: "Status", exact: true })).toHaveValue("Draft");
  await expect(page.getByLabel("Define the audience")).not.toBeChecked();
  await page.getByRole("tab", { name: "Results", exact: true }).click();
  await expect(page.getByTestId("revenue")).toHaveText("$0");
});

test("lead pagination and filtered exports, notifications, and missing records work", async ({
  page,
}) => {
  await page.goto("/leads");
  await ready(page);
  const firstName = await page.getByRole("table").getByRole("link").first().textContent();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByRole("table").getByRole("link").first()).not.toHaveText(firstName!);
  await page.getByRole("combobox", { name: "Lead stage", exact: true }).selectOption("Won");
  await expect(page.getByText(/Page 1 of/)).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("launchpad-leads.csv");
  await page.getByRole("button", { name: "Open notifications" }).click();
  await page.getByRole("button", { name: "Mark all as read" }).click();
  await expect(page.getByRole("dialog").getByText("Unread", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.goto("/campaigns/no-such-record");
  await ready(page);
  await expect(page.getByRole("heading", { name: "We couldn't find that record" })).toBeVisible();
});

test("corrupt snapshots recover and dark/mobile pages remain accessible", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("launchpad-demo-v1", "{corrupt"));
  await page.goto("/");
  await ready(page);
  await expect(page.getByText("Saved data couldn't be restored.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.waitForFunction(
    () => !document.getAnimations().some((animation) => animation instanceof CSSTransition)
  );
  let result = await new AxeBuilder({ page })
    .exclude("nuxt-devtools-frame")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Toggle navigation", exact: true }).click();
  result = await new AxeBuilder({ page })
    .exclude("nuxt-devtools-frame")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
});

test("settings tabs are addressable by URL and do not trip the unsaved-changes guard", async ({
  page,
}) => {
  await page.goto("/settings?tab=data");
  await ready(page);
  await expect(page.getByRole("tab", { name: "Your data" })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  await page.getByRole("tab", { name: "Profile" }).click();
  await expect(page).toHaveURL(/\/settings$/);
  // A dialog would be auto-dismissed by Playwright, which would cancel the navigation.
  await page.getByLabel("Name", { exact: true }).fill("Alex Edited");
  await page.getByRole("tab", { name: "Preferences" }).click();
  await expect(page).toHaveURL(/\/settings\?tab=preferences$/);
  await page.getByRole("tab", { name: "Profile" }).click();
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Alex Edited");
  await page.goto("/settings?tab=nope");
  await ready(page);
  await expect(page.getByRole("tab", { name: "Profile" })).toHaveAttribute("aria-selected", "true");
});

test("every page, including the error page, ships the social card tags", async ({ page }) => {
  const image = /\/social-preview\.png$/;
  const content = (selector: string) => page.locator(selector).getAttribute("content");
  for (const route of [
    "/",
    "/campaigns",
    "/campaigns/campaign-1",
    "/docs/architecture",
    "/login",
  ]) {
    await page.goto(route);
    await expect(page.locator('meta[property="og:image"]'), route).toHaveCount(1);
    expect(await content('meta[property="og:image"]'), route).toMatch(image);
    await expect(page.locator('meta[name="twitter:image"]'), route).toHaveCount(1);
    expect(await content('meta[name="twitter:image"]'), route).toMatch(image);
    expect(await content('meta[name="twitter:card"]'), route).toBe("summary_large_image");
    expect(await content('meta[property="og:title"]'), route).toMatch(/ · Launchpad$/);
    expect(await content('meta[property="og:url"]'), route).toMatch(
      new RegExp(`${route === "/" ? "/" : route}$`)
    );
  }
  // Detail pages use the record they show.
  await page.goto("/campaigns/campaign-1");
  await expect(page).toHaveTitle("Make room for better work · Launchpad");
  // The error page replaces app.vue, so it has to carry the tags on its own.
  const response = await page.goto("/this-page-does-not-exist");
  expect(response?.status()).toBe(404);
  expect(await content('meta[property="og:image"]')).toMatch(image);
  expect(await content('meta[name="twitter:image"]')).toMatch(image);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});
