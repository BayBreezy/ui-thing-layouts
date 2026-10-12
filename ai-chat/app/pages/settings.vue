<script setup lang="ts">
  import { settingsSchema } from "#shared/schemas";
  import type { DemoState, Preferences, Profile } from "#shared/types";
  usePageSeo({
    title: "Settings",
    description:
      "Update your demo profile, choose a theme, set default chat preferences, and export or reset your local data.",
  });
  const { state, ready } = useDemo();
  const colorMode = useColorMode();
  const themes = [
    { value: "light", label: "Light", icon: "lucide:sun" },
    { value: "dark", label: "Dark", icon: "lucide:moon" },
    { value: "system", label: "System", icon: "lucide:monitor" },
  ];
  const profile = ref<Profile>({ id: "", name: "", email: "", role: "" });
  const preferences = ref<Preferences>(defaultPrefs());
  function defaultPrefs() {
    return {
      modelId: "orbit-pro",
      writingStyle: "concise" as const,
      format: "markdown" as const,
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.9,
    };
  }
  watch(
    [ready, state],
    () => {
      if (ready.value && state.value) {
        profile.value = { ...state.value.profile };
        preferences.value = { ...state.value.preferences };
      }
    },
    { immediate: true }
  );
  const busy = ref(false);
  const error = ref("");
  const resetting = ref(false);
  const resetOpen = ref(false);
  async function save() {
    busy.value = true;
    error.value = "";
    try {
      const body = await settingsSchema.validate(
        { profile: profile.value, preferences: preferences.value },
        { abortEarly: false }
      );
      const result = await $fetch<{ profile: Profile; preferences: Preferences }>(
        "/api/demo/settings/save",
        { method: "POST", body }
      );
      if (state.value) {
        state.value.profile = result.profile;
        state.value.preferences = result.preferences;
      }
      useSonner.success("Settings saved");
    } catch (err) {
      error.value = apiError(err);
    } finally {
      busy.value = false;
    }
  }
  async function reset() {
    resetting.value = true;
    try {
      const seed = await $fetch<DemoState>("/api/demo/bootstrap");
      await clearBlobs().catch(() => {});
      state.value = seed;
      resetOpen.value = false;
      useSonner.success("Demo restored");
      await navigateTo("/");
    } catch (err) {
      error.value = apiError(err);
    } finally {
      resetting.value = false;
    }
  }
</script>
<template>
  <div class="page-shell">
    <OrbitPageHeader
      title="Make yourself at home"
      description="A workspace that works the way you do."
    />
    <form v-if="ready" class="grid items-start gap-6 lg:grid-cols-3" @submit.prevent="save">
      <div class="space-y-6 lg:col-span-2">
        <UiCard>
          <UiCardHeader>
            <UiCardTitle as="h2">Your profile</UiCardTitle>
            <UiCardDescription>Your demo identity, stored in this browser.</UiCardDescription>
          </UiCardHeader>
          <UiCardContent class="space-y-6">
            <div class="flex items-center gap-4">
              <UiAvatar class="size-14">
                <UiAvatarFallback class="text-lg">{{ profile.name.slice(0, 1) }}</UiAvatarFallback>
              </UiAvatar>
              <div>
                <p class="text-sm font-medium">{{ profile.name }}</p>
                <p class="text-sm text-muted-foreground">{{ profile.role }}</p>
              </div>
            </div>
            <div class="grid gap-5 sm:grid-cols-2">
              <div class="space-y-2">
                <UiLabel for="profile-name">Full name</UiLabel>
                <UiInput id="profile-name" v-model="profile.name" autocomplete="name" />
              </div>
              <div class="space-y-2">
                <UiLabel for="profile-email">Email address</UiLabel>
                <UiInput
                  id="profile-email"
                  v-model="profile.email"
                  type="email"
                  autocomplete="email"
                />
              </div>
            </div>
          </UiCardContent>
        </UiCard>
        <UiCard>
          <UiCardHeader>
            <UiCardTitle as="h2">Appearance</UiCardTitle>
            <UiCardDescription>Choose a comfortable view for your workspace.</UiCardDescription>
          </UiCardHeader>
          <UiCardContent>
            <ClientOnly>
              <div class="grid grid-cols-3 gap-3">
                <UiButton
                  v-for="theme in themes"
                  :key="theme.value"
                  type="button"
                  :variant="colorMode.preference === theme.value ? 'default' : 'outline'"
                  :aria-pressed="colorMode.preference === theme.value"
                  @click="colorMode.preference = theme.value"
                >
                  <Icon :name="theme.icon" />{{ theme.label }}
                </UiButton>
              </div>
            </ClientOnly>
          </UiCardContent>
        </UiCard>
        <UiCard>
          <UiCardHeader>
            <UiCardTitle as="h2">Your data stays here</UiCardTitle>
            <UiCardDescription>
              Conversations and settings live in browser storage. Recordings and attachments stay on
              your device. Exports include text and metadata; they do not include media files.
            </UiCardDescription>
          </UiCardHeader>
          <UiCardFooter class="flex-wrap gap-3">
            <UiButton
              type="button"
              variant="outline"
              @click="
                downloadText('orbit-demo.json', JSON.stringify(state, null, 2), 'application/json')
              "
            >
              <Icon name="lucide:download" />Export demo data
            </UiButton>
            <UiButton type="button" variant="destructive" @click="resetOpen = true">
              Reset demo
            </UiButton>
          </UiCardFooter>
        </UiCard>
        <p v-if="error" role="alert" class="text-sm text-destructive">{{ error }}</p>
        <UiButton type="submit" :disabled="!ready" :loading="busy">Save changes</UiButton>
      </div>
      <UiCard>
        <UiCardHeader>
          <UiCardTitle as="h2">Default chat preferences</UiCardTitle>
          <UiCardDescription>Applied to every new conversation.</UiCardDescription>
        </UiCardHeader>
        <UiCardContent>
          <OrbitPreferences v-model="preferences" hide-header />
        </UiCardContent>
      </UiCard>
    </form>
    <UiSkeleton v-else class="h-96" />
    <UiAlertDialog v-model:open="resetOpen">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>Restore the original demo?</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            This removes your local conversations, assistants, recordings, and profile changes.
            Export your data first if you want to keep it.
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel>Cancel</UiAlertDialogCancel>
          <UiButton :loading="resetting" @click="reset">Reset demo</UiButton>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  </div>
</template>
