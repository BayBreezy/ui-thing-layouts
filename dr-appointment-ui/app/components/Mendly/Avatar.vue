<script setup lang="ts">
  import { hueFor, initialsOf } from "#shared/patients";
  const props = withDefaults(
    defineProps<{ name: string; hue?: number; size?: "xs" | "sm" | "md" | "lg" }>(),
    { hue: undefined, size: "md" }
  );
  const initials = computed(() => initialsOf(props.name));
  const hue = computed(() => props.hue ?? hueFor(props.name));
  const sizes = {
    xs: "size-5 text-[9px]",
    sm: "size-7 text-[11px]",
    md: "size-9 text-xs",
    lg: "size-14 text-lg",
  };
</script>
<template>
  <span
    aria-hidden="true"
    :class="[
      'person-avatar inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
      sizes[size],
    ]"
    :style="{ '--hue': hue }"
    >{{ initials }}</span
  >
</template>
