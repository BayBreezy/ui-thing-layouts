<script setup lang="ts">
  import { formatDate, formatPercent } from "#shared/format";
  import { holdsSlot, slim, utilization } from "#shared/schedule";
  import { providerSchema } from "#shared/schemas";
  import type { Provider, WorkingDay } from "#shared/types";
  import { clone, today } from "~/utils/demo";

  const route = useRoute();
  const id = computed(() => String(route.params.id));
  const { state, saveProvider } = useDemo();
  const { pending, error, run } = useAction();
  const uid = useId();
  const provider = computed(() => state.value?.providers.find((item) => item.id === id.value));
  usePageSeo({ title: () => provider.value?.name ?? "Provider" });
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const defaultDay = (): WorkingDay => ({
    start: "09:00",
    end: "17:00",
    breakStart: "12:00",
    breakEnd: "13:00",
  });

  const form = ref<Provider | null>(null);
  const { dirty, markSaved } = useUnsaved(form);
  watch(
    provider,
    (value) => {
      if (value && !form.value) {
        form.value = clone(value);
        markSaved();
      }
    },
    { immediate: true }
  );
  const message = ref("");
  const newDayOff = ref("");
  function setWorking(index: number, on: boolean) {
    if (!form.value) return;
    form.value.hours[index] = on ? defaultDay() : null;
  }
  function addDayOff() {
    if (!form.value || !newDayOff.value) return;
    if (!form.value.daysOff.includes(newDayOff.value))
      form.value.daysOff = [...form.value.daysOff, newDayOff.value].sort();
    newDayOff.value = "";
  }
  function toggleVisit(visitId: string, on: boolean) {
    if (!form.value) return;
    form.value.visitTypeIds = on
      ? [...new Set([...form.value.visitTypeIds, visitId])]
      : form.value.visitTypeIds.filter((item) => item !== visitId);
  }
  async function save() {
    if (!form.value) return;
    message.value = "";
    for (const day of form.value.hours) {
      if (!day) continue;
      const hasBreak = Boolean(day.breakStart || day.breakEnd);
      if (hasBreak && (!day.breakStart || !day.breakEnd)) {
        message.value = "Set both a break start and a break end, or clear both.";
        return;
      }
      if (
        hasBreak &&
        !(day.start < day.breakStart && day.breakStart < day.breakEnd && day.breakEnd < day.end)
      ) {
        message.value = "A break must fall inside the working day.";
        return;
      }
    }
    try {
      await providerSchema.validate(form.value, { abortEarly: true });
    } catch (cause) {
      message.value = (cause as Error).message;
      return;
    }
    const saved = await run(() => saveProvider(clone(form.value!)));
    if (saved) {
      markSaved();
      useSonner.success("Schedule saved");
    }
  }
  const load = computed(() =>
    provider.value
      ? utilization(provider.value, (state.value?.appointments ?? []).map(slim), today, 14)
      : 0
  );
  const upcoming = computed(
    () =>
      (state.value?.appointments ?? []).filter(
        (item) => item.providerId === id.value && item.date >= today && holdsSlot(item.status)
      ).length
  );
  const todays = computed(() =>
    (state.value?.appointments ?? [])
      .filter((item) => item.providerId === id.value && item.date === today)
      .sort((a, b) => a.start.localeCompare(b.start))
  );
</script>
<template>
  <div class="page-shell">
    <MendlyRecordGate :exists="Boolean(provider)" back="/providers" back-label="Back to providers">
      <template v-if="provider && form">
        <MendlyPageHeader
          :title="provider.name"
          :description="`${provider.specialty} · ${provider.room}`"
        >
          <UiButton :to="`/calendar?provider=${provider.id}`" variant="outline">
            <Icon name="lucide:calendar-days" />Open calendar
          </UiButton>
          <UiButton :to="`/appointments/new?provider=${provider.id}`">
            <Icon name="lucide:calendar-plus" />Book with
            {{ provider.name.split(" ").slice(-1)[0] }}
          </UiButton>
        </MendlyPageHeader>

        <div class="mb-6 grid gap-4 @lg:grid-cols-3">
          <UiCard>
            <UiCardContent>
              <p class="text-sm text-muted-foreground">Booked, next 14 days</p>
              <p class="mt-1 text-3xl font-semibold tabular-nums">{{ formatPercent(load) }}</p>
            </UiCardContent>
          </UiCard>
          <UiCard>
            <UiCardContent>
              <p class="text-sm text-muted-foreground">Upcoming visits</p>
              <p class="mt-1 text-3xl font-semibold tabular-nums">{{ upcoming }}</p>
            </UiCardContent>
          </UiCard>
          <UiCard>
            <UiCardContent>
              <p class="text-sm text-muted-foreground">Today</p>
              <p class="mt-1 text-3xl font-semibold tabular-nums">
                {{ todays.filter((item) => holdsSlot(item.status)).length }}
              </p>
            </UiCardContent>
          </UiCard>
        </div>

        <form class="grid gap-6 @4xl:grid-cols-3" novalidate @submit.prevent="save">
          <UiCard class="@4xl:col-span-2">
            <UiCardHeader>
              <UiCardTitle as="h2">Weekly hours</UiCardTitle>
              <UiCardDescription>
                New bookings can only be made inside these hours and outside breaks.
              </UiCardDescription>
            </UiCardHeader>
            <UiCardContent>
              <ul class="divide-y">
                <li
                  v-for="(label, index) in dayNames"
                  :key="label"
                  class="flex flex-wrap items-center gap-x-4 gap-y-2 py-3"
                >
                  <div class="flex w-40 items-center gap-3">
                    <UiSwitch
                      :id="`${uid}-day-${index}`"
                      :model-value="form.hours[index] !== null"
                      @update:model-value="setWorking(index, $event === true)"
                    />
                    <UiLabel :for="`${uid}-day-${index}`" class="font-medium">{{ label }}</UiLabel>
                  </div>
                  <template v-if="form.hours[index]">
                    <div class="flex flex-wrap items-center gap-2 text-sm">
                      <UiLabel :for="`${uid}-s-${index}`" class="sr-only"
                        >{{ label }} start</UiLabel
                      >
                      <UiInput
                        :id="`${uid}-s-${index}`"
                        v-model="form.hours[index]!.start"
                        type="time"
                        step="900"
                        class="w-32"
                      />
                      <span aria-hidden="true">to</span>
                      <UiLabel :for="`${uid}-e-${index}`" class="sr-only">{{ label }} end</UiLabel>
                      <UiInput
                        :id="`${uid}-e-${index}`"
                        v-model="form.hours[index]!.end"
                        type="time"
                        step="900"
                        class="w-32"
                      />
                    </div>
                    <div class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span>Break</span>
                      <UiLabel :for="`${uid}-bs-${index}`" class="sr-only"
                        >{{ label }} break start</UiLabel
                      >
                      <UiInput
                        :id="`${uid}-bs-${index}`"
                        v-model="form.hours[index]!.breakStart"
                        type="time"
                        step="900"
                        class="w-32"
                      />
                      <span aria-hidden="true">to</span>
                      <UiLabel :for="`${uid}-be-${index}`" class="sr-only"
                        >{{ label }} break end</UiLabel
                      >
                      <UiInput
                        :id="`${uid}-be-${index}`"
                        v-model="form.hours[index]!.breakEnd"
                        type="time"
                        step="900"
                        class="w-32"
                      />
                    </div>
                  </template>
                  <span v-else class="text-sm text-muted-foreground">Not working</span>
                </li>
              </ul>
            </UiCardContent>
          </UiCard>

          <div class="space-y-6">
            <UiCard>
              <UiCardHeader><UiCardTitle as="h2">Availability</UiCardTitle></UiCardHeader>
              <UiCardContent class="space-y-4">
                <div class="flex items-center justify-between gap-3">
                  <UiLabel :for="`${uid}-active`">Taking appointments</UiLabel>
                  <UiSwitch :id="`${uid}-active`" v-model="form.active" />
                </div>
                <div class="flex items-center justify-between gap-3">
                  <UiLabel :for="`${uid}-new`">Accepting new patients</UiLabel>
                  <UiSwitch :id="`${uid}-new`" v-model="form.acceptingNew" />
                </div>
              </UiCardContent>
            </UiCard>

            <UiCard>
              <UiCardHeader>
                <UiCardTitle as="h2">Visit types</UiCardTitle>
                <UiCardDescription>What patients can book with this provider.</UiCardDescription>
              </UiCardHeader>
              <UiCardContent class="space-y-3">
                <div
                  v-for="item in state?.visitTypes"
                  :key="item.id"
                  class="flex items-center gap-3"
                >
                  <UiCheckbox
                    :id="`${uid}-v-${item.id}`"
                    :model-value="form.visitTypeIds.includes(item.id)"
                    @update:model-value="toggleVisit(item.id, $event === true)"
                  />
                  <UiLabel :for="`${uid}-v-${item.id}`" class="font-normal">{{
                    item.name
                  }}</UiLabel>
                </div>
              </UiCardContent>
            </UiCard>

            <UiCard>
              <UiCardHeader>
                <UiCardTitle as="h2">Days off</UiCardTitle>
                <UiCardDescription>Vacation, conferences and training.</UiCardDescription>
              </UiCardHeader>
              <UiCardContent class="space-y-3">
                <div class="flex items-end gap-2">
                  <div class="flex-1 space-y-1.5">
                    <UiLabel :for="`${uid}-off`">Add a day off</UiLabel>
                    <UiInput :id="`${uid}-off`" v-model="newDayOff" type="date" :min="today" />
                  </div>
                  <UiButton type="button" variant="outline" @click="addDayOff">Add</UiButton>
                </div>
                <ul v-if="form.daysOff.length" class="space-y-1.5 text-sm">
                  <li
                    v-for="date in form.daysOff"
                    :key="date"
                    class="flex items-center justify-between rounded-md border px-3 py-1.5"
                  >
                    {{ formatDate(date, "long") }}
                    <UiButton
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      :aria-label="`Remove ${formatDate(date, 'long')}`"
                      @click="form.daysOff = form.daysOff.filter((item) => item !== date)"
                    >
                      <Icon name="lucide:x" />
                    </UiButton>
                  </li>
                </ul>
                <p v-else class="text-sm text-muted-foreground">No days off scheduled.</p>
              </UiCardContent>
            </UiCard>
          </div>

          <div class="space-y-3 @4xl:col-span-3">
            <MendlyError :message="message || error" />
            <div class="flex items-center justify-end gap-3">
              <span v-if="dirty" class="mr-auto text-sm text-muted-foreground"
                >Unsaved changes</span
              >
              <UiButton type="submit" :loading="pending">Save schedule</UiButton>
            </div>
          </div>
        </form>
      </template>
    </MendlyRecordGate>
  </div>
</template>
