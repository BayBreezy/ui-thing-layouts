import { object } from "yup";

import { settingsSchema, contextSchema } from "../../../../shared/schemas";
import { demoDelay, requireReference, validatedBody } from "../../../utils/validation";
export default defineEventHandler(async (event) => {
  const { record, context } = await validatedBody(
    event,
    object({ record: settingsSchema.required(), context: contextSchema.required() })
  );
  requireReference(record.profile.id, context.memberIds, "profile");
  await demoDelay();
  return record;
});
