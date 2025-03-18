<template>
  <div
    class="group relative p-4 before:absolute before:inset-y-8 before:right-0 before:w-px before:bg-gradient-to-b before:from-input/30 before:via-input before:to-input/30 last:before:hidden lg:p-5"
  >
    <div class="relative flex items-center gap-4">
      <Icon
        name="ri:arrow-right-up-line"
        class="absolute right-0 top-0 size-5 text-emerald-500 opacity-0 transition-opacity group-has-[a:hover]:opacity-100"
        aria-hidden="true"
      />
      <!-- Icon  -->
      <div
        class="flex size-10 shrink-0 items-center justify-center rounded-full border border-emerald-600/50 bg-emerald-600/25 text-emerald-500 max-[480px]:hidden"
      >
        <Icon :name="props.icon" class="size-6" />
      </div>
      <!-- Content -->
      <div>
        <a
          href="#"
          class="text-xs font-medium uppercase tracking-widest text-muted-foreground/60 before:absolute before:inset-0"
        >
          {{ title }}
        </a>
        <div class="mb-2 text-2xl font-semibold">{{ value }}</div>
        <div class="text-xs text-muted-foreground/60">
          <span class="font-medium" :class="[trendColor]">
            {{ isPositive ? "↗" : "↘" }} {{ change.value }}
          </span>
          vs last week
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  interface StatsCardProps {
    title: string;
    value: string;
    change: {
      value: string;
      trend: "up" | "down";
    };
    icon: string;
  }

  const props = defineProps<StatsCardProps>();

  const isPositive = computed(() => props.change.trend === "up");
  const trendColor = computed(() => (isPositive.value ? "text-emerald-500" : "text-red-500"));
</script>
