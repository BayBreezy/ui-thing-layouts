import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { createDemoState } from "../../server/utils/fixtures";
import { displayName } from "../../shared/contacts";
import { findDuplicates } from "../../shared/duplicates";

const seed = createDemoState();
const storageKey = "verdant-demo-v1";

async function ready(page: Page) {
  await expect(page.locator('[data-demo-ready="true"]')).toBeAttached();
}
async function open(page: Page, path: string) {
  await page.goto(path);
  await ready(page);
}
/** Runs axe on the current page once color transitions have finished. */
async function audit(page: Page) {
  await page.waitForFunction(
    () => !document.getAnimations().some((animation) => animation instanceof CSSTransition)
  );
  // Form hints fade in with a script-driven animation; wait for them to settle too.
  await page.waitForFunction(() =>
    [...document.querySelectorAll('p[style*="opacity"]')].every(
      (element) => getComputedStyle(element).opacity === "1"
    )
  );
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .exclude("nuxt-devtools-frame")
    .analyze();
  expect(
    results.violations.map((violation) => `${violation.id}: ${violation.nodes[0]?.html}`)
  ).toEqual([]);
}
const status = (page: Page) => page.locator("p[role=status]", { hasText: /contacts match/ });
async function stored(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "null"), storageKey);
}

test("a contact can be added, edited, favorited, archived and restored, and survives a reload", async ({
  page,
}) => {
  await open(page, "/contacts/new");
  await page.getByLabel("First name").fill("Ada");
  await page.getByLabel("Last name").fill("Lovelace");
  await page.getByLabel("Company", { exact: true }).fill("Analytical Engines");
  await page.getByRole("button", { name: "Add email" }).click();
  await page.getByLabel("Email 1", { exact: true }).fill("ada@example.com");
  await page.getByRole("button", { name: "Add phone" }).click();
  await page.getByLabel("Phone 1", { exact: true }).fill("+1 555 555 0170");
  await page.getByRole("checkbox", { name: "Friends" }).check();
  await page.getByRole("button", { name: "Save contact" }).click();
  await expect(page).toHaveURL(/\/contacts\/[a-f0-9-]{36}$/);
  await expect(page.getByRole("heading", { name: "Ada Lovelace" })).toBeVisible();
  await expect(page.getByRole("link", { name: "ada@example.com" })).toBeVisible();
  const url = page.url();

  await page.getByRole("button", { name: "Favorite", exact: true }).click();
  await expect(page.getByRole("button", { name: "Favorited" })).toBeVisible();
  await page.getByRole("tab", { name: "Edit" }).click();
  await page.getByLabel("Job title").fill("Mathematician");
  await Promise.all([
    page.waitForResponse((response) => response.url().includes("/api/demo/contacts/save")),
    page.getByRole("button", { name: "Save contact" }).click(),
  ]);
  await expect(page.getByRole("button", { name: "Save contact" })).toBeEnabled();

  await page.reload();
  await ready(page);
  await expect(page.getByText("Mathematician · Analytical Engines")).toBeVisible();
  await expect(page.getByRole("button", { name: "Favorited" })).toBeVisible();

  await page.getByRole("button", { name: "More actions" }).click();
  await page.getByRole("menuitem", { name: "Archive" }).click();
  await expect(page.getByText("This contact is archived")).toBeVisible();
  await open(page, "/archive");
  await expect(page.getByRole("link", { name: "Ada Lovelace" })).toBeVisible();
  await page.getByRole("button", { name: "Restore Ada Lovelace" }).click();
  await expect(page.getByText("1 contact restored").first()).toBeVisible();
  await expect(
    page.locator("#main-content").getByRole("link", { name: "Ada Lovelace" })
  ).toHaveCount(0);
  await page.goto(url);
  await ready(page);
  await expect(page.getByText("This contact is archived")).toHaveCount(0);
});

test("search, filters, sorting and paging live in the URL and survive reloads", async ({
  page,
}) => {
  await open(page, "/contacts");
  await expect(status(page)).toContainText(
    `${seed.contacts.filter((c) => !c.archived).length} contacts`
  );
  const target = seed.contacts.find((c) => !c.archived)!;
  await page.getByRole("searchbox", { name: "Search contacts" }).fill(target.lastName);
  await expect(page).toHaveURL(new RegExp(`q=${encodeURIComponent(target.lastName)}`));
  await expect(page.getByRole("link", { name: displayName(target) }).first()).toBeVisible();
  const filtered = await status(page).innerText();

  await page.reload();
  await ready(page);
  await expect(page.getByRole("searchbox", { name: "Search contacts" })).toHaveValue(
    target.lastName
  );
  await expect(status(page)).toHaveText(filtered);

  await page.getByRole("button", { name: /Clear filters/ }).click();
  await expect(page).toHaveURL(/\/contacts$/);
  await page.getByLabel("Filter by group").selectOption({ label: "Clients" });
  const clients = seed.contacts.filter((c) => !c.archived && c.groupIds.includes("group-3")).length;
  await expect(status(page)).toHaveText(`${clients} contacts match`);
  await page.getByRole("button", { name: "Favorites", exact: true }).click();
  await expect(page).toHaveURL(/fav=1/);
  await page.getByRole("button", { name: /Clear filters/ }).click();

  await page.getByRole("button", { name: /Sort by name/ }).click();
  await expect(page).toHaveURL(/sort=name/);
  await page.getByRole("button", { name: /Sort by name/ }).click();
  await expect(page).toHaveURL(/sort=-name/);

  await page.getByRole("button", { name: "Card view" }).click();
  await expect(page).toHaveURL(/view=grid/);
  await expect(page).toHaveURL(/sort=-name/);
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByText("Page 2 of").locator("visible=true")).toBeVisible();
  await page.getByRole("button", { name: "Table view" }).click();
  await expect(page.getByRole("table")).toBeVisible();
});

test("selecting rows reveals bulk actions that update the chosen contacts", async ({ page }) => {
  await open(page, "/contacts");
  await page.getByRole("checkbox", { name: "Select all on this page" }).click();
  await expect(page.getByTestId("selected-count")).toHaveText("10 selected");
  await page.getByRole("button", { name: "Add to group" }).click();
  await page.getByRole("menuitem", { name: "Mentors" }).click();
  await expect(page.getByText("10 contacts updated").first()).toBeVisible();
  await expect(page.getByTestId("selected-count")).toHaveCount(0);
  await expect
    .poll(
      async () =>
        (await stored(page))?.contacts.filter((c: { groupIds: string[] }) =>
          c.groupIds.includes("group-7")
        ).length
    )
    .toBeGreaterThanOrEqual(10);
  const saved = await stored(page);
  await open(page, "/groups/group-7");
  await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(
    saved.contacts.filter(
      (c: { groupIds: string[]; archived: boolean }) =>
        c.groupIds.includes("group-7") && !c.archived
    ).length
  );
});

test("CSV import previews errors and duplicates before adding contacts", async ({ page }) => {
  const existing = seed.contacts[0]!.emails[0]!.value;
  const csv = [
    "first_name,last_name,company,email,groups",
    "Grace,Hopper,Navy,grace@example.com,Clients",
    `Dup,Licate,Somewhere,${existing},`,
    "Broken,Row,Nowhere,not-an-email,",
  ].join("\n");
  await open(page, "/contacts?import=1");
  const dialog = page.getByRole("dialog", { name: "Import contacts" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Or paste CSV").fill(csv);
  await dialog.getByRole("button", { name: "Preview import" }).click();
  await expect(dialog.getByText("2 of 3 rows are ready")).toBeVisible();
  await expect(dialog.getByText(/Row 4:/)).toBeVisible();
  await expect(dialog.getByText("Already exists", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Import 1 contact" })).toBeVisible();
  await dialog.getByRole("checkbox").uncheck();
  await dialog.getByRole("button", { name: "Import 2 contacts" }).click();
  await expect(page.getByText("Imported 2 contacts").first()).toBeVisible();
  await page.getByRole("searchbox", { name: "Search contacts" }).fill("Hopper");
  await expect(page.getByRole("link", { name: "Grace Hopper" })).toBeVisible();
});

test("duplicates can be merged and history moves to the surviving contact", async ({ page }) => {
  const pair = findDuplicates(seed.contacts).find((item) => item.reason === "email")!;
  const names = [displayName(pair.a), displayName(pair.b)];
  await open(page, "/cleanup");
  await expect(page.getByText("Possible duplicates")).toBeVisible();
  await expect(page.getByRole("link", { name: names[0]! }).first()).toBeVisible();
  const row = page
    .getByRole("listitem")
    .filter({ hasText: names[0]! })
    .filter({ hasText: "Same email" });
  await row.getByRole("button", { name: "Merge" }).click();
  const dialog = page.getByRole("dialog", { name: "Merge duplicates" });
  await expect(dialog.getByText("The merged contact will have")).toBeVisible();
  await dialog.getByRole("button", { name: "Merge contacts" }).click();
  await expect(page.getByText(`Merged into ${names[0]}`).first()).toBeVisible();
  await expect(page.getByText("Same email")).toHaveCount(0);
  await expect
    .poll(async () =>
      (await stored(page))?.contacts.some((c: { id: string }) => c.id === pair.b.id)
    )
    .toBe(false);
  const saved = await stored(page);
  expect(saved.contacts.some((c: { id: string }) => c.id === pair.a.id)).toBe(true);
});

test("a group is created with a color and an icon picked from a visible grid", async ({ page }) => {
  await open(page, "/groups");
  await page.getByRole("button", { name: "New group" }).click();
  const dialog = page.getByRole("dialog", { name: "New group" });
  await dialog.getByLabel("Name").fill("Trail friends");
  await expect(dialog.getByRole("button", { name: "users" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await dialog.getByRole("button", { name: "tent" }).click();
  await expect(dialog.getByRole("button", { name: "tent" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await expect(dialog.getByRole("button", { name: "users" })).toHaveAttribute(
    "aria-pressed",
    "false"
  );
  await dialog.getByRole("button", { name: "Create group" }).click();
  await expect(page.getByText("Group created").first()).toBeVisible();
  const card = page.getByRole("listitem").filter({ hasText: "Trail friends" });
  await expect(card.locator(".i-lucide\\:tent")).toBeVisible();
  await expect
    .poll(
      async () =>
        (await stored(page))?.groups.find((g: { name: string }) => g.name === "Trail friends")
          ?.icon ?? ""
    )
    .toBe("tent");
});

test("follow-ups can be added, completed, snoozed and deleted", async ({ page }) => {
  await open(page, "/follow-ups");
  const overdue = seed.followUps.filter((f) => !f.done && f.dueDate < "2026-10-12").length;
  await expect(page.locator("p[role=status]")).toContainText(`${overdue} overdue`);
  await page.getByRole("button", { name: "New follow-up" }).click();
  const dialog = page.getByRole("dialog", { name: "New follow-up" });
  await dialog.getByLabel("What do you need to do?").fill("Send the sample files");
  await dialog.getByRole("button", { name: "Add follow-up" }).click();
  await expect(page.getByText("Send the sample files")).toBeVisible();
  await page.getByRole("checkbox", { name: /Mark “Send the sample files” as done/ }).click();
  await expect(page.getByText("Marked as done").first()).toBeVisible();
  const first = page.getByRole("checkbox", { name: /as done/ }).first();
  await expect(first).toBeVisible();
  await page
    .getByRole("button", { name: /Snooze “/ })
    .first()
    .click();
  await expect(page.getByText("Pushed back a week").first()).toBeVisible();
  await page.getByRole("button", { name: /Delete “Send the sample files”/ }).click();
  await expect(page.getByText("Send the sample files")).toHaveCount(0);
});

test("the command palette finds people and pages by keyboard", async ({ page }) => {
  await open(page, "/");
  const target = seed.contacts.find((c) => !c.archived && c.firstName && c.lastName)!;
  await page.keyboard.press("ControlOrMeta+k");
  const palette = page.getByRole("dialog", { name: "Search Verdant" });
  await expect(palette).toBeVisible();
  await palette
    .getByPlaceholder("Search people, groups and pages…")
    .fill(`${target.firstName} ${target.lastName}`);
  await palette
    .getByRole("option", { name: new RegExp(target.firstName) })
    .first()
    .click();
  await expect(page).toHaveURL(/\/contacts\//);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(target.firstName);
});

test("unsaved edits are guarded and a failed save can be retried", async ({ page }) => {
  await open(page, "/contacts/contact-1?tab=edit");
  await page.getByLabel("Job title").fill("Chief of Everything");
  page.once("dialog", (dialog) => {
    expect(dialog.message()).toContain("unsaved");
    void dialog.dismiss();
  });
  await page.getByRole("link", { name: "Groups", exact: true }).first().click();
  await expect(page).toHaveURL(/\/contacts\/contact-1/);

  let fail = true;
  await page.route("**/api/demo/contacts/save", async (route) => {
    if (fail) await route.fulfill({ status: 500, json: { statusMessage: "Server unavailable" } });
    else await route.continue();
  });
  await page.getByRole("button", { name: "Save contact" }).click();
  await expect(page.getByRole("alert")).toContainText(/Server unavailable|couldn't complete/);
  fail = false;
  await page.getByRole("button", { name: "Save contact" }).click();
  await expect(page.getByText("Contact saved").first()).toBeVisible();
  await page.reload();
  await ready(page);
  await expect(page.getByText(/Chief of Everything/)).toBeVisible();
});

test("validation explains what to fix", async ({ page }) => {
  await open(page, "/contacts/new");
  await page.getByRole("button", { name: "Save contact" }).click();
  await expect(page.getByRole("alert")).toContainText("Add a name or a company");
  await page.getByLabel("First name").fill("Ada");
  await page.getByRole("button", { name: "Add email" }).click();
  await page.getByLabel("Email 1", { exact: true }).fill("nope");
  await page.getByRole("button", { name: "Save contact" }).click();
  await expect(page.getByRole("alert")).toContainText("Enter a valid email address");
});

test("storage failures warn instead of breaking, and corrupt snapshots recover", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    };
  });
  await open(page, "/contacts");
  await page
    .getByRole("button", { name: /Add .* to favorites/ })
    .first()
    .click();
  await expect(page.getByText(/Browser storage is unavailable/)).toBeVisible();

  const fresh = await page.context().newPage();
  await fresh.addInitScript((key) => localStorage.setItem(key, "{not valid json"), storageKey);
  await open(fresh, "/contacts");
  await expect(fresh.getByText(/Saved data couldn't be restored/)).toBeVisible();
  await expect(status(fresh)).toContainText("contacts match");
});

test("preferences persist and labels can be renamed and removed everywhere", async ({ page }) => {
  await open(page, "/settings?tab=preferences");
  await page.getByLabel("Default contacts view").selectOption("grid");
  await page.getByLabel("Show names as").selectOption("last-first");
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByText("Settings saved").first()).toBeVisible();
  await open(page, "/contacts");
  await expect(page).toHaveURL(/\/contacts$/);
  await expect(page.getByRole("button", { name: "Card view" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  const sample = seed.contacts.find((c) => !c.archived && c.firstName && c.lastName)!;
  await page.getByRole("searchbox", { name: "Search contacts" }).fill(sample.lastName);
  await expect(
    page.getByRole("link", { name: new RegExp(`^${sample.lastName}, `) }).first()
  ).toBeVisible();

  await open(page, "/settings?tab=labels");
  await page.getByRole("button", { name: "Rename VIP" }).click();
  await page.getByLabel("New name for VIP").fill("Inner circle");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("link", { name: "Inner circle" })).toBeVisible();
  await expect(page.getByRole("link", { name: "VIP", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Remove Inner circle" }).click();
  await expect(page.getByRole("link", { name: "Inner circle" })).toHaveCount(0);
});

test("archived contacts can be deleted for good and the demo can be reset", async ({ page }) => {
  await open(page, "/archive");
  const archived = seed.contacts.filter((c) => c.archived).length;
  await page.getByRole("checkbox", { name: "Select all archived contacts" }).check();
  await page.getByRole("button", { name: "Delete forever" }).first().click();
  await page.getByRole("button", { name: "Delete forever" }).last().click();
  await expect(page.getByText(`${archived} contacts deleted`).first()).toBeVisible();
  await expect(page.getByText("The archive is empty")).toBeVisible();

  await open(page, "/settings?tab=data");
  await page.getByRole("button", { name: "Reset demo data" }).first().click();
  await page.getByRole("button", { name: "Reset demo data" }).last().click();
  await expect(page.getByText("Demo data restored").first()).toBeVisible();
  await open(page, "/archive");
  await expect(
    page.getByRole("link", { name: displayName(seed.contacts.find((c) => c.archived)!) })
  ).toBeVisible();
});

test("every page loads directly without hydration errors and ships social tags", async ({
  page,
}) => {
  const problems: string[] = [];
  page.on("pageerror", (error) => problems.push(error.message));
  page.on("console", (message) => {
    if (/hydration/i.test(message.text())) problems.push(message.text());
  });
  const person = seed.contacts[0]!;
  const routes: [string, RegExp][] = [
    ["/", /Overview/],
    ["/contacts", /Contacts/],
    [`/contacts/${person.id}`, new RegExp(person.firstName)],
    ["/contacts/new", /New contact/],
    ["/groups", /Groups/],
    ["/groups/group-1", /Family/],
    ["/follow-ups", /Follow-ups/],
    ["/cleanup", /Clean up/],
    ["/archive", /Archive/],
    ["/settings", /Settings/],
    ["/login", /Demo sign in/],
    ["/signup", /Demo sign up/],
    ["/forgot-password", /Demo password help/],
    ["/reset-password?token=verdant-demo-reset", /Demo reset/],
    ["/definitely-not-here", /Page not found/],
  ];
  for (const [path, title] of routes) {
    await page.goto(path);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      /\/social-preview\.png$/
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image"
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /Verdant/);
  }
  await page.goto("/definitely-not-here");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("couldn't find that page");
  expect(problems).toEqual([]);
});

const accessiblePages = [
  "/",
  "/contacts",
  "/contacts?view=grid",
  "/contacts/contact-1",
  "/contacts/contact-1?tab=edit",
  "/contacts/new",
  "/groups",
  "/groups/group-1",
  "/follow-ups",
  "/cleanup",
  "/archive",
  "/settings",
  "/login",
];
test("pages pass axe in light mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  for (const path of accessiblePages) {
    await open(page, path);
    if (path.startsWith("/contacts") && !path.includes("/contacts/"))
      await page.waitForSelector("tbody tr, [aria-label=Groups]");
    if (path === "/") await page.locator(".apexcharts-svg").first().waitFor();
    await audit(page);
  }
});
test("pages pass axe in dark mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  for (const path of ["/", "/contacts", "/contacts/contact-1", "/cleanup", "/settings", "/login"]) {
    await open(page, path);
    await expect(page.locator("html")).toHaveClass(/dark/);
    if (path === "/contacts") await page.waitForSelector("tbody tr");
    if (path === "/") await page.locator(".apexcharts-svg").first().waitFor();
    await audit(page);
  }
});
test("pages pass axe at a phone width without horizontal scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/", "/contacts?view=grid", "/contacts/contact-1", "/follow-ups"]) {
    await open(page, path);
    if (path === "/") await page.locator(".apexcharts-svg").first().waitFor();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow, path).toBeLessThanOrEqual(0);
    await audit(page);
  }
});
