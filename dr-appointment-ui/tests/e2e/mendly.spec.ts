import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { createDemoState } from "../../server/utils/fixtures";
import { fullName } from "../../shared/patients";
import { holdsSlot } from "../../shared/schedule";

const seed = createDemoState();
const storageKey = "mendly-demo-v1";

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
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .exclude("nuxt-devtools-frame")
    .analyze();
  expect(
    results.violations.map((violation) => `${violation.id}: ${violation.nodes[0]?.html}`)
  ).toEqual([]);
}
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
/** A seeded patient with no visits on the given day, so a booking cannot clash with them. */
function freePatient(date: string) {
  const busy = new Set(
    seed.appointments.filter((item) => item.date === date).map((item) => item.patientId)
  );
  return seed.patients.find((item) => !busy.has(item.id) && item.birthday < "2005-01-01")!;
}

test("a visit can be booked, cannot be double-booked, and survives a reload", async ({ page }) => {
  const date = "2026-10-20";
  const patient = freePatient(date);
  await open(page, "/appointments/new");
  const form = page.locator("form");
  await page.getByRole("combobox", { name: "Patient" }).fill(patient.lastName);
  await page
    .getByRole("option", { name: new RegExp(fullName(patient)) })
    .first()
    .click();
  await form.getByLabel("Visit type").selectOption("visit-follow-up");
  await form.getByLabel("Provider").selectOption("provider-1");
  await form.getByLabel("Date").fill(date);
  await form.getByLabel("Start time").selectOption({ index: 1 });
  const chosen = await form.getByLabel("Start time").inputValue();
  await form.getByLabel("Reason for visit").fill("E2E check-up");
  await form.getByRole("button", { name: "Book appointment" }).click();
  await expect(page).toHaveURL(/\/appointments\/appointment-[a-f0-9]{8}$/);
  await expect(page.getByRole("heading", { name: fullName(patient) })).toBeVisible();
  await expect(page.getByText("E2E check-up")).toBeVisible();
  const url = page.url();

  // The same provider, day and time is no longer offered.
  await open(page, "/appointments/new");
  await page.locator("form").getByLabel("Visit type").selectOption("visit-follow-up");
  await page.locator("form").getByLabel("Provider").selectOption("provider-1");
  await page.locator("form").getByLabel("Date").fill(date);
  await expect(
    page.locator("form").getByLabel("Start time").locator(`option[value="${chosen}"]`)
  ).toHaveCount(0);

  await page.goto(url);
  await ready(page);
  await expect(page.getByRole("heading", { name: fullName(patient) })).toBeVisible();
  await storedWhen(page, (state) =>
    state.appointments.some((item: { reason: string }) => item.reason === "E2E check-up")
  );
});

test("a visit moves through the front-desk workflow from the Today page", async ({ page }) => {
  await open(page, "/");
  const row = page.locator("li", { has: page.getByRole("button", { name: "Check in" }) }).first();
  const name = (await row.locator("a").first().innerText()).trim();
  await row.getByRole("button", { name: "Check in" }).click();
  const moved = page.locator("li", { hasText: name }).first();
  await expect(moved).toContainText("Checked in");
  await moved.getByRole("button", { name: "Start visit" }).click();
  await expect(page.locator("li", { hasText: name }).first()).toContainText("In progress");
  await page
    .locator("li", { hasText: name })
    .first()
    .getByRole("button", { name: "Complete" })
    .click();
  await expect(page.locator("li", { hasText: name }).first()).toContainText("Completed");
  const before = seed.appointments.filter((item) => item.status === "completed").length;
  await storedWhen(
    page,
    (state) =>
      state.appointments.filter((item: { status: string }) => item.status === "completed")
        .length ===
      before + 1
  );
});

test("appointment filters live in the URL and survive reloads and the back button", async ({
  page,
}) => {
  await open(page, "/appointments");
  await page.getByLabel("Status").selectOption("confirmed");
  await expect(page).toHaveURL(/status=confirmed/);
  const rows = page.locator("tbody tr");
  await expect(rows.first()).toBeVisible();
  for (const text of await rows.allInnerTexts()) expect(text).toContain("Confirmed");
  await page.getByLabel("Provider").selectOption("provider-2");
  await expect(page).toHaveURL(/provider=provider-2/);
  await page.getByRole("searchbox", { name: "Search" }).fill("zzzz-no-such-patient");
  await expect(page.getByRole("heading", { name: "No visits match" })).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).first().click();
  await expect(page).not.toHaveURL(/status=|provider=|q=/);
  await page.goto("/appointments?status=cancelled&range=past&sort=-patient");
  await ready(page);
  await expect(page.getByLabel("Status")).toHaveValue("cancelled");
  await expect(page.getByLabel("When")).toHaveValue("past");
});

test("bulk actions confirm several scheduled visits at once", async ({ page }) => {
  await open(page, "/appointments?status=scheduled");
  await page.getByRole("checkbox", { name: "Select all visits on this page" }).click();
  const count = await page.locator("tbody tr").count();
  await expect(page.getByText(`${count} selected`)).toBeVisible();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.getByText(`${count} visits confirmed`).first()).toBeVisible();
  const confirmedBefore = seed.appointments.filter((item) => item.status === "confirmed").length;
  await storedWhen(
    page,
    (state) =>
      state.appointments.filter((item: { status: string }) => item.status === "confirmed").length >=
      confirmedBefore + count
  );
});

test("a waitlisted patient can be booked into an opening", async ({ page }) => {
  await open(page, "/waitlist");
  const cards = page
    .locator("main ul > li, #main-content ul > li")
    .filter({ has: page.getByText("Earliest openings") });
  const before = await cards.count();
  expect(before).toBeGreaterThan(0);
  const first = cards.first();
  const name = (await first.locator("a").first().innerText()).trim();
  await first.getByRole("button", { name: /AM|PM/ }).first().click();
  await expect(page.getByText("Booked from the waitlist").first()).toBeVisible();
  await expect(cards).toHaveCount(before - 1);
  const state = await storedWhen(
    page,
    (value) => value.waitlist.length === seed.waitlist.length - 1
  );
  const booked = state.appointments.filter(
    (item: { source: string }) => item.source === "waitlist"
  );
  expect(booked.length).toBeGreaterThan(
    seed.appointments.filter((item) => item.source === "waitlist").length
  );
  expect(name.length).toBeGreaterThan(0);
});

test("a patient can book online and staff see the visit", async ({ page }) => {
  await open(page, "/book");
  await page.getByRole("button", { name: /Follow-up visit/ }).click();
  await expect(page.getByRole("heading", { name: "Follow-up visit" })).toBeVisible();
  await expect(page.getByRole("button", { pressed: false }).first()).toBeVisible();
  // Pick the first day that has openings, then its first time.
  await page.locator("button[aria-pressed]:not([disabled])").first().click();
  const times = page.locator("ul.grid button[aria-pressed]").filter({ hasText: /AM|PM/ });
  await expect(times.first()).toBeVisible();
  await times.first().click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("First name").fill("Grace");
  await page.getByLabel("Last name").fill("Hopper");
  await page.getByLabel("Email").fill("grace.hopper@example.com");
  await page.getByLabel("Phone").fill("(415) 555-0188");
  await page.getByLabel("What brings you in?").fill("Annual blood pressure check");
  await page.getByRole("button", { name: "Review" }).click();
  await expect(page.getByText("grace.hopper@example.com")).toBeVisible();
  await page.getByRole("button", { name: "Confirm booking" }).click();
  await expect(page.getByRole("heading", { name: "You're booked." })).toBeVisible();
  const reference = (await page.locator("span.font-mono").innerText()).trim();
  expect(reference).toMatch(/^MND-[A-Z2-9]{4}$/);

  await page.getByRole("link", { name: "See it in the staff view" }).click();
  await expect(page.getByRole("heading", { name: "Grace Hopper" })).toBeVisible();
  await expect(page.getByText("Annual blood pressure check")).toBeVisible();
  await open(page, "/patients?q=Hopper");
  await expect(page.getByRole("link", { name: "Grace Hopper" })).toBeVisible();
  await open(page, `/appointments?q=${reference}`);
  await expect(page.locator("tbody tr")).toHaveCount(1);
});

test("a calendar slot opens the booking dialog with the provider and day filled in", async ({
  page,
}) => {
  await open(page, "/calendar?date=2026-10-14&provider=provider-1");
  await page
    .getByRole("button", { name: /Add a visit for Dr\. Amara Okafor on/ })
    .first()
    .click();
  const dialog = page.getByRole("dialog", { name: "Book appointment" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Provider")).toHaveValue("provider-1");
  await expect(dialog.getByLabel("Date")).not.toHaveValue("");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await page.getByRole("button", { name: "Next week" }).click();
  await expect(page).toHaveURL(/date=2026-10-21/);
});

test("the command palette finds patients and pages by keyboard", async ({ page }) => {
  const patient = seed.patients[3]!;
  await open(page, "/");
  await page.keyboard.press("ControlOrMeta+k");
  const palette = page.getByRole("dialog", { name: "Search Mendly" });
  await expect(palette).toBeVisible();
  await palette.getByPlaceholder("Search patients, providers and pages…").fill(fullName(patient));
  await palette
    .getByRole("option", { name: new RegExp(patient.firstName) })
    .first()
    .click();
  await expect(page).toHaveURL(new RegExp(`/patients/${patient.id}$`));
  await expect(page.getByRole("heading", { name: fullName(patient) })).toBeVisible();
});

test("unsaved changes are guarded and validation explains what is wrong", async ({ page }) => {
  const patient = seed.patients[5]!;
  await open(page, `/patients/${patient.id}`);
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Enter a valid email address")).toBeVisible();
  await page.getByLabel("Email").fill("new.address@example.com");
  let prompted = false;
  page.once("dialog", async (dialog) => {
    prompted = true;
    await dialog.dismiss();
  });
  await page.getByRole("link", { name: "Appointments", exact: true }).click();
  expect(prompted).toBe(true);
  await expect(page).toHaveURL(new RegExp(`/patients/${patient.id}$`));
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Patient updated").first()).toBeVisible();
  await storedWhen(
    page,
    (state) =>
      state.patients.find((item: { id: string }) => item.id === patient.id).email ===
      "new.address@example.com"
  );
});

test("a provider's hours can be edited and change what can be booked", async ({ page }) => {
  await open(page, "/providers/provider-1");
  await page.getByLabel("Tuesday start").fill("10:00");
  await page.getByRole("button", { name: "Save schedule" }).click();
  await expect(page.getByText("Schedule saved").first()).toBeVisible();
  await open(page, "/appointments/new");
  const form = page.locator("form");
  await form.getByLabel("Visit type").selectOption("visit-follow-up");
  await form.getByLabel("Provider").selectOption("provider-1");
  await form.getByLabel("Date").fill("2026-10-20");
  await expect(form.getByLabel("Start time").locator('option[value="09:00"]')).toHaveCount(0);
  await expect(form.getByLabel("Start time").locator('option[value="10:00"]')).toHaveCount(1);
});

test("failing storage and corrupt snapshots keep the app usable and explain themselves", async ({
  page,
}) => {
  await page.addInitScript((key) => {
    localStorage.setItem(key, '{"providers": "broken"}');
  }, storageKey);
  await open(page, "/");
  await expect(page.getByText(/Saved data couldn't be restored/)).toBeVisible();
  await expect(page.getByRole("heading", { name: /Good morning/ })).toBeVisible();
});
test("blocked browser storage shows a warning and the session still works", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error("blocked");
    };
  });
  await open(page, "/patients");
  await page.getByRole("link", { name: "Add patient" }).first().click();
  await page.getByLabel("First name").fill("Ada");
  await page.getByLabel("Last name").fill("Lovelace");
  await page.getByLabel("Email").fill("ada.l@example.com");
  await page.getByLabel("Phone").fill("(415) 555-0170");
  await page.getByRole("button", { name: "Add patient" }).click();
  await expect(page).toHaveURL(/\/patients\/patient-/);
  await expect(page.getByText(/Browser storage is unavailable/)).toBeVisible();
});

test("settings, appearance and reset work together", async ({ page }) => {
  await open(page, "/settings");
  await page.getByLabel("Clinic name").fill("Harbor Light Test Clinic");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("Settings saved").first()).toBeVisible();
  await page.getByRole("tab", { name: "Preferences" }).click();
  await page.getByLabel("Appearance").selectOption("dark");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("tab", { name: "Data" }).click();
  await page.getByRole("button", { name: "Reset demo data" }).click();
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await expect(page.getByText("Demo data restored").first()).toBeVisible();
  await storedWhen(page, (state) => state.clinic.name === seed.clinic.name);
});

test("online booking can be paused", async ({ page }) => {
  await open(page, "/settings");
  await page.getByLabel("Online booking").click();
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("Settings saved").first()).toBeVisible();
  await open(page, "/book");
  await expect(page.getByText(/Online booking is paused/)).toBeVisible();
});

const routes = [
  "/",
  "/calendar",
  "/calendar?view=day",
  "/appointments",
  `/appointments/${seed.appointments.find((item) => holdsSlot(item.status))!.id}`,
  "/appointments/new",
  "/patients",
  `/patients/${seed.patients[0]!.id}`,
  "/patients/new",
  "/providers",
  "/providers/provider-1",
  "/waitlist",
  "/reports",
  "/settings",
  "/book",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

test("every route loads directly without errors and ships its social tags", async ({ page }) => {
  const problems: string[] = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type()) && !/favicon|devtools/i.test(message.text()))
      problems.push(`${message.type()}: ${message.text()}`);
  });
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  for (const route of routes) {
    await open(page, route);
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /Mendly/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      /social-preview\.png$/
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image"
    );
  }
  expect(problems).toEqual([]);
});
test("unknown pages show the friendly error page", async ({ page }) => {
  await page.goto("/appointments/does-not-exist");
  await ready(page);
  await expect(page.getByText("We couldn't find that record")).toBeVisible();
  const response = await page.goto("/no/such/page");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "We couldn't find that page." })).toBeVisible();
});

const auditRoutes = [
  "/",
  "/calendar",
  "/appointments",
  "/patients",
  `/patients/${seed.patients[0]!.id}`,
  "/providers",
  "/providers/provider-1",
  "/waitlist",
  "/reports",
  "/settings",
  "/book",
  "/login",
];
test("has no accessibility violations in light mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  for (const route of auditRoutes) {
    await open(page, route);
    await audit(page);
  }
});
test("has no accessibility violations in dark mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  for (const route of auditRoutes) {
    await open(page, route);
    await audit(page);
  }
});
test("fits a phone without horizontal scrolling or accessibility violations", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "/",
    "/calendar",
    "/appointments",
    "/patients",
    "/providers/provider-1",
    "/waitlist",
    "/reports",
    "/settings",
    "/book",
    "/login",
  ]) {
    await open(page, route);
    const overflow = await page.evaluate(() => {
      const scrollers = [document.scrollingElement, document.querySelector("#main-content")];
      return scrollers.some((element) => element && element.scrollWidth > element.clientWidth + 1);
    });
    expect(overflow, `${route} scrolls horizontally`).toBe(false);
    await audit(page);
  }
});
