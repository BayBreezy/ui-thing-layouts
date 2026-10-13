<template>
  <div class="w-full">
    <UiLabel
      v-if="label"
      :for="inputId"
      :hint="labelHint"
      :class="[disabled && 'text-muted-foreground', errorMessage && 'text-destructive', 'mb-2']"
      ><span>{{ label }} <span v-if="required" class="text-destructive">*</span></span></UiLabel
    >
    <div class="relative">
      <slot name="icon">
        <span v-if="hasIcon" class="absolute inset-y-0 left-3 flex items-center justify-center">
          <Icon v-if="icon" :name="icon" class="size-4 text-muted-foreground/70" />
        </span>
      </slot>
      <slot name="trailingIcon">
        <span
          v-if="hasTrailingIcon"
          class="absolute inset-y-0 right-3 flex items-center justify-center"
        >
          <Icon v-if="trailingIcon" :name="trailingIcon" class="size-4 text-muted-foreground/70" />
        </span>
      </slot>
      <UiInput
        :id="inputId"
        :aria-describedby="errorMessage || hint ? `${inputId}-message` : undefined"
        v-model="value"
        :type="type"
        :required="required"
        :name="name"
        :disabled="disabled"
        :aria-invalid="!!errorMessage"
        v-bind="$attrs"
        :class="[hasIcon && 'pl-9', hasTrailingIcon && 'pr-9']"
        :placeholder="placeholder"
        @blur="handleBlur"
      />
    </div>
    <div>
      <slot name="hint" :error-message="errorMessage" :value>
        <p
          v-if="hint && !errorMessage"
          :id="`${inputId}-message`"
          class="mt-1.5 text-sm text-muted-foreground"
        >
          {{ hint }}
        </p>
      </slot>
      <slot name="errorMessage" :error-message="errorMessage" :value>
        <p
          v-if="errorMessage"
          :id="`${inputId}-message`"
          role="alert"
          class="mt-1.5 text-sm text-destructive"
        >
          {{ errorMessage }}
        </p>
      </slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
  const props = defineProps<{
    label?: string;
    labelHint?: string;
    icon?: string;
    trailingIcon?: string;
    hint?: string;
    disabled?: boolean;
    modelValue?: string;
    name?: string;
    id?: string;
    rules?: any;
    validateOnMount?: boolean;
    type?: string;
    placeholder?: string;
    required?: boolean;
  }>();

  defineOptions({ inheritAttrs: false });

  const inputId = props.id || useId();

  const hasIcon = computed(() => Boolean(props.icon) || Boolean(useSlots().icon));
  const hasTrailingIcon = computed(
    () => Boolean(props.trailingIcon) || Boolean(useSlots().trailingIcon)
  );

  const { errorMessage, value, handleBlur } = useField(() => props.name || inputId, props.rules, {
    initialValue: props.modelValue,
    label: props.label,
    validateOnMount: props.validateOnMount,
    syncVModel: true,
  });
</script>
