<template>
  <UiTextarea
    v-bind="forwarded"
    data-slot="input-group-control"
    :class="inputGroupTextareaStyles({ class: normalizeClass(props.class) || undefined })"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <slot />
  </UiTextarea>
</template>

<script lang="ts">
  import { normalizeClass } from "vue";

  import type { TextareaProps } from "@/components/Ui/Textarea.vue";

  const inputGroupTextareaStyles = tv({
    base: "flex-1 resize-none rounded-none border-0 bg-transparent py-3 shadow-none focus-visible:ring-0 dark:bg-transparent",
  });
</script>

<script lang="ts" setup>
  const props = defineProps<TextareaProps>();
  // Declared so `v-model` reaches the wrapped textarea; Vue drops `onUpdate:modelValue` from
  // fallthrough attrs when a component declares the `modelValue` prop without emitting it.
  const emit = defineEmits<{ "update:modelValue": [value: string] }>();

  const forwarded = reactiveOmit(props, ["class"]);
</script>
