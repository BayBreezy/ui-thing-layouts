import { object } from "yup";

import { groupSchema } from "../../../../shared/schemas";
import { demoDelay, validatedBody } from "../../../utils/validation";
export default defineEventHandler(async (event) => {
  const { record } = await validatedBody(event, object({ record: groupSchema.required() }));
  await demoDelay();
  return record;
});
