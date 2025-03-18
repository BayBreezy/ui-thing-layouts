<template>
  <button
    v-tippy.bottom="{ content: label }"
    class="relative flex size-8 items-center justify-center text-muted-foreground/80 outline-offset-2 transition-colors before:absolute before:inset-y-1.5 before:left-0 before:w-px before:bg-border first:before:hidden first-of-type:rounded-s-lg last-of-type:rounded-e-lg hover:text-foreground focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-ring/70"
  >
    <Icon :name="icon" class="size-4" />
    <span class="sr-only">{{ label }}</span>
  </button>
</template>

<script lang="ts" setup>
  defineProps<{
    icon: string;
    label: string;
  }>();
</script>
