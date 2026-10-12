<script setup lang="ts">
  import { parseMarkdown } from "@nuxtjs/mdc/runtime";
  const props = defineProps<{ value: string }>();
  const parsed = shallowRef(await parseMarkdown(props.value, { toc: false }));
  let revision = 0;
  watch(
    () => props.value,
    async (value) => {
      const current = ++revision;
      const result = await parseMarkdown(value, { toc: false });
      if (current === revision) parsed.value = result;
    }
  );
  onBeforeUnmount(() => revision++);
</script>
<template><MDCRenderer :body="parsed.body" :data="parsed.data" class="orbit-prose" /></template>
