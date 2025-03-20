// @vitest-environment nuxt
import { mountSuspended } from "@nuxt/test-utils/runtime";
import Heading from "~/components/Heading.vue";
import { describe, expect, it } from "vitest";

describe("Heading", () => {
  it("should render the title & description passed in as props", async () => {
    const component = await mountSuspended(Heading, {
      props: { title: "My Heading", description: "My Description" },
    });
    expect(component.props().description).toBe("My Description");
    expect(component.props().title).toBe("My Heading");
  });
});
