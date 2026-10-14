import { array, object, string } from "yup";

import { savedReportSchema } from "../../../../shared/schemas";
import { demoDelay, requireReference, validatedBody } from "../../../utils/validation";

export default defineEventHandler(async (event) => {
  const { record, context } = await validatedBody(
    event,
    object({
      record: savedReportSchema.required(),
      context: object({ siteIds: array().of(string().required()).required() }).required(),
    })
  );
  requireReference(record.siteId, context.siteIds as string[], "site");
  await demoDelay();
  return record;
});
