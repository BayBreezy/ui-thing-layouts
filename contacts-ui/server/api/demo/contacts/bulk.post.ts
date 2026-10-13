import { bulkSchema } from "../../../../../shared/schemas";
import { demoDelay, requireReference, validatedBody } from "../../../../utils/validation";
export default defineEventHandler(async (event) => {
  const body = await validatedBody(event, bulkSchema);
  body.ids.forEach((id) => requireReference(id, body.context.contactIds, "contact"));
  if (body.action === "add-group" || body.action === "remove-group") {
    if (!body.value) throw createError({ statusCode: 400, statusMessage: "Choose a group" });
    requireReference(body.value, body.context.groupIds, "group");
  }
  if ((body.action === "add-label" || body.action === "remove-label") && !body.value.trim())
    throw createError({ statusCode: 400, statusMessage: "Enter a label" });
  await demoDelay();
  return { action: body.action, ids: body.ids, value: body.value.trim(), count: body.ids.length };
});
