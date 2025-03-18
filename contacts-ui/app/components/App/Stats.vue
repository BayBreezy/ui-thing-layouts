<template>
  <div
    class="grid grid-cols-2 rounded-xl border border-border bg-gradient-to-br from-sidebar/60 to-sidebar min-[1200px]:grid-cols-4"
  >
    <template v-for="item in stats" :key="item.title">
      <AppStatCard v-bind="item" />
    </template>
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
  const stats: StatsCardProps[] = [
    {
      title: "Connections",
      value: "427,296",
      change: {
        value: "+12%",
        trend: "up",
      },
      icon: "ri:link",
    },
    {
      title: "Contacts",
      value: "37,429",
      change: {
        value: "+42%",
        trend: "up",
      },
      icon: "ri:database-2-line",
    },
    {
      title: "Value",
      value: "$82,439",
      change: {
        value: "+37%",
        trend: "up",
      },
      icon: "ri:dashboard-3-line",
    },
    {
      title: "Referrals",
      value: "3,497",
      change: {
        value: "-17%",
        trend: "down",
      },
      icon: "ri:pen-nib-line",
    },
  ];
</script>
