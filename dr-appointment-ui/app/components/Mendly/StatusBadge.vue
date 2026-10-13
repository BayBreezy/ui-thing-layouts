<script setup lang="ts">
  import type { AppointmentStatus } from "#shared/types";
  import { statusMeta } from "~/utils/demo";
  defineProps<{ status: AppointmentStatus }>();
</script>
<template>
  <span
    :class="[
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
      statusMeta[status].badge,
    ]"
  >
    <Icon :name="statusMeta[status].icon" class="size-3.5" aria-hidden="true" />
    {{ statusMeta[status].label }}
  </span>
</template>
