import { array, object, string } from "yup";

import { waitlistSchema } from "../../../../shared/schemas";
import { demoDelay, requireReference, validatedBody } from "../../../utils/validation";

export default defineEventHandler(async (event) => {
  const { record, context } = await validatedBody(
    event,
    object({
      record: waitlistSchema.required(),
      context: object({
        patientIds: array().of(string().required()).required().max(5000),
        providerIds: array().of(string().required()).required().max(100),
        visitTypeIds: array().of(string().required()).required().max(100),
      }).required(),
    })
  );
  requireReference(record.patientId, context.patientIds, "patient");
  requireReference(record.visitTypeId, context.visitTypeIds, "visit type");
  requireReference(record.providerId, context.providerIds, "provider");
  await demoDelay();
  return record;
});
