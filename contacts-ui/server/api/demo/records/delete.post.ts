import { deleteSchema } from "../../../../shared/schemas";
import { demoDelay, validatedBody } from "../../../utils/validation";
export default defineEventHandler(async (event) => {
  const { kind, id } = await validatedBody(event, deleteSchema);
  await demoDelay();
  return { kind, id };
});
