<script setup lang="ts">
  import { navigation, moreNavigation } from "~/utils/navigation";
  const route = useRoute();
  const { state, conversations, storageWarning, openNewChat } = useDemo();
  const commandOpen = ref(false);
  const colorMode = useColorMode();
  const title = computed(
    () =>
      [...navigation, ...moreNavigation, { title: "History", to: "/history" }].find(
        (item) => item.to !== "/" && route.path.startsWith(item.to)
      )?.title ?? "Chat"
  );
  const crumbs = computed(() => [{ label: "Workspace", link: "/" }, { label: title.value }]);
  async function go(to: string) {
    commandOpen.value = false;
    await navigateTo(to);
  }
  async function logout() {
    try {
      await $fetch("/api/demo/auth/logout", { method: "POST" });
      await navigateTo("/login");
    } catch (error) {
      useSonner.error(apiError(error));
    }
  }
  useEventListener("keydown", (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      commandOpen.value = !commandOpen.value;
    }
    if (
      event.key.toLowerCase() === "n" &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      !(
        event.target instanceof HTMLElement &&
        event.target.closest("input, textarea, [contenteditable]")
      )
    )
      void openNewChat();
  });
</script>
<template>
  <a
    href="#main-content"
    class="sr-only z-50 rounded-md bg-primary p-3 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
    >Skip to content</a
  >
  <UiSidebarProvider class="h-svh min-h-0 overflow-hidden">
    <UiSidebar role="navigation" aria-label="Workspace navigation" variant="sidebar">
      <OrbitSidebarContent />
    </UiSidebar>
    <UiSidebarInset class="h-svh min-w-0 overflow-hidden">
      <header class="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <UiSidebarTrigger class="-ml-1" aria-label="Toggle navigation" />
        <UiSeparator orientation="vertical" class="mr-2 h-4" />
        <UiBreadcrumbs :items="crumbs" class="w-auto" />
        <div class="ml-auto flex items-center gap-2">
          <UiButton
            variant="outline"
            size="sm"
            class="hidden gap-2 text-muted-foreground md:inline-flex"
            @click="commandOpen = true"
          >
            <Icon name="lucide:search" />Search anything<UiKbd>⌘ K</UiKbd>
          </UiButton>
          <UiButton
            variant="ghost"
            size="icon-sm"
            class="md:hidden"
            aria-label="Search workspace"
            @click="commandOpen = true"
          >
            <Icon name="lucide:search" />
          </UiButton>
          <UiBadge variant="outline" class="hidden sm:inline-flex">Demo</UiBadge>
          <ClientOnly>
            <UiButton
              variant="ghost"
              size="icon-sm"
              :aria-label="
                colorMode.value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
              "
              @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'"
            >
              <Icon :name="colorMode.value === 'dark' ? 'lucide:moon' : 'lucide:sun'" />
            </UiButton>
            <template #fallback><span class="size-8" /></template>
          </ClientOnly>
          <UiDropdownMenu>
            <UiDropdownMenuTrigger as-child>
              <UiButton
                variant="ghost"
                size="icon-sm"
                class="rounded-full"
                aria-label="Open profile menu"
              >
                <UiAvatar class="size-8">
                  <UiAvatarFallback>{{ state?.profile.name.slice(0, 1) }}</UiAvatarFallback>
                </UiAvatar>
              </UiButton>
            </UiDropdownMenuTrigger>
            <UiDropdownMenuContent align="end" class="w-56">
              <UiDropdownMenuLabel>{{ state?.profile.name }}</UiDropdownMenuLabel>
              <UiDropdownMenuSeparator />
              <UiDropdownMenuItem @select="go('/settings')">
                <Icon name="lucide:user" />Profile & settings
              </UiDropdownMenuItem>
              <UiDropdownMenuItem @select="go('/history')">
                <Icon name="lucide:history" />History
              </UiDropdownMenuItem>
              <UiDropdownMenuItem @select="go('/docs/changelog')">
                <Icon name="lucide:git-pull-request" />Changelog
              </UiDropdownMenuItem>
              <UiDropdownMenuItem @select="go('/help')">
                <Icon name="lucide:circle-help" />Help centre
              </UiDropdownMenuItem>
              <UiDropdownMenuSeparator />
              <UiDropdownMenuItem @select="logout">
                <Icon name="lucide:log-out" />Sign out
              </UiDropdownMenuItem>
            </UiDropdownMenuContent>
          </UiDropdownMenu>
        </div>
      </header>
      <UiAlert
        v-if="storageWarning"
        role="status"
        icon="lucide:triangle-alert"
        icon-class="text-amber-600"
        :description="storageWarning"
        class="rounded-none border-x-0 border-t-0 py-3 shadow-none"
      />
      <div id="main-content" class="min-h-0 flex-1 overflow-y-auto"><slot /></div>
    </UiSidebarInset>
  </UiSidebarProvider>
  <UiCommandDialog
    v-model:open="commandOpen"
    title="Search Orbit"
    description="Find a page or jump to a conversation."
  >
    <UiCommandInput
      placeholder="Where would you like to go?"
      aria-label="Search pages and conversations"
    /><UiCommandList
      ><UiCommandEmpty>No matches. Try a page or conversation name.</UiCommandEmpty
      ><UiCommandGroup heading="Pages"
        ><UiCommandItem
          v-for="item in [
            ...navigation,
            ...moreNavigation,
            { title: 'History', to: '/history', icon: 'lucide:history' },
          ]"
          :key="item.to"
          :value="item.title"
          @select="go(item.to)"
          ><Icon :name="item.icon" />{{ item.title }}</UiCommandItem
        ></UiCommandGroup
      ><UiCommandGroup heading="Conversations"
        ><UiCommandItem
          v-for="conversation in conversations"
          :key="conversation.id"
          :value="conversation.title"
          @select="go(`/chat/${conversation.id}`)"
          ><Icon name="lucide:message-circle" />{{ conversation.title }}</UiCommandItem
        ></UiCommandGroup
      ></UiCommandList
    >
  </UiCommandDialog>
</template>
