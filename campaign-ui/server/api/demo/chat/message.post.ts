import { chatSchema } from "../../../../shared/schemas";
import { demoDelay, requireReference, validatedBody } from "../../../utils/validation";
export default defineEventHandler(async (event) => {
  const body = await validatedBody(event, chatSchema);
  requireReference(body.memberId, body.context.memberIds, "sender");
  requireReference(body.replyMemberId, body.context.memberIds, "teammate");
  await demoDelay();
  const createdAt = new Date().toISOString();
  return {
    threadId: body.threadId,
    messages: [
      {
        id: crypto.randomUUID(),
        memberId: body.memberId,
        content: body.content,
        createdAt,
        simulated: false,
      },
      {
        id: crypto.randomUUID(),
        memberId: body.replyMemberId,
        content:
          "Thanks for the update. I'll review this with the team and add it to our next campaign check-in.",
        createdAt,
        simulated: true,
      },
    ],
  };
});
