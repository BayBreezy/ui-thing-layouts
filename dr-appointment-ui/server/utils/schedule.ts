import { createError } from "h3";

import { bookingProblems, canTransition, needsSlot } from "../../shared/schedule";
import type { Appointment, AppointmentStatus, ScheduleContext } from "../../shared/types";

/** Throws a 400 listing every scheduling rule the appointment breaks. */
export function assertBookable(
  record: Appointment,
  context: ScheduleContext,
  options: { checkPast?: boolean } = {}
) {
  const problems = bookingProblems(record, context, options);
  if (problems.length)
    throw createError({
      statusCode: 400,
      statusMessage: "This visit can't be booked",
      data: { errors: problems },
    });
}
export function assertTransition(from: AppointmentStatus, to: AppointmentStatus) {
  if (from !== to && !canTransition(from, to))
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid status change",
      data: { errors: [`A ${from} visit can't become ${to}.`] },
    });
}
export { needsSlot };
