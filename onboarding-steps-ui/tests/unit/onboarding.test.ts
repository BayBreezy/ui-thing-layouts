import { describe, expect, it } from "vitest";

import {
  cleanInvites,
  clampStep,
  inviteSchema,
  maxInvites,
  registerSchema,
  steps,
  verifySchema,
} from "../../shared/onboarding";

describe("steps", () => {
  it("are numbered 1 to 4 in order", () => {
    expect(steps.map((step) => step.id)).toEqual([1, 2, 3, 4]);
  });
});

describe("registerSchema", () => {
  it("accepts a valid email and an 8 character password", async () => {
    await expect(
      registerSchema.validate({ email: "jo@example.com", password: "12345678" })
    ).resolves.toBeTruthy();
  });
  it("trims the email", async () => {
    const value = await registerSchema.validate({
      email: "  jo@example.com ",
      password: "12345678",
    });
    expect(value.email).toBe("jo@example.com");
  });
  it.each([
    [{ email: "", password: "12345678" }, "Enter your email address"],
    [{ email: "nope", password: "12345678" }, "Enter a valid email address"],
    [{ email: "jo@example.com", password: "" }, "Choose a password"],
    [{ email: "jo@example.com", password: "short" }, "Use at least 8 characters"],
  ])("rejects %j", async (input, message) => {
    await expect(registerSchema.validate(input)).rejects.toThrow(message);
  });
});

describe("verifySchema", () => {
  it("needs exactly five digits", async () => {
    const ok = { email: "jo@example.com", code: "48213" };
    await expect(verifySchema.validate(ok)).resolves.toBeTruthy();
    for (const code of ["", "1234", "123456", "12a45"])
      await expect(verifySchema.validate({ ...ok, code })).rejects.toThrow();
  });
});

describe("inviteSchema", () => {
  const base = { email: "jo@example.com" };
  it("allows blank rows and none at all", async () => {
    await expect(inviteSchema.validate({ ...base, members: ["", "a@b.co"] })).resolves.toBeTruthy();
    await expect(inviteSchema.validate(base)).resolves.toMatchObject({ members: [] });
  });
  it("rejects a bad address and too many people", async () => {
    await expect(inviteSchema.validate({ ...base, members: ["nope"] })).rejects.toThrow(
      "Enter a valid email address"
    );
    const many = Array.from({ length: maxInvites + 1 }, (_, i) => `p${i}@example.com`);
    await expect(inviteSchema.validate({ ...base, members: many })).rejects.toThrow(
      `up to ${maxInvites}`
    );
  });
});

describe("cleanInvites", () => {
  it("drops blanks, repeats (ignoring case) and the person's own address", () => {
    expect(
      cleanInvites(
        [" Sam@Example.com ", "", null, "sam@example.com", "JO@example.com", "lee@x.io"],
        "jo@example.com"
      )
    ).toEqual(["Sam@Example.com", "lee@x.io"]);
  });
});

describe("clampStep", () => {
  it("never runs ahead of the furthest reached step", () => {
    expect(clampStep("3", 1)).toBe(1);
    expect(clampStep("3", 3)).toBe(3);
    expect(clampStep("9", 4)).toBe(4);
  });
  it("falls back to the first step for junk", () => {
    for (const value of [undefined, "", "abc", "0", "-2", null])
      expect(clampStep(value, 4)).toBe(1);
  });
});
