<script setup lang="ts">
  import { sortedLabels } from "#shared/contacts";
  import { contactsToCsv } from "#shared/csv";
  import { settingsSchema } from "#shared/schemas";
  import { clone, downloadFile } from "~/utils/demo";
  usePageSeo({ title: "Settings" });
  const route = useRoute();
  const router = useRouter();
  const uid = useId();
  const { state, saveSettings, resetDemo, bulk } = useDemo();
  const { pending, error, run } = useAction();
  const tabs = ["profile", "preferences", "labels", "data"];
  const tab = computed(() => {
    const value = String(route.query.tab || "");
    return tabs.includes(value) ? value : "profile";
  });
  const form = ref(clone({ profile: state.value!.profile, preferences: state.value!.preferences }));
  const { markSaved } = useUnsaved(form);
  const message = ref("");
  const resetOpen = ref(false);
  const renaming = ref("");
  const renameTo = ref("");
  const labels = computed(() => sortedLabels(state.value?.contacts ?? []));
  function setTab(value: string | number) {
    void router.replace({
      query: { ...route.query, tab: value === "profile" ? undefined : value },
    });
  }
  async function save() {
    message.value = "";
    try {
      await settingsSchema.validate(form.value, { abortEarly: true });
    } catch (cause) {
      message.value = (cause as Error).message;
      return;
    }
    const saved = await run(() => saveSettings(clone(form.value)));
    if (saved) {
      markSaved();
      useSonner.success("Settings saved");
    }
  }
  const idsWith = (label: string) =>
    (state.value?.contacts ?? []).filter((item) => item.labels.includes(label)).map((i) => i.id);
  async function removeLabel(label: string) {
    const ids = idsWith(label);
    if (!ids.length) return;
    const result = await run(() => bulk("remove-label", ids, label));
    if (result) useSonner.success(`Removed “${label}”`);
  }
  async function renameLabel(label: string) {
    const next = renameTo.value.trim();
    if (!next || next === label) {
      renaming.value = "";
      return;
    }
    const ids = idsWith(label);
    const done = await run(async () => {
      await bulk("add-label", ids, next);
      await bulk("remove-label", ids, label);
      return true;
    });
    if (done) {
      useSonner.success(`Renamed to “${next}”`);
      renaming.value = "";
    }
  }
  async function reset() {
    const done = await run(async () => {
      await resetDemo();
      return true;
    });
    if (done) {
      form.value = clone({ profile: state.value!.profile, preferences: state.value!.preferences });
      markSaved();
      resetOpen.value = false;
      useSonner.success("Demo data restored");
    }
  }
  function exportAll() {
    if (!state.value) return;
    downloadFile(
      "verdant-contacts.csv",
      contactsToCsv(state.value.contacts, state.value.groups),
      "text/csv"
    );
  }
  function exportBackup() {
    if (!state.value) return;
    downloadFile("verdant-backup.json", JSON.stringify(state.value, null, 2), "application/json");
  }
</script>
<template>
  <div class="page-shell">
    <VerdantPageHeader
      title="Settings"
      description="Your profile, how Verdant looks, and what you do with your data."
    />
    <UiTabs :model-value="tab" @update:model-value="setTab">
      <UiTabsList class="mb-6">
        <UiTabsTrigger value="profile">Profile</UiTabsTrigger>
        <UiTabsTrigger value="preferences">Preferences</UiTabsTrigger>
        <UiTabsTrigger value="labels">Labels</UiTabsTrigger>
        <UiTabsTrigger value="data">Data</UiTabsTrigger>
      </UiTabsList>

      <UiTabsContent value="profile">
        <form novalidate @submit.prevent="save">
          <fieldset :disabled="pending">
            <UiCard>
              <UiCardHeader>
                <UiCardTitle as="h2">Profile</UiCardTitle>
                <UiCardDescription>This is only stored in your browser.</UiCardDescription>
              </UiCardHeader>
              <UiCardContent class="grid gap-5 @xl:grid-cols-2">
                <div class="space-y-2">
                  <UiLabel :for="`${uid}-name`">Name</UiLabel>
                  <UiInput :id="`${uid}-name`" v-model="form.profile.name" autocomplete="name" />
                </div>
                <div class="space-y-2">
                  <UiLabel :for="`${uid}-email`">Email</UiLabel>
                  <UiInput
                    :id="`${uid}-email`"
                    v-model="form.profile.email"
                    type="email"
                    autocomplete="email"
                  />
                </div>
                <div class="space-y-2">
                  <UiLabel :for="`${uid}-role`">Role</UiLabel>
                  <UiInput :id="`${uid}-role`" v-model="form.profile.role" />
                </div>
                <div class="@xl:col-span-2"><VerdantError :message="message || error" /></div>
              </UiCardContent>
              <UiCardFooter class="justify-end">
                <UiButton type="submit" :loading="pending">Save profile</UiButton>
              </UiCardFooter>
            </UiCard>
          </fieldset>
        </form>
      </UiTabsContent>

      <UiTabsContent value="preferences">
        <form novalidate @submit.prevent="save">
          <fieldset :disabled="pending">
            <UiCard>
              <UiCardHeader>
                <UiCardTitle as="h2">Preferences</UiCardTitle>
                <UiCardDescription>Tune how your contacts are shown.</UiCardDescription>
              </UiCardHeader>
              <UiCardContent class="grid gap-5 @xl:grid-cols-2">
                <div class="space-y-2">
                  <UiLabel :for="`${uid}-appearance`">Appearance</UiLabel>
                  <UiNativeSelect :id="`${uid}-appearance`" v-model="form.preferences.appearance">
                    <option value="system">Match my device</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </UiNativeSelect>
                </div>
                <div class="space-y-2">
                  <UiLabel :for="`${uid}-view`">Default contacts view</UiLabel>
                  <UiNativeSelect :id="`${uid}-view`" v-model="form.preferences.defaultView">
                    <option value="table">Table</option>
                    <option value="grid">Cards</option>
                  </UiNativeSelect>
                </div>
                <div class="space-y-2">
                  <UiLabel :for="`${uid}-order`">Show names as</UiLabel>
                  <UiNativeSelect :id="`${uid}-order`" v-model="form.preferences.nameOrder">
                    <option value="first-last">First Last</option>
                    <option value="last-first">Last, First</option>
                  </UiNativeSelect>
                </div>
                <div class="space-y-2">
                  <UiLabel :for="`${uid}-size`">Contacts per page</UiLabel>
                  <UiNativeSelect :id="`${uid}-size`" v-model.number="form.preferences.pageSize">
                    <option :value="10">10</option>
                    <option :value="20">20</option>
                    <option :value="50">50</option>
                  </UiNativeSelect>
                </div>
                <div class="flex items-center gap-3 @xl:col-span-2">
                  <UiSwitch :id="`${uid}-notify`" v-model="form.preferences.notify" />
                  <UiLabel :for="`${uid}-notify`"
                    >Show reminders and updates in notifications</UiLabel
                  >
                </div>
              </UiCardContent>
              <UiCardFooter class="justify-end">
                <UiButton type="submit" :loading="pending">Save preferences</UiButton>
              </UiCardFooter>
            </UiCard>
          </fieldset>
        </form>
      </UiTabsContent>

      <UiTabsContent value="labels">
        <UiCard>
          <UiCardHeader>
            <UiCardTitle as="h2">Labels</UiCardTitle>
            <UiCardDescription>
              Rename or remove labels across all of your contacts at once.
            </UiCardDescription>
          </UiCardHeader>
          <UiCardContent>
            <VerdantError :message="error" />
            <ul v-if="labels.length" class="divide-y rounded-lg border">
              <li
                v-for="item in labels"
                :key="item.label"
                class="flex flex-wrap items-center gap-3 p-3"
              >
                <template v-if="renaming === item.label">
                  <form
                    class="flex flex-1 items-center gap-2"
                    @submit.prevent="renameLabel(item.label)"
                  >
                    <UiInput
                      v-model="renameTo"
                      :aria-label="`New name for ${item.label}`"
                      class="max-w-xs"
                    />
                    <UiButton type="submit" size="sm" :loading="pending">Save</UiButton>
                    <UiButton type="button" variant="ghost" size="sm" @click="renaming = ''">
                      Cancel
                    </UiButton>
                  </form>
                </template>
                <template v-else>
                  <NuxtLink
                    :to="'/contacts?label=' + encodeURIComponent(item.label)"
                    class="flex-1 text-sm font-medium underline-offset-4 hover:underline"
                    >{{ item.label }}</NuxtLink
                  >
                  <span class="text-sm text-muted-foreground tabular-nums">
                    {{ item.count }} {{ item.count === 1 ? "contact" : "contacts" }}
                  </span>
                  <UiButton
                    variant="ghost"
                    size="sm"
                    :aria-label="`Rename ${item.label}`"
                    @click="
                      renaming = item.label;
                      renameTo = item.label;
                    "
                  >
                    Rename
                  </UiButton>
                  <UiButton
                    variant="ghost"
                    size="sm"
                    :aria-label="`Remove ${item.label}`"
                    @click="removeLabel(item.label)"
                  >
                    Remove
                  </UiButton>
                </template>
              </li>
            </ul>
            <VerdantEmpty
              v-else
              title="No labels yet"
              description="Add labels from a contact, or select several contacts and label them together."
              icon="lucide:tag"
            />
          </UiCardContent>
        </UiCard>
      </UiTabsContent>

      <UiTabsContent value="data" class="space-y-6">
        <UiCard>
          <UiCardHeader>
            <UiCardTitle as="h2">Take your data with you</UiCardTitle>
            <UiCardDescription>
              Everything lives in this browser. Export it whenever you like.
            </UiCardDescription>
          </UiCardHeader>
          <UiCardFooter class="flex-wrap gap-2">
            <UiButton variant="outline" @click="exportAll">
              <Icon name="lucide:file-spreadsheet" />Export contacts (CSV)
            </UiButton>
            <UiButton variant="outline" @click="exportBackup">
              <Icon name="lucide:database-backup" />Download full backup (JSON)
            </UiButton>
          </UiCardFooter>
        </UiCard>
        <UiCard>
          <UiCardHeader>
            <UiCardTitle as="h2">Reset demo data</UiCardTitle>
            <UiCardDescription>
              Replace everything with the original sample contacts. Your changes will be lost.
            </UiCardDescription>
          </UiCardHeader>
          <UiCardFooter>
            <UiButton variant="destructive" @click="resetOpen = true">Reset demo data</UiButton>
          </UiCardFooter>
        </UiCard>
      </UiTabsContent>
    </UiTabs>
    <UiAlertDialog v-model:open="resetOpen">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>Reset the demo?</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            All of your contacts, groups and follow-ups will be replaced by the sample data.
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel>Cancel</UiAlertDialogCancel>
          <UiAlertDialogAction @click.prevent="reset">Reset demo data</UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  </div>
</template>
