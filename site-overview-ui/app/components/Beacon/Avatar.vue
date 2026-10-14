<script setup lang="ts">
  const props = withDefaults(defineProps<{ name: string; size?: "xs" | "sm" | "md" }>(), {
    size: "md",
  });
  const initials = computed(() =>
    props.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]!.toUpperCase())
      .join("")
  );
</script>
<template>
  <span
    aria-hidden="true"
    :class="[
      'inline-flex shrink-0 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground',
      size === 'xs' ? 'size-5 text-[10px]' : size === 'sm' ? 'size-8 text-xs' : 'size-10 text-sm',
    ]"
    >{{ initials }}</span
  >
</template>
