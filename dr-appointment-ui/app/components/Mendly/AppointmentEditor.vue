<script setup lang="ts">
  import { formatDuration, formatTime } from "#shared/format";
  import {
    addMinutes,
    bookingProblems,
    isInPast,
    openStarts,
    referenceFor,
    slim,
  } from "#shared/schedule";
  import type { Appointment } from "#shared/types";
  import { newId, now, today } from "~/utils/demo";

  const props = withDefaults(
    defineProps<{
      appointment?: Appointment;
      defaults?: Partial<{
        patientId: string;
        providerId: string;
        visitTypeId: string;
        date: string;
        start: string;
      }>;
      /** Warn before leaving the page with unsaved changes. Off inside dialogs. */
      guard?: boolean;
    }>(),
    { appointment: undefined, defaults: () => ({}), guard: false }
  );
  const emit = defineEmits<{ saved: [appointment: Appointment]; cancel: [] }>();
  const uid = useId();
  const { state, saveAppointment } = useDemo();
  const { pending, error, run } = useAction();

  const editing = computed(() => Boolean(props.appointment));
  const form = ref({
    patientId: props.appointment?.patientId ?? props.defaults.patientId ?? "",
    visitTypeId:
      props.appointment?.visitTypeId ||
      props.defaults.visitTypeId ||
      // With a provider already chosen, start on a visit type they offer.
      state.value?.providers.find((item) => item.id === props.defaults.providerId)
        ?.visitTypeIds[0] ||
      state.value?.visitTypes[0]?.id ||
      "",
    providerId: props.appointment?.providerId ?? props.defaults.providerId ?? "",
    date: props.appointment?.date ?? props.defaults.date ?? today,
    start: props.appointment?.start ?? props.defaults.start ?? "",
    reason: props.appointment?.reason ?? "",
    notes: props.appointment?.notes ?? "",
  });
  const { dirty, markSaved } = props.guard
    ? useUnsaved(form)
    : { dirty: ref(false), markSaved: () => {} };
  const message = ref("");

  const visit = computed(() =>
    state.value?.visitTypes.find((item) => item.id === form.value.visitTypeId)
  );
  const providers = computed(() =>
    (state.value?.providers ?? []).filter(
      (item) =>
        item.active &&
        (!form.value.visitTypeId || item.visitTypeIds.includes(form.value.visitTypeId))
    )
  );
  // A visit type change can make the chosen provider invalid; keep the form consistent.
  watch(
    () => form.value.visitTypeId,
    () => {
      if (
        form.value.providerId &&
        !providers.value.some((item) => item.id === form.value.providerId)
      )
        form.value.providerId = "";
    }
  );
  const provider = computed(() =>
    providers.value.find((item) => item.id === form.value.providerId)
  );
  const starts = computed(() => {
    if (!provider.value || !visit.value || !form.value.date) return [];
    const list = openStarts({
      provider: provider.value,
      minutes: visit.value.minutes,
      date: form.value.date,
      appointments: (state.value?.appointments ?? [])
        .filter((item) => item.date === form.value.date)
        .map(slim),
      slotMinutes: state.value?.clinic.slotMinutes ?? 15,
      ignoreId: props.appointment?.id,
    });
    const original = props.appointment;
    if (
      original &&
      original.providerId === form.value.providerId &&
      original.date === form.value.date &&
      !list.includes(original.start)
    )
      return [original.start, ...list].sort();
    return list;
  });
  watch(starts, (list) => {
    if (form.value.start && !list.includes(form.value.start)) form.value.start = "";
  });
  const timeFormat = computed(() => state.value?.preferences.timeFormat ?? "12h");
  const patients = computed(() => state.value?.patients ?? []);

  function candidate(): Appointment {
    const end = addMinutes(form.value.start || "00:00", visit.value?.minutes ?? 0);
    const id = props.appointment?.id ?? newId("appointment");
    const stamp = now();
    return {
      id,
      reference: props.appointment?.reference ?? referenceFor(id),
      patientId: form.value.patientId,
      providerId: form.value.providerId,
      visitTypeId: form.value.visitTypeId,
      date: form.value.date,
      start: form.value.start,
      end,
      status: props.appointment?.status ?? "scheduled",
      reason: form.value.reason.trim(),
      notes: form.value.notes,
      source: props.appointment?.source ?? "staff",
      createdAt: props.appointment?.createdAt ?? stamp,
      updatedAt: stamp,
    };
  }
  async function submit() {
    message.value = "";
    if (!form.value.patientId) return void (message.value = "Choose a patient.");
    if (!form.value.visitTypeId) return void (message.value = "Choose a visit type.");
    if (!form.value.providerId) return void (message.value = "Choose a provider.");
    if (!form.value.date) return void (message.value = "Choose a date.");
    if (!form.value.start) return void (message.value = "Choose a start time.");
    const record = candidate();
    const original = props.appointment;
    const moved =
      !original ||
      original.providerId !== record.providerId ||
      original.date !== record.date ||
      original.start !== record.start;
    const problems = bookingProblems(
      record,
      {
        providers: state.value!.providers,
        visitTypes: state.value!.visitTypes,
        patientIds: state.value!.patients.map((item) => item.id),
        slotMinutes: state.value!.clinic.slotMinutes,
        appointments: state
          .value!.appointments.filter((item) => item.date === record.date)
          .map(slim),
      },
      { checkPast: moved }
    );
    if (problems.length) {
      message.value = problems.join(" ");
      return;
    }
    const result = await run(() => saveAppointment(record));
    if (result) {
      markSaved();
      useSonner.success(result.created ? "Appointment booked" : "Appointment updated");
      emit("saved", result.saved);
    }
  }
  const pastDate = computed(() => !editing.value && form.value.date < today);
  const noOpenings = computed(
    () =>
      Boolean(provider.value && visit.value && form.value.date) &&
      starts.value.length === 0 &&
      !isInPast(form.value.date, "23:59")
  );
</script>
<template>
  <form class="space-y-5" novalidate @submit.prevent="submit">
    <div class="space-y-2">
      <UiLabel :for="`${uid}-patient`">Patient</UiLabel>
      <MendlyPatientPicker :id="`${uid}-patient`" v-model="form.patientId" :patients="patients" />
      <p v-if="!editing" class="text-xs text-muted-foreground">
        Not in the list?
        <NuxtLink to="/patients/new" class="text-primary underline underline-offset-2"
          >Add a new patient</NuxtLink
        >
      </p>
    </div>
    <div class="grid gap-4 sm:grid-cols-2">
      <div class="space-y-2">
        <UiLabel :for="`${uid}-visit`">Visit type</UiLabel>
        <UiNativeSelect :id="`${uid}-visit`" v-model="form.visitTypeId">
          <option v-for="item in state?.visitTypes" :key="item.id" :value="item.id">
            {{ item.name }} · {{ formatDuration(item.minutes) }}
          </option>
        </UiNativeSelect>
      </div>
      <div class="space-y-2">
        <UiLabel :for="`${uid}-provider`">Provider</UiLabel>
        <UiNativeSelect :id="`${uid}-provider`" v-model="form.providerId">
          <option value="" disabled>Choose a provider</option>
          <option v-for="item in providers" :key="item.id" :value="item.id">
            {{ item.name }} · {{ item.specialty }}
          </option>
        </UiNativeSelect>
      </div>
    </div>
    <div class="grid gap-4 sm:grid-cols-2">
      <div class="space-y-2">
        <UiLabel :for="`${uid}-date`">Date</UiLabel>
        <UiInput
          :id="`${uid}-date`"
          v-model="form.date"
          type="date"
          :min="editing ? undefined : today"
        />
      </div>
      <div class="space-y-2">
        <UiLabel :for="`${uid}-start`">Start time</UiLabel>
        <UiNativeSelect
          :id="`${uid}-start`"
          v-model="form.start"
          :disabled="!provider || starts.length === 0"
        >
          <option value="" disabled>
            {{
              !provider
                ? "Choose a provider first"
                : starts.length
                  ? "Choose a time"
                  : "No openings"
            }}
          </option>
          <option v-for="time in starts" :key="time" :value="time">
            {{ formatTime(time, timeFormat) }}
          </option>
        </UiNativeSelect>
      </div>
    </div>
    <p v-if="pastDate" class="text-xs text-muted-foreground">
      New visits can't be booked in the past.
    </p>
    <UiAlert
      v-else-if="noOpenings"
      role="status"
      icon="lucide:calendar-x"
      :description="`${provider?.name} has no openings for this visit on this day. Try another date or provider.`"
    />
    <p v-else-if="visit && form.start" class="text-xs text-muted-foreground">
      Runs {{ formatTime(form.start, timeFormat) }} to
      {{ formatTime(addMinutes(form.start, visit.minutes), timeFormat) }}
      ({{ formatDuration(visit.minutes) }}).
    </p>
    <div class="space-y-2">
      <UiLabel :for="`${uid}-reason`">Reason for visit</UiLabel>
      <UiInput
        :id="`${uid}-reason`"
        v-model="form.reason"
        :maxlength="300"
        placeholder="Blood pressure review"
      />
    </div>
    <div class="space-y-2">
      <UiLabel :for="`${uid}-notes`">Internal notes</UiLabel>
      <UiTextarea :id="`${uid}-notes`" v-model="form.notes" :rows="3" :maxlength="5000" />
    </div>
    <MendlyError :message="message || error" />
    <div class="flex flex-wrap items-center justify-end gap-2">
      <span v-if="dirty" class="mr-auto text-xs text-muted-foreground">Unsaved changes</span>
      <UiButton variant="outline" type="button" @click="emit('cancel')">Cancel</UiButton>
      <UiButton type="submit" :loading="pending">{{
        editing ? "Save changes" : "Book appointment"
      }}</UiButton>
    </div>
  </form>
</template>
