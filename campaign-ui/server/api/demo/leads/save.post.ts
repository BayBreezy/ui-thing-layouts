import { object } from "yup";

import { leadSchema, contextSchema } from "../../../../shared/schemas";
import { demoDelay, requireReference, validatedBody } from "../../../utils/validation";
export default defineEventHandler(async (event) => {
  const { record, context } = await validatedBody(
    event,
    object({ record: leadSchema.required(), context: contextSchema.required() })
  );
  requireReference(record.ownerId, context.memberIds, "owner");
  requireReference(record.campaignId, context.campaignIds, "campaign");
  await demoDelay();
  return record;
});
