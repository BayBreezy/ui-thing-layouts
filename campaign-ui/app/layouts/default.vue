<script setup lang="ts">
  import { navigation, moreNavigation } from "~/utils/navigation";
  const route = useRoute();
  const { state, storageWarning } = useDemo();
  const colorMode = useColorMode();
  const commandOpen = ref(false);
  const notificationsOpen = ref(false);
  const title = computed(
    () =>
      [...navigation, ...moreNavigation, { title: "Changelog", to: "/changelog" }].find((item) =>
        item.to === "/" ? route.path === "/" : route.path.startsWith(item.to)
      )?.title || "Workspace"
  );
  const initials = computed(() => state.value?.profile.name.slice(0, 1) ?? "");
  const crumbs = computed(() => [
    { label: "Studio", link: "/" },
    { label: title.value },
    ...(route.params.id ? [{ label: route.params.id === "new" ? "New" : "Details" }] : []),
  ]);
  const results = computed(() => [
    ...[
      ...navigation,
      ...moreNavigation,
      { title: "Changelog", to: "/changelog", icon: "lucide:git-pull-request" },
    ].map((item) => ({ ...item, group: "Pages" })),
    ...(state.value?.campaigns ?? []).map((item) => ({
      title: item.name,
      to: "/campaigns/" + item.id,
      icon: "lucide:megaphone",
      group: "Campaigns",
    })),
    ...(state.value?.leads ?? []).map((item) => ({
      title: item.name + " · " + item.company,
      to: "/leads/" + item.id,
      icon: "lucide:contact-round",
      group: "Leads",
    })),
    ...(state.value?.documents ?? []).map((item) => ({
      title: item.title,
      to: "/documents/" + item.id,
      icon: "lucide:file-text",
      group: "Documents",
    })),
  ]);
  async function go(to: string) {
    commandOpen.value = false;
    notificationsOpen.value = false;
    await navigateTo(to);
  }
  function markAllRead() {
    state.value?.notifications.forEach((item) => {
      item.read = true;
    });
  }
  function toggleTheme() {
    if (state.value)
      state.value.preferences.appearance = colorMode.value === "dark" ? "light" : "dark";
  }
  function signOut() {
    if (state.value) state.value.signedIn = false;
    void go("/login");
  }
  useEventListener("keydown", (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      commandOpen.value = !commandOpen.value;
    }
  });
</script>
<template>
  <a
    href="#main-content"
    class="sr-only z-50 rounded-md bg-primary p-3 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
    >Skip to content</a
  >
  <UiSidebarProvider class="h-dvh min-h-0 overflow-hidden">
    <UiSidebar role="navigation" aria-label="Workspace navigation">
      <LaunchpadSidebarContent />
      <UiSidebarRail />
    </UiSidebar>
    <UiSidebarInset class="h-dvh min-w-0 overflow-hidden">
      <header class="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <UiSidebarTrigger class="-ml-1" aria-label="Toggle navigation" />
        <UiSeparator orientation="vertical" class="mr-2 hidden h-4 sm:block" />
        <UiBreadcrumbs :items="crumbs" class="hidden w-auto sm:flex" />
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
          <UiButton
            variant="ghost"
            size="icon-sm"
            aria-label="Open notifications"
            class="relative"
            @click="notificationsOpen = true"
          >
            <Icon name="lucide:bell" />
            <span
              v-if="state?.notifications.some((n) => !n.read)"
              class="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary ring-2 ring-background"
            />
          </UiButton>
          <ClientOnly>
            <UiButton
              variant="ghost"
              size="icon-sm"
              :aria-label="
                colorMode.value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
              "
              @click="toggleTheme"
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
                  <UiAvatarFallback>{{ initials }}</UiAvatarFallback>
                </UiAvatar>
              </UiButton>
            </UiDropdownMenuTrigger>
            <UiDropdownMenuContent align="end" class="w-56">
              <UiDropdownMenuLabel>{{ state?.profile.name }}</UiDropdownMenuLabel>
              <UiDropdownMenuSeparator />
              <UiDropdownMenuItem @select="go('/settings')">
                <Icon name="lucide:user" />Profile & settings
              </UiDropdownMenuItem>
              <UiDropdownMenuItem @select="go('/activity')">
                <Icon name="lucide:history" />History
              </UiDropdownMenuItem>
              <UiDropdownMenuItem @select="go('/changelog')">
                <Icon name="lucide:git-pull-request" />Changelog
              </UiDropdownMenuItem>
              <UiDropdownMenuItem @select="go('/support')">
                <Icon name="lucide:circle-help" />Help
              </UiDropdownMenuItem>
              <UiDropdownMenuSeparator />
              <UiDropdownMenuItem v-if="state?.signedIn" @select="signOut">
                <Icon name="lucide:log-out" />Sign out
              </UiDropdownMenuItem>
              <UiDropdownMenuItem v-else @select="go('/login')">
                <Icon name="lucide:log-in" />Try demo sign in
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
      <div
        id="main-content"
        class="@container min-h-0 flex-1 overflow-y-auto outline-none"
        tabindex="-1"
      >
        <slot />
      </div>
    </UiSidebarInset>
    <!-- Pinned to the viewport: the page scrolls inside the inset, the rail scrolls on its own. -->
    <aside
      aria-label="Workspace context"
      class="hidden h-dvh w-64 shrink-0 overflow-y-auto overscroll-contain border-l bg-muted/30 p-6 xl:block"
    >
      <LaunchpadContextRail />
    </aside>
  </UiSidebarProvider>
  <UiCommandDialog
    v-model:open="commandOpen"
    title="Search Launchpad"
    description="Find a page, campaign, lead, or document."
  >
    <UiCommandInput
      placeholder="Search your workspace…"
      aria-label="Search pages and records"
    /><UiCommandList
      ><UiCommandEmpty>No matches. Try another name.</UiCommandEmpty
      ><UiCommandGroup
        v-for="group in ['Pages', 'Campaigns', 'Leads', 'Documents']"
        :key="group"
        :heading="group"
        ><UiCommandItem
          v-for="item in results.filter((r) => r.group === group)"
          :key="item.to"
          :value="item.title + ' ' + item.to"
          @select="go(item.to)"
          ><Icon :name="item.icon" />{{ item.title }}</UiCommandItem
        ></UiCommandGroup
      ></UiCommandList
    >
  </UiCommandDialog>
  <UiDialog v-model:open="notificationsOpen">
    <UiDialogContent class="sm:max-w-lg">
      <UiDialogHeader>
        <UiDialogTitle>Notifications</UiDialogTitle>
        <UiDialogDescription>Updates from your demo workspace.</UiDialogDescription>
      </UiDialogHeader>
      <div>
        <UiButton variant="outline" size="sm" @click="markAllRead">
          <Icon name="lucide:check-check" />Mark all as read
        </UiButton>
      </div>
      <ul v-if="state?.notifications.length" class="space-y-2">
        <li v-for="item in state.notifications" :key="item.id">
          <UiButton
            variant="outline"
            class="h-auto w-full justify-start gap-3 p-3 text-left font-normal whitespace-normal"
            @click="
              item.read = true;
              go(item.href);
            "
          >
            <span
              :class="[
                'size-2 shrink-0 rounded-full',
                item.read ? 'bg-muted-foreground/30' : 'bg-primary',
              ]"
            />
            <span>{{ item.title }}</span>
            <span class="sr-only">{{ item.read ? "Read" : "Unread" }}</span>
          </UiButton>
        </li>
      </ul>
      <p v-else class="text-sm text-muted-foreground">You're all caught up.</p>
    </UiDialogContent>
  </UiDialog>
</template>
