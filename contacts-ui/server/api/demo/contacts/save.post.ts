import { object } from "yup";

import { contactSchema, contextSchema } from "../../../../shared/schemas";
import { demoDelay, requireReference, validatedBody } from "../../../utils/validation";
export default defineEventHandler(async (event) => {
  const { record, context } = await validatedBody(
    event,
    object({ record: contactSchema.required(), context: contextSchema.required() })
  );
  record.groupIds.forEach((id) => requireReference(id, context.groupIds, "group"));
  if (record.referredById === record.id)
    throw createError({ statusCode: 400, statusMessage: "A contact cannot refer themselves" });
  requireReference(record.referredById, context.contactIds, "referrer");
  await demoDelay();
  return record;
});
