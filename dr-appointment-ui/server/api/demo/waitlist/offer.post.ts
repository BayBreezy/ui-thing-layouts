import { object, string } from "yup";

import { addMinutes } from "../../../../shared/schedule";
import {
  appointmentSchema,
  scheduleContextSchema,
  waitlistSchema,
} from "../../../../shared/schemas";
import type { Appointment, ScheduleContext } from "../../../../shared/types";
import { assertBookable } from "../../../utils/schedule";
import { demoDelay, validatedBody } from "../../../utils/validation";

/** Turns a waitlist entry into a booking in a chosen open slot, after re-checking the slot. */
export default defineEventHandler(async (event) => {
  const { entry, slot, context, id, now } = await validatedBody(
    event,
    object({
      entry: waitlistSchema.required(),
      slot: object({
        providerId: string().required(),
        date: string().required(),
        start: string().required(),
      }).required(),
      id: string().required(),
      now: string().required(),
      context: scheduleContextSchema.required(),
    })
  );
  const visit = (context as ScheduleContext).visitTypes.find(
    (item) => item.id === entry.visitTypeId
  );
  if (!visit) throw createError({ statusCode: 400, statusMessage: "Unknown visit type" });
  const candidate = await appointmentSchema.validate(
    {
      id,
      reference: "PENDING",
      patientId: entry.patientId,
      providerId: slot.providerId,
      visitTypeId: entry.visitTypeId,
      date: slot.date,
      start: slot.start,
      end: addMinutes(slot.start, visit.minutes),
      status: "confirmed",
      reason: entry.notes.slice(0, 300),
      notes: "",
      source: "waitlist",
      createdAt: now,
      updatedAt: now,
    },
    { stripUnknown: true }
  );
  assertBookable(candidate as Appointment, context as ScheduleContext, { checkPast: true });
  await demoDelay();
  return { appointment: candidate, entryId: entry.id };
});
