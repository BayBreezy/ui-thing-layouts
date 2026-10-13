<script setup lang="ts">
  import { formatDate, formatRange } from "#shared/format";
  import { buildIcs, downloadFile } from "~/utils/demo";

  definePageMeta({ layout: "booking" });
  usePageSeo({ title: "Visit booked", canonical: false });
  const route = useRoute();
  const { state } = useDemo();
  const appointment = computed(() =>
    state.value?.appointments.find((item) => item.id === String(route.query.id || ""))
  );
  const provider = computed(() =>
    state.value?.providers.find((item) => item.id === appointment.value?.providerId)
  );
  const visit = computed(() =>
    state.value?.visitTypes.find((item) => item.id === appointment.value?.visitTypeId)
  );
  const timeFormat = computed(() => state.value?.preferences.timeFormat ?? "12h");
  function addToCalendar() {
    const item = appointment.value;
    if (!item || !state.value) return;
    downloadFile(
      `${item.reference}.ics`,
      buildIcs({
        id: item.id,
        title: `${visit.value?.name} at ${state.value.clinic.name}`,
        date: item.date,
        start: item.start,
        end: item.end,
        location: `${state.value.clinic.name}, ${state.value.clinic.address}`,
        description: `With ${provider.value?.name}. Reference ${item.reference}.`,
      }),
      "text/calendar;charset=utf-8"
    );
  }
</script>
<template>
  <MendlyRecordGate :exists="Boolean(appointment)" back="/book" back-label="Start a new booking">
    <div v-if="appointment" class="space-y-6 text-center">
      <span
        class="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary"
      >
        <Icon name="lucide:calendar-check" class="size-7" />
      </span>
      <div>
        <h1 class="text-3xl font-semibold tracking-tight">You're booked.</h1>
        <p class="mt-2 text-muted-foreground">
          Reference
          <span class="font-mono font-medium text-foreground">{{ appointment.reference }}</span>
        </p>
      </div>
      <UiCard class="text-left">
        <UiCardContent class="space-y-3 text-sm">
          <p class="text-base font-medium">{{ visit?.name }}</p>
          <p class="flex items-center gap-2">
            <Icon name="lucide:calendar" class="size-4" />{{ formatDate(appointment.date, "full") }}
          </p>
          <p class="flex items-center gap-2 tabular-nums">
            <Icon name="lucide:clock" class="size-4" />
            {{ formatRange(appointment.start, appointment.end, timeFormat) }}
          </p>
          <p class="flex items-center gap-2">
            <Icon name="lucide:stethoscope" class="size-4" />{{ provider?.name }} ·
            {{ provider?.room }}
          </p>
          <p class="flex items-center gap-2">
            <Icon name="lucide:map-pin" class="size-4" />{{ state?.clinic.name }},
            {{ state?.clinic.address }}
          </p>
        </UiCardContent>
      </UiCard>
      <p class="text-sm text-muted-foreground">
        A reminder would be sent {{ state?.clinic.reminderHours }} hours before. This is a demo, so
        nothing is actually sent.
      </p>
      <div class="flex flex-wrap justify-center gap-2">
        <UiButton @click="addToCalendar"
          ><Icon name="lucide:calendar-plus" />Add to calendar</UiButton
        >
        <UiButton variant="outline" :to="'/appointments/' + appointment.id">
          <Icon name="lucide:layout-dashboard" />See it in the staff view
        </UiButton>
        <UiButton variant="ghost" to="/book">Book another visit</UiButton>
      </div>
    </div>
  </MendlyRecordGate>
</template>
