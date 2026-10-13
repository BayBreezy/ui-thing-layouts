import { object, string } from "yup";

import { needsSlot } from "../../../../shared/schedule";
import { appointmentSchema, scheduleContextSchema } from "../../../../shared/schemas";
import type { AppointmentStatus, ScheduleContext } from "../../../../shared/types";
import { appointmentStatuses } from "../../../../shared/types";
import { assertBookable, assertTransition } from "../../../utils/schedule";
import { demoDelay, validatedBody } from "../../../utils/validation";

export default defineEventHandler(async (event) => {
  const { record, from, context } = await validatedBody(
    event,
    object({
      record: appointmentSchema.required(),
      from: string().oneOf(appointmentStatuses).required(),
      context: scheduleContextSchema.required(),
    })
  );
  assertTransition(from as AppointmentStatus, record.status);
  // Putting a cancelled or missed visit back on the schedule needs its slot to still be free.
  if (needsSlot(from as AppointmentStatus, record.status))
    assertBookable(record, context as ScheduleContext, { checkPast: true });
  await demoDelay();
  return record;
});
