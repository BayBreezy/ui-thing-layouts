<template>
  <UiButton
    :title="label"
    data-sidebar="trigger"
    variant="ghost"
    size="icon"
    :class="sideBarTriggerStyles({ class: props.class })"
    @click="toggleSidebar"
  >
    <slot v-bind="{ state }">
      <Icon v-if="icon" :name="icon" class="size-5" />
      <span class="sr-only">{{ label }}</span>
    </slot>
  </UiButton>
</template>

<script lang="ts">
  import type { HTMLAttributes } from "vue";

  export const sideBarTriggerStyles = tv({
    base: "size-8 shrink-0 text-muted-foreground/60 hover:text-foreground",
  });
</script>

<script setup lang="ts">
  const props = withDefaults(
    defineProps<{
      /**
       * The icon to display in the trigger.
       * @default "ri:layout-left-line"
       */
      icon?: string;
      /**
       * Additional classes to apply to the parent element.
       */
      class?: HTMLAttributes["class"];
      /**
       * The label for the trigger.
       * @default "Toggle Sidebar"
       */
      label?: string;
    }>(),
    {
      icon: "ri:layout-left-line",
      label: "Toggle Sidebar",
    }
  );

  const { toggleSidebar, state } = useSidebar();
</script>
