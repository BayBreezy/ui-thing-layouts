<template>
  <UiDialog v-model:open="open">
    <UiDialogTrigger as-child><slot /></UiDialogTrigger>
    <UiDialogContent
      disable-outside-pointer-events
      trap-focus
      class="md:max-w-md md:rounded-2xl"
      @escape-key-down="(e) => e.preventDefault()"
      @interact-outside="(e) => e.preventDefault()"
      @pointer-down-outside="(e) => e.preventDefault()"
    >
      <div
        class="mx-auto flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-primary/50 text-primary-foreground shadow-sm"
      >
        <Icon name="solar:bolt-bold" class="size-6" />
      </div>
      <UiDialogTitle class="mt-3 text-center text-lg font-semibold"
        >Sign in to your account</UiDialogTitle
      >
      <div class="mb-4 mt-2 grid grid-cols-2 gap-2">
        <UiButton size="sm" variant="secondary">
          <Icon name="logos:google-icon" />
          <span>Sign in with Google</span>
        </UiButton>
        <UiButton size="sm" variant="secondary">
          <Icon name="logos:apple" />
          <span>Sign in with Apple</span>
        </UiButton>
      </div>
      <UiDivider label="Or use Email" />
      <form @submit="submit">
        <fieldset :disabled="isSubmitting" class="grid grid-cols-1 gap-3">
          <div class="mt-3 grid grid-cols-1 divide-y rounded-lg border bg-background shadow-sm">
            <UiVeeInput name="email" type="email" placeholder="Email address" class="border-none" />
            <UiVeeInput
              name="password"
              type="password"
              placeholder="Password"
              class="border-none"
            />
          </div>
          <div class="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <UiVeeCheckbox
              class="*:leading-none"
              name="remember"
              label="Remember me on this device"
            />
            <NuxtLink class="underline underline-offset-2 md:text-sm" to="#"
              >Forgot password?</NuxtLink
            >
          </div>
          <div class="mt-3">
            <UiButton type="submit" :loading="isSubmitting" class="w-full">Sign in</UiButton>
          </div>
        </fieldset>
      </form>
      <p class="mt-2 text-center text-sm text-muted-foreground">
        Not a member?
        <NuxtLink to="#" class="text-foreground underline underline-offset-2"
          >Start a 14-day trial</NuxtLink
        >
      </p>
    </UiDialogContent>
  </UiDialog>
</template>

<script lang="ts" setup>
  import { promiseTimeout } from "@vueuse/core";
  import { bool, object, string } from "yup";

  const schema = object({
    email: string().email().required().label("Email"),
    password: string().required().label("Password").min(8),
    remember: bool().label("Remember me").default(true),
  });
  const open = defineModel<boolean>();

  const { handleSubmit, isSubmitting } = useForm({
    name: "sign-in-form",
    validationSchema: toTypedSchema(schema),
  });

  const submit = handleSubmit(async (values) => {
    await promiseTimeout(2000);
    console.log(values);
  });
</script>
