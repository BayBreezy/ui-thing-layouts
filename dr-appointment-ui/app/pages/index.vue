<script setup lang="ts">
  import { formatDate, formatPercent, formatTime } from "#shared/format";
  import { addDays, holdsSlot, openStarts, slim } from "#shared/schedule";
  import { nowTime, today } from "~/utils/demo";
  usePageSeo({ title: "Today" });
  const { state, bulk } = useDemo();
  const timeFormat = computed(() => state.value?.preferences.timeFormat ?? "12h");

  const todays = computed(() =>
    (state.value?.appointments ?? [])
      .filter((item) => item.date === today)
      .sort((a, b) => a.start.localeCompare(b.start))
  );
  const active = computed(() => todays.value.filter((item) => holdsSlot(item.status)));
  const done = computed(() => todays.value.filter((item) => item.status === "completed").length);
  const waiting = computed(() => todays.value.filter((item) => item.status === "checked-in"));
  const inRoom = computed(() => todays.value.filter((item) => item.status === "in-progress"));
  const upcoming = computed(() =>
    todays.value.filter((item) => ["scheduled", "confirmed"].includes(item.status))
  );
  const finished = computed(() =>
    todays.value.filter((item) => ["completed", "cancelled", "no-show"].includes(item.status))
  );

  /** Open follow-up-sized slots left across all providers for the rest of the day. */
  const openLeft = computed(() => {
    const draft = state.value;
    if (!draft) return 0;
    const follow =
      draft.visitTypes.find((item) => item.id === "visit-follow-up") ?? draft.visitTypes[0];
    if (!follow) return 0;
    const appointments = draft.appointments.filter((item) => item.date === today).map(slim);
    return draft.providers
      .filter((item) => item.active && item.visitTypeIds.includes(follow.id))
      .reduce(
        (sum, provider) =>
          sum +
          openStarts({
            provider,
            minutes: follow.minutes,
            date: today,
            appointments,
            slotMinutes: draft.clinic.slotMinutes,
          }).length,
        0
      );
  });
  const noShowRate = computed(() => {
    const past = (state.value?.appointments ?? []).filter(
      (item) => item.date < today && item.date >= addDays(today, -28)
    );
    const counted = past.filter((item) => item.status === "completed" || item.status === "no-show");
    return counted.length
      ? counted.filter((item) => item.status === "no-show").length / counted.length
      : 0;
  });

  const tomorrow = addDays(today, 1);
  const unconfirmed = computed(() =>
    (state.value?.appointments ?? []).filter(
      (item) => item.date >= today && item.date <= addDays(today, 2) && item.status === "scheduled"
    )
  );
  const bulkPending = ref(false);
  async function confirmAll() {
    bulkPending.value = true;
    try {
      const result = await bulk(
        "confirm",
        unconfirmed.value.map((item) => item.id)
      );
      useSonner.success(`${result.ids.length} visits confirmed`);
    } catch {
      useSonner.error("We couldn't confirm those visits. Try again.");
    } finally {
      bulkPending.value = false;
    }
  }

  /** The next 14 clinic days, as booked visit counts. */
  const load = computed(() => {
    const days: { date: string; label: string; count: number }[] = [];
    for (let offset = 0; offset < 14; offset++) {
      const date = addDays(today, offset);
      if ([0, 6].includes(new Date(date + "T00:00:00Z").getUTCDay())) continue;
      days.push({
        date,
        label: formatDate(date, "day"),
        count: (state.value?.appointments ?? []).filter(
          (item) => item.date === date && holdsSlot(item.status)
        ).length,
      });
    }
    return days;
  });
  const loadSeries = computed(() => [
    { name: "Visits", data: load.value.map((item) => item.count) },
  ]);
  const loadOptions = computed(() => ({
    colors: ["var(--color-primary)"],
    chart: { animations: { enabled: false }, toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 4, columnWidth: "55%" } },
    xaxis: { categories: load.value.map((item) => item.label) },
    yaxis: { labels: { formatter: (value: number) => String(Math.round(value)) } },
    grid: { strokeDashArray: 4 },
  }));

  const stats = computed(() => [
    {
      label: "Visits today",
      value: String(active.value.length),
      hint: `${done.value} completed`,
      icon: "lucide:calendar-check",
    },
    {
      label: "In the waiting room",
      value: String(waiting.value.length),
      hint: `${inRoom.value.length} with a provider`,
      icon: "lucide:door-open",
    },
    {
      label: "Open slots left today",
      value: String(openLeft.value),
      hint: "20-minute follow-ups",
      icon: "lucide:calendar-plus",
    },
    {
      label: "No-show rate",
      value: formatPercent(noShowRate.value),
      hint: "Last 28 days",
      icon: "lucide:user-x",
    },
  ]);
  const firstName = computed(() => state.value?.profile.name.split(" ")[0] ?? "");
</script>
<template>
  <div class="page-shell">
    <MendlyPageHeader
      :title="`Good morning, ${firstName}.`"
      :description="`${formatDate(today, 'full')} · demo clock ${formatTime(nowTime, timeFormat)}`"
    >
      <UiButton variant="outline" to="/calendar"
        ><Icon name="lucide:calendar-days" />Calendar</UiButton
      >
      <UiButton to="/appointments/new"
        ><Icon name="lucide:calendar-plus" />Book appointment</UiButton
      >
    </MendlyPageHeader>

    <section aria-label="Today at a glance" class="grid gap-4 @lg:grid-cols-2 @4xl:grid-cols-4">
      <UiCard v-for="item in stats" :key="item.label">
        <UiCardContent class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm text-muted-foreground">{{ item.label }}</p>
            <p class="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{{ item.value }}</p>
            <p class="mt-1 text-xs text-muted-foreground">{{ item.hint }}</p>
          </div>
          <span class="rounded-lg bg-primary/10 p-2 text-primary" aria-hidden="true">
            <Icon :name="item.icon" class="size-5" />
          </span>
        </UiCardContent>
      </UiCard>
    </section>

    <div class="mt-6 grid gap-6 @4xl:grid-cols-3">
      <div class="space-y-6 @4xl:col-span-2">
        <UiCard>
          <UiCardHeader>
            <UiCardTitle as="h2">Now in the building</UiCardTitle>
            <UiCardDescription>
              Patients who are checked in or with a provider right now.
            </UiCardDescription>
          </UiCardHeader>
          <UiCardContent class="p-0">
            <ul v-if="inRoom.length || waiting.length" class="divide-y border-t">
              <MendlyVisitRow
                v-for="item in [...inRoom, ...waiting]"
                :key="item.id"
                :appointment="item"
              />
            </ul>
            <p v-else class="border-t px-6 py-8 text-center text-sm text-muted-foreground">
              No one is checked in right now.
            </p>
          </UiCardContent>
        </UiCard>

        <UiCard>
          <UiCardHeader>
            <UiCardTitle as="h2">Later today</UiCardTitle>
            <UiCardDescription>{{ upcoming.length }} visits still to come.</UiCardDescription>
          </UiCardHeader>
          <UiCardContent class="p-0">
            <ul v-if="upcoming.length" class="divide-y border-t">
              <MendlyVisitRow v-for="item in upcoming" :key="item.id" :appointment="item" />
            </ul>
            <p v-else class="border-t px-6 py-8 text-center text-sm text-muted-foreground">
              That's the last visit of the day.
            </p>
          </UiCardContent>
        </UiCard>

        <UiCard>
          <UiCardHeader>
            <UiCardTitle as="h2">Earlier today</UiCardTitle>
            <UiCardDescription>Completed, cancelled and missed visits.</UiCardDescription>
          </UiCardHeader>
          <UiCardContent class="p-0">
            <ul v-if="finished.length" class="divide-y border-t">
              <MendlyVisitRow v-for="item in finished" :key="item.id" :appointment="item" />
            </ul>
            <p v-else class="border-t px-6 py-8 text-center text-sm text-muted-foreground">
              Nothing has finished yet.
            </p>
          </UiCardContent>
        </UiCard>
      </div>

      <div class="space-y-6">
        <UiCard>
          <UiCardHeader>
            <UiCardTitle as="h2">Needs attention</UiCardTitle>
            <UiCardDescription>Things worth a look before they become problems.</UiCardDescription>
          </UiCardHeader>
          <UiCardContent class="space-y-3 text-sm">
            <div class="flex items-start gap-3 rounded-lg border p-3">
              <Icon name="lucide:calendar-clock" class="mt-0.5 size-4 shrink-0 text-primary" />
              <div class="flex-1">
                <p class="font-medium">
                  {{ unconfirmed.length }} unconfirmed
                  {{ unconfirmed.length === 1 ? "visit" : "visits" }}
                </p>
                <p class="text-muted-foreground">
                  Through {{ formatDate(addDays(today, 2), "day") }}.
                </p>
                <UiButton
                  v-if="unconfirmed.length"
                  size="sm"
                  variant="outline"
                  class="mt-2"
                  :loading="bulkPending"
                  @click="confirmAll"
                >
                  Confirm all
                </UiButton>
              </div>
            </div>
            <div class="flex items-start gap-3 rounded-lg border p-3">
              <Icon name="lucide:hourglass" class="mt-0.5 size-4 shrink-0 text-primary" />
              <div class="flex-1">
                <p class="font-medium">{{ state?.waitlist.length ?? 0 }} on the waitlist</p>
                <p class="text-muted-foreground">
                  {{ state?.waitlist.filter((item) => item.urgency === "urgent").length ?? 0 }}
                  urgent.
                </p>
                <UiButton size="sm" variant="outline" class="mt-2" to="/waitlist">
                  Fill openings
                </UiButton>
              </div>
            </div>
            <div class="flex items-start gap-3 rounded-lg border p-3">
              <Icon name="lucide:globe" class="mt-0.5 size-4 shrink-0 text-primary" />
              <div class="flex-1">
                <p class="font-medium">
                  Online booking is {{ state?.clinic.onlineBooking ? "on" : "off" }}
                </p>
                <p class="text-muted-foreground">
                  Tomorrow ({{ formatDate(tomorrow, "day") }}) has
                  {{
                    (state?.appointments ?? []).filter(
                      (item) => item.date === tomorrow && holdsSlot(item.status)
                    ).length
                  }}
                  visits.
                </p>
                <UiButton size="sm" variant="outline" class="mt-2" to="/book"
                  >Open booking page</UiButton
                >
              </div>
            </div>
          </UiCardContent>
        </UiCard>

        <UiCard>
          <UiCardHeader>
            <UiCardTitle as="h2">Next two weeks</UiCardTitle>
            <UiCardDescription>Booked visits by clinic day.</UiCardDescription>
          </UiCardHeader>
          <UiCardContent>
            <ClientOnly>
              <LazyUiApexchart
                type="bar"
                :height="240"
                :series="loadSeries"
                :options="loadOptions"
              />
              <template #fallback><UiSkeleton class="h-60" /></template>
            </ClientOnly>
            <ul class="sr-only" aria-label="Booked visits by day">
              <li v-for="item in load" :key="item.date">{{ item.label }}: {{ item.count }}</li>
            </ul>
          </UiCardContent>
        </UiCard>
      </div>
    </div>
  </div>
</template>
