import { fileURLToPath } from "node:url";

import { setup, $fetch } from "@nuxt/test-utils/e2e";
import { describe, expect, it } from "vitest";

import { createDemoState } from "../../server/utils/fixtures";
await setup({
  rootDir: fileURLToPath(new URL("../..", import.meta.url)),
  server: true,
  browser: false,
  dev: true,
  nuxtConfig: { devtools: { enabled: false } },
});
const seed = createDemoState();
const context = {
  groupIds: seed.groups.map((item) => item.id),
  contactIds: seed.contacts.map((item) => item.id),
};
const post = <T = any>(url: string, body: unknown) =>
  $fetch<T>(url, { method: "POST", body: body as Record<string, unknown> });

describe("stateless Nitro API", () => {
  it("returns populated seeds and never retains visitor mutations", async () => {
    const first = await $fetch("/api/demo/bootstrap");
    expect(first.contacts.length).toBe(seed.contacts.length);
    first.profile.name = "Edited";
    expect((await $fetch("/api/demo/bootstrap")).profile.name).toBe("Alex Morgan");
  });
  it("accepts browser-created contacts and returns canonical validated input", async () => {
    const record = {
      ...seed.contacts[0]!,
      id: "browser-created",
      firstName: "  Ada  ",
      referredById: "",
    };
    const result = await post("/api/demo/contacts/save", { record, context });
    expect(result.id).toBe("browser-created");
    expect(result.firstName).toBe("Ada");
    const again = await $fetch("/api/demo/bootstrap");
    expect(again.contacts.some((item) => item.id === "browser-created")).toBe(false);
    const interaction = await post("/api/demo/interactions/save", {
      record: { ...seed.interactions[0]!, contactId: result.id },
      context: { ...context, contactIds: [...context.contactIds, result.id] },
    });
    expect(interaction.contactId).toBe(result.id);
  });
  it("rejects malformed records and unknown relationships with 400", async () => {
    const base = seed.contacts[0]!;
    for (const record of [
      { ...base, groupIds: ["missing-group"] },
      { ...base, referredById: "missing-contact" },
      { ...base, referredById: base.id },
      { ...base, birthday: "2026-13-01" },
      { ...base, emails: [{ label: "work", value: "nope", primary: true }] },
      { ...base, firstName: "", lastName: "", company: "", nickname: "" },
    ]) {
      await expect(post("/api/demo/contacts/save", { record, context })).rejects.toMatchObject({
        statusCode: 400,
      });
    }
    await expect(
      post("/api/demo/follow-ups/save", {
        record: { ...seed.followUps[0]!, contactId: "missing" },
        context,
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
  it("validates bulk actions against the ids the browser sends", async () => {
    const ids = seed.contacts.slice(0, 3).map((item) => item.id);
    const ok = await post("/api/demo/contacts/bulk", {
      action: "add-group",
      ids,
      value: seed.groups[0]!.id,
      context,
    });
    expect(ok).toMatchObject({ action: "add-group", count: 3 });
    await expect(
      post("/api/demo/contacts/bulk", { action: "add-group", ids, value: "missing", context })
    ).rejects.toMatchObject({ statusCode: 400 });
    await expect(
      post("/api/demo/contacts/bulk", { action: "add-group", ids, value: "", context })
    ).rejects.toMatchObject({ statusCode: 400 });
    await expect(
      post("/api/demo/contacts/bulk", { action: "archive", ids: ["ghost"], value: "", context })
    ).rejects.toMatchObject({ statusCode: 400 });
    await expect(
      post("/api/demo/contacts/bulk", { action: "explode", ids, value: "", context })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
  it("parses an import on the server and flags duplicates and bad rows", async () => {
    const existing = seed.contacts[0]!.emails[0]!.value;
    const csv = [
      "first_name,last_name,email",
      "Grace,Hopper,grace@example.com",
      `Again,Someone,${existing}`,
      "Broken,Row,nope",
    ].join("\n");
    const result = await post("/api/demo/contacts/import", {
      csv,
      context: { groups: [], emails: [existing] },
    });
    expect(result.total).toBe(3);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[1].duplicateOf).toBe(existing);
    expect(result.errors).toHaveLength(1);
    await expect(
      post("/api/demo/contacts/import", { csv: "", context: { groups: [], emails: [] } })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
  it("merges two contacts and names the record to remove", async () => {
    const [a, b] = [seed.contacts[0]!, seed.contacts[1]!];
    const result = await post("/api/demo/contacts/merge", { primary: a, secondary: b });
    expect(result.removedId).toBe(b.id);
    expect(result.merged.id).toBe(a.id);
    await expect(
      post("/api/demo/contacts/merge", { primary: a, secondary: a })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
  it("saves groups, settings and deletions", async () => {
    expect((await post("/api/demo/groups/save", { record: seed.groups[0] })).name).toBe(
      seed.groups[0]!.name
    );
    await expect(
      post("/api/demo/groups/save", { record: { ...seed.groups[0], color: "pink" } })
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(
      (
        await post("/api/demo/settings/save", {
          record: { profile: seed.profile, preferences: seed.preferences },
        })
      ).profile.id
    ).toBe(seed.profile.id);
    expect(await post("/api/demo/records/delete", { kind: "group", id: "group-1" })).toEqual({
      kind: "group",
      id: "group-1",
    });
    await expect(
      post("/api/demo/records/delete", { kind: "contact", id: "contact-1" })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
  it("validates demo auth without returning passwords", async () => {
    const account = await post("/api/demo/auth/signup", {
      name: "Demo Person",
      email: "demo@example.com",
      password: "fictional123",
    });
    expect(account.profile?.name).toBe("Demo Person");
    expect(JSON.stringify(account)).not.toContain("fictional123");
    const recovery = await post("/api/demo/auth/forgot-password", { email: "demo@example.com" });
    expect(recovery.resetLink).toBe("/reset-password?token=verdant-demo-reset");
    await expect(
      post("/api/demo/auth/reset-password", { token: "invalid", password: "fictional123" })
    ).rejects.toMatchObject({ statusCode: 400 });
    await expect(post("/api/demo/auth/unknown", {})).rejects.toMatchObject({ statusCode: 404 });
  });
});
