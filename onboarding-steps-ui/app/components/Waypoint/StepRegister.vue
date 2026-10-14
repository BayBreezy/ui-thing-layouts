<script setup lang="ts">
  import { toTypedSchema } from "@vee-validate/yup";

  import { registerSchema } from "#shared/onboarding";

  const { progress, complete } = useOnboarding();
  const { handleSubmit, isSubmitting, setFieldError } = useForm({
    name: "register-form",
    validationSchema: toTypedSchema(registerSchema),
    initialValues: { email: progress.value.email, password: "" },
  });

  const submit = handleSubmit(async (values) => {
    try {
      const result = await $fetch<{ email: string }>("/api/onboarding/register", {
        method: "POST",
        body: values,
      });
      useSonner.success("Account created", {
        description: "We sent a verification code to your email.",
      });
      await complete({ email: result.email });
    } catch (cause: any) {
      const errors: string[] | undefined = cause?.data?.data?.errors;
      if (cause?.data?.data?.field === "email" && errors?.[0]) setFieldError("email", errors[0]);
      else useSonner.error("We couldn't create your account", { description: "Please try again." });
    }
  });

  const social = (provider: string) =>
    useSonner.info(`${provider} sign-up isn't part of this demo`, {
      description: "Continue with email to see the full flow.",
    });
</script>
<template>
  <WaypointStep>
    <WaypointHeading
      title="Create a free account"
      description="Provide your email and choose a password"
    />
    <form class="w-full" novalidate @submit.prevent="submit">
      <fieldset :disabled="isSubmitting" class="grid grid-cols-1 gap-5">
        <UiVeeInput
          label="Email"
          name="email"
          required
          type="email"
          autocomplete="email"
          placeholder="you@company.com"
        />
        <UiVeePasswordInput
          label="Password"
          name="password"
          required
          autocomplete="new-password"
          placeholder="At least 8 characters"
          show-strength
          :requirements="['length', 'number', 'uppercase', 'special']"
        />
        <UiButton type="submit" :loading="isSubmitting" class="w-full">
          Continue with email
        </UiButton>
        <div class="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden="true">
          <UiSeparator class="flex-1" />
          <span>OR</span>
          <UiSeparator class="flex-1" />
        </div>
        <div class="grid gap-3">
          <UiButton type="button" variant="outline" class="w-full" @click="social('Google')">
            <Icon name="logos:google-icon" />
            <span>Sign up with Google</span>
          </UiButton>
          <UiButton type="button" variant="outline" class="w-full" @click="social('Apple')">
            <Icon name="logos:apple" class="dark:invert" />
            <span>Sign up with Apple</span>
          </UiButton>
        </div>
      </fieldset>
    </form>
  </WaypointStep>
</template>
