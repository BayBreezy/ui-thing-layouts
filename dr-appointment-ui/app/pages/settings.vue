<script setup lang="ts">
  import { appointmentsCsv, patientsCsv } from "#shared/csv";
  import { settingsSchema } from "#shared/schemas";
  import { reminderLeads, slotIntervals } from "#shared/types";
  import { clone, downloadFile } from "~/utils/demo";
  usePageSeo({ title: "Settings" });
  const route = useRoute();
  const router = useRouter();
  const uid = useId();
  const { state, saveSettings, resetDemo } = useDemo();
  const { pending, error, run } = useAction();
  const tabs = ["clinic", "profile", "preferences", "data"];
  const tab = computed(() => {
    const value = String(route.query.tab || "");
    return tabs.includes(value) ? value : "clinic";
  });
  const form = ref(
    clone({
      profile: state.value!.profile,
      clinic: state.value!.clinic,
      preferences: state.value!.preferences,
    })
  );
  const { dirty, markSaved } = useUnsaved(form);
  // The header's theme toggle writes straight to state, so keep the form from saving a stale value.
  watch(
    () => state.value?.preferences.appearance,
    (value) => {
      if (value) form.value.preferences.appearance = value;
    }
  );
  const message = ref("");
  const resetOpen = ref(false);
  function setTab(value: string | number) {
    void router.replace({ query: { ...route.query, tab: value === "clinic" ? undefined : value } });
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
  async function reset() {
    const done = await run(async () => {
      await resetDemo();
      return true;
    });
    if (done) {
      form.value = clone({
        profile: state.value!.profile,
        clinic: state.value!.clinic,
        preferences: state.value!.preferences,
      });
      markSaved();
      resetOpen.value = false;
      useSonner.success("Demo data restored");
    }
  }
  function backup() {
    if (!state.value) return;
    downloadFile("mendly-backup.json", JSON.stringify(state.value, null, 2), "application/json");
  }
  function exportVisits() {
    if (!state.value) return;
    downloadFile(
      "appointments.csv",
      appointmentsCsv(state.value.appointments, {
        patients: state.value.patients,
        providers: state.value.providers,
        visitTypes: state.value.visitTypes,
      })
    );
  }
  function exportPatients() {
    if (state.value)
      downloadFile("patients.csv", patientsCsv(state.value.patients, state.value.providers));
  }
</script>
<template>
  <div class="page-shell max-w-4xl!">
    <MendlyPageHeader
      title="Settings"
      description="Clinic details, how booking works, and your preferences."
    />
    <UiTabs :model-value="tab" @update:model-value="setTab">
      <UiTabsList class="mb-6">
        <UiTabsTrigger value="clinic">Clinic</UiTabsTrigger>
        <UiTabsTrigger value="profile">Profile</UiTabsTrigger>
        <UiTabsTrigger value="preferences">Preferences</UiTabsTrigger>
        <UiTabsTrigger value="data">Data</UiTabsTrigger>
      </UiTabsList>

      <form novalidate @submit.prevent="save">
        <UiTabsContent value="clinic" class="space-y-6">
          <UiCard>
            <UiCardHeader><UiCardTitle as="h2">Clinic</UiCardTitle></UiCardHeader>
            <UiCardContent class="grid gap-4 sm:grid-cols-2">
              <div class="space-y-2 sm:col-span-2">
                <UiLabel :for="`${uid}-name`">Clinic name</UiLabel>
                <UiInput :id="`${uid}-name`" v-model="form.clinic.name" />
              </div>
              <div class="space-y-2">
                <UiLabel :for="`${uid}-phone`">Phone</UiLabel>
                <UiInput :id="`${uid}-phone`" v-model="form.clinic.phone" type="tel" />
              </div>
              <div class="space-y-2">
                <UiLabel :for="`${uid}-email`">Email</UiLabel>
                <UiInput :id="`${uid}-email`" v-model="form.clinic.email" type="email" />
              </div>
              <div class="space-y-2 sm:col-span-2">
                <UiLabel :for="`${uid}-address`">Address</UiLabel>
                <UiInput :id="`${uid}-address`" v-model="form.clinic.address" />
              </div>
            </UiCardContent>
          </UiCard>
          <UiCard>
            <UiCardHeader>
              <UiCardTitle as="h2">Booking</UiCardTitle>
              <UiCardDescription>How patients and staff can book visits.</UiCardDescription>
            </UiCardHeader>
            <UiCardContent class="space-y-5">
              <div class="grid gap-4 sm:grid-cols-2">
                <div class="space-y-2">
                  <UiLabel :for="`${uid}-slot`">Slot length</UiLabel>
                  <UiNativeSelect :id="`${uid}-slot`" v-model.number="form.clinic.slotMinutes">
                    <option v-for="item in slotIntervals" :key="item" :value="item">
                      {{ item }} minutes
                    </option>
                  </UiNativeSelect>
                </div>
                <div class="space-y-2">
                  <UiLabel :for="`${uid}-window`">Booking window (days)</UiLabel>
                  <UiInput
                    :id="`${uid}-window`"
                    v-model.number="form.clinic.bookingWindowDays"
                    type="number"
                    min="7"
                    max="90"
                  />
                </div>
              </div>
              <div class="flex items-center justify-between gap-4">
                <div>
                  <UiLabel :for="`${uid}-online`">Online booking</UiLabel>
                  <p class="text-sm text-muted-foreground">
                    Let patients book from the public page.
                  </p>
                </div>
                <UiSwitch :id="`${uid}-online`" v-model="form.clinic.onlineBooking" />
              </div>
            </UiCardContent>
          </UiCard>
          <UiCard>
            <UiCardHeader>
              <UiCardTitle as="h2">Reminders</UiCardTitle>
              <UiCardDescription>Demo only. Nothing is actually sent.</UiCardDescription>
            </UiCardHeader>
            <UiCardContent class="space-y-5">
              <div class="space-y-2 sm:max-w-xs">
                <UiLabel :for="`${uid}-lead`">Send reminders</UiLabel>
                <UiNativeSelect :id="`${uid}-lead`" v-model.number="form.clinic.reminderHours">
                  <option v-for="item in reminderLeads" :key="item" :value="item">
                    {{ item }} hours before
                  </option>
                </UiNativeSelect>
              </div>
              <div class="flex items-center justify-between gap-4">
                <UiLabel :for="`${uid}-emailr`">Email reminders</UiLabel>
                <UiSwitch :id="`${uid}-emailr`" v-model="form.clinic.emailReminders" />
              </div>
              <div class="flex items-center justify-between gap-4">
                <UiLabel :for="`${uid}-smsr`">Text message reminders</UiLabel>
                <UiSwitch :id="`${uid}-smsr`" v-model="form.clinic.smsReminders" />
              </div>
            </UiCardContent>
          </UiCard>
        </UiTabsContent>

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
              <div class="grid gap-4 sm:grid-cols-3">
                <div class="space-y-2">
                  <UiLabel :for="`${uid}-appearance`">Appearance</UiLabel>
                  <UiNativeSelect :id="`${uid}-appearance`" v-model="form.preferences.appearance">
                    <option value="system">Match my device</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </UiNativeSelect>
                </div>
                <div class="space-y-2">
                  <UiLabel :for="`${uid}-time`">Time format</UiLabel>
                  <UiNativeSelect :id="`${uid}-time`" v-model="form.preferences.timeFormat">
                    <option value="12h">12-hour (2:30 PM)</option>
                    <option value="24h">24-hour (14:30)</option>
                  </UiNativeSelect>
                </div>
                <div class="space-y-2">
                  <UiLabel :for="`${uid}-size`">Rows per page</UiLabel>
                  <UiNativeSelect :id="`${uid}-size`" v-model.number="form.preferences.pageSize">
                    <option :value="10">10</option>
                    <option :value="20">20</option>
                    <option :value="50">50</option>
                  </UiNativeSelect>
                </div>
              </div>
              <div class="flex items-center justify-between gap-4">
                <div>
                  <UiLabel :for="`${uid}-notify`">Activity notifications</UiLabel>
                  <p class="text-sm text-muted-foreground">
                    Show bookings and cancellations in the bell menu.
                  </p>
                </div>
                <UiSwitch :id="`${uid}-notify`" v-model="form.preferences.notify" />
              </div>
            </UiCardContent>
          </UiCard>
        </UiTabsContent>

        <div v-if="tab !== 'data'" class="mt-6 space-y-3">
          <MendlyError :message="message || error" />
          <div class="flex items-center justify-end gap-3">
            <span v-if="dirty" class="mr-auto text-sm text-muted-foreground">Unsaved changes</span>
            <UiButton type="submit" :loading="pending">Save settings</UiButton>
          </div>
        </div>
      </form>

      <UiTabsContent value="data" class="space-y-6">
        <UiCard>
          <UiCardHeader>
            <UiCardTitle as="h2">Export</UiCardTitle>
            <UiCardDescription
              >Take your data with you. Files are generated in your browser.</UiCardDescription
            >
          </UiCardHeader>
          <UiCardContent class="flex flex-wrap gap-2">
            <UiButton variant="outline" @click="exportVisits"
              ><Icon name="lucide:download" />Appointments (CSV)</UiButton
            >
            <UiButton variant="outline" @click="exportPatients"
              ><Icon name="lucide:download" />Patients (CSV)</UiButton
            >
            <UiButton variant="outline" @click="backup"
              ><Icon name="lucide:archive" />Full backup (JSON)</UiButton
            >
          </UiCardContent>
        </UiCard>
        <UiCard>
          <UiCardHeader>
            <UiCardTitle as="h2">Reset the demo</UiCardTitle>
            <UiCardDescription>
              Everything lives in this browser. Resetting replaces your changes with the sample
              clinic.
            </UiCardDescription>
          </UiCardHeader>
          <UiCardContent>
            <MendlyError :message="error" />
            <UiButton variant="outline" class="mt-3" @click="resetOpen = true">
              <Icon name="lucide:rotate-ccw" />Reset demo data
            </UiButton>
          </UiCardContent>
        </UiCard>
      </UiTabsContent>
    </UiTabs>

    <UiAlertDialog v-model:open="resetOpen">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>Reset all demo data?</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            Your patients, visits and settings go back to the sample clinic. This can't be undone.
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel>Keep my data</UiAlertDialogCancel>
          <UiAlertDialogAction @click.prevent="reset">Reset demo</UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  </div>
</template>
