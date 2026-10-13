import { array, object, string } from "yup";

import { patientSchema } from "../../../../shared/schemas";
import { demoDelay, requireReference, validatedBody } from "../../../utils/validation";

export default defineEventHandler(async (event) => {
  const { record, context } = await validatedBody(
    event,
    object({
      record: patientSchema.required(),
      context: object({
        providerIds: array().of(string().required()).required().max(100),
        /** Other patients' emails, so a duplicate can be flagged without server state. */
        otherEmails: array().of(string().required()).required().max(5000),
      }).required(),
    })
  );
  requireReference(record.preferredProviderId, context.providerIds, "provider");
  if (context.otherEmails.some((value) => value.toLowerCase() === record.email.toLowerCase()))
    throw createError({
      statusCode: 400,
      statusMessage: "Duplicate patient",
      data: { errors: ["A patient with this email already exists."] },
    });
  await demoDelay();
  return record;
});
