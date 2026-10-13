import { contactsFromCsv } from "../../../../../shared/csv";
import { importSchema } from "../../../../../shared/schemas";
import { demoDelay, validatedBody } from "../../../../utils/validation";
export default defineEventHandler(async (event) => {
  const { csv, context } = await validatedBody(event, importSchema);
  await demoDelay();
  return contactsFromCsv(csv, { groups: context.groups, emails: context.emails });
});
