<script setup lang="ts">
  import { profileSchema } from "#shared/schemas";
  const { state, saveSettings, resetDemo } = useDemo();
  const form = ref(clone({ profile: state.value!.profile, preferences: state.value!.preferences }));
  const { pending, error, run } = useAction();
  const { validate } = useForm();
  const { dirty, markSaved } = useUnsaved(form);
  const resetOpen = ref(false);
  const sections = [
    { value: "profile", label: "Profile", icon: "lucide:user" },
    { value: "preferences", label: "Preferences", icon: "lucide:sliders-horizontal" },
    { value: "data", label: "Your data", icon: "lucide:database" },
    { value: "identity", label: "Demo identity", icon: "lucide:shield-check" },
  ];
  // The active tab lives in the URL (`/settings?tab=data`). The default tab keeps a clean URL, and
  // unknown values fall back to it. `replace` keeps tab changes out of the history stack.
  const route = useRoute();
  const router = useRouter();
  const tab = computed({
    get: () => sections.find((item) => item.value === route.query.tab)?.value ?? "profile",
    set: (value: string) => {
      void router.replace({
        query: { ...route.query, tab: value === "profile" ? undefined : value },
      });
    },
  });
  const themes = [
    { value: "light", label: "Light", icon: "lucide:sun" },
    { value: "dark", label: "Dark", icon: "lucide:moon" },
    { value: "system", label: "System", icon: "lucide:monitor" },
  ] as const;
  async function save() {
    // Inactive panels stay mounted (`unmount-on-hide`), so every field is validated even when
    // saving from another tab. Bring the user back to the invalid ones.
    if (!(await validate()).valid) {
      tab.value = "profile";
      return;
    }
    const result = await run(() => saveSettings(form.value));
    if (result) {
      form.value = clone(result);
      markSaved();
      useSonner.success("Preferences saved");
    }
  }
  async function reset() {
    const result = await run(async () => {
      await resetDemo();
      return true;
    });
    if (result) {
      form.value = clone({ profile: state.value!.profile, preferences: state.value!.preferences });
      markSaved();
      resetOpen.value = false;
      useSonner.success("A fresh workspace is ready");
    }
  }
  function exportSnapshot() {
    downloadFile(
      "launchpad-workspace.json",
      JSON.stringify(state.value, null, 2),
      "application/json"
    );
  }
</script>
<template>
  <div>
    <UiTabs v-model="tab" :unmount-on-hide="false" class="max-w-3xl gap-6">
      <UiTabsList class="max-w-full justify-start overflow-x-auto">
        <UiTabsTrigger v-for="item in sections" :key="item.value" :value="item.value" class="gap-2">
          <Icon :name="item.icon" />{{ item.label }}
        </UiTabsTrigger>
      </UiTabsList>
      <form @submit.prevent="save">
        <fieldset :disabled="pending">
          <UiTabsContent value="profile">
            <UiCard>
              <UiCardHeader>
                <UiCardTitle as="h2">Your profile</UiCardTitle>
                <UiCardDescription>Your demo identity, stored in this browser.</UiCardDescription>
                <UiCardAction v-if="dirty">
                  <UiBadge variant="outline">Unsaved changes</UiBadge>
                </UiCardAction>
              </UiCardHeader>
              <UiCardContent class="space-y-6">
                <div class="flex items-center gap-4">
                  <LaunchpadAvatar
                    :member="state?.members.find((m) => m.id === state?.profile.id)"
                    size="xl"
                  />
                  <div>
                    <p class="text-sm font-medium">{{ form.profile.name }}</p>
                    <p class="text-sm text-muted-foreground">{{ form.profile.role }}</p>
                  </div>
                </div>
                <div class="grid gap-5 @xl:grid-cols-2">
                  <UiVeeInput
                    v-model="form.profile.name"
                    name="name"
                    label="Name"
                    :rules="profileSchema.fields.name"
                  />
                  <UiVeeInput
                    v-model="form.profile.email"
                    name="email"
                    type="email"
                    label="Email"
                    :rules="profileSchema.fields.email"
                  />
                  <UiVeeInput
                    v-model="form.profile.role"
                    name="role"
                    label="Role"
                    :rules="profileSchema.fields.role"
                  />
                </div>
                <LaunchpadError :message="error" />
              </UiCardContent>
              <UiCardFooter>
                <UiButton type="submit" :loading="pending">Save changes</UiButton>
              </UiCardFooter>
            </UiCard>
          </UiTabsContent>
          <UiTabsContent value="preferences">
            <UiCard>
              <UiCardHeader>
                <UiCardTitle as="h2">Preferences</UiCardTitle>
                <UiCardDescription>Choose a comfortable view for your workspace.</UiCardDescription>
                <UiCardAction v-if="dirty">
                  <UiBadge variant="outline">Unsaved changes</UiBadge>
                </UiCardAction>
              </UiCardHeader>
              <UiCardContent class="space-y-6">
                <div class="space-y-2">
                  <p id="settings-appearance" class="text-sm leading-none font-medium">
                    Appearance
                  </p>
                  <div
                    class="grid grid-cols-3 gap-3"
                    role="group"
                    aria-labelledby="settings-appearance"
                  >
                    <UiButton
                      v-for="theme in themes"
                      :key="theme.value"
                      type="button"
                      :variant="form.preferences.appearance === theme.value ? 'default' : 'outline'"
                      :aria-pressed="form.preferences.appearance === theme.value"
                      @click="form.preferences.appearance = theme.value"
                    >
                      <Icon :name="theme.icon" />{{ theme.label }}
                    </UiButton>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <UiSwitch id="settings-notify" v-model="form.preferences.notify" />
                  <UiLabel for="settings-notify" class="font-normal"
                    >Show notifications for new activity</UiLabel
                  >
                </div>
                <LaunchpadError :message="error" />
              </UiCardContent>
              <UiCardFooter>
                <UiButton type="submit" :loading="pending">Save changes</UiButton>
              </UiCardFooter>
            </UiCard>
          </UiTabsContent>
        </fieldset>
      </form>
      <UiTabsContent value="data">
        <UiCard>
          <UiCardHeader>
            <UiCardTitle as="h2">Your demo data</UiCardTitle>
            <UiCardDescription>
              Your edits stay in this browser. Export a JSON snapshot to keep a copy, or reset to
              explore a fresh workspace. Snapshots contain no passwords.
            </UiCardDescription>
          </UiCardHeader>
          <UiCardFooter class="flex-wrap gap-3">
            <UiButton variant="outline" @click="exportSnapshot">
              <Icon name="lucide:download" />Export workspace JSON
            </UiButton>
            <UiButton variant="destructive" :disabled="pending" @click="resetOpen = true">
              Reset demo
            </UiButton>
          </UiCardFooter>
        </UiCard>
      </UiTabsContent>
      <UiTabsContent value="identity">
        <UiCard>
          <UiCardHeader>
            <UiCardTitle as="h2">Demo identity</UiCardTitle>
            <UiCardDescription>
              {{
                state?.signedIn
                  ? "You are signed in with a fictional identity."
                  : "The workspace is open without signing in."
              }}
              Account pages never create a real account.
            </UiCardDescription>
          </UiCardHeader>
          <UiCardFooter>
            <UiButton to="/login" variant="outline">Explore demo accounts</UiButton>
          </UiCardFooter>
        </UiCard>
      </UiTabsContent>
    </UiTabs>
    <UiAlertDialog v-model:open="resetOpen">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>Start with a fresh workspace?</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            This replaces your locally saved campaigns, leads, documents, messages, and preferences.
            Export a copy first if you want to keep them.
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <LaunchpadError :message="error" />
        <UiAlertDialogFooter>
          <UiAlertDialogCancel :disabled="pending">Keep my workspace</UiAlertDialogCancel>
          <UiButton variant="destructive" :loading="pending" @click="reset">
            Reset workspace
          </UiButton>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  </div>
</template>
