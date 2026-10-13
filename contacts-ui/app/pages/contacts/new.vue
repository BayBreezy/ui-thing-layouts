<script setup lang="ts">
  import type { Contact } from "#shared/types";
  import { newContact } from "~/utils/demo";
  usePageSeo({ title: "New contact" });
  const route = useRoute();
  const record = newContact();
  if (typeof route.query.group === "string") record.groupIds = [route.query.group];
  async function saved(value: Contact) {
    await navigateTo("/contacts/" + value.id);
  }
</script>
<template>
  <div class="page-shell">
    <VerdantPageHeader
      title="Add someone new"
      description="Start with a name or a company. You can fill in the rest whenever you like."
    />
    <VerdantRecordGate :exists="true" back="/contacts">
      <VerdantContactEditor :record="record" @saved="saved" />
    </VerdantRecordGate>
  </div>
</template>
