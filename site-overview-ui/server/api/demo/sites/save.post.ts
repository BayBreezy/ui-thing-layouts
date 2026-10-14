import { object } from "yup";

import { siteSchema } from "../../../../shared/schemas";
import { demoDelay, validatedBody } from "../../../utils/validation";

export default defineEventHandler(async (event) => {
  const { record } = await validatedBody(event, object({ record: siteSchema.required() }));
  await demoDelay();
  return record;
});
