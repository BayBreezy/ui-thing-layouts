<script setup lang="ts">
  import { formatChange } from "#shared/format";
  import { toneClasses } from "~/utils/demo";

  const props = defineProps<{
    change: number | null;
    /** For metrics where a drop is good news, like bounce rate. */
    invert?: boolean;
    /** Shown to screen readers after the number, like "vs previous period". */
    context?: string;
  }>();
  const tone = computed(() => {
    if (props.change === null || props.change === 0) return "info";
    const good = props.invert ? props.change < 0 : props.change > 0;
    return good ? "up" : "down";
  });
  const icon = computed(() =>
    props.change === null || props.change === 0
      ? "lucide:minus"
      : props.change > 0
        ? "lucide:arrow-up-right"
        : "lucide:arrow-down-right"
  );
</script>
<template>
  <span
    :class="[
      'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
      toneClasses[tone],
    ]"
  >
    <Icon :name="icon" class="size-3.5" aria-hidden="true" />
    {{ formatChange(change) }}
    <span v-if="context" class="sr-only"> {{ context }}</span>
  </span>
</template>
