<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between gap-2">
      <UiLabel>{{ label }}</UiLabel>
      <div class="flex items-center gap-1">
        <UiButton
          v-tippy="'Reset to default'"
          size="icon"
          variant="ghost"
          class="group size-7"
          aria-label="Reset"
          @click="model = modelValue"
        >
          <Icon
            name="lucide:rotate-ccw"
            class="size-4 text-muted-foreground/50 transition group-hover:text-foreground"
            aria-hidden="true"
          />
        </UiButton>
        <UiInput
          v-model="model"
          class="h-7 w-16 border-none px-2 py-0 text-right tabular-nums"
          type="text"
          input-mode="decimal"
          aria-label="Enter value"
        />
      </div>
    </div>
    <div class="flex items-center gap-4">
      <UiSlider
        v-model="model"
        class="[&_[data-slot=slider-track]]:!bg-black/10 dark:[&_[data-slot=slider-track]]:!bg-white/20"
        :min="minValue"
        :max="maxValue"
        :step="step"
        :aria-label="label"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
  withDefaults(
    defineProps<{
      modelValue: number[];
      label: string;
      step?: number;
      minValue?: number;
      maxValue?: number;
    }>(),
    {
      minValue: 0.0,
      maxValue: 100,
      step: 1,
    }
  );

  const model = defineModel<number[]>();
</script>
