<script setup lang="ts">
  import { toTypedSchema } from "@vee-validate/yup";
  import { array, object, string } from "yup";

  import { codeLength, rejectedCode } from "#shared/onboarding";

  const { progress, complete, back } = useOnboarding();

  const schema = object({
    otp: array()
      .of(
        string().matches(/^\d$/, "Use digits only").required(`Enter the ${codeLength}-digit code`)
      )
      .length(codeLength, `Enter the ${codeLength}-digit code`)
      .required(`Enter the ${codeLength}-digit code`),
  });
  const { handleSubmit, isSubmitting, setFieldError, resetForm } = useForm({
    name: "verify-form",
    validationSchema: toTypedSchema(schema),
    initialValues: { otp: [] as string[] },
  });

  const submit = handleSubmit(async (values) => {
    try {
      await $fetch("/api/onboarding/verify", {
        method: "POST",
        body: { email: progress.value.email, code: values.otp.join("") },
      });
      useSonner.success("Email verified", { description: "Thanks for confirming your address." });
      await complete();
    } catch (cause: any) {
      const message = cause?.data?.data?.errors?.[0];
      if (message) setFieldError("otp", message);
      else useSonner.error("We couldn't verify that code", { description: "Please try again." });
    }
  });

  // Resending is simulated, with a short wait so it cannot be hammered.
  const wait = ref(0);
  const timer = useIntervalFn(
    () => {
      wait.value = Math.max(0, wait.value - 1);
      if (!wait.value) timer.pause();
    },
    1000,
    { immediate: false }
  );
  function resend() {
    wait.value = 30;
    timer.resume();
    resetForm({ values: { otp: [] } });
    useSonner.success("A new code is on its way", {
      description: "This is a demo, so nothing is actually sent.",
    });
  }
</script>
<template>
  <WaypointStep>
    <WaypointHeading
      title="Verify your email"
      :description="
        progress.email ? `We sent a code to ${progress.email}` : 'We sent a code to your email'
      "
    />
    <form class="w-full" novalidate @submit.prevent="submit">
      <fieldset :disabled="isSubmitting" class="grid grid-cols-1 gap-6">
        <div>
          <UiVeePinInput
            otp
            name="otp"
            label="Verification code"
            :input-count="codeLength"
            class="[&_input]:h-14 [&_input]:w-auto [&_input]:min-w-0 [&_input]:flex-1 [&_input]:text-xl [&_input]:font-semibold"
            :hint="`Demo: any ${codeLength} digits work, except ${rejectedCode}.`"
          />
        </div>
        <UiButton type="submit" :loading="isSubmitting" class="w-full">Verify account</UiButton>
        <p class="text-center text-sm text-muted-foreground">
          Didn't get a code?
          <button
            type="button"
            class="font-medium text-foreground underline underline-offset-2 disabled:no-underline disabled:opacity-60"
            :disabled="wait > 0"
            @click="resend"
          >
            {{ wait > 0 ? `Resend in ${wait}s` : "Click to resend" }}
          </button>
        </p>
        <UiButton type="button" variant="ghost" class="mx-auto" @click="back()">
          <Icon name="lucide:arrow-left" /> Back
        </UiButton>
      </fieldset>
    </form>
  </WaypointStep>
</template>
