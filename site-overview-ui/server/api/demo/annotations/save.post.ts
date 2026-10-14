import { array, object, string } from "yup";

import { demoDelay, requireReference, validatedBody } from "../../../utils/validation";

export default defineEventHandler(async (event) => {
  const { record, context } = await validatedBody(
    event,
    object({
      record: object({
        id: string().required().max(80),
        siteId: string().required().max(80),
        date: string()
          .required("Pick a date")
          .matches(/^\d{4}-\d{2}-\d{2}$/, "Pick a real date"),
        label: string().trim().required("Add a short note").max(120),
        kind: string().oneOf(["deploy", "campaign", "incident", "note"]).required(),
      }).required(),
      context: object({ siteIds: array().of(string().required()).required() }).required(),
    })
  );
  requireReference(record.siteId, context.siteIds as string[], "site");
  await demoDelay();
  return record;
});
