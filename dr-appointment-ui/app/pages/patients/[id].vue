<script setup lang="ts">
  import { formatDate, formatRange } from "#shared/format";
  import { ageOn, fullName } from "#shared/patients";
  import { holdsSlot } from "#shared/schedule";
  import { errorMessage, today } from "~/utils/demo";

  const route = useRoute();
  const id = computed(() => String(route.params.id));
  const { state, deletePatient } = useDemo();
  const patient = computed(() => state.value?.patients.find((item) => item.id === id.value));
  usePageSeo({ title: () => (patient.value ? fullName(patient.value) : "Patient") });
  const editing = ref(false);
  const deleteOpen = ref(false);
  const deleting = ref(false);
  const timeFormat = computed(() => state.value?.preferences.timeFormat ?? "12h");
  const visits = computed(() =>
    (state.value?.appointments ?? [])
      .filter((item) => item.patientId === id.value)
      .sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start))
  );
  const upcoming = computed(() =>
    visits.value
      .filter((item) => item.date >= today && holdsSlot(item.status))
      .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
  );
  const past = computed(() => visits.value.filter((item) => !upcoming.value.includes(item)));
  const waitlisted = computed(
    () => state.value?.waitlist.filter((item) => item.patientId === id.value) ?? []
  );
  const provider = computed(() =>
    state.value?.providers.find((item) => item.id === patient.value?.preferredProviderId)
  );
  async function destroy() {
    deleting.value = true;
    try {
      await deletePatient(id.value);
      useSonner.success("Patient removed");
      deleteOpen.value = false;
      await navigateTo("/patients");
    } catch (cause) {
      useSonner.error(errorMessage(cause));
    } finally {
      deleting.value = false;
    }
  }
</script>
<template>
  <div class="page-shell">
    <MendlyRecordGate :exists="Boolean(patient)" back="/patients" back-label="Back to patients">
      <template v-if="patient">
        <MendlyPageHeader
          :title="fullName(patient)"
          :description="`${ageOn(patient.birthday, today) ?? 'Age unknown'}${patient.birthday ? ' years' : ''} · ${patient.insurance || 'No insurance on file'}`"
        >
          <UiButton :to="'/appointments/new?patient=' + patient.id">
            <Icon name="lucide:calendar-plus" />Book visit
          </UiButton>
          <UiButton variant="outline" @click="editing = !editing">
            <Icon :name="editing ? 'lucide:x' : 'lucide:pencil'" />{{
              editing ? "Close editor" : "Edit"
            }}
          </UiButton>
          <UiButton
            variant="outline"
            size="icon"
            aria-label="Delete patient"
            @click="deleteOpen = true"
          >
            <Icon name="lucide:trash-2" />
          </UiButton>
        </MendlyPageHeader>

        <UiCard v-if="editing" class="mb-6">
          <UiCardContent class="pt-6">
            <MendlyPatientForm
              :patient="patient"
              @saved="editing = false"
              @cancel="editing = false"
            />
          </UiCardContent>
        </UiCard>

        <div class="grid gap-6 @4xl:grid-cols-3">
          <div class="space-y-6">
            <UiCard>
              <UiCardHeader><UiCardTitle as="h2">Details</UiCardTitle></UiCardHeader>
              <UiCardContent class="space-y-3 text-sm">
                <p class="flex items-center gap-2">
                  <Icon name="lucide:mail" class="size-4" />{{ patient.email }}
                </p>
                <p class="flex items-center gap-2">
                  <Icon name="lucide:phone" class="size-4" />{{ patient.phone }}
                </p>
                <p v-if="patient.birthday" class="flex items-center gap-2">
                  <Icon name="lucide:cake" class="size-4" />{{
                    formatDate(patient.birthday, "long")
                  }}
                </p>
                <p v-if="provider" class="flex items-center gap-2">
                  <Icon name="lucide:stethoscope" class="size-4" />
                  <NuxtLink :to="'/providers/' + provider.id" class="hover:underline">{{
                    provider.name
                  }}</NuxtLink>
                </p>
                <div v-if="patient.tags.length" class="flex flex-wrap gap-1.5 pt-1">
                  <UiBadge v-for="tag in patient.tags" :key="tag" variant="secondary">{{
                    tag
                  }}</UiBadge>
                </div>
                <p v-if="patient.notes" class="rounded-lg bg-muted p-3 whitespace-pre-wrap">
                  {{ patient.notes }}
                </p>
              </UiCardContent>
            </UiCard>
            <UiCard v-if="waitlisted.length">
              <UiCardHeader><UiCardTitle as="h2">On the waitlist</UiCardTitle></UiCardHeader>
              <UiCardContent class="space-y-2 text-sm">
                <p v-for="item in waitlisted" :key="item.id">
                  {{ state?.visitTypes.find((v) => v.id === item.visitTypeId)?.name }} ·
                  <span class="capitalize">{{ item.urgency }}</span>
                </p>
                <UiButton to="/waitlist" size="sm" variant="outline">View waitlist</UiButton>
              </UiCardContent>
            </UiCard>
          </div>

          <div class="space-y-6 @4xl:col-span-2">
            <UiCard>
              <UiCardHeader>
                <UiCardTitle as="h2">Upcoming</UiCardTitle>
                <UiCardDescription>{{ upcoming.length }} on the schedule.</UiCardDescription>
              </UiCardHeader>
              <UiCardContent class="p-0">
                <ul v-if="upcoming.length" class="divide-y border-t">
                  <MendlyVisitRow
                    v-for="item in upcoming"
                    :key="item.id"
                    :appointment="item"
                    :show-patient="false"
                    show-date
                  />
                </ul>
                <p v-else class="border-t px-6 py-8 text-center text-sm text-muted-foreground">
                  No upcoming visits.
                </p>
              </UiCardContent>
            </UiCard>
            <UiCard>
              <UiCardHeader>
                <UiCardTitle as="h2">History</UiCardTitle>
                <UiCardDescription>Past, cancelled and missed visits.</UiCardDescription>
              </UiCardHeader>
              <UiCardContent class="p-0">
                <ul v-if="past.length" class="divide-y border-t">
                  <li
                    v-for="item in past"
                    :key="item.id"
                    class="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                  >
                    <NuxtLink :to="'/appointments/' + item.id" class="hover:underline">
                      {{ formatDate(item.date, "long") }} ·
                      {{ formatRange(item.start, item.end, timeFormat) }} ·
                      {{ item.reason || "Visit" }}
                    </NuxtLink>
                    <MendlyStatusBadge :status="item.status" />
                  </li>
                </ul>
                <p v-else class="border-t px-6 py-8 text-center text-sm text-muted-foreground">
                  No past visits yet.
                </p>
              </UiCardContent>
            </UiCard>
          </div>
        </div>

        <UiAlertDialog v-model:open="deleteOpen">
          <UiAlertDialogContent>
            <UiAlertDialogHeader>
              <UiAlertDialogTitle>Remove {{ fullName(patient) }}?</UiAlertDialogTitle>
              <UiAlertDialogDescription>
                This also removes their {{ visits.length }}
                {{ visits.length === 1 ? "visit" : "visits" }} and any waitlist entries. This can't
                be undone, but "Reset demo" in Settings restores the sample data.
              </UiAlertDialogDescription>
            </UiAlertDialogHeader>
            <UiAlertDialogFooter>
              <UiAlertDialogCancel>Keep patient</UiAlertDialogCancel>
              <UiAlertDialogAction :disabled="deleting" @click.prevent="destroy">
                Remove patient
              </UiAlertDialogAction>
            </UiAlertDialogFooter>
          </UiAlertDialogContent>
        </UiAlertDialog>
      </template>
    </MendlyRecordGate>
  </div>
</template>
