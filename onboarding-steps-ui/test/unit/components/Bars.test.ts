// @vitest-environment nuxt
import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import Bars from "~/components/Bars.vue";
import { describe, expect, it, vi } from "vitest";

const timelineMock = {
  steps: [
    {
      id: 1,
      title: "Your details",
      description: "Provide your email and password",
      icon: "i:user-01",
    },
    {
      id: 2,
      title: "Verify your email",
      description: "Enter your verification code",
      icon: "i:mail-01",
    },
  ],
  currentStep: 1,
  nextStep: vi.fn(),
  prevStep: vi.fn(),
};
const { useCurrentTimelineStep, useTimeline } = vi.hoisted(() => {
  return {
    useCurrentTimelineStep: vi.fn(() => 1),
    useTimeline: vi.fn(() => {
      return { ...timelineMock };
    }),
  };
});

mockNuxtImport("useCurrentTimelineStep", () => useCurrentTimelineStep);
mockNuxtImport("useTimeline", () => useTimeline);

describe("Bars", () => {
  it("should render bg-primary class once", async () => {
    const component = await mountSuspended(Bars);
    const count = component.html().match(/bg-primary/g)?.length;
    expect(count).toBe(1);
  });
});
