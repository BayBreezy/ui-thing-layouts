import { recordingSchema } from "../../../../shared/schemas";
import { transcript } from "../../../utils/fixtures";
import { validatedBody, demoDelay } from "../../../utils/validation";
export default defineEventHandler(async (event) => {
  const body = await validatedBody(event, recordingSchema);
  await demoDelay();
  const segments =
    body.name === "The first five minutes"
      ? transcript
      : [
          {
            speaker: "Demo speaker",
            start: 0,
            end: body.duration / 3,
            text: "A small idea can be a useful starting point. Choose one thing to explore.",
          },
          {
            speaker: "Demo speaker",
            start: body.duration / 3,
            end: (body.duration * 2) / 3,
            text: "Make a rough prototype, share it with a few people, and listen for what feels unclear.",
          },
          {
            speaker: "Demo speaker",
            start: (body.duration * 2) / 3,
            end: body.duration,
            text: "Keep the next step small. Write down what you learned before expanding the idea.",
          },
        ];
  return { segments, simulated: true as const };
});
