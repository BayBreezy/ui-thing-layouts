<script setup lang="ts">
  usePageSeo({ title: "Add patient" });
  const { ready } = useDemo();
</script>
<template>
  <div class="page-shell max-w-3xl!">
    <MendlyPageHeader
      title="Add a patient"
      description="Patients can also be created automatically from online bookings."
    />
    <UiCard>
      <UiCardContent class="pt-6">
        <div v-if="!ready" role="status" aria-label="Loading"><UiSkeleton class="h-96" /></div>
        <MendlyPatientForm
          v-else
          @saved="(patient) => navigateTo('/patients/' + patient.id)"
          @cancel="navigateTo('/patients')"
        />
      </UiCardContent>
    </UiCard>
  </div>
</template>
