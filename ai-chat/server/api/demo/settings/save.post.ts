import { settingsSchema } from "../../../../shared/schemas";
import { validatedBody, demoDelay } from "../../../utils/validation";
export default defineEventHandler(async (event) => {
  const settings = await validatedBody(event, settingsSchema);
  await demoDelay();
  return settings;
});
