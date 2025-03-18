<template>
  <article
    class="flex items-start gap-4 text-[15px] leading-relaxed"
    :class="[isUser && 'justify-end']"
  >
    <UiAvatar :class="[isUser ? 'order-1' : 'border shadow-sm']">
      <UiAvatarImage
        :src="
          isUser
            ? user.image
            : 'https://res.cloudinary.com/dlzlfasou/image/upload/v1741345634/user-01_i5l7tp.png'
        "
        :alt="isUser ? user.name : 'Bart logo'"
      />
      <UiAvatarFallback>
        {{ isUser ? initials : "Bart" }}
      </UiAvatarFallback>
    </UiAvatar>
    <div :class="[isUser ? 'rounded-xl bg-muted px-4 py-3' : 'space-y-4']">
      <div class="flex flex-col gap-3">
        <p class="sr-only">{{ isUser ? "You" : "Bart" }} said:</p>
        <slot />
      </div>
      <template v-if="!isUser">
        <div class="relative inline-flex -space-x-px rounded-md border shadow-sm">
          <template v-for="a in actions" :key="a.label">
            <AppChatActionButton v-bind="a" />
          </template>
        </div>
      </template>
    </div>
  </article>
</template>

<script lang="ts" setup>
  defineProps<{ isUser?: boolean }>();

  const { user, initials } = useUser();

  const actions = [
    { label: "Show Code", icon: "ri:code-s-slash-line" },
    { label: "Bookmark", icon: "ri:bookmark-line" },
    { label: "Refresh", icon: "ri:loop-right-fill" },
    { label: "Approve", icon: "ri:check-line" },
  ];
</script>
