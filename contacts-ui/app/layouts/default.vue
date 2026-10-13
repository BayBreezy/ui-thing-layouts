<script setup lang="ts">
  import { navigation, moreNavigation } from "~/utils/navigation";
  const route = useRoute();
  const { state, storageWarning, nameOf } = useDemo();
  const colorMode = useColorMode();
  const commandOpen = ref(false);
  const notificationsOpen = ref(false);
  const sections = [...navigation, ...moreNavigation];
  const section = computed(() =>
    sections.find((item) => (item.to === "/" ? route.path === "/" : route.path.startsWith(item.to)))
  );
  const detail = computed(() => {
    const id = String(route.params.id || "");
    if (!id) return "";
    if (id === "new") return "New";
    if (route.path.startsWith("/contacts/"))
      return nameOf(state.value?.contacts.find((item) => item.id === id) ?? ({} as never));
    if (route.path.startsWith("/groups/"))
      return state.value?.groups.find((item) => item.id === id)?.name ?? "Group";
    return "Details";
  });
  const crumbs = computed(() => [
    { label: "Verdant", link: "/" },
    ...(section.value && section.value.to !== "/"
      ? [{ label: section.value.title, link: detail.value ? section.value.to : undefined }]
      : []),
    ...(detail.value ? [{ label: detail.value }] : []),
  ]);
  const unread = computed(() => state.value?.notifications.some((item) => !item.read));
  const results = computed(() => [
    ...[...sections, { title: "Sign in", to: "/login", icon: "lucide:log-in" }].map((item) => ({
      title: item.title,
      to: item.to,
      icon: item.icon,
      group: "Pages",
    })),
    { title: "New contact", to: "/contacts/new", icon: "lucide:user-plus", group: "Actions" },
    { title: "Import contacts", to: "/contacts?import=1", icon: "lucide:upload", group: "Actions" },
    ...(state.value?.groups ?? []).map((item) => ({
      title: item.name,
      to: "/groups/" + item.id,
      icon: "lucide:users-round",
      group: "Groups",
    })),
    ...(state.value?.contacts ?? []).map((item) => ({
      title: nameOf(item) + (item.company ? " · " + item.company : ""),
      to: "/contacts/" + item.id,
      icon: "lucide:contact-round",
      group: "Contacts",
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
    <UiSidebar role="navigation" aria-label="Main navigation">
      <VerdantSidebarContent />
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
            <Icon name="lucide:search" />Search people<UiKbd>⌘ K</UiKbd>
          </UiButton>
          <UiButton
            variant="ghost"
            size="icon-sm"
            class="md:hidden"
            aria-label="Open search"
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
              v-if="unread"
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
                <UiAvatar class="size-8" aria-hidden="true">
                  <UiAvatarFallback
                    class="contact-avatar text-xs font-semibold"
                    style="--hue: 160"
                    >{{ state?.profile.name.slice(0, 1) }}</UiAvatarFallback
                  >
                </UiAvatar>
              </UiButton>
            </UiDropdownMenuTrigger>
            <UiDropdownMenuContent align="end" class="w-56">
              <UiDropdownMenuLabel>{{ state?.profile.name }}</UiDropdownMenuLabel>
              <UiDropdownMenuSeparator />
              <UiDropdownMenuItem @select="go('/settings')">
                <Icon name="lucide:user" />Profile & settings
              </UiDropdownMenuItem>
              <UiDropdownMenuItem @select="go('/follow-ups')">
                <Icon name="lucide:calendar-check" />Follow-ups
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
  </UiSidebarProvider>
  <UiCommandDialog
    v-model:open="commandOpen"
    title="Search Verdant"
    description="Find a person, group or page, or start something new."
  >
    <UiCommandInput
      placeholder="Search people, groups and pages…"
      aria-label="Search contacts and pages"
    />
    <UiCommandList>
      <UiCommandEmpty>No matches. Try another name.</UiCommandEmpty>
      <UiCommandGroup
        v-for="group in ['Actions', 'Contacts', 'Groups', 'Pages']"
        :key="group"
        :heading="group"
      >
        <UiCommandItem
          v-for="item in results.filter((r) => r.group === group)"
          :key="item.to"
          :value="item.title + ' ' + item.to"
          @select="go(item.to)"
        >
          <Icon :name="item.icon" />{{ item.title }}
        </UiCommandItem>
      </UiCommandGroup>
    </UiCommandList>
  </UiCommandDialog>
  <UiDialog v-model:open="notificationsOpen">
    <UiDialogContent class="sm:max-w-lg">
      <UiDialogHeader>
        <UiDialogTitle>Notifications</UiDialogTitle>
        <UiDialogDescription>Reminders and updates from your contacts.</UiDialogDescription>
      </UiDialogHeader>
      <div>
        <UiButton variant="outline" size="sm" @click="markAllRead">
          <Icon name="lucide:check-check" />Mark all as read
        </UiButton>
      </div>
      <ul v-if="state?.notifications.length" class="max-h-96 space-y-2 overflow-y-auto">
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
