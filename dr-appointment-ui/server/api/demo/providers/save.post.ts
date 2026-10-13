import { array, object, string } from "yup";

import { providerSchema } from "../../../../shared/schemas";
import { demoDelay, requireReference, validatedBody } from "../../../utils/validation";

export default defineEventHandler(async (event) => {
  const { record, context } = await validatedBody(
    event,
    object({
      record: providerSchema.required(),
      context: object({
        visitTypeIds: array().of(string().required()).required().max(100),
      }).required(),
    })
  );
  record.visitTypeIds.forEach((id) => requireReference(id, context.visitTypeIds, "visit type"));
  await demoDelay();
  return record;
});
