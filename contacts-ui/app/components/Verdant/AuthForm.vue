<script setup lang="ts">
  import type { AnyObjectSchema } from "yup";

  import { authSchemas } from "#shared/schemas";
  import type { Profile } from "#shared/types";
  const props = defineProps<{ action: keyof typeof authSchemas }>();
  const { state, ready, request } = useDemo();
  const { pending, error, run } = useAction();
  const resetLink = ref("");
  const complete = ref(false);
  const route = useRoute();
  const schema = computed(() => authSchemas[props.action]);
  const { handleSubmit } = useForm({
    validationSchema: toTypedSchema(schema.value as AnyObjectSchema),
    initialValues: { name: "", email: "", password: "", token: String(route.query.token || "") },
  });
  const submit = handleSubmit(async (values) => {
    const result = await run(() =>
      request<{ profile?: Profile; resetLink?: string; success?: boolean }>(
        "/api/demo/auth/" + props.action,
        values
      )
    );
    if (!result) return;
    if (result.profile && state.value) {
      state.value.profile = result.profile;
      state.value.signedIn = true;
      await navigateTo("/");
    }
    if (result.resetLink) resetLink.value = result.resetLink;
    if (result.success) complete.value = true;
  });
  const titles = {
    login: "Welcome back.",
    signup: "Start with the people you know.",
    "forgot-password": "A fresh start is easy.",
    "reset-password": "Choose a demo password.",
  };
</script>
<template>
  <div>
    <h1 class="text-2xl font-semibold tracking-tight">{{ titles[action] }}</h1>
    <p class="mt-2 mb-6 text-sm text-muted-foreground">
      {{
        action === "login"
          ? "Try a fictional identity, or head straight into your contacts."
          : action === "signup"
            ? "A local demo identity. No real account is created."
            : "No email is sent, and no real password is changed."
      }}
    </p>
    <UiAlert v-if="complete" role="status" icon="lucide:circle-check" icon-class="text-primary">
      <div class="space-y-4">
        <p class="text-sm">Your demo reset is complete. No password was stored.</p>
        <UiButton to="/login" class="w-full">Back to demo sign in</UiButton>
      </div>
    </UiAlert>
    <UiAlert
      v-else-if="resetLink"
      role="status"
      icon="lucide:circle-check"
      icon-class="text-primary"
    >
      <div class="space-y-4">
        <p class="text-sm">Here's your demo recovery link. No email was sent.</p>
        <UiButton :to="resetLink" class="w-full">Open demo reset link</UiButton>
      </div>
    </UiAlert>
    <form v-else class="space-y-5" @submit="submit">
      <fieldset :disabled="pending || !ready" class="space-y-5">
        <UiVeeInput
          v-if="action === 'signup'"
          name="name"
          label="Name"
          autocomplete="name"
          placeholder="Alex Morgan"
        />
        <UiVeeInput
          v-if="action !== 'reset-password'"
          name="email"
          type="email"
          label="Email"
          autocomplete="email"
          placeholder="you@example.com"
        />
        <UiVeePasswordInput
          v-if="action !== 'forgot-password'"
          name="password"
          label="Demo password"
          :autocomplete="action === 'login' ? 'current-password' : 'new-password'"
          :show-strength="action !== 'login'"
          hint="Use a fictional password with at least 8 characters."
        />
        <NuxtLink
          v-if="action === 'login'"
          to="/forgot-password"
          class="block text-right text-sm text-primary underline-offset-4 hover:underline"
          >Forgot password?</NuxtLink
        >
        <VerdantError :message="error" />
        <UiButton type="submit" class="w-full" :loading="pending">
          {{
            action === "login"
              ? "Sign in to demo"
              : action === "signup"
                ? "Create demo identity"
                : action === "forgot-password"
                  ? "Get demo reset link"
                  : "Complete demo reset"
          }}<Icon name="lucide:arrow-right" />
        </UiButton>
      </fieldset>
    </form>
    <p v-if="action === 'login'" class="mt-6 text-center text-sm text-muted-foreground">
      New to Verdant?
      <NuxtLink to="/signup" class="font-medium text-primary underline-offset-4 hover:underline"
        >Try demo signup</NuxtLink
      >
    </p>
    <p v-else class="mt-6 text-center text-sm text-muted-foreground">
      Already have a demo identity?
      <NuxtLink to="/login" class="font-medium text-primary underline-offset-4 hover:underline"
        >Back to sign in</NuxtLink
      >
    </p>
    <div class="my-6 flex items-center gap-4">
      <UiSeparator class="flex-1" />
      <span class="text-xs text-muted-foreground">or explore first</span>
      <UiSeparator class="flex-1" />
    </div>
    <UiButton to="/" variant="outline" class="w-full">Continue to your contacts</UiButton>
  </div>
</template>
