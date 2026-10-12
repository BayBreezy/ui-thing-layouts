<script setup lang="ts">
  import { defaultPreferences } from "#shared/types";
  import type { Preferences } from "#shared/types";
  defineProps<{ hideHeader?: boolean }>();
  const model = defineModel<Preferences>({ required: true });
  const controls = [
    { key: "temperature", label: "Creativity", min: 0, max: 2, step: 0.1 },
    { key: "maxTokens", label: "Maximum tokens", min: 128, max: 8192, step: 128 },
    { key: "topP", label: "Focus (top P)", min: 0, max: 1, step: 0.1 },
  ] as const;
</script>
<template>
  <div class="space-y-6">
    <div v-if="!hideHeader" class="space-y-1">
      <h2 class="text-base font-semibold tracking-tight">Chat preferences</h2>
      <p class="text-sm text-muted-foreground">A few small adjustments for the way you work.</p>
    </div>
    <div class="space-y-4">
      <div class="space-y-2">
        <UiLabel>Model</UiLabel>
        <OrbitModelPicker v-model="model.modelId" />
      </div>
      <div class="space-y-2">
        <UiLabel for="writing-style">Writing style</UiLabel>
        <UiSelect v-model="model.writingStyle">
          <UiSelectTrigger id="writing-style" />
          <UiSelectContent>
            <UiSelectItem value="concise">Concise & clear</UiSelectItem>
            <UiSelectItem value="detailed">Thoughtful & detailed</UiSelectItem>
            <UiSelectItem value="technical">Technical & precise</UiSelectItem>
          </UiSelectContent>
        </UiSelect>
      </div>
      <div class="space-y-2">
        <UiLabel for="response-format">Response format</UiLabel>
        <UiSelect v-model="model.format">
          <UiSelectTrigger id="response-format" />
          <UiSelectContent>
            <UiSelectItem value="markdown">Markdown</UiSelectItem>
            <UiSelectItem value="json">JSON</UiSelectItem>
          </UiSelectContent>
        </UiSelect>
      </div>
    </div>
    <UiSeparator />
    <div class="space-y-5">
      <div v-for="control in controls" :key="control.key" class="space-y-3">
        <div class="flex items-center justify-between">
          <UiLabel>{{ control.label }}</UiLabel>
          <span class="font-mono text-sm text-muted-foreground">{{ model[control.key] }}</span>
        </div>
        <UiSlider
          :model-value="[model[control.key]]"
          :min="control.min"
          :max="control.max"
          :step="control.step"
          @update:model-value="model[control.key] = $event?.[0] ?? model[control.key]"
        >
          <template #thumb><UiSliderThumb :aria-label="control.label" /></template>
        </UiSlider>
      </div>
      <UiButton
        variant="ghost"
        size="sm"
        class="w-full text-muted-foreground"
        @click="model = { ...defaultPreferences }"
      >
        <Icon name="lucide:rotate-ccw" />Reset preferences
      </UiButton>
    </div>
    <UiAlert
      icon="lucide:flask-conical"
      description="Orbit models are fictional. Your selections change the demo response style and format."
      class="border-dashed shadow-none"
    />
  </div>
</template>
