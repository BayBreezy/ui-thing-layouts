import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { createDemoState, datasetFor } from "../../server/utils/fixtures";
import { emptyFilters, runReport } from "../../shared/analytics";
import { addDays } from "../../shared/dates";
import { formatMetric } from "../../shared/format";
import { referenceDate } from "../../shared/types";
import type { Metric, ReportQuery } from "../../shared/types";

const seed = createDemoState();
const northwind = seed.sites[0]!;
const storageKey = "beacon-demo-v1";

/** What the app should show for a question, computed with the same rules the API uses. */
function expected(over: Partial<ReportQuery> = {}) {
  return runReport(
    datasetFor(northwind),
    {
      siteId: "northwind",
      from: addDays(referenceDate, -29),
      to: referenceDate,
      compare: true,
      segment: "all",
      filters: emptyFilters(),
      interval: "auto",
      ...over,
    },
    { goals: seed.goals, funnel: seed.preferences.funnel }
  );
}
const figure = (over: Partial<ReportQuery>, metric: Metric = "sessions") =>
  formatMetric(metric, expected(over).totals[metric as "sessions"]);

async function ready(page: Page) {
  await expect(page.locator('[data-demo-ready="true"]')).toBeAttached();
}
async function open(page: Page, path: string) {
  await page.goto(path);
  await ready(page);
}
const card = (page: Page, name: string) =>
  page.locator("button[aria-pressed]", { hasText: name }).first();
async function stored(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "null"), storageKey);
}
/** Persistence is debounced, so wait until the stored snapshot satisfies the check. */
async function storedWhen(page: Page, check: (state: any) => boolean) {
  await expect
    .poll(async () => {
      const state = await stored(page);
      return Boolean(state) && check(state);
    })
    .toBe(true);
  return stored(page);
}
async function audit(page: Page) {
  await page.waitForFunction(
    () => !document.getAnimations().some((animation) => animation instanceof CSSTransition)
  );
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .exclude("nuxt-devtools-frame")
    .analyze();
  expect(
    results.violations.map((violation) => `${violation.id}: ${violation.nodes[0]?.html}`)
  ).toEqual([]);
}

test("the overview shows real figures and a segment tab changes them", async ({ page }) => {
  await open(page, "/");
  await expect(card(page, "Total sessions")).toContainText(figure({}));
  await expect(card(page, "Total sessions")).toContainText("+");
  await page.getByRole("tab", { name: "Organic" }).click();
  await expect(card(page, "Total sessions")).toContainText(figure({ segment: "organic" }));
  await expect(page).toHaveURL(/segment=organic/);
  await expect(page.getByRole("list", { name: "Active filters" })).toContainText("Organic");
  await page.getByRole("tab", { name: "All sessions" }).click();
  await expect(card(page, "Total sessions")).toContainText(figure({}));
  await expect(page).not.toHaveURL(/segment=/);
});

test("date range and comparison controls change the report and the URL", async ({ page }) => {
  await open(page, "/");
  await page.getByLabel("Date range").selectOption("7d");
  await expect(page).toHaveURL(/range=7d/);
  await expect(card(page, "Total sessions")).toContainText(
    figure({ from: addDays(referenceDate, -6) })
  );
  await page.getByRole("switch", { name: "Compare to previous period" }).click();
  await expect(page).toHaveURL(/compare=0/);
  await expect(card(page, "Total sessions")).not.toContainText("%");
  await page.getByLabel("Date range").selectOption("today");
  await expect(card(page, "Total sessions")).toContainText(
    figure({ from: referenceDate, compare: false })
  );
});

test("a custom range is applied from the popover", async ({ page }) => {
  await open(page, "/");
  await page.getByRole("button", { name: "Choose dates" }).click();
  await page.getByLabel("From", { exact: true }).fill("2026-09-21");
  await page.getByLabel("To", { exact: true }).fill("2026-09-27");
  await page.getByRole("button", { name: "Apply range" }).click();
  await expect(page).toHaveURL(/range=custom&from=2026-09-21&to=2026-09-27/);
  await expect(card(page, "Total sessions")).toContainText(
    figure({ from: "2026-09-21", to: "2026-09-27" })
  );
  await expect(page.getByLabel("Date range")).toHaveValue("custom");
});

test("filters cross-filter every figure and can be removed from their chips", async ({ page }) => {
  await open(page, "/");
  await page.getByRole("button", { name: /^Filter/ }).click();
  await page.getByLabel("Device", { exact: true }).selectOption("mobile");
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/device=mobile/);
  await expect(card(page, "Total sessions")).toContainText(
    figure({ filters: { ...emptyFilters(), device: "mobile" } })
  );
  await page.getByRole("button", { name: "Remove device filter" }).click();
  await expect(page).not.toHaveURL(/device=/);
  await expect(card(page, "Total sessions")).toContainText(figure({}));
});

test("selecting a source in a list filters the whole report", async ({ page }) => {
  await open(page, "/");
  await page
    .getByRole("list", { name: /Top sources/ })
    .getByRole("button", { name: /Paid/ })
    .click();
  await expect(page).toHaveURL(/channel=paid/);
  await expect(card(page, "Total sessions")).toContainText(
    figure({ filters: { ...emptyFilters(), channel: "paid" } })
  );
});

test("a shared link opens the exact view", async ({ page }) => {
  await open(page, "/?range=7d&segment=paid&country=CA&compare=0");
  await expect(page.getByLabel("Date range")).toHaveValue("7d");
  await expect(page.getByRole("list", { name: "Active filters" })).toContainText("Segment: Paid");
  await expect(page.getByRole("list", { name: "Active filters" })).toContainText("Country: Canada");
  await expect(card(page, "Total sessions")).toContainText(
    figure({
      from: addDays(referenceDate, -6),
      compare: false,
      segment: "paid",
      filters: { ...emptyFilters(), country: "CA" },
    })
  );
});

test("a customized layout is saved and survives a reload", async ({ page }) => {
  await open(page, "/");
  await page.getByRole("button", { name: "Customize" }).click();
  await page.getByRole("button", { name: "Move Top sources up" }).click();
  await page.getByRole("switch", { name: "Show Devices" }).click();
  const state = await storedWhen(page, (value) =>
    value.preferences.widgets.some((w: any) => w.id === "devices" && !w.visible)
  );
  expect(state.preferences.widgets.map((w: any) => w.id).slice(0, 3)).toEqual([
    "trend",
    "sources",
    "pages",
  ]);
  await page.keyboard.press("Escape");
  await page.reload();
  await ready(page);
  await expect(page.getByRole("heading", { name: "Devices" })).toHaveCount(0);
  const headings = await page.getByRole("heading", { level: 2 }).allTextContents();
  expect(headings.findIndex((text) => text.includes("Top sources"))).toBeLessThan(
    headings.findIndex((text) => text.includes("Top pages"))
  );
});

test("the pages table searches, sorts, opens details and exports", async ({ page }) => {
  await open(page, "/pages");
  const rows = page.locator("tbody tr");
  await expect(rows.first()).toBeVisible();
  const all = await rows.count();
  await page.getByLabel("Search pages").fill("boots");
  await expect(page).toHaveURL(/q=boots/);
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText("Hiking boots");
  await page.getByLabel("Search pages").fill("");
  await expect(rows).toHaveCount(all);
  await page.getByRole("button", { name: "Pageviews" }).click();
  await expect(page).toHaveURL(/sort=/);
  await rows.first().getByRole("button").click();
  await expect(page.getByRole("dialog")).toContainText("Bounce rate");
  await page.keyboard.press("Escape");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  expect((await download).suggestedFilename()).toBe("northwind-pages.csv");
});

test("goals validate, persist and can be removed", async ({ page }) => {
  await open(page, "/goals");
  const before = await page.locator("tbody tr").count();
  await page.getByRole("button", { name: "Add goal" }).click();
  const form = page.getByRole("dialog");
  await form.getByRole("button", { name: "Add goal" }).click();
  await expect(form).toContainText("Name is required");
  await form.getByLabel("Goal name").fill("Pricing view");
  await form.getByLabel("Page path").fill("pricing");
  await form.getByRole("button", { name: "Add goal" }).click();
  await expect(form).toContainText("starts with /");
  await form.getByLabel("Page path").fill("/shop/boots");
  await form.getByRole("button", { name: "Add goal" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(before + 1);
  const row = page.locator("tbody tr", { hasText: "Pricing view" });
  await expect(row).toContainText("/shop/boots");
  await storedWhen(page, (state) => state.goals.some((goal: any) => goal.name === "Pricing view"));
  await page.reload();
  await ready(page);
  await expect(page.locator("tbody tr", { hasText: "Pricing view" })).toBeVisible();
  await page.getByRole("button", { name: "Remove Pricing view" }).click();
  await page.getByRole("button", { name: "Remove goal" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(before);
});

test("the live feed adds events and can be paused", async ({ page }) => {
  await open(page, "/live");
  const items = page.getByRole("list", { name: "Recent pageviews" }).getByRole("listitem");
  await expect(items.first()).toBeVisible();
  await page.getByRole("button", { name: "Pause feed" }).click();
  const paused = await items.count();
  await page.waitForTimeout(3500);
  expect(await items.count()).toBe(paused);
  await page.getByRole("button", { name: "Resume feed" }).click();
  await expect.poll(() => items.count(), { timeout: 8000 }).toBeGreaterThan(paused);
});

test("a view can be saved as a report, reopened and deleted", async ({ page }) => {
  await open(page, "/?range=7d&segment=mobile");
  await page.goto("/reports?range=7d&segment=mobile");
  await ready(page);
  await page.getByRole("button", { name: "Save report" }).click();
  await expect(
    page.getByText("Enter a name").or(page.getByText("Report name is required"))
  ).toBeVisible();
  await page.getByLabel("Report name").fill("Mobile this week");
  await page.getByRole("button", { name: "Save report" }).click();
  const list = page.getByRole("list", { name: "Saved reports" });
  await expect(list).toContainText("Mobile this week");
  await page.goto("/reports");
  await ready(page);
  await page
    .locator("li", { has: page.getByRole("heading", { name: "Mobile this week" }) })
    .getByRole("button", { name: "Open" })
    .click();
  await expect(page).toHaveURL(/range=7d/);
  await expect(page).toHaveURL(/segment=mobile/);
  await page.goto("/reports");
  await ready(page);
  await page.getByRole("button", { name: "Delete Mobile this week" }).click();
  await page.getByRole("button", { name: "Delete report" }).click();
  await expect(page.getByRole("list", { name: "Saved reports" })).not.toContainText(
    "Mobile this week"
  );
});

test("the command palette jumps between pages and sites", async ({ page }) => {
  await open(page, "/");
  const palette = page.getByRole("dialog", { name: "Search Beacon" });
  await page.keyboard.press("ControlOrMeta+k");
  await palette.getByPlaceholder("Search pages, sites and reports…").fill("goals");
  await palette.getByRole("option", { name: "Goals" }).first().click();
  await expect(page).toHaveURL(/\/goals/);
  await page.keyboard.press("ControlOrMeta+k");
  await palette.getByPlaceholder("Search pages, sites and reports…").fill("Fernlight");
  await palette.getByRole("option", { name: /Switch to Fernlight/ }).click();
  await expect(page).toHaveURL(/site=fernlight/);
  await expect(page.getByRole("button", { name: "Switch site" })).toContainText("Fernlight Docs");
});

test("switching sites changes the data and each site keeps its own goals", async ({ page }) => {
  await open(page, "/goals");
  await expect(page.locator("tbody")).toContainText("Added to cart");
  await page.getByRole("button", { name: "Switch site" }).click();
  await page.getByRole("menuitem", { name: /Fernlight Docs/ }).click();
  await expect(page.locator("tbody")).toContainText("API key created");
  await expect(page.locator("tbody")).not.toContainText("Added to cart");
});

test("a failing browser store warns instead of breaking", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("full", "QuotaExceededError");
    };
  });
  await open(page, "/");
  await page.getByRole("tab", { name: "Paid" }).click();
  await page.getByRole("button", { name: "Customize" }).click();
  await page.getByRole("switch", { name: "Show Devices" }).click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("status").filter({ hasText: "Browser storage is unavailable" })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Customize" })).toBeVisible();
});

test("settings save, add a site, and reset restores the seed", async ({ page }) => {
  await open(page, "/settings?tab=sites");
  await page.getByRole("button", { name: "Add site" }).first().click();
  const form = page.getByRole("dialog");
  await form.getByLabel("Site name").fill("Acme Studio");
  await form.getByLabel("Domain").fill("not a domain");
  await form.getByRole("button", { name: "Add site" }).click();
  await expect(form).toContainText("Enter a domain like example.com");
  await form.getByLabel("Domain").fill("acme.example");
  await form.getByRole("button", { name: "Add site" }).click();
  await expect(page.getByRole("list", { name: "Sites" })).toContainText("Acme Studio");
  await page.getByRole("button", { name: "Switch site" }).click();
  await page.getByRole("menuitem", { name: /Acme Studio/ }).click();
  await page.goto("/pages");
  await ready(page);
  await expect(page.locator("tbody tr").first()).toBeVisible();
  await page.goto("/settings?tab=data");
  await ready(page);
  await page.getByRole("button", { name: "Reset demo data" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Reset demo data" }).click();
  await expect(page.getByText("Demo data restored")).toBeVisible();
  await page.goto("/settings?tab=sites");
  await ready(page);
  await expect(page.getByRole("list", { name: "Sites" })).not.toContainText("Acme Studio");
});

test("every route has social tags and no console errors", async ({ page }) => {
  const problems: string[] = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) problems.push(message.text());
  });
  page.on("pageerror", (error) => problems.push(error.message));
  for (const path of [
    "/",
    "/pages",
    "/sources",
    "/audience",
    "/goals",
    "/live",
    "/reports",
    "/notifications",
    "/settings",
    "/login",
    "/signup",
    "/forgot-password",
  ]) {
    await open(page, path);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      "https://beacon.behonbaker.com/social-preview.png"
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image"
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      new RegExp(`^https://beacon.behonbaker.com${path === "/" ? "/?$" : path}$`)
    );
    await expect(page).toHaveTitle(/Beacon/);
  }
  expect(problems.filter((text) => !/devtools|HMR|vite/i.test(text))).toEqual([]);
});

test("unknown pages show the friendly 404", async ({ page }) => {
  await page.goto("/nowhere/at/all");
  await expect(page.getByRole("heading", { name: "We couldn't find that page." })).toBeVisible();
  await expect(async () => {
    await page.getByRole("button", { name: /Back to Beacon/ }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 1500 });
  }).toPass();
});

test("key screens have no accessibility violations in light, dark and on a phone", async ({
  page,
}) => {
  await open(page, "/");
  await expect(card(page, "Total sessions")).toContainText(figure({}));
  await audit(page);
  await open(page, "/goals");
  await expect(page.locator("tbody tr").first()).toBeVisible();
  await audit(page);
  await open(page, "/settings");
  await audit(page);
  await page.emulateMedia({ colorScheme: "dark" });
  await open(page, "/");
  await expect(card(page, "Total sessions")).toContainText(figure({}));
  await audit(page);
  await open(page, "/sources");
  await audit(page);
  await page.emulateMedia({ colorScheme: "light" });
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "/");
  await expect(card(page, "Total sessions")).toContainText(figure({}));
  await audit(page);
  await open(page, "/login");
  // The field hint fades in with a JS animation; audit only once it has settled.
  await expect(page.getByText("Use a fictional password")).toHaveCSS("opacity", "1");
  await audit(page);
});
