import { mergeContacts } from "../../../../../shared/duplicates";
import { mergeSchema } from "../../../../../shared/schemas";
import { demoDelay, validatedBody } from "../../../../utils/validation";
export default defineEventHandler(async (event) => {
  const { primary, secondary } = await validatedBody(event, mergeSchema);
  if (primary.id === secondary.id)
    throw createError({ statusCode: 400, statusMessage: "Choose two different contacts" });
  await demoDelay();
  return {
    merged: mergeContacts(primary, secondary, new Date().toISOString()),
    removedId: secondary.id,
  };
});
