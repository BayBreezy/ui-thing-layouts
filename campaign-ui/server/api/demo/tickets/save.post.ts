import { object } from "yup";

import { ticketSchema, contextSchema } from "../../../../shared/schemas";
import { demoDelay, validatedBody } from "../../../utils/validation";
export default defineEventHandler(async (event) => {
  const { record } = await validatedBody(
    event,
    object({ record: ticketSchema.required(), context: contextSchema.required() })
  );
  await demoDelay();
  return {
    ...record,
    status: "Open" as const,
    response:
      "Thanks for sharing this with Launchpad. This is a simulated support response. Your ticket is saved in this browser; no message was sent to a support team. Try the guides for a walkthrough of this feature.",
  };
});
