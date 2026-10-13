import { object, string } from "yup";

import {
  appointmentSchema,
  previousPlacementSchema,
  scheduleContextSchema,
} from "../../../../shared/schemas";
import type { ScheduleContext } from "../../../../shared/types";
import { assertBookable, assertTransition } from "../../../utils/schedule";
import { demoDelay, validatedBody } from "../../../utils/validation";

export default defineEventHandler(async (event) => {
  const { record, previous, previousStatus, context } = await validatedBody(
    event,
    object({
      record: appointmentSchema.required(),
      previous: previousPlacementSchema.default(undefined),
      previousStatus: string().defined().default(""),
      context: scheduleContextSchema.required(),
    })
  );
  if (previousStatus) assertTransition(previousStatus as typeof record.status, record.status);
  // A visit that stays where it is can still be edited after its time has passed.
  const moved =
    !previous ||
    previous.providerId !== record.providerId ||
    previous.date !== record.date ||
    previous.start !== record.start;
  assertBookable(record, context as ScheduleContext, { checkPast: moved });
  await demoDelay();
  return record;
});
