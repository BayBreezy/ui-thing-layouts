<template>
  <UiScrollArea type="auto" orientation="horizontal" class="pb-4">
    <div class="flex items-center rounded-lg border bg-background shadow-sm md:grid md:grid-cols-3">
      <template v-for="item in stats" :key="item.title">
        <div class="border-r p-6 first:rounded-l-[inherit] last:border-r-0">
          <p class="font-semibold">{{ item.title }}</p>
          <div class="mt-6 flex items-center">
            <p class="mr-3 text-2xl font-bold">{{ item.value }}</p>
            <Icon
              name="solar:round-arrow-up-bold-duotone"
              :class="['size-5', item.increase ? 'text-green-500' : 'text-amber-500']"
            />
            <p
              class="text-sm font-semibold"
              :class="[item.increase ? 'text-green-500' : 'text-amber-500']"
            >
              {{ item.increase ? "+" : "-" }}{{ item.percentage }}%
            </p>
          </div>
          <p class="mt-3 whitespace-nowrap text-sm text-muted-foreground lg:whitespace-normal">
            Compared to last week
          </p>
        </div>
      </template>
    </div>
  </UiScrollArea>
</template>

<script lang="ts" setup>
  const stats = [
    {
      title: "New subscriptions",
      value: "22",
      percentage: 23,
      comparedToLastWeek: true,
      increase: true,
    },
    {
      title: "New orders",
      value: "162",
      percentage: 3,
      comparedToLastWeek: true,
      increase: false,
    },
    {
      title: "Avg. order revenue",
      value: "$2,232.90",
      percentage: 16,
      comparedToLastWeek: true,
      increase: true,
    },
  ];
</script>
