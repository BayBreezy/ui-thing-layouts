import { object, string } from "yup";

import { addMinutes, openStarts, referenceFor } from "../../../../shared/schedule";
import { bookingSchema, scheduleContextSchema } from "../../../../shared/schemas";
import type { Appointment, ScheduleContext } from "../../../../shared/types";
import { assertBookable } from "../../../utils/schedule";
import { demoDelay, validatedBody } from "../../../utils/validation";

/**
 * The public booking endpoint. It re-checks the chosen slot the way the staff endpoint does, so
 * a slot taken while the patient filled in the form is refused rather than double-booked.
 */
export default defineEventHandler(async (event) => {
  const { booking, id, patientId, now, context, existingPatientId } = await validatedBody(
    event,
    object({
      booking: bookingSchema.required(),
      id: string().required(),
      patientId: string().required(),
      /** A matched patient, resolved client-side by email, so the booking attaches to them. */
      existingPatientId: string().defined().default(""),
      now: string().required(),
      context: scheduleContextSchema.required(),
    })
  );
  const ctx = context as ScheduleContext;
  const visit = ctx.visitTypes.find((item) => item.id === booking.visitTypeId);
  if (!visit) throw createError({ statusCode: 400, statusMessage: "Unknown visit type" });
  // "First available" arrives without a provider. Pick the first one who is free at that time.
  const providerId =
    booking.providerId ||
    ctx.providers.find(
      (item) =>
        item.active &&
        item.visitTypeIds.includes(visit.id) &&
        openStarts({
          provider: item,
          minutes: visit.minutes,
          date: booking.date,
          appointments: ctx.appointments,
          slotMinutes: ctx.slotMinutes,
        }).includes(booking.start)
    )?.id ||
    "";
  const effectivePatientId = existingPatientId || patientId;
  const candidate: Appointment = {
    id,
    reference: referenceFor(id),
    patientId: effectivePatientId,
    providerId,
    visitTypeId: booking.visitTypeId,
    date: booking.date,
    start: booking.start,
    end: addMinutes(booking.start, visit.minutes),
    status: "scheduled",
    reason: booking.reason,
    notes: "",
    source: "online",
    createdAt: now,
    updatedAt: now,
  };
  const provider = ctx.providers.find((item) => item.id === providerId);
  if (!provider)
    throw createError({
      statusCode: 400,
      statusMessage: "That time is no longer available",
      data: { errors: ["That time is no longer available. Please pick another."] },
    });
  assertBookable(
    candidate,
    { ...ctx, patientIds: [...ctx.patientIds, effectivePatientId] },
    { checkPast: true }
  );
  await demoDelay();
  return { appointment: candidate };
});
