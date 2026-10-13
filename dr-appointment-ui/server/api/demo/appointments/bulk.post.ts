import { array, object, string } from "yup";

import { canTransition } from "../../../../shared/schedule";
import { bulkActions } from "../../../../shared/schemas";
import { appointmentStatuses } from "../../../../shared/types";
import { demoDelay, validatedBody } from "../../../utils/validation";

export default defineEventHandler(async (event) => {
  const { action, items } = await validatedBody(
    event,
    object({
      action: string()
        .oneOf([...bulkActions])
        .required(),
      items: array()
        .of(
          object({
            id: string().required(),
            status: string().oneOf(appointmentStatuses).required(),
          })
        )
        .required()
        .min(1)
        .max(500),
    })
  );
  const target = action === "confirm" ? "confirmed" : "cancelled";
  const ids: string[] = [];
  const skipped: string[] = [];
  for (const item of items) {
    if (item.status !== target && canTransition(item.status as never, target)) ids.push(item.id);
    else skipped.push(item.id);
  }
  await demoDelay();
  return { action, status: target, ids, skipped };
});
