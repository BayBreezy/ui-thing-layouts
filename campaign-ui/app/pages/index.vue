<template>
  <div>
    <h1 class="text-3xl font-bold tracking-tight lg:text-4xl">Your total revenue</h1>
    <div class="mt-4 flex flex-col gap-5 md:flex-row md:items-center md:justify-between lg:mt-6">
      <p
        class="inline-block bg-gradient-to-r from-violet-500 via-pink-500 to-amber-500 bg-clip-text text-4xl font-black text-transparent lg:text-5xl"
      >
        $87,235.98
      </p>
      <div class="grid grid-cols-2 gap-3 md:flex md:items-center">
        <UiDatepicker v-model="date">
          <template #default="{ togglePopover }">
            <UiButton variant="outline" size="sm" @click="togglePopover">
              <Icon name="solar:calendar-bold-duotone" class="size-[18px] text-muted-foreground" />
              <span> {{ date ? useDateFormat(date, "MMM DD, YYYY").value : "Select a date" }}</span>
            </UiButton>
          </template>
        </UiDatepicker>
        <UiButton variant="outline" size="sm">
          <Icon name="solar:filter-bold-duotone" class="size-[18px] text-muted-foreground" />
          <span>Filters</span>
        </UiButton>
      </div>
    </div>
    <Stats class="mt-8" />
    <RecentCampaigns class="mt-8" />
  </div>
</template>

<script lang="ts" setup>
  import { useDateFormat } from "@vueuse/core";

  const date = ref(new Date());
</script>
