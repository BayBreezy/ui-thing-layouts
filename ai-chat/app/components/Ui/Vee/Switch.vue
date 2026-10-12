<template>
  <div :class="styles({ class: normalizeClass(props.class) || undefined })">
    <UiSwitch
      :id="inputId"
      v-bind="$attrs"
      :name="name"
      :required="required"
      :disabled="disabled"
      :model-value="value"
      :true-value="trueValue"
      :false-value="falseValue"
      @update:model-value="handleChange"
    />
    <div class="grid gap-1 leading-[1.25]">
      <slot name="label" :error-message="errorMessage" :checked="checked">
        <UiLabel v-if="label" :for="inputId" :class="[errorMessage && 'text-destructive']">
          {{ label }}
        </UiLabel>
      </slot>
      <div>
        <slot name="hint" :error-message="errorMessage" :checked="checked">
          <p
            v-if="hint && !errorMessage"
            :id="`${inputId}-message`"
            class="text-sm text-muted-foreground"
          >
            {{ hint }}
          </p>
        </slot>
        <slot name="errorMessage" :error-message="errorMessage" :checked="checked">
          <p
            v-if="errorMessage"
            :id="`${inputId}-message`"
            role="alert"
            class="text-sm text-destructive"
          >
            {{ errorMessage }}
          </p>
        </slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { normalizeClass } from "vue";
  import type { HTMLAttributes } from "vue";

  const props = defineProps<{
    label?: string;
    hint?: string;
    modelValue?: any;
    name?: string;
    id?: string;
    rules?: any;
    validateOnMount?: boolean;
    required?: boolean;
    disabled?: boolean;
    trueValue?: any;
    falseValue?: any;
    class?: HTMLAttributes["class"];
  }>();

  defineOptions({ inheritAttrs: false });

  const inputId = props.id || useId();

  const styles = tv({
    base: "flex items-start gap-3",
  });

  const { errorMessage, checked, value, handleChange } = useField(
    () => props.name || inputId,
    props.rules,
    {
      initialValue: props.modelValue,
      label: props.label,
      validateOnMount: props.validateOnMount,
      type: "checkbox",
      checkedValue: props.trueValue ?? true,
      uncheckedValue: props.falseValue ?? false,
      syncVModel: true,
    }
  );
</script>
