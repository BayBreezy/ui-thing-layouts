<template>
  <div>
    <h1 class="text-2xl font-semibold">
      <span id="dashboard-welcome">Overview</span>
    </h1>
    <p class="text-muted-foreground">
      Welcome back, <strong>{{ user.firstName }} {{ user.lastName }}</strong
      >! You have <strong>12</strong> unread notifications.
    </p>
    <StatCards />
    <ChartAppointmentTrends class="mt-6" />
    <div class="mt-6 @container">
      <div class="grid grid-cols-1 gap-6 @[1000px]:grid-cols-3">
        <div class="col-span-full @[600px]:col-span-2">
          <ChartDoctorWorkload />
        </div>
        <div class="col-span-full @[1000px]:col-span-1">
          <ChartAppointmentDuration />
        </div>
      </div>
    </div>
    <ChartPatientDistribution class="mt-6" />
    <TableRecentAppointments class="mt-6" />
  </div>
</template>

<script lang="ts" setup>
  const user = useUser();
  onMounted(() => {
    useCurrentBreadcrumbs().value = [
      {
        label: `${user.value.firstName} ${user.value.lastName}`,
        icon: "solar:stethoscope-bold-duotone",
      },
      { label: "Dashboard", icon: "solar:home-2-bold-duotone", link: "/" },
    ];
  });
</script>
