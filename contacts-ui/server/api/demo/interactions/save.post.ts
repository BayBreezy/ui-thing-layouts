import { object } from "yup";

import { contextSchema, interactionSchema } from "../../../../shared/schemas";
import { demoDelay, requireReference, validatedBody } from "../../../utils/validation";
export default defineEventHandler(async (event) => {
  const { record, context } = await validatedBody(
    event,
    object({ record: interactionSchema.required(), context: contextSchema.required() })
  );
  requireReference(record.contactId, context.contactIds, "contact");
  await demoDelay();
  return record;
});
