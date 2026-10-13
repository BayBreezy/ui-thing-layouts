<script setup lang="ts">
  import { initials } from "#shared/contacts";
  import type { Contact } from "#shared/types";
  defineProps<{
    contact: Pick<Contact, "firstName" | "lastName" | "nickname" | "company" | "avatarHue">;
    size?: "xs" | "sm" | "default" | "lg" | "xl";
  }>();
</script>
<template>
  <UiAvatar
    :size="size === 'xl' ? 'lg' : size"
    :class="size === 'xl' ? 'size-16' : undefined"
    aria-hidden="true"
  >
    <UiAvatarFallback
      class="contact-avatar font-semibold"
      :class="
        size === 'xs' || size === 'sm' ? 'text-[10px]' : size === 'xl' ? 'text-xl' : 'text-xs'
      "
      :style="{ '--hue': contact.avatarHue }"
      >{{ initials(contact) }}</UiAvatarFallback
    >
  </UiAvatar>
</template>
