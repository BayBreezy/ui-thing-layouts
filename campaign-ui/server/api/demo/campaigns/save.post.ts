import { object } from "yup";

import { campaignSchema, contextSchema } from "../../../../shared/schemas";
import { demoDelay, requireReference, validatedBody } from "../../../utils/validation";
export default defineEventHandler(async (event) => {
  const { record, context } = await validatedBody(
    event,
    object({ record: campaignSchema.required(), context: contextSchema.required() })
  );
  requireReference(record.ownerId, context.memberIds, "owner");
  record.memberIds.forEach((id) => requireReference(id, context.memberIds, "team member"));
  await demoDelay();
  return record;
});
