import { authSchemas } from "../../../../shared/schemas";
import { demoDelay, validatedBody } from "../../../utils/validation";
export default defineEventHandler(async (event) => {
  const action = getRouterParam(event, "action");
  if (!action || !Object.hasOwn(authSchemas, action))
    throw createError({ statusCode: 404, statusMessage: "Unknown demo account action" });
  const body = await validatedBody(event, authSchemas[action as keyof typeof authSchemas]);
  await demoDelay();
  if (action === "forgot-password")
    return { simulated: true, resetLink: "/reset-password?token=launchpad-demo-reset" };
  if (action === "reset-password") return { simulated: true, success: true };
  return {
    simulated: true,
    profile: {
      id: "member-1",
      name: "name" in body ? body.name : "Alex Morgan",
      email: "email" in body ? body.email : "alex@example.com",
      role: "Campaign strategist",
    },
  };
});
