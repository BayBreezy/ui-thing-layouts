import { assistantSchema } from "../../../../shared/schemas";
import { validatedBody, demoDelay } from "../../../utils/validation";
export default defineEventHandler(async (event) => {
  const assistant = await validatedBody(event, assistantSchema);
  await demoDelay();
  return assistant;
});
