<script setup lang="ts">
  import type { HTMLAttributes } from "vue";

  import { models } from "#shared/types";
  const props = defineProps<{ class?: HTMLAttributes["class"] }>();
  const model = defineModel<string>({ required: true });
  const selected = computed(() => models.find((item) => item.id === model.value));
</script>
<template>
  <UiSelect v-model="model">
    <UiSelectTrigger aria-label="Select model" :class="props.class">
      <UiSelectValue placeholder="Choose a model">
        <Icon v-if="selected" :name="selected.icon" class="text-primary" />
        {{ selected?.name }}
      </UiSelectValue>
    </UiSelectTrigger>
    <UiSelectContent>
      <UiSelectItem v-for="item in models" :key="item.id" :value="item.id">
        <Icon :name="item.icon" class="text-primary" />
        <span class="flex flex-col items-start">
          <span class="font-medium">{{ item.name }}</span>
          <span class="text-xs text-muted-foreground">{{ item.description }}</span>
        </span>
      </UiSelectItem>
    </UiSelectContent>
  </UiSelect>
</template>
