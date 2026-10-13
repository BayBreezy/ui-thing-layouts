import { object } from "yup";

import { settingsSchema } from "../../../../../shared/schemas";
import { demoDelay, validatedBody } from "../../../../utils/validation";
export default defineEventHandler(async (event) => {
  const { record } = await validatedBody(event, object({ record: settingsSchema.required() }));
  await demoDelay();
  return record;
});
