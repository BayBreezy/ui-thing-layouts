<script setup lang="ts">
  const { state } = useDemo();
  usePageSeo({ title: "Contacts" });
  const count = computed(() => state.value?.contacts.filter((item) => !item.archived).length ?? 0);
</script>
<template>
  <div class="page-shell">
    <VerdantPageHeader
      title="Your people"
      :description="`${count} contacts. Search, filter, tidy up and keep in touch.`"
    >
      <UiButton to="/contacts/new"><Icon name="lucide:user-plus" />New contact</UiButton>
    </VerdantPageHeader>
    <VerdantContactsExplorer />
  </div>
</template>
