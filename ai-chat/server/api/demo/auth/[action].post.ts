import { loginSchema, signupSchema, recoverySchema, resetSchema } from "../../../../shared/schemas";
import { validatedBody, demoDelay } from "../../../utils/validation";
export default defineEventHandler(async (event) => {
  const action = getRouterParam(event, "action");
  if (action === "logout") return { success: true };
  if (action === "forgot-password") {
    await validatedBody(event, recoverySchema);
    await demoDelay();
    return { resetLink: "/reset-password?token=orbit-demo-reset", simulated: true };
  }
  if (action === "reset-password") {
    await validatedBody(event, resetSchema);
    await demoDelay();
    return { success: true, simulated: true };
  }
  if (action !== "login" && action !== "signup")
    throw createError({ statusCode: 404, statusMessage: "Unknown demo action" });
  const body = await validatedBody(event, action === "signup" ? signupSchema : loginSchema);
  await demoDelay();
  const name =
    "name" in body ? String(body.name) : body.email.split("@")[0]!.replace(/[._-]/g, " ");
  return {
    profile: {
      id: "local-demo-user",
      name: name.length >= 2 ? name : "Orbit explorer",
      email: body.email,
      role: "Orbit explorer",
    },
    simulated: true,
  };
});
