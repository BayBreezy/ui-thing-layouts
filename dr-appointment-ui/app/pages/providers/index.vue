<script setup lang="ts">
  import { formatPercent } from "#shared/format";
  import { holdsSlot, slim, utilization, weekdayOf, workingDay } from "#shared/schedule";
  import { addDays } from "#shared/schedule";
  import type { Provider } from "#shared/types";
  import { today } from "~/utils/demo";
  usePageSeo({ title: "Providers" });
  const { state } = useDemo();
  const slimmed = computed(() => (state.value?.appointments ?? []).map(slim));
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const workdays = (provider: Provider) => {
    const names = provider.hours.map((day, index) => (day ? dayNames[index] : "")).filter(Boolean);
    return names.length ? names.join(", ") : "No regular hours";
  };
  const cards = computed(() =>
    (state.value?.providers ?? []).map((provider) => {
      const todays = (state.value?.appointments ?? []).filter(
        (item) => item.providerId === provider.id && item.date === today && holdsSlot(item.status)
      ).length;
      return {
        provider,
        todays,
        working: Boolean(workingDay(provider, today)),
        load: utilization(provider, slimmed.value, today, 14),
        offToday: provider.daysOff.includes(today),
        weekday: weekdayOf(today),
        next: addDays(today, 1),
      };
    })
  );
</script>
<template>
  <div class="page-shell">
    <MendlyPageHeader
      title="Providers"
      description="Working hours, days off and how full each schedule is."
    />
    <ul class="grid gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
      <li v-for="card in cards" :key="card.provider.id">
        <UiCard class="h-full">
          <UiCardHeader>
            <div class="flex items-start gap-3">
              <MendlyAvatar :name="card.provider.name" :hue="card.provider.hue" size="lg" />
              <div class="min-w-0">
                <UiCardTitle as="h2" class="text-lg">
                  <NuxtLink :to="'/providers/' + card.provider.id" class="hover:underline">{{
                    card.provider.name
                  }}</NuxtLink>
                </UiCardTitle>
                <UiCardDescription>
                  {{ card.provider.specialty }} · {{ card.provider.room }}
                </UiCardDescription>
              </div>
            </div>
          </UiCardHeader>
          <UiCardContent class="space-y-4 text-sm">
            <p class="text-muted-foreground">{{ card.provider.bio }}</p>
            <div class="flex flex-wrap gap-1.5">
              <UiBadge :variant="card.working ? 'default' : 'secondary'">
                {{
                  card.working
                    ? `In today · ${card.todays} ${card.todays === 1 ? "visit" : "visits"}`
                    : card.offToday
                      ? "Day off today"
                      : "Not in today"
                }}
              </UiBadge>
              <UiBadge variant="outline">
                {{
                  card.provider.acceptingNew
                    ? "Accepting new patients"
                    : "Not accepting new patients"
                }}
              </UiBadge>
            </div>
            <div>
              <div class="mb-1.5 flex justify-between">
                <span class="text-muted-foreground">Booked, next 14 days</span>
                <span class="font-medium tabular-nums">{{ formatPercent(card.load) }}</span>
              </div>
              <UiProgress
                :model-value="Math.round(card.load * 100)"
                :aria-label="`${card.provider.name} utilization`"
              />
            </div>
            <p class="text-xs text-muted-foreground">{{ workdays(card.provider) }}</p>
          </UiCardContent>
          <UiCardFooter>
            <UiButton :to="'/providers/' + card.provider.id" variant="outline" size="sm">
              View schedule
            </UiButton>
          </UiCardFooter>
        </UiCard>
      </li>
    </ul>
  </div>
</template>
