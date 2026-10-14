import { authSchemas } from "../../../../shared/schemas";
import { demoDelay, validatedBody } from "../../../utils/validation";

export default defineEventHandler(async (event) => {
  const action = getRouterParam(event, "action");
  if (!action || !Object.hasOwn(authSchemas, action))
    throw createError({ statusCode: 404, statusMessage: "Unknown demo account action" });
  const body = await validatedBody(event, authSchemas[action as keyof typeof authSchemas]);
  await demoDelay();
  if (action === "forgot-password")
    return { simulated: true, resetLink: "/reset-password?token=beacon-demo-reset" };
  if (action === "reset-password") return { simulated: true, success: true };
  return {
    simulated: true,
    profile: {
      id: "profile-1",
      name: "name" in body ? body.name : "Jordan Ellis",
      email: "email" in body ? body.email : "jordan.ellis@example.com",
      role: "Growth lead",
    },
  };
});
