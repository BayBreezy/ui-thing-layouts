<template>
  <StepContainer>
    <Heading title="Verify your email" description="We sent a code to your email" />
    <form class="mt-8 w-full" @submit="submit">
      <fieldset :disabled="isSubmitting" class="grid grid-cols-1 gap-6">
        <div
          class="grid place-items-center [&>div>div>div]:justify-center [&_.text-destructive]:text-center [&_input]:size-14 [&_input]:text-2xl [&_input]:font-bold"
        >
          <UiVeePinInput otp type="number" name="otp" :input-count="5" />
        </div>
        <div>
          <p class="text-center text-sm text-muted-foreground">
            Didn't get a code?
            <NuxtLink class="text-foreground underline underline-offset-2" to="#"
              >Click to resend</NuxtLink
            >
          </p>
        </div>

        <div>
          <UiButton :loading="isSubmitting" type="submit" class="w-full">
            <span>Verify Account</span>
          </UiButton>
        </div>
      </fieldset>
    </form>
  </StepContainer>
</template>

<script lang="ts" setup>
  import { promiseTimeout } from "@vueuse/core";
  import { array, object, string } from "yup";

  const { nextStep } = useTimeline();

  const schema = object({
    otp: array()
      .of(string().required("Value is required"))
      .min(5, "Code must be 5 digits")
      .max(5, "Code must be 5 digits")
      .label("OTP"),
  });

  const { handleSubmit, isSubmitting } = useForm({
    name: "verify-form",
    validationSchema: toTypedSchema(schema),
  });

  const submit = handleSubmit(async (values) => {
    await promiseTimeout(2000);
    console.log(values);
    useSonner.success("Account Verified", {
      description: "Thank you for verifying your account",
    });
    nextStep();
  });
</script>
