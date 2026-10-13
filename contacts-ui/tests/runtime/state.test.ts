import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, nextTick } from "vue";

import { useDemo } from "../../app/composables/useDemo";
import { createDemoState } from "../../server/utils/fixtures";
const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));
mockNuxtImport("$fetch", () => fetchMock);

describe("connected workspace mutations", () => {
  beforeEach(() => {
    const demo = useDemo();
    demo.state.value = createDemoState();
    demo.revision.value = 0;
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (url: string, options: { body: any }) => {
      if (url.endsWith("/bulk"))
        return {
          ids: options.body.ids,
          value: options.body.value,
          count: options.body.ids.length,
        };
      return JSON.parse(JSON.stringify(options.body.record ?? options.body));
    });
  });
  it("updates reactive views, activity and notifications when a contact is archived", async () => {
    const demo = useDemo();
    const active = computed(() => demo.state.value!.contacts.filter((c) => !c.archived).length);
    const original = active.value;
    await demo.saveContact({ ...demo.state.value!.contacts[0]!, archived: true });
    await nextTick();
    expect(active.value).toBe(original - 1);
    expect(demo.state.value!.activity[0]!.title).toContain("archived");
    expect(demo.state.value!.notifications[0]!.read).toBe(false);
    await demo.saveContact({ ...demo.state.value!.contacts[0]!, archived: false });
    expect(active.value).toBe(original);
  });
  it("applies bulk group, label and favorite changes only to the chosen contacts", async () => {
    const demo = useDemo();
    const ids = demo.state.value!.contacts.slice(0, 2).map((c) => c.id);
    await demo.bulk("add-label", ids, "VIP");
    await demo.bulk("favorite", ids);
    for (const contact of demo.state.value!.contacts) {
      const chosen = ids.includes(contact.id);
      expect(contact.labels.includes("VIP")).toBe(chosen || contact.labels.includes("VIP"));
      if (chosen) expect(contact.favorite).toBe(true);
    }
    await demo.bulk("remove-label", ids, "VIP");
    expect(demo.state.value!.contacts[0]!.labels).not.toContain("VIP");
  });
  it("cascades a permanent delete to history, follow-ups and referrers", async () => {
    const demo = useDemo();
    const target = demo.state.value!.contacts.find((c) =>
      demo.state.value!.contacts.some((other) => other.referredById === c.id)
    )!;
    await demo.bulk("delete", [target.id]);
    const state = demo.state.value!;
    expect(state.contacts.some((c) => c.id === target.id)).toBe(false);
    expect(state.interactions.some((i) => i.contactId === target.id)).toBe(false);
    expect(state.followUps.some((f) => f.contactId === target.id)).toBe(false);
    expect(state.contacts.some((c) => c.referredById === target.id)).toBe(false);
    expect(state.activity.some((a) => a.contactId === target.id)).toBe(false);
  });
  it("keeps last-contacted in step with the logged interactions", async () => {
    const demo = useDemo();
    const contact = demo.state.value!.contacts[0]!;
    const occurredAt = "2026-10-12T18:00:00.000Z";
    const record = { id: "log-1", contactId: contact.id, type: "call", summary: "Hi", occurredAt };
    await demo.logInteraction(record as never);
    expect(demo.state.value!.contacts[0]!.lastContactedAt).toBe(occurredAt);
    await demo.deleteInteraction("log-1");
    expect(demo.state.value!.contacts[0]!.lastContactedAt).not.toBe(occurredAt);
  });
  it("merges two contacts, moving history and follow-ups to the survivor", async () => {
    const demo = useDemo();
    const [primary, secondary] = [demo.state.value!.contacts[0]!, demo.state.value!.contacts[1]!];
    fetchMock.mockImplementationOnce(async () => ({
      merged: { ...primary, notes: "merged" },
      removedId: secondary.id,
    }));
    const moved = demo.state.value!.interactions.filter((i) => i.contactId === secondary.id).length;
    const before = demo.state.value!.interactions.filter((i) => i.contactId === primary.id).length;
    await demo.merge(primary, secondary);
    const state = demo.state.value!;
    expect(state.contacts.some((c) => c.id === secondary.id)).toBe(false);
    expect(state.contacts.find((c) => c.id === primary.id)!.notes).toBe("merged");
    expect(state.interactions.filter((i) => i.contactId === primary.id)).toHaveLength(
      before + moved
    );
  });
  it("preserves a record when the API fails", async () => {
    const demo = useDemo();
    const name = demo.state.value!.contacts[0]!.firstName;
    fetchMock.mockRejectedValue(new Error("offline"));
    await expect(
      demo.saveContact({ ...demo.state.value!.contacts[0]!, firstName: "Unconfirmed" })
    ).rejects.toThrow("offline");
    expect(demo.state.value!.contacts[0]!.firstName).toBe(name);
  });
  it("prevents an old mutation from writing after reset even if transport ignores abort", async () => {
    const demo = useDemo();
    let complete!: (value: unknown) => void;
    fetchMock.mockImplementation(async (url: string) =>
      url === "/api/demo/bootstrap"
        ? createDemoState()
        : new Promise((resolve) => {
            complete = resolve;
          })
    );
    const proposed = { ...demo.state.value!.contacts[0]!, firstName: "Stale change" };
    const caught = demo.saveContact(proposed).catch((error) => error);
    await demo.resetDemo();
    complete(proposed);
    expect((await caught).message).toContain("reset");
    expect(demo.state.value!.contacts[0]!.firstName).not.toBe("Stale change");
  });
  it("commits imported rows once, skipping ids it already has", async () => {
    const demo = useDemo();
    const before = demo.state.value!.contacts.length;
    const contact = { ...demo.state.value!.contacts[0]!, id: "imported-1", source: "import" };
    const rows = [{ line: 2, contact, duplicateOf: "" }] as never;
    expect(demo.commitImport(rows)).toHaveLength(1);
    expect(demo.commitImport(rows)).toHaveLength(0);
    expect(demo.state.value!.contacts).toHaveLength(before + 1);
  });
});
