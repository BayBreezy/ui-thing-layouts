// @vitest-environment nuxt
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";

import Progress from "~/components/Waypoint/Progress.vue";

const active = (html: string) => (html.match(/data-active="true"/g) ?? []).length;

describe("Progress", () => {
  it("fills one bar on the first step", async () => {
    const wrapper = await mountSuspended(Progress, { route: "/" });
    expect(wrapper.findAll("[data-bar]")).toHaveLength(4);
    expect(active(wrapper.html())).toBe(1);
    expect(wrapper.text()).toContain("Step 1 of 4");
  });

  it("does not run ahead of the steps that were completed", async () => {
    const wrapper = await mountSuspended(Progress, { route: "/?step=3" });
    expect(active(wrapper.html())).toBe(1);
  });
});
