import { object } from "yup";

import { briefSchema, contextSchema } from "../../../../shared/schemas";
import { demoDelay, requireReference, validatedBody } from "../../../utils/validation";
export default defineEventHandler(async (event) => {
  const { record, context } = await validatedBody(
    event,
    object({ record: briefSchema.required(), context: contextSchema.required() })
  );
  requireReference(record.campaignId, context.campaignIds, "campaign");
  await demoDelay();
  return record;
});
