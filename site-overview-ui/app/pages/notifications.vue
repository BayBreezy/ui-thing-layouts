<script setup lang="ts">
  import { toneClasses } from "~/utils/demo";
  usePageSeo({ title: "Notifications" });
  const { state, markAllRead } = useDemo();
  const route = useRoute();
  const unreadOnly = computed(() => route.query.show === "unread");
  const items = computed(() =>
    (state.value?.notifications ?? []).filter((item) => !unreadOnly.value || !item.read)
  );
  const siteName = (id: string) => state.value?.sites.find((item) => item.id === id)?.name ?? "";
  const icons = { up: "lucide:trending-up", down: "lucide:trending-down", info: "lucide:info" };
  async function open(id: string, href: string) {
    const item = state.value?.notifications.find((entry) => entry.id === id);
    if (item) item.read = true;
    await navigateTo(href);
  }
  function setShow(value: string) {
    void navigateTo(
      {
        path: route.path,
        query: { ...route.query, show: value === "unread" ? "unread" : undefined },
      },
      { replace: true }
    );
  }
</script>
<template>
  <div class="page-shell">
    <BeaconPageHeader
      title="Notifications"
      description="Notable changes in your traffic, found by comparing the last 7 days with the 7 before."
    >
      <UiButton variant="outline" @click="markAllRead">
        <Icon name="lucide:check-check" />Mark all as read
      </UiButton>
    </BeaconPageHeader>
    <UiTabs
      :model-value="unreadOnly ? 'unread' : 'all'"
      class="mb-4"
      @update:model-value="setShow(String($event))"
    >
      <UiTabsList aria-label="Filter notifications">
        <UiTabsTrigger value="all">All</UiTabsTrigger>
        <UiTabsTrigger value="unread">Unread</UiTabsTrigger>
      </UiTabsList>
    </UiTabs>
    <ul v-if="items.length" class="space-y-3" aria-label="Notifications">
      <li v-for="item in items" :key="item.id">
        <button
          type="button"
          class="flex w-full items-start gap-4 rounded-xl border bg-card p-4 text-left shadow-xs outline-none hover:border-foreground/30 focus-visible:ring-[3px] focus-visible:ring-ring/50"
          @click="open(item.id, item.href)"
        >
          <span :class="['mt-0.5', toneClasses[item.tone]]">
            <Icon :name="icons[item.tone]" class="size-5" aria-hidden="true" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="flex items-center gap-2 font-medium">
              {{ item.title }}
              <span v-if="!item.read" class="size-2 rounded-full bg-primary" aria-hidden="true" />
              <span class="sr-only">{{ item.read ? "Read" : "Unread" }}</span>
            </span>
            <span v-if="item.detail" class="mt-1 block text-sm text-muted-foreground">
              {{ item.detail }}
            </span>
            <span class="mt-1 block text-xs text-muted-foreground">{{
              siteName(item.siteId)
            }}</span>
          </span>
        </button>
      </li>
    </ul>
    <BeaconEmpty
      v-else
      :title="unreadOnly ? 'You\'re all caught up' : 'No notifications yet'"
      description="Traffic changes and workspace activity will appear here."
      icon="lucide:bell"
    />
  </div>
</template>
