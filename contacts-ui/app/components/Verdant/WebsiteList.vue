<script setup lang="ts">
  const websites = defineModel<string[]>({ required: true });
  const entries = computed(() => websites.value.map((value, index) => ({ value, index })));
  function update(index: number, value: string | number | undefined) {
    websites.value = websites.value.map((item, position) =>
      position === index ? String(value ?? "") : item
    );
  }
  function remove(index: number) {
    websites.value = websites.value.filter((_item, position) => position !== index);
  }
</script>
<template>
  <section aria-labelledby="web-heading" class="space-y-3">
    <h3 id="web-heading" class="text-sm font-medium">Websites</h3>
    <div v-for="entry in entries" :key="entry.index" class="flex items-center gap-2">
      <UiInput
        :model-value="entry.value"
        type="url"
        :aria-label="`Website ${entry.index + 1}`"
        placeholder="example.com"
        @update:model-value="update(entry.index, $event)"
      />
      <UiButton
        type="button"
        variant="ghost"
        size="icon-sm"
        :aria-label="`Remove website ${entry.index + 1}`"
        @click="remove(entry.index)"
      >
        <Icon name="lucide:trash-2" />
      </UiButton>
    </div>
    <UiButton type="button" variant="outline" size="sm" @click="websites = [...websites, '']">
      <Icon name="lucide:plus" />Add website
    </UiButton>
  </section>
</template>
