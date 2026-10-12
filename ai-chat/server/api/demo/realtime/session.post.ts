import { sessionSchema } from "../../../../shared/schemas";
import { validatedBody, demoDelay } from "../../../utils/validation";
export default defineEventHandler(async (event) => {
  const body = await validatedBody(event, sessionSchema);
  await demoDelay();
  return {
    id: crypto.randomUUID(),
    workspaceId: body.workspaceId,
    name: body.name,
    createdAt: new Date().toISOString(),
    messages: [],
    summary: "",
  };
});
