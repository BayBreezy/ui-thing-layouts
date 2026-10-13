<script setup lang="ts">
  import { formatDuration, formatRange } from "#shared/format";
  import { fullName } from "#shared/patients";
  import { allowedTransitions } from "#shared/schedule";
  import type { Appointment } from "#shared/types";
  import { nextStep } from "~/composables/useVisitActions";
  import { statusMeta, visitColorClasses } from "~/utils/demo";

  const props = withDefaults(
    defineProps<{ appointment: Appointment; showDate?: boolean; showPatient?: boolean }>(),
    { showDate: false, showPatient: true }
  );
  const { state } = useDemo();
  const { busy, change } = useVisitActions();
  const patient = computed(() =>
    state.value?.patients.find((item) => item.id === props.appointment.patientId)
  );
  const provider = computed(() =>
    state.value?.providers.find((item) => item.id === props.appointment.providerId)
  );
  const visit = computed(() =>
    state.value?.visitTypes.find((item) => item.id === props.appointment.visitTypeId)
  );
  const step = computed(() => nextStep[props.appointment.status]);
  const timeFormat = computed(() => state.value?.preferences.timeFormat ?? "12h");
  const others = computed(() =>
    allowedTransitions(props.appointment.status).filter((status) => status !== step.value?.to)
  );
  const title = computed(() =>
    props.showPatient
      ? patient.value
        ? fullName(patient.value)
        : "Unknown patient"
      : (visit.value?.name ?? "Visit")
  );
</script>
<template>
  <li class="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
    <div class="w-28 shrink-0 text-sm tabular-nums">
      <p class="font-medium">{{ formatRange(appointment.start, appointment.end, timeFormat) }}</p>
      <p v-if="showDate" class="text-xs text-muted-foreground">{{ appointment.date }}</p>
      <p v-else class="text-xs text-muted-foreground">{{ formatDuration(visit?.minutes ?? 0) }}</p>
    </div>
    <div class="flex min-w-44 flex-1 items-center gap-3">
      <MendlyAvatar v-if="showPatient && patient" :name="fullName(patient)" />
      <div class="min-w-0">
        <NuxtLink
          :to="'/appointments/' + appointment.id"
          class="block truncate font-medium hover:underline"
          >{{ title }}</NuxtLink
        >
        <p class="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
          <span
            v-if="visit"
            :class="['size-2 shrink-0 rounded-full', visitColorClasses[visit.color].dot]"
            aria-hidden="true"
          />
          <span class="truncate"
            >{{ showPatient ? visit?.name : appointment.reason }} · {{ provider?.name }}</span
          >
        </p>
      </div>
    </div>
    <MendlyStatusBadge :status="appointment.status" />
    <div class="ml-auto flex items-center gap-1">
      <UiButton
        v-if="step"
        size="sm"
        variant="outline"
        :loading="busy === appointment.id"
        @click="change(appointment, step.to)"
      >
        <Icon :name="step.icon" />{{ step.label }}
      </UiButton>
      <UiDropdownMenu>
        <UiDropdownMenuTrigger as-child>
          <UiButton
            variant="ghost"
            size="icon-sm"
            :aria-label="`More actions for ${title} at ${appointment.start}`"
          >
            <Icon name="lucide:ellipsis" />
          </UiButton>
        </UiDropdownMenuTrigger>
        <UiDropdownMenuContent align="end">
          <UiDropdownMenuItem @select="navigateTo('/appointments/' + appointment.id)">
            <Icon name="lucide:external-link" />Open visit
          </UiDropdownMenuItem>
          <template v-if="others.length">
            <UiDropdownMenuSeparator />
            <UiDropdownMenuItem
              v-for="status in others"
              :key="status"
              @select="change(appointment, status)"
            >
              <Icon :name="statusMeta[status].icon" />Mark
              {{ statusMeta[status].label.toLowerCase() }}
            </UiDropdownMenuItem>
          </template>
        </UiDropdownMenuContent>
      </UiDropdownMenu>
    </div>
  </li>
</template>
