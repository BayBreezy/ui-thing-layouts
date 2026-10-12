import { readBody, createError } from "h3";
import type { H3Event } from "h3";
import { ValidationError } from "yup";
import type { AnyObjectSchema, InferType } from "yup";

export async function validatedBody<S extends AnyObjectSchema>(
  event: H3Event,
  schema: S
): Promise<InferType<S>> {
  try {
    return await schema.validate(await readBody(event), { abortEarly: false, stripUnknown: true });
  } catch (error) {
    if (error instanceof ValidationError)
      throw createError({
        statusCode: 400,
        statusMessage: "Please check your input",
        data: { errors: error.errors },
      });
    throw error;
  }
}
export const demoDelay = () => new Promise<void>((resolve) => setTimeout(resolve, 300));
