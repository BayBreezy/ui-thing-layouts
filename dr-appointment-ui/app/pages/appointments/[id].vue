<script setup lang="ts">
  import { formatDate, formatDuration, formatPrice, formatRange } from "#shared/format";
  import { fullName } from "#shared/patients";
  import { allowedTransitions, holdsSlot } from "#shared/schedule";
  import type { AppointmentStatus } from "#shared/types";
  import { nextStep } from "~/composables/useVisitActions";
  import { errorMessage, statusMeta, visitColorClasses } from "~/utils/demo";

  const route = useRoute();
  const id = computed(() => String(route.params.id));
  const { state, deleteAppointment } = useDemo();
  const { busy, change } = useVisitActions();
  const appointment = computed(() =>
    state.value?.appointments.find((item) => item.id === id.value)
  );
  const patient = computed(() =>
    state.value?.patients.find((item) => item.id === appointment.value?.patientId)
  );
  const provider = computed(() =>
    state.value?.providers.find((item) => item.id === appointment.value?.providerId)
  );
  const visit = computed(() =>
    state.value?.visitTypes.find((item) => item.id === appointment.value?.visitTypeId)
  );
  const timeFormat = computed(() => state.value?.preferences.timeFormat ?? "12h");
  usePageSeo({
    title: () =>
      patient.value
        ? `${fullName(patient.value)} · ${appointment.value?.reference}`
        : "Appointment",
  });
  const step = computed(() => (appointment.value ? nextStep[appointment.value.status] : undefined));
  const others = computed(() =>
    appointment.value
      ? allowedTransitions(appointment.value.status).filter((status) => status !== step.value?.to)
      : []
  );
  const editOpen = ref(false);
  const deleteOpen = ref(false);
  const deleting = ref(false);
  const flow: AppointmentStatus[] = [
    "scheduled",
    "confirmed",
    "checked-in",
    "in-progress",
    "completed",
  ];
  const flowIndex = computed(() => flow.indexOf(appointment.value?.status ?? "scheduled"));
  async function destroy() {
    deleting.value = true;
    try {
      await deleteAppointment(id.value);
      useSonner.success("Visit deleted");
      deleteOpen.value = false;
      await navigateTo("/appointments");
    } catch (cause) {
      useSonner.error(errorMessage(cause));
    } finally {
      deleting.value = false;
    }
  }
  const history = computed(() =>
    (state.value?.appointments ?? [])
      .filter((item) => item.patientId === appointment.value?.patientId && item.id !== id.value)
      .sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start))
      .slice(0, 5)
  );
</script>
<template>
  <div class="page-shell">
    <MendlyRecordGate
      :exists="Boolean(appointment)"
      back="/appointments"
      back-label="Back to appointments"
    >
      <template v-if="appointment">
        <MendlyPageHeader
          :title="patient ? fullName(patient) : 'Appointment'"
          :description="`${visit?.name} with ${provider?.name} · ${appointment.reference}`"
        >
          <MendlyStatusBadge :status="appointment.status" />
          <UiButton
            v-if="step"
            :loading="busy === appointment.id"
            @click="change(appointment, step.to)"
          >
            <Icon :name="step.icon" />{{ step.label }}
          </UiButton>
          <UiButton variant="outline" @click="editOpen = true">
            <Icon name="lucide:calendar-clock" />Reschedule or edit
          </UiButton>
          <UiDropdownMenu>
            <UiDropdownMenuTrigger as-child>
              <UiButton variant="outline" size="icon" aria-label="More actions">
                <Icon name="lucide:ellipsis" />
              </UiButton>
            </UiDropdownMenuTrigger>
            <UiDropdownMenuContent align="end">
              <UiDropdownMenuItem
                v-for="status in others"
                :key="status"
                @select="change(appointment, status)"
              >
                <Icon :name="statusMeta[status].icon" />Mark
                {{ statusMeta[status].label.toLowerCase() }}
              </UiDropdownMenuItem>
              <UiDropdownMenuSeparator v-if="others.length" />
              <UiDropdownMenuItem @select="deleteOpen = true">
                <Icon name="lucide:trash-2" />Delete visit
              </UiDropdownMenuItem>
            </UiDropdownMenuContent>
          </UiDropdownMenu>
        </MendlyPageHeader>

        <div class="grid gap-6 @4xl:grid-cols-3">
          <div class="space-y-6 @4xl:col-span-2">
            <UiCard>
              <UiCardHeader>
                <UiCardTitle as="h2">Visit details</UiCardTitle>
              </UiCardHeader>
              <UiCardContent>
                <dl class="grid gap-x-6 gap-y-4 text-sm @lg:grid-cols-2">
                  <div>
                    <dt class="text-muted-foreground">Date</dt>
                    <dd class="font-medium">{{ formatDate(appointment.date, "full") }}</dd>
                  </div>
                  <div>
                    <dt class="text-muted-foreground">Time</dt>
                    <dd class="font-medium tabular-nums">
                      {{ formatRange(appointment.start, appointment.end, timeFormat) }}
                      ({{ formatDuration(visit?.minutes ?? 0) }})
                    </dd>
                  </div>
                  <div>
                    <dt class="text-muted-foreground">Visit type</dt>
                    <dd class="flex items-center gap-2 font-medium">
                      <span
                        v-if="visit"
                        :class="['size-2 rounded-full', visitColorClasses[visit.color].dot]"
                        aria-hidden="true"
                      />
                      {{ visit?.name }} · {{ formatPrice(visit?.price ?? 0) }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-muted-foreground">Provider</dt>
                    <dd class="font-medium">
                      <NuxtLink :to="'/providers/' + provider?.id" class="hover:underline">{{
                        provider?.name
                      }}</NuxtLink>
                      · {{ provider?.room }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-muted-foreground">Reason</dt>
                    <dd class="font-medium">{{ appointment.reason || "Not given" }}</dd>
                  </div>
                  <div>
                    <dt class="text-muted-foreground">Booked via</dt>
                    <dd class="font-medium capitalize">{{ appointment.source }}</dd>
                  </div>
                </dl>
                <div v-if="appointment.notes" class="mt-5 rounded-lg bg-muted p-3 text-sm">
                  <p class="mb-1 text-xs font-medium text-muted-foreground">Internal notes</p>
                  <p class="whitespace-pre-wrap">{{ appointment.notes }}</p>
                </div>
              </UiCardContent>
            </UiCard>

            <UiCard>
              <UiCardHeader>
                <UiCardTitle as="h2">Progress</UiCardTitle>
                <UiCardDescription>
                  {{
                    holdsSlot(appointment.status)
                      ? "Where this visit is in the day."
                      : "This visit no longer holds its slot."
                  }}
                </UiCardDescription>
              </UiCardHeader>
              <UiCardContent>
                <ol v-if="holdsSlot(appointment.status)" class="grid gap-3 @lg:grid-cols-5">
                  <li
                    v-for="(status, index) in flow"
                    :key="status"
                    :aria-current="status === appointment.status ? 'step' : undefined"
                    :class="[
                      'flex items-center gap-2 rounded-lg border p-3 text-sm',
                      index <= flowIndex
                        ? 'border-primary/40 bg-primary/5'
                        : 'text-muted-foreground',
                    ]"
                  >
                    <Icon
                      :name="index < flowIndex ? 'lucide:circle-check' : statusMeta[status].icon"
                      :class="['size-4 shrink-0', index <= flowIndex ? 'text-primary' : '']"
                    />
                    {{ statusMeta[status].label }}
                  </li>
                </ol>
                <p v-else class="text-sm text-muted-foreground">
                  Marked {{ statusMeta[appointment.status].label.toLowerCase() }}. You can reinstate
                  it to put it back on the schedule if the slot is still free.
                </p>
              </UiCardContent>
            </UiCard>
          </div>

          <div class="space-y-6">
            <UiCard v-if="patient">
              <UiCardHeader>
                <UiCardTitle as="h2">Patient</UiCardTitle>
              </UiCardHeader>
              <UiCardContent class="space-y-3 text-sm">
                <NuxtLink :to="'/patients/' + patient.id" class="flex items-center gap-3">
                  <MendlyAvatar :name="fullName(patient)" size="lg" />
                  <span>
                    <span class="block font-medium hover:underline">{{ fullName(patient) }}</span>
                    <span class="block text-muted-foreground">{{
                      patient.insurance || "No insurance on file"
                    }}</span>
                  </span>
                </NuxtLink>
                <p class="flex items-center gap-2">
                  <Icon name="lucide:mail" class="size-4" />{{ patient.email }}
                </p>
                <p class="flex items-center gap-2">
                  <Icon name="lucide:phone" class="size-4" />{{ patient.phone }}
                </p>
              </UiCardContent>
            </UiCard>
            <UiCard>
              <UiCardHeader>
                <UiCardTitle as="h2">Other visits</UiCardTitle>
              </UiCardHeader>
              <UiCardContent class="p-0">
                <ul v-if="history.length" class="divide-y border-t">
                  <li
                    v-for="item in history"
                    :key="item.id"
                    class="flex items-center justify-between gap-2 px-4 py-3 text-sm"
                  >
                    <NuxtLink :to="'/appointments/' + item.id" class="hover:underline">
                      {{ formatDate(item.date, "short") }} · {{ item.reason || "Visit" }}
                    </NuxtLink>
                    <MendlyStatusBadge :status="item.status" />
                  </li>
                </ul>
                <p v-else class="border-t px-4 py-6 text-center text-sm text-muted-foreground">
                  This is their only visit.
                </p>
              </UiCardContent>
            </UiCard>
          </div>
        </div>

        <UiDialog v-model:open="editOpen">
          <UiDialogContent class="sm:max-w-xl">
            <UiDialogHeader>
              <UiDialogTitle>Reschedule or edit</UiDialogTitle>
              <UiDialogDescription>
                Changes are checked against the provider's hours and existing visits.
              </UiDialogDescription>
            </UiDialogHeader>
            <MendlyAppointmentEditor
              :appointment="appointment"
              @saved="editOpen = false"
              @cancel="editOpen = false"
            />
          </UiDialogContent>
        </UiDialog>
        <UiAlertDialog v-model:open="deleteOpen">
          <UiAlertDialogContent>
            <UiAlertDialogHeader>
              <UiAlertDialogTitle>Delete this visit?</UiAlertDialogTitle>
              <UiAlertDialogDescription>
                It is removed for good, and the slot opens up. To keep a record, cancel the visit
                instead.
              </UiAlertDialogDescription>
            </UiAlertDialogHeader>
            <UiAlertDialogFooter>
              <UiAlertDialogCancel>Keep visit</UiAlertDialogCancel>
              <UiAlertDialogAction :disabled="deleting" @click.prevent="destroy">
                Delete visit
              </UiAlertDialogAction>
            </UiAlertDialogFooter>
          </UiAlertDialogContent>
        </UiAlertDialog>
      </template>
    </MendlyRecordGate>
  </div>
</template>
