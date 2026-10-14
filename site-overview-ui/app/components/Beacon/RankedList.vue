<script setup lang="ts">
  import { formatNumber, formatPercent } from "#shared/format";
  import type { RankedRow } from "#shared/types";

  const props = withDefaults(
    defineProps<{
      title: string;
      description?: string;
      rows: RankedRow[] | null;
      /** Column heading for the metric, like "Sessions". */
      unit?: string;
      /** When set, rows become buttons that report their key. */
      selectable?: boolean;
      /** The key of the row that is currently applied as a filter. */
      selected?: string;
      limit?: number;
    }>(),
    { unit: "Sessions", limit: 8 }
  );
  defineEmits<{ select: [key: string] }>();
  const top = computed(() => (props.rows ?? []).slice(0, props.limit));
  const max = computed(() => Math.max(1, ...top.value.map((row) => row.sessions)));
</script>
<template>
  <UiCard>
    <UiCardHeader>
      <UiCardTitle as="h2" class="text-base">{{ title }}</UiCardTitle>
      <UiCardDescription v-if="description">{{ description }}</UiCardDescription>
    </UiCardHeader>
    <UiCardContent>
      <div v-if="!rows" class="space-y-3">
        <UiSkeleton v-for="n in 5" :key="n" class="h-8" />
      </div>
      <p v-else-if="!top.length" class="py-6 text-center text-sm text-muted-foreground">
        No traffic matches these filters.
      </p>
      <ul v-else class="space-y-1" :aria-label="`${title}, by ${unit.toLowerCase()}`">
        <li v-for="row in top" :key="row.key">
          <component
            :is="selectable ? 'button' : 'div'"
            :type="selectable ? 'button' : undefined"
            :aria-pressed="selectable ? selected === row.key : undefined"
            :class="[
              'grid w-full grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 rounded-md px-2 py-1.5 text-left text-sm',
              selectable &&
                'cursor-pointer outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50',
              selected === row.key && 'bg-accent',
            ]"
            @click="selectable && $emit('select', row.key)"
          >
            <span class="truncate font-medium">{{ row.label }}</span>
            <span class="flex items-center gap-2 tabular-nums">
              {{ formatNumber(row.sessions) }}
              <BeaconDelta
                v-if="row.change !== null"
                :change="row.change"
                class="w-16 justify-end"
              />
              <span v-else class="w-16 text-right text-xs text-muted-foreground">—</span>
            </span>
            <span class="col-span-2 flex items-center gap-2" aria-hidden="true">
              <span class="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  class="block h-full rounded-full bg-primary"
                  :style="{ width: `${(row.sessions / max) * 100}%` }"
                />
              </span>
              <span class="w-10 text-right text-xs text-muted-foreground tabular-nums">
                {{ formatPercent(row.share, 0) }}
              </span>
            </span>
          </component>
        </li>
      </ul>
    </UiCardContent>
  </UiCard>
</template>
