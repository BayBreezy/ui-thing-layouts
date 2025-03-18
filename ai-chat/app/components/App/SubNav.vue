<template>
  <header class="sticky top-0 flex h-14 items-center justify-between border-b bg-background py-3">
    <UiBreadcrumbs class="gap-3" :items="chatBreadcrumbs" />
    <div class="flex items-center gap-1">
      <UiButton
        v-for="b in chatButtons"
        :key="b.text"
        :title="b.text"
        :to="b.link"
        size="sm"
        variant="ghost"
      >
        <Icon :name="b.icon" class="size-5 text-muted-foreground sm:text-muted-foreground/70" />
        <span class="max-lg:sr-only">{{ b.text }}</span>
      </UiButton>
      <UiSheet>
        <UiSheetTrigger as-child>
          <UiButton title="Settings" class="lg:hidden" size="sm" variant="ghost">
            <Icon
              name="ri:settings-line"
              class="size-5 text-muted-foreground sm:text-muted-foreground/70"
            />
            <span class="max-lg:sr-only">Settings</span>
          </UiButton>
        </UiSheetTrigger>
        <UiSheetContent side="right" trap-focus class="bg-muted dark:bg-sidebar">
          <UiSheetTitle class="sr-only">My Preference</UiSheetTitle>
          <UiSheetDescription class="sr-only">Mobile preference sheets</UiSheetDescription>
          <AppChatPreferences />
          <UiSheetX />
        </UiSheetContent>
      </UiSheet>
    </div>
  </header>
</template>

<script lang="ts" setup>
  import type { Crumbs } from "@/components/Ui/Breadcrumbs.vue";

  const chatBreadcrumbs: Crumbs[] = [{ label: "Playground" }, { label: "Chat", link: "#" }];
  const chatButtons = [
    { text: "Code", icon: "ri:code-s-slash-line", link: "#" },
    { text: "Share", icon: "ri:share-line", link: "#" },
    { text: "Export", icon: "ri:share-circle-line", link: "#" },
  ];
</script>
