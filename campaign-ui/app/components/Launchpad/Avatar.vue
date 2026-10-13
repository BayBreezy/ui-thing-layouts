<script setup lang="ts">
  import type { Member } from "#shared/types";
  defineProps<{ member?: Member; size?: "xs" | "sm" | "default" | "lg" | "xl" }>();
  const colors = {
    violet: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
    amber: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
    teal: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200",
    rose: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
  };
  const sizes = { xl: "size-14 text-base" };
</script>
<template>
  <UiAvatar
    :size="size === 'xl' ? 'lg' : size"
    :class="size === 'xl' ? sizes.xl : undefined"
    aria-hidden="true"
  >
    <UiAvatarFallback
      :class="[
        'font-semibold',
        size === 'xs' || size === 'sm' ? 'text-[10px]' : 'text-xs',
        size === 'xl' && 'text-base',
        colors[(member?.color as keyof typeof colors) || 'violet'],
      ]"
      >{{ member?.initials || "LP" }}</UiAvatarFallback
    >
  </UiAvatar>
</template>
