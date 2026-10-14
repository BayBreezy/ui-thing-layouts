<script setup lang="ts">
  import { channelLabels, countryNames, deviceLabels } from "#shared/format";
  import { liveEvent, liveVisitors } from "#shared/live";
  import type { LiveEvent } from "#shared/types";
  import { referenceHour } from "#shared/types";

  usePageSeo({ title: "Live" });
  const { site } = useDemo();
  const events = ref<LiveEvent[]>([]);
  const paused = ref(false);
  const minute = ref(referenceHour * 60 + 20);
  let cursor = 1000;
  const visible = useDocumentVisibility();
  const time = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });

  function push(at: Date) {
    if (!site.value) return;
    events.value = [liveEvent(site.value, cursor++, at.toISOString()), ...events.value].slice(
      0,
      40
    );
  }
  function seed() {
    events.value = [];
    cursor = 1000;
    const now = Date.now();
    for (let n = 11; n >= 0; n--) push(new Date(now - n * 3500));
  }
  const { pause, resume } = useIntervalFn(
    () => {
      push(new Date());
      minute.value = referenceHour * 60 + 20 + Math.floor((cursor - 1000) / 24);
    },
    2800,
    { immediate: false }
  );
  onMounted(() => {
    seed();
    resume();
  });
  watch(() => site.value?.id, seed);
  watch([paused, visible], ([isPaused, vis]) =>
    isPaused || vis === "hidden" ? pause() : resume()
  );
  const count = computed(() => (site.value ? liveVisitors(site.value, minute.value) : 0));
  const perMinute = computed(() => Math.round(count.value * 1.8));
</script>
<template>
  <div class="page-shell">
    <BeaconPageHeader
      title="Live"
      :description="`A simulated real-time view of ${site?.name ?? 'your site'}. Events here are generated for the demo.`"
    >
      <UiButton variant="outline" @click="paused = !paused">
        <Icon :name="paused ? 'lucide:play' : 'lucide:pause'" />{{
          paused ? "Resume feed" : "Pause feed"
        }}
      </UiButton>
    </BeaconPageHeader>
    <section aria-label="Right now" class="mb-6 grid gap-4 @lg:grid-cols-2">
      <UiCard>
        <UiCardContent>
          <p class="text-sm text-muted-foreground">Visitors right now</p>
          <p class="mt-1 text-4xl font-semibold tracking-tight tabular-nums">{{ count }}</p>
        </UiCardContent>
      </UiCard>
      <UiCard>
        <UiCardContent>
          <p class="text-sm text-muted-foreground">Pageviews per minute</p>
          <p class="mt-1 text-4xl font-semibold tracking-tight tabular-nums">{{ perMinute }}</p>
        </UiCardContent>
      </UiCard>
    </section>
    <UiCard>
      <UiCardHeader>
        <UiCardTitle as="h2" class="text-base">Pageview stream</UiCardTitle>
        <UiCardDescription>
          {{
            paused
              ? "Paused. New events are not being added."
              : "New pageviews appear every few seconds."
          }}
        </UiCardDescription>
      </UiCardHeader>
      <UiCardContent>
        <ul v-if="events.length" class="divide-y" aria-label="Recent pageviews">
          <li
            v-for="item in events"
            :key="item.id"
            class="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5 text-sm"
          >
            <span class="w-24 text-xs text-muted-foreground tabular-nums">{{ time(item.at) }}</span>
            <span class="min-w-0 flex-1">
              <span class="font-medium">{{ item.title }}</span>
              <span class="ml-2 font-mono text-xs text-muted-foreground">{{ item.path }}</span>
            </span>
            <span class="text-xs text-muted-foreground">
              {{ countryNames[item.country] ?? item.country }} · {{ deviceLabels[item.device] }} ·
              {{ channelLabels[item.channel] }}
            </span>
          </li>
        </ul>
        <div v-else class="space-y-2"><UiSkeleton v-for="n in 6" :key="n" class="h-9" /></div>
      </UiCardContent>
    </UiCard>
  </div>
</template>
