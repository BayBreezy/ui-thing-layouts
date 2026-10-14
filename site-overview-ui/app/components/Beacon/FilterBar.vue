<script setup lang="ts">
  import { channelLabels, countryNames, deviceLabels, presetLabels } from "#shared/format";
  import { describeRange } from "#shared/format";
  import { channels, devices } from "#shared/types";
  import type { Filters } from "#shared/types";

  const {
    prefs,
    range,
    activeFilters,
    filtering,
    setPreset,
    setCustomRange,
    setFilter,
    clearFilters,
  } = useReportQuery();
  const { site } = useDemo();
  const uid = useId();
  const open = ref(false);
  const custom = reactive({ from: "", to: "" });
  const presets = ["today", "7d", "30d", "90d"] as const;

  const value = computed(() => prefs.value?.range.preset ?? "30d");
  watch(
    range,
    (resolved) => {
      if (resolved) Object.assign(custom, resolved);
    },
    { immediate: true }
  );
  function onPreset(next: string) {
    if (next === "custom") open.value = true;
    else setPreset(next as (typeof presets)[number]);
  }
  function applyCustom() {
    setCustomRange(custom.from, custom.to);
    open.value = false;
  }
  const chipLabel = (key: string, raw: string) => {
    if (key === "channel") return channelLabels[raw as keyof typeof channelLabels] ?? raw;
    if (key === "device") return deviceLabels[raw as keyof typeof deviceLabels] ?? raw;
    if (key === "country") return countryNames[raw] ?? raw;
    return site.value?.pages.find((page) => page.path === raw)?.title ?? raw;
  };
  const chipPrefix: Record<string, string> = {
    channel: "Channel",
    device: "Device",
    country: "Country",
    page: "Page",
  };
</script>
<template>
  <section aria-label="Report filters" class="mb-6 space-y-3">
    <div class="flex flex-wrap items-end gap-3">
      <div class="space-y-1.5">
        <UiLabel :for="`${uid}-range`">Date range</UiLabel>
        <UiNativeSelect
          :id="`${uid}-range`"
          class="w-44"
          :model-value="value"
          @update:model-value="onPreset(String($event))"
        >
          <option v-for="item in presets" :key="item" :value="item">
            {{ presetLabels[item] }}
          </option>
          <option value="custom">
            {{
              value === "custom" && range ? describeRange(range.from, range.to) : "Custom range…"
            }}
          </option>
        </UiNativeSelect>
      </div>
      <UiPopover v-model:open="open">
        <UiPopoverTrigger as-child>
          <UiButton variant="outline" :class="value === 'custom' ? 'border-primary' : ''">
            <Icon name="lucide:calendar-range" />Choose dates
          </UiButton>
        </UiPopoverTrigger>
        <UiPopoverContent align="start" class="w-72">
          <form class="space-y-3" @submit.prevent="applyCustom">
            <div class="space-y-1.5">
              <UiLabel :for="`${uid}-from`">From</UiLabel>
              <UiInput :id="`${uid}-from`" v-model="custom.from" type="date" required />
            </div>
            <div class="space-y-1.5">
              <UiLabel :for="`${uid}-to`">To</UiLabel>
              <UiInput :id="`${uid}-to`" v-model="custom.to" type="date" required />
            </div>
            <UiButton type="submit" class="w-full">Apply range</UiButton>
          </form>
        </UiPopoverContent>
      </UiPopover>
      <div class="flex h-9 items-center gap-2">
        <UiSwitch
          :id="`${uid}-compare`"
          :model-value="prefs?.compare ?? true"
          @update:model-value="prefs && (prefs.compare = Boolean($event))"
        />
        <UiLabel :for="`${uid}-compare`" class="font-normal">Compare to previous period</UiLabel>
      </div>
      <UiPopover>
        <UiPopoverTrigger as-child>
          <UiButton variant="outline" class="ml-auto">
            <Icon name="lucide:list-filter" />Filter
            <span
              v-if="activeFilters.length"
              class="rounded-full bg-primary px-1.5 text-xs text-primary-foreground tabular-nums"
              >{{ activeFilters.length }}</span
            >
          </UiButton>
        </UiPopoverTrigger>
        <UiPopoverContent align="end" class="w-72 space-y-3">
          <div class="space-y-1.5">
            <UiLabel :for="`${uid}-channel`">Channel</UiLabel>
            <UiNativeSelect
              :id="`${uid}-channel`"
              :model-value="prefs?.filters.channel ?? ''"
              @update:model-value="setFilter('channel', String($event) as Filters['channel'])"
            >
              <option value="">All channels</option>
              <option v-for="item in channels" :key="item" :value="item">
                {{ channelLabels[item] }}
              </option>
            </UiNativeSelect>
          </div>
          <div class="space-y-1.5">
            <UiLabel :for="`${uid}-device`">Device</UiLabel>
            <UiNativeSelect
              :id="`${uid}-device`"
              :model-value="prefs?.filters.device ?? ''"
              @update:model-value="setFilter('device', String($event) as Filters['device'])"
            >
              <option value="">All devices</option>
              <option v-for="item in devices" :key="item" :value="item">
                {{ deviceLabels[item] }}
              </option>
            </UiNativeSelect>
          </div>
          <div class="space-y-1.5">
            <UiLabel :for="`${uid}-country`">Country</UiLabel>
            <UiNativeSelect
              :id="`${uid}-country`"
              :model-value="prefs?.filters.country ?? ''"
              @update:model-value="setFilter('country', String($event))"
            >
              <option value="">All countries</option>
              <option v-for="(name, code) in countryNames" :key="code" :value="code">
                {{ name }}
              </option>
            </UiNativeSelect>
          </div>
          <div class="space-y-1.5">
            <UiLabel :for="`${uid}-page`">Page</UiLabel>
            <UiNativeSelect
              :id="`${uid}-page`"
              :model-value="prefs?.filters.page ?? ''"
              @update:model-value="setFilter('page', String($event))"
            >
              <option value="">All pages</option>
              <option v-for="page in site?.pages ?? []" :key="page.path" :value="page.path">
                {{ page.title }}
              </option>
            </UiNativeSelect>
          </div>
        </UiPopoverContent>
      </UiPopover>
    </div>
    <ul v-if="filtering" class="flex flex-wrap items-center gap-2" aria-label="Active filters">
      <li v-if="prefs && prefs.segment !== 'all'">
        <UiBadge variant="outline" class="gap-1.5 py-1">
          Segment:
          {{
            prefs.segment === "mobile"
              ? "Mobile users"
              : prefs.segment === "returning"
                ? "Returning users"
                : channelLabels[prefs.segment]
          }}
          <button
            type="button"
            class="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Remove segment"
            @click="prefs.segment = 'all'"
          >
            <Icon name="lucide:x" class="size-3" />
          </button>
        </UiBadge>
      </li>
      <li v-for="[key, raw] in activeFilters" :key="key">
        <UiBadge variant="outline" class="gap-1.5 py-1">
          {{ chipPrefix[key] }}: {{ chipLabel(key, String(raw)) }}
          <button
            type="button"
            class="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            :aria-label="`Remove ${chipPrefix[key]?.toLowerCase()} filter`"
            @click="setFilter(key as keyof Filters, '' as never)"
          >
            <Icon name="lucide:x" class="size-3" />
          </button>
        </UiBadge>
      </li>
      <li>
        <UiButton variant="link" size="sm" @click="clearFilters">Clear all</UiButton>
      </li>
    </ul>
  </section>
</template>
