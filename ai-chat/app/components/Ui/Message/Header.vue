<template>
  <Primitive
    data-slot="message-header"
    v-bind="forwarded"
    :class="messageHeaderStyles({ class: normalizeClass(props.class) || undefined })"
  >
    <slot />
  </Primitive>
</template>

<script lang="ts">
  import { Primitive } from "reka-ui";
  import type { PrimitiveProps } from "reka-ui";
  import { normalizeClass } from "vue";
  import type { HTMLAttributes } from "vue";

  export const messageHeaderStyles = tv({
    base: "flex max-w-full min-w-0 items-center px-3 text-xs font-medium text-muted-foreground group-has-data-[variant=ghost]/message:px-0",
  });

  export type MessageHeaderProps = PrimitiveProps & {
    /** Additional classes to apply to the header. */
    class?: HTMLAttributes["class"];
  };
</script>

<script lang="ts" setup>
  const props = withDefaults(defineProps<MessageHeaderProps>(), {});

  const forwarded = reactiveOmit(props, ["class"]);
</script>
