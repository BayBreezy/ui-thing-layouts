<template>
  <Icon
    :icon="name"
    v-bind="reactiveOmit(props, 'class')"
    :class="styles({ class: props.class })"
  />
</template>

<script lang="ts" setup>
  import { Icon } from "@iconify/vue";
  import { reactiveOmit } from "@vueuse/core";
  import type { IconProps } from "@iconify/vue";

  const props = defineProps<
    Omit<IconProps, "icon"> & {
      name: string;
      class?: any;
    }
  >();

  const styles = tv({ base: "size-4" });
</script>
