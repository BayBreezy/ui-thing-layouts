<template>
  <UiInput
    v-bind="forwarded"
    data-slot="input-group-control"
    :class="inputGroupInputStyles({ class: normalizeClass(props.class) || undefined })"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <slot />
  </UiInput>
</template>

<script lang="ts">
  import { normalizeClass } from "vue";

  import type { InputProps } from "@/components/Ui/Input.vue";

  const inputGroupInputStyles = tv({
    base: "flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent",
  });
</script>

<script lang="ts" setup>
  const props = defineProps<InputProps>();
  // Declared so `v-model` reaches the wrapped input; Vue drops `onUpdate:modelValue` from fallthrough
  // attrs when a component declares the `modelValue` prop without emitting it.
  const emit = defineEmits<{ "update:modelValue": [value: any] }>();

  const forwarded = reactiveOmit(props, ["class"]);
</script>
