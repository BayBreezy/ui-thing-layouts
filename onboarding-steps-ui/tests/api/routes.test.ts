import { fileURLToPath } from "node:url";

import { setup, $fetch } from "@nuxt/test-utils/e2e";
import { describe, expect, it } from "vitest";

import { rejectedCode, takenEmail } from "../../shared/onboarding";

await setup({
  rootDir: fileURLToPath(new URL("../..", import.meta.url)),
  server: true,
  browser: false,
  dev: true,
  nuxtConfig: { devtools: { enabled: false } },
});

const post = <T = any>(url: string, body: unknown) =>
  $fetch<T>(url, { method: "POST", body: body as Record<string, unknown> });
const failure = async (url: string, body: unknown) => {
  try {
    await post(url, body);
  } catch (cause) {
    return cause as { statusCode?: number; data?: any };
  }
  throw new Error("expected the request to fail");
};

describe("onboarding API", () => {
  it("registers a new address", async () => {
    const result = await post("/api/onboarding/register", {
      email: "jo@example.com",
      password: "correct-horse",
    });
    expect(result).toMatchObject({ simulated: true, email: "jo@example.com" });
  });

  it("refuses an address that is already registered", async () => {
    const error = await failure("/api/onboarding/register", {
      email: takenEmail,
      password: "correct-horse",
    });
    expect(error.statusCode).toBe(409);
    expect(error.data?.data?.field).toBe("email");
  });

  it("validates the registration body", async () => {
    const error = await failure("/api/onboarding/register", { email: "nope", password: "x" });
    expect(error.statusCode).toBe(400);
    expect(error.data?.data?.errors?.length).toBeGreaterThan(0);
  });

  it("verifies any five digits except the rejected code", async () => {
    const ok = await post("/api/onboarding/verify", { email: "jo@example.com", code: "48213" });
    expect(ok).toMatchObject({ verified: true });
    const bad = await failure("/api/onboarding/verify", {
      email: "jo@example.com",
      code: rejectedCode,
    });
    expect(bad.statusCode).toBe(422);
    const short = await failure("/api/onboarding/verify", { email: "jo@example.com", code: "12" });
    expect(short.statusCode).toBe(400);
  });

  it("returns the cleaned invite list", async () => {
    const result = await post("/api/onboarding/invite", {
      email: "jo@example.com",
      members: ["sam@example.com", "SAM@example.com", "jo@example.com", "lee@example.com"],
    });
    expect(result.invited).toEqual(["sam@example.com", "lee@example.com"]);
  });

  it("answers 404 for an unknown action", async () => {
    const error = await failure("/api/onboarding/delete-everything", {});
    expect(error.statusCode).toBe(404);
  });
});
