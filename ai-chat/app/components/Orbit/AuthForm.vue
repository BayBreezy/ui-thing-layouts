<script setup lang="ts">
  import { loginSchema, signupSchema, recoverySchema, resetSchema } from "#shared/schemas";
  import type { Profile } from "#shared/types";
  const props = defineProps<{ mode: "login" | "signup" | "forgot-password" | "reset-password" }>();
  const route = useRoute();
  const { state } = useDemo();
  const config = {
    login: {
      title: "Welcome back",
      description: "A fresh perspective is just a conversation away.",
      action: "Log in to demo",
      schema: loginSchema,
    },
    signup: {
      title: "Find your orbit",
      description: "Make a little room for your next big idea.",
      action: "Create demo account",
      schema: signupSchema,
    },
    "forgot-password": {
      title: "Forgot your password?",
      description: "We'll show you a demo link to reset it.",
      action: "Get demo reset link",
      schema: recoverySchema,
    },
    "reset-password": {
      title: "A fresh start",
      description: "Choose a password to complete the simulated reset.",
      action: "Reset demo password",
      schema: resetSchema,
    },
  }[props.mode];
  const { handleSubmit, isSubmitting } = useForm({
    validationSchema: config.schema,
    initialValues: { email: "", password: "", name: "", token: String(route.query.token ?? "") },
  });
  const error = ref("");
  const success = ref(false);
  const resetLink = ref("");
  const submit = handleSubmit(async (values) => {
    error.value = "";
    try {
      const result = await $fetch<{ profile?: Profile; resetLink?: string }>(
        `/api/demo/auth/${props.mode}`,
        { method: "POST", body: values }
      );
      if (result.profile && state.value) {
        state.value.profile = result.profile;
        useSonner.success("Welcome to your demo workspace");
        await navigateTo("/");
      } else {
        success.value = true;
        resetLink.value = result.resetLink ?? "";
      }
    } catch (err) {
      error.value = apiError(err);
    }
  });
</script>
<template>
  <div>
    <h1 class="text-2xl font-semibold tracking-tight">{{ config.title }}</h1>
    <p class="mt-2 mb-6 text-sm text-muted-foreground">{{ config.description }}</p>
    <UiAlert
      v-if="mode === 'reset-password' && route.query.token !== 'orbit-demo-reset'"
      role="alert"
      variant="destructive"
      icon="lucide:circle-alert"
    >
      <div class="space-y-4">
        <p class="text-sm">This demo reset link is invalid. Request a new link to continue.</p>
        <UiButton to="/forgot-password" variant="outline" class="w-full">
          Get a new demo reset link
        </UiButton>
      </div>
    </UiAlert>
    <UiAlert v-else-if="success" role="status" icon="lucide:circle-check" icon-class="text-primary">
      <div class="space-y-4">
        <p class="text-sm">
          {{
            mode === "forgot-password"
              ? "Your demo reset link is ready. No email was sent."
              : "Demo password reset complete. No password was stored."
          }}
        </p>
        <UiButton v-if="resetLink" :to="resetLink" class="w-full">Open demo reset link</UiButton>
        <UiButton v-else to="/login" class="w-full">Back to login</UiButton>
      </div>
    </UiAlert>
    <form v-else class="space-y-5" @submit="submit">
      <UiVeeInput
        v-if="mode === 'signup'"
        name="name"
        label="Full name"
        autocomplete="name"
        placeholder="Alex Morgan"
      />
      <UiVeeInput
        v-if="mode !== 'reset-password'"
        name="email"
        label="Email address"
        type="email"
        autocomplete="email"
        placeholder="you@example.com"
      />
      <UiVeePasswordInput
        v-if="mode !== 'forgot-password'"
        name="password"
        label="Password"
        :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
        :show-strength="mode !== 'login'"
        hint="At least 8 characters. Use a fictional password for this demo."
      />
      <NuxtLink
        v-if="mode === 'login'"
        to="/forgot-password"
        class="block text-right text-sm text-primary underline-offset-4 hover:underline"
        >Forgot password?</NuxtLink
      >
      <p v-if="error" role="alert" class="text-sm text-destructive">{{ error }}</p>
      <UiButton type="submit" :loading="isSubmitting" class="w-full">
        {{ config.action }}<Icon name="lucide:arrow-right" />
      </UiButton>
    </form>
    <p v-if="mode === 'login'" class="mt-6 text-center text-sm text-muted-foreground">
      New to Orbit?
      <NuxtLink to="/signup" class="font-medium text-primary underline-offset-4 hover:underline"
        >Create an account</NuxtLink
      >
    </p>
    <p v-else class="mt-6 text-center text-sm text-muted-foreground">
      Already have an account?
      <NuxtLink to="/login" class="font-medium text-primary underline-offset-4 hover:underline"
        >Log in</NuxtLink
      >
    </p>
    <div class="my-6 flex items-center gap-4">
      <UiSeparator class="flex-1" />
      <span class="text-xs text-muted-foreground">or explore first</span>
      <UiSeparator class="flex-1" />
    </div>
    <UiButton to="/" variant="outline" class="w-full">Continue demo</UiButton>
  </div>
</template>
