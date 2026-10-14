<script setup lang="ts">
  import { settingsSchema } from "#shared/schemas";
  import type { Site } from "#shared/types";
  import { clone, errorMessage } from "~/utils/demo";

  usePageSeo({ title: "Settings" });
  const { state, saveSettings, removeSite, resetDemo } = useDemo();
  const { pending, error, run } = useAction();
  const route = useRoute();
  const router = useRouter();
  const uid = useId();
  const tabs = ["sites", "profile", "preferences", "data"] as const;
  const tab = computed(() => {
    const value = String(route.query.tab || "");
    return (tabs as readonly string[]).includes(value) ? value : "sites";
  });
  function setTab(value: string | number) {
    void router.replace({ path: route.path, query: { ...route.query, tab: String(value) } });
  }

  const form = reactive(
    clone({ profile: state.value!.profile, preferences: state.value!.preferences })
  );
  const message = ref("");
  const { dirty, markSaved } = useUnsaved(toRef(() => form));
  async function save() {
    message.value = "";
    try {
      await settingsSchema.validate(form, { abortEarly: false });
    } catch (cause) {
      message.value = (cause as { errors?: string[] }).errors?.join(" ") ?? "Check your details.";
      return;
    }
    const saved = await run(() => saveSettings(clone(form)));
    if (saved) {
      markSaved();
      useSonner.success("Settings saved");
    }
  }

  const siteForm = ref(false);
  const editing = ref<Site | null>(null);
  const removing = ref<Site | null>(null);
  const confirmOpen = ref(false);
  function addSite() {
    editing.value = null;
    siteForm.value = true;
  }
  function editSite(site: Site) {
    editing.value = site;
    siteForm.value = true;
  }
  function ask(site: Site) {
    removing.value = site;
    confirmOpen.value = true;
  }
  async function confirmRemove() {
    const site = removing.value;
    if (!site) return;
    try {
      await removeSite(site.id);
      useSonner.success("Site removed", { description: site.name });
    } catch (cause) {
      useSonner.error(errorMessage(cause));
    } finally {
      confirmOpen.value = false;
    }
  }
  // The closing tag is split so it can't end this single-file component's script block.
  const closeTag = "</" + "script>";
  const snippet = (id: string) =>
    `<script defer data-site="${id}" src="https://beacon.example/beacon.js">${closeTag}`;
  async function copySnippet(id: string) {
    try {
      await navigator.clipboard.writeText(snippet(id));
      useSonner.success("Snippet copied");
    } catch {
      useSonner.error("Couldn't copy. Select the text and copy it instead.");
    }
  }

  const resetting = ref(false);
  const resetOpen = ref(false);
  async function confirmReset() {
    resetting.value = true;
    try {
      await resetDemo();
      Object.assign(
        form,
        clone({ profile: state.value!.profile, preferences: state.value!.preferences })
      );
      markSaved();
      useSonner.success("Demo data restored");
    } catch (cause) {
      useSonner.error(errorMessage(cause));
    } finally {
      resetting.value = false;
      resetOpen.value = false;
    }
  }
</script>
<template>
  <div v-if="state" class="page-shell max-w-4xl">
    <BeaconPageHeader title="Settings" description="Sites, your profile and how Beacon behaves." />
    <UiTabs :model-value="tab" @update:model-value="setTab">
      <UiTabsList class="mb-6" aria-label="Settings sections">
        <UiTabsTrigger value="sites">Sites</UiTabsTrigger>
        <UiTabsTrigger value="profile">Profile</UiTabsTrigger>
        <UiTabsTrigger value="preferences">Preferences</UiTabsTrigger>
        <UiTabsTrigger value="data">Data</UiTabsTrigger>
      </UiTabsList>

      <UiTabsContent value="sites" class="space-y-6">
        <UiCard>
          <UiCardHeader>
            <UiCardTitle as="h2">Your sites</UiCardTitle>
            <UiCardDescription>
              Every site in this workspace. New sites are filled with generated sample traffic.
            </UiCardDescription>
            <UiCardAction>
              <UiButton size="sm" @click="addSite"><Icon name="lucide:plus" />Add site</UiButton>
            </UiCardAction>
          </UiCardHeader>
          <UiCardContent>
            <ul class="divide-y" aria-label="Sites">
              <li
                v-for="site in state.sites"
                :key="site.id"
                class="space-y-3 py-4 first:pt-0 last:pb-0"
              >
                <div class="flex flex-wrap items-center gap-3">
                  <div class="min-w-0 flex-1">
                    <p class="font-medium">{{ site.name }}</p>
                    <p class="text-sm text-muted-foreground">
                      {{ site.domain }}{{ site.blurb ? " · " + site.blurb : "" }}
                    </p>
                  </div>
                  <UiBadge v-if="site.id === state.preferences.siteId" variant="outline"
                    >Viewing</UiBadge
                  >
                  <UiButton
                    variant="ghost"
                    size="icon-sm"
                    :aria-label="`Edit ${site.name}`"
                    @click="editSite(site)"
                  >
                    <Icon name="lucide:pencil" />
                  </UiButton>
                  <UiButton
                    variant="ghost"
                    size="icon-sm"
                    :aria-label="`Remove ${site.name}`"
                    :disabled="state.sites.length <= 1"
                    @click="ask(site)"
                  >
                    <Icon name="lucide:trash-2" />
                  </UiButton>
                </div>
                <div class="flex items-center gap-2 rounded-md bg-muted p-2">
                  <code class="min-w-0 flex-1 overflow-x-auto font-mono text-xs whitespace-nowrap">
                    {{ snippet(site.id) }}
                  </code>
                  <UiButton
                    variant="outline"
                    size="icon-sm"
                    :aria-label="`Copy tracking snippet for ${site.name}`"
                    @click="copySnippet(site.id)"
                  >
                    <Icon name="lucide:copy" />
                  </UiButton>
                </div>
              </li>
            </ul>
            <p class="mt-4 text-xs text-muted-foreground">
              The snippet is illustrative. This demo doesn't collect real traffic.
            </p>
          </UiCardContent>
        </UiCard>
      </UiTabsContent>

      <form novalidate @submit.prevent="save">
        <UiTabsContent value="profile">
          <UiCard>
            <UiCardHeader><UiCardTitle as="h2">Your profile</UiCardTitle></UiCardHeader>
            <UiCardContent class="grid gap-4 sm:grid-cols-2">
              <div class="space-y-2">
                <UiLabel :for="`${uid}-pname`">Name</UiLabel>
                <UiInput :id="`${uid}-pname`" v-model="form.profile.name" autocomplete="name" />
              </div>
              <div class="space-y-2">
                <UiLabel :for="`${uid}-pemail`">Email</UiLabel>
                <UiInput
                  :id="`${uid}-pemail`"
                  v-model="form.profile.email"
                  type="email"
                  autocomplete="email"
                />
              </div>
              <div class="space-y-2">
                <UiLabel :for="`${uid}-prole`">Role</UiLabel>
                <UiInput :id="`${uid}-prole`" v-model="form.profile.role" />
              </div>
            </UiCardContent>
          </UiCard>
        </UiTabsContent>

        <UiTabsContent value="preferences">
          <UiCard>
            <UiCardHeader><UiCardTitle as="h2">Preferences</UiCardTitle></UiCardHeader>
            <UiCardContent class="space-y-5">
              <div class="grid gap-4 sm:grid-cols-2">
                <div class="space-y-2">
                  <UiLabel :for="`${uid}-appearance`">Appearance</UiLabel>
                  <UiNativeSelect :id="`${uid}-appearance`" v-model="form.preferences.appearance">
                    <option value="system">Match my device</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </UiNativeSelect>
                </div>
                <div class="space-y-2">
                  <UiLabel :for="`${uid}-retention`">Data retention</UiLabel>
                  <UiNativeSelect
                    :id="`${uid}-retention`"
                    :model-value="form.preferences.retentionMonths"
                    @update:model-value="form.preferences.retentionMonths = Number($event)"
                  >
                    <option :value="3">3 months</option>
                    <option :value="6">6 months</option>
                    <option :value="14">14 months</option>
                    <option :value="26">26 months</option>
                  </UiNativeSelect>
                </div>
              </div>
              <div class="flex items-center justify-between gap-4">
                <div>
                  <UiLabel :for="`${uid}-notify`">Traffic notifications</UiLabel>
                  <p class="text-sm text-muted-foreground">
                    Add notable changes and workspace activity to your inbox.
                  </p>
                </div>
                <UiSwitch :id="`${uid}-notify`" v-model="form.preferences.notify" />
              </div>
              <div class="flex items-center justify-between gap-4">
                <div>
                  <UiLabel :for="`${uid}-digest`">Weekly digest</UiLabel>
                  <p class="text-sm text-muted-foreground">Demo only. Nothing is actually sent.</p>
                </div>
                <UiSwitch :id="`${uid}-digest`" v-model="form.preferences.weeklyDigest" />
              </div>
            </UiCardContent>
          </UiCard>
        </UiTabsContent>

        <div v-if="tab === 'profile' || tab === 'preferences'" class="mt-6 space-y-3">
          <BeaconError :message="message || error" />
          <div class="flex items-center justify-end gap-3">
            <p v-if="dirty" class="text-sm text-muted-foreground" role="status">Unsaved changes</p>
            <UiButton type="submit" :loading="pending" :disabled="!dirty">Save settings</UiButton>
          </div>
        </div>
      </form>

      <UiTabsContent value="data">
        <UiCard>
          <UiCardHeader>
            <UiCardTitle as="h2">Demo data</UiCardTitle>
            <UiCardDescription>
              Everything you change is stored in this browser only. Resetting brings back the
              original sites, goals, reports and layout.
            </UiCardDescription>
          </UiCardHeader>
          <UiCardContent>
            <UiButton variant="outline" @click="resetOpen = true">
              <Icon name="lucide:rotate-ccw" />Reset demo data
            </UiButton>
          </UiCardContent>
        </UiCard>
      </UiTabsContent>
    </UiTabs>

    <UiSheet v-model:open="siteForm">
      <UiSheetContent side="right" class="sm:max-w-md">
        <UiSheetHeader>
          <UiSheetTitle>{{ editing ? "Edit site" : "Add a site" }}</UiSheetTitle>
          <UiSheetDescription>Sites keep their own goals, reports and notes.</UiSheetDescription>
        </UiSheetHeader>
        <div class="px-4">
          <BeaconSiteForm
            :key="editing?.id ?? 'new'"
            :site="editing ?? undefined"
            @saved="siteForm = false"
            @cancel="siteForm = false"
          />
        </div>
      </UiSheetContent>
    </UiSheet>
    <UiAlertDialog v-model:open="confirmOpen">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>Remove {{ removing?.name }}?</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            Its goals, saved reports, notes and notifications are removed with it.
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel>Keep site</UiAlertDialogCancel>
          <UiAlertDialogAction @click.prevent="confirmRemove">Remove site</UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
    <UiAlertDialog v-model:open="resetOpen">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>Reset all demo data?</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            Your sites, goals, saved reports, notes and layout will return to how they started.
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel>Keep my data</UiAlertDialogCancel>
          <UiAlertDialogAction :disabled="resetting" @click.prevent="confirmReset">
            Reset demo data
          </UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  </div>
</template>
