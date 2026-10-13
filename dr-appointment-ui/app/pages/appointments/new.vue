<script setup lang="ts">
  usePageSeo({ title: "Book appointment" });
  const route = useRoute();
  const defaults = computed(() => ({
    patientId: typeof route.query.patient === "string" ? route.query.patient : "",
    providerId: typeof route.query.provider === "string" ? route.query.provider : "",
    visitTypeId: typeof route.query.type === "string" ? route.query.type : "",
    date: typeof route.query.date === "string" ? route.query.date : undefined,
    start: typeof route.query.start === "string" ? route.query.start : "",
  }));
  // The editor reads its defaults once, so the route is parsed before it mounts.
  const initial = defaults.value;
  const { ready } = useDemo();
</script>
<template>
  <div class="page-shell max-w-3xl!">
    <MendlyPageHeader
      title="Book an appointment"
      description="Times shown are open for the chosen provider. Double-booking isn't possible."
    />
    <UiCard>
      <UiCardContent class="pt-6">
        <div v-if="!ready" role="status" aria-label="Loading the schedule">
          <UiSkeleton class="h-96" />
        </div>
        <MendlyAppointmentEditor
          v-else
          guard
          :defaults="initial"
          @saved="(visit) => navigateTo('/appointments/' + visit.id)"
          @cancel="navigateTo('/appointments')"
        />
      </UiCardContent>
    </UiCard>
  </div>
</template>
