<script setup lang="ts">
  import { formatDate, formatPercent, formatPrice } from "#shared/format";
  import { addDays, holdsSlot, slim, utilization } from "#shared/schedule";
  import { today } from "~/utils/demo";
  usePageSeo({ title: "Reports" });
  const { state } = useDemo();

  const appointments = computed(() => state.value?.appointments ?? []);
  const windowStart = addDays(today, -14);
  const past = computed(() =>
    appointments.value.filter((item) => item.date >= windowStart && item.date < today)
  );
  const completed = computed(() => past.value.filter((item) => item.status === "completed"));
  const missed = computed(() => past.value.filter((item) => item.status === "no-show"));
  const cancelled = computed(() => past.value.filter((item) => item.status === "cancelled"));
  const price = (id: string) => state.value?.visitTypes.find((item) => item.id === id)?.price ?? 0;
  const revenue = computed(() =>
    completed.value.reduce((sum, item) => sum + price(item.visitTypeId), 0)
  );
  const attended = computed(() => completed.value.length + missed.value.length);
  const noShowRate = computed(() => (attended.value ? missed.value.length / attended.value : 0));
  const cancelRate = computed(() =>
    past.value.length ? cancelled.value.length / past.value.length : 0
  );
  const onlineShare = computed(() => {
    const booked = appointments.value.filter((item) => holdsSlot(item.status));
    return booked.length
      ? booked.filter((item) => item.source === "online").length / booked.length
      : 0;
  });

  const kpis = computed(() => [
    {
      label: "Completed visits",
      hint: "Last 14 days",
      value: String(completed.value.length),
      icon: "lucide:circle-check",
    },
    {
      label: "Estimated revenue",
      hint: "Completed, at list price",
      value: formatPrice(revenue.value),
      icon: "lucide:banknote",
    },
    {
      label: "No-show rate",
      hint: `${missed.value.length} of ${attended.value} attended slots`,
      value: formatPercent(noShowRate.value),
      icon: "lucide:user-x",
    },
    {
      label: "Booked online",
      hint: "Share of all booked visits",
      value: formatPercent(onlineShare.value),
      icon: "lucide:globe",
    },
  ]);

  // Daily outcome for the last 14 days (weekdays only).
  const daily = computed(() => {
    const days: {
      date: string;
      label: string;
      completed: number;
      missed: number;
      cancelled: number;
    }[] = [];
    for (let offset = -14; offset < 0; offset++) {
      const date = addDays(today, offset);
      if ([0, 6].includes(new Date(date + "T00:00:00Z").getUTCDay())) continue;
      const items = appointments.value.filter((item) => item.date === date);
      days.push({
        date,
        label: formatDate(date, "day"),
        completed: items.filter((item) => item.status === "completed").length,
        missed: items.filter((item) => item.status === "no-show").length,
        cancelled: items.filter((item) => item.status === "cancelled").length,
      });
    }
    return days;
  });
  const dailySeries = computed(() => [
    { name: "Completed", data: daily.value.map((item) => item.completed) },
    { name: "No-show", data: daily.value.map((item) => item.missed) },
    { name: "Cancelled", data: daily.value.map((item) => item.cancelled) },
  ]);
  const dailyOptions = computed(() => ({
    colors: ["var(--color-primary)", "#d97706", "#94a3b8"],
    chart: { stacked: true, animations: { enabled: false }, toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 3, columnWidth: "60%" } },
    xaxis: { categories: daily.value.map((item) => item.label) },
    legend: { show: true, position: "top" as const },
    yaxis: { labels: { formatter: (value: number) => String(Math.round(value)) } },
    grid: { strokeDashArray: 4 },
  }));

  const mix = computed(() =>
    (state.value?.visitTypes ?? [])
      .map((visit) => ({
        name: visit.name,
        count: appointments.value.filter(
          (item) => item.visitTypeId === visit.id && holdsSlot(item.status)
        ).length,
      }))
      .filter((item) => item.count)
      .sort((a, b) => b.count - a.count)
  );
  const mixOptions = computed(() => ({
    labels: mix.value.map((item) => item.name),
    chart: { animations: { enabled: false } },
    colors: ["#d6153f", "#0369a1", "#0d9488", "#d97706", "#64748b", "#ea580c", "#be185d"],
    legend: { show: true, position: "bottom" as const },
    dataLabels: { enabled: false },
    plotOptions: { pie: { donut: { size: "62%" } } },
  }));

  const slimmed = computed(() => appointments.value.map(slim));
  const load = computed(() =>
    (state.value?.providers ?? [])
      .filter((item) => item.active)
      .map((provider) => ({
        name: provider.name,
        value: Math.round(utilization(provider, slimmed.value, today, 14) * 100),
      }))
  );
  const loadOptions = computed(() => ({
    colors: ["var(--color-primary)"],
    chart: { animations: { enabled: false }, toolbar: { show: false } },
    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: "55%" } },
    xaxis: { categories: load.value.map((item) => item.name), max: 100 },
    dataLabels: { enabled: true, formatter: (value: number) => value + "%" },
    grid: { show: false },
    tooltip: { y: { formatter: (value: number) => value + "% booked" } },
  }));

  const sources = computed(() => {
    const labels: Record<string, string> = {
      staff: "Front desk",
      online: "Online",
      phone: "Phone",
      waitlist: "Waitlist",
    };
    return Object.entries(labels).map(([key, label]) => ({
      label,
      count: appointments.value.filter((item) => item.source === key && holdsSlot(item.status))
        .length,
    }));
  });
  const total = computed(() => sources.value.reduce((sum, item) => sum + item.count, 0) || 1);
</script>
<template>
  <div class="page-shell">
    <MendlyPageHeader
      title="Reports"
      description="How the clinic is doing. Figures cover the last two weeks of the demo schedule."
    />
    <section aria-label="Key figures" class="mb-6 grid gap-4 @lg:grid-cols-2 @4xl:grid-cols-4">
      <UiCard v-for="item in kpis" :key="item.label">
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

    <div class="grid gap-6 @4xl:grid-cols-2">
      <UiCard class="@4xl:col-span-2">
        <UiCardHeader>
          <UiCardTitle as="h2">Visit outcomes by day</UiCardTitle>
          <UiCardDescription
            >Completed, missed and cancelled visits over the last two weeks.</UiCardDescription
          >
        </UiCardHeader>
        <UiCardContent>
          <ClientOnly>
            <LazyUiApexchart
              type="bar"
              :height="300"
              :series="dailySeries"
              :options="dailyOptions"
            />
            <template #fallback><UiSkeleton class="h-75" /></template>
          </ClientOnly>
          <ul class="sr-only" aria-label="Visit outcomes by day">
            <li v-for="item in daily" :key="item.date">
              {{ item.label }}: {{ item.completed }} completed, {{ item.missed }} no-show,
              {{ item.cancelled }} cancelled
            </li>
          </ul>
        </UiCardContent>
      </UiCard>

      <UiCard>
        <UiCardHeader>
          <UiCardTitle as="h2">Visit mix</UiCardTitle>
          <UiCardDescription>Booked visits by type across the schedule.</UiCardDescription>
        </UiCardHeader>
        <UiCardContent>
          <ClientOnly>
            <LazyUiApexchart
              type="donut"
              :height="300"
              :series="mix.map((item) => item.count)"
              :options="mixOptions"
            />
            <template #fallback><UiSkeleton class="h-75" /></template>
          </ClientOnly>
          <ul class="sr-only" aria-label="Visit mix">
            <li v-for="item in mix" :key="item.name">{{ item.name }}: {{ item.count }}</li>
          </ul>
        </UiCardContent>
      </UiCard>

      <UiCard>
        <UiCardHeader>
          <UiCardTitle as="h2">Provider utilization</UiCardTitle>
          <UiCardDescription>Share of open minutes booked, next 14 days.</UiCardDescription>
        </UiCardHeader>
        <UiCardContent>
          <ClientOnly>
            <LazyUiApexchart
              type="bar"
              :height="300"
              :series="[{ name: 'Booked', data: load.map((item) => item.value) }]"
              :options="loadOptions"
            />
            <template #fallback><UiSkeleton class="h-75" /></template>
          </ClientOnly>
          <ul class="sr-only" aria-label="Provider utilization">
            <li v-for="item in load" :key="item.name">{{ item.name }}: {{ item.value }}% booked</li>
          </ul>
        </UiCardContent>
      </UiCard>

      <UiCard>
        <UiCardHeader>
          <UiCardTitle as="h2">How visits get booked</UiCardTitle>
          <UiCardDescription>Every booked visit by where it came from.</UiCardDescription>
        </UiCardHeader>
        <UiCardContent class="space-y-4">
          <div v-for="item in sources" :key="item.label" class="space-y-1.5">
            <div class="flex justify-between text-sm">
              <span>{{ item.label }}</span>
              <span class="text-muted-foreground tabular-nums">
                {{ item.count }} · {{ formatPercent(item.count / total) }}
              </span>
            </div>
            <UiProgress
              :model-value="Math.round((item.count / total) * 100)"
              :aria-label="item.label"
            />
          </div>
        </UiCardContent>
      </UiCard>

      <UiCard>
        <UiCardHeader>
          <UiCardTitle as="h2">Cancellations</UiCardTitle>
          <UiCardDescription>Last two weeks.</UiCardDescription>
        </UiCardHeader>
        <UiCardContent class="space-y-2 text-sm">
          <p>
            <span class="text-2xl font-semibold tabular-nums">{{ formatPercent(cancelRate) }}</span>
            of visits were cancelled ({{ cancelled.length }} of {{ past.length }}).
          </p>
          <p class="text-muted-foreground">
            The waitlist is the fastest way to refill a cancelled slot.
            <NuxtLink to="/waitlist" class="text-primary underline underline-offset-2"
              >Open the waitlist</NuxtLink
            >.
          </p>
        </UiCardContent>
      </UiCard>
    </div>
  </div>
</template>
