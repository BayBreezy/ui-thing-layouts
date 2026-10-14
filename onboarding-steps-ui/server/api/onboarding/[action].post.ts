import {
  cleanInvites,
  inviteSchema,
  registerSchema,
  rejectedCode,
  takenEmail,
  verifySchema,
} from "../../../shared/onboarding";
import { demoDelay, validatedBody } from "../../utils/validation";

/**
 * Simulated onboarding endpoints. Nothing is stored and no email is sent; the responses exist so
 * the form states (loading, field errors, success) behave like a real service.
 */
export default defineEventHandler(async (event) => {
  const action = getRouterParam(event, "action");

  if (action === "register") {
    const body = await validatedBody(event, registerSchema);
    await demoDelay();
    if (body.email.toLowerCase() === takenEmail)
      throw createError({
        statusCode: 409,
        statusMessage: "That email is already registered",
        data: { field: "email", errors: ["That email is already registered. Try signing in."] },
      });
    return { simulated: true, email: body.email };
  }

  if (action === "verify") {
    const body = await validatedBody(event, verifySchema);
    await demoDelay();
    if (body.code === rejectedCode)
      throw createError({
        statusCode: 422,
        statusMessage: "That code didn't match",
        data: { field: "code", errors: ["That code didn't match. Check it and try again."] },
      });
    return { simulated: true, verified: true };
  }

  if (action === "invite") {
    const body = await validatedBody(event, inviteSchema);
    await demoDelay();
    const invited = cleanInvites(body.members, body.email);
    return { simulated: true, invited };
  }

  throw createError({ statusCode: 404, statusMessage: "Unknown onboarding action" });
});
