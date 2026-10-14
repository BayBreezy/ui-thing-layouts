import { object, string } from "yup";

import { deletableKinds } from "../../../../shared/schemas";
import { demoDelay, validatedBody } from "../../../utils/validation";

export default defineEventHandler(async (event) => {
  const { kind, id } = await validatedBody(
    event,
    object({
      kind: string()
        .oneOf([...deletableKinds])
        .required(),
      id: string().required(),
    })
  );
  await demoDelay();
  return { kind, id, deleted: true };
});
