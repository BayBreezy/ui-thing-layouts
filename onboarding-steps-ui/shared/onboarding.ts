import { array, object, string } from "yup";

/** The four steps, in order. The sidebar, progress bars and page all read from this list. */
export const steps = [
  {
    id: 1,
    key: "account",
    title: "Your details",
    description: "Provide your email and password",
    icon: "lucide:user-round",
  },
  {
    id: 2,
    key: "verify",
    title: "Verify your email",
    description: "Enter your verification code",
    icon: "lucide:mail-check",
  },
  {
    id: 3,
    key: "team",
    title: "Invite your team",
    description: "Start collaborating with your team",
    icon: "lucide:users-round",
  },
  {
    id: 4,
    key: "welcome",
    title: "Welcome to Waypoint",
    description: "You're all set up and ready to go",
    icon: "lucide:rocket",
  },
] as const;

export type StepId = (typeof steps)[number]["id"];

export const maxInvites = 4;
export const codeLength = 5;
/** This address is always "already registered", so the server-side error state can be seen. */
export const takenEmail = "taken@example.com";
/** This code is always rejected, so the failed-verification state can be seen. */
export const rejectedCode = "00000";

const email = () => string().trim().email("Enter a valid email address").label("Email");

export const registerSchema = object({
  email: email().required("Enter your email address"),
  password: string()
    .required("Choose a password")
    .min(8, "Use at least 8 characters")
    .max(128, "Use 128 characters or fewer")
    .label("Password"),
});

export const verifySchema = object({
  email: email().required(),
  code: string()
    .required("Enter the 5-digit code")
    .matches(new RegExp(`^\\d{${codeLength}}$`), `Enter the ${codeLength}-digit code`),
});

export const inviteSchema = object({
  email: email().required(),
  // Blank rows are allowed so a half-filled form is not an error; they are dropped before sending.
  members: array()
    .of(email())
    .max(maxInvites, `You can invite up to ${maxInvites} people here`)
    .default([]),
});

/** Trims, drops blanks and removes repeats (ignoring case), keeping the first spelling. */
export function cleanInvites(raw: readonly (string | null | undefined)[], ownEmail = "") {
  const seen = new Set([ownEmail.trim().toLowerCase()]);
  const result: string[] = [];
  for (const entry of raw) {
    const value = (entry ?? "").trim();
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

/** Zero-based position of the step that `reached` allows, clamped to the real steps. */
export function clampStep(requested: unknown, reached: number): StepId {
  const wanted = Number.parseInt(String(requested ?? ""), 10);
  const limit = Math.min(Math.max(reached, 1), steps.length);
  if (!Number.isFinite(wanted) || wanted < 1) return 1;
  return Math.min(wanted, limit) as StepId;
}
