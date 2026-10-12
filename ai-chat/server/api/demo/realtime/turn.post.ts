import { chatSchema } from "../../../../shared/schemas";
import { createReply } from "../../../utils/fixtures";
import { validatedBody, demoDelay } from "../../../utils/validation";
export default defineEventHandler(async (event) => {
  const body = await validatedBody(event, chatSchema);
  await demoDelay();
  const result = createReply(
    body.prompt,
    body.preferences,
    body.workspaceId,
    body.assistant,
    body.turn
  );
  result.usage.source = "realtime";
  return result;
});
