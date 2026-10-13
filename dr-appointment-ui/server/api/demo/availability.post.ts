import { number, object, string } from "yup";

import { availability } from "../../../shared/schedule";
import { scheduleContextSchema } from "../../../shared/schemas";
import type { ScheduleContext } from "../../../shared/types";
import { demoDelay, requireReference, validatedBody } from "../../utils/validation";

export default defineEventHandler(async (event) => {
  const { visitTypeId, providerId, from, days, ignoreId, context } = await validatedBody(
    event,
    object({
      visitTypeId: string().required(),
      providerId: string().defined(),
      from: string()
        .required()
        .matches(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date"),
      days: number().integer().min(1).max(31).required(),
      ignoreId: string().defined().default(""),
      context: scheduleContextSchema.required(),
    })
  );
  const visitType = context.visitTypes.find((item) => item.id === visitTypeId);
  if (!visitType) throw createError({ statusCode: 400, statusMessage: "Unknown visit type" });
  requireReference(
    providerId,
    context.providers.map((item) => item.id),
    "provider"
  );
  await demoDelay();
  return {
    days: availability({
      visitType,
      providerId,
      from,
      days,
      context: context as ScheduleContext,
      ignoreId: ignoreId || undefined,
    }),
  };
});
