<script setup lang="ts">
  import { fullName } from "#shared/patients";
  import { moreNavigation, navigation } from "~/utils/navigation";
  const route = useRoute();
  const { state, storageWarning } = useDemo();
  const colorMode = useColorMode();
  const commandOpen = ref(false);
  const notificationsOpen = ref(false);
  const sections = [...navigation, ...moreNavigation];
  const section = computed(() =>
    sections.find((item) => (item.to === "/" ? route.path === "/" : route.path.startsWith(item.to)))
  );
  const detail = computed(() => {
    const id = String(route.params.id || "");
    if (!id && route.path !== "/appointments/new" && route.path !== "/patients/new") return "";
    if (route.path.endsWith("/new")) return "New";
    if (route.path.startsWith("/patients/")) {
      const patient = state.value?.patients.find((item) => item.id === id);
      return patient ? fullName(patient) : "Patient";
    }
    if (route.path.startsWith("/providers/"))
      return state.value?.providers.find((item) => item.id === id)?.name ?? "Provider";
    if (route.path.startsWith("/appointments/")) {
      const visit = state.value?.appointments.find((item) => item.id === id);
      return visit ? visit.reference : "Visit";
    }
    return "Details";
  });
  const crumbs = computed(() => [
    { label: "Mendly", link: "/" },
    ...(section.value && section.value.to !== "/"
      ? [{ label: section.value.title, link: detail.value ? section.value.to : undefined }]
      : []),
    ...(detail.value ? [{ label: detail.value }] : []),
  ]);
  const unread = computed(() => state.value?.notifications.some((item) => !item.read));
  const results = computed(() => [
    ...[...sections, { title: "Patient booking page", to: "/book", icon: "lucide:globe" }].map(
      (item) => ({ title: item.title, to: item.to, icon: item.icon, group: "Pages" })
    ),
    {
      title: "Book appointment",
      to: "/appointments/new",
      icon: "lucide:calendar-plus",
      group: "Actions",
    },
    { title: "Add patient", to: "/patients/new", icon: "lucide:user-plus", group: "Actions" },
    ...(state.value?.providers ?? []).map((item) => ({
      title: `${item.name} · ${item.specialty}`,
      to: "/providers/" + item.id,
      icon: "lucide:stethoscope",
      group: "Providers",
    })),
    ...(state.value?.patients ?? []).map((item) => ({
      title: fullName(item),
      to: "/patients/" + item.id,
      icon: "lucide:user-round",
      group: "Patients",
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
      <MendlySidebarContent />
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
            <Icon name="lucide:search" />Search patients<UiKbd>⌘ K</UiKbd>
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
                <MendlyAvatar :name="state?.profile.name ?? 'Front Desk'" size="sm" />
              </UiButton>
            </UiDropdownMenuTrigger>
            <UiDropdownMenuContent align="end" class="w-56">
              <UiDropdownMenuLabel>{{ state?.profile.name }}</UiDropdownMenuLabel>
              <UiDropdownMenuSeparator />
              <UiDropdownMenuItem @select="go('/settings')">
                <Icon name="lucide:settings-2" />Clinic settings
              </UiDropdownMenuItem>
              <UiDropdownMenuItem @select="go('/book')">
                <Icon name="lucide:globe" />Patient booking page
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
    title="Search Mendly"
    description="Find a patient, provider or page, or start something new."
  >
    <UiCommandInput
      placeholder="Search patients, providers and pages…"
      aria-label="Search patients and pages"
    />
    <UiCommandList>
      <UiCommandEmpty>No matches. Try another name.</UiCommandEmpty>
      <UiCommandGroup
        v-for="group in ['Actions', 'Patients', 'Providers', 'Pages']"
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
        <UiDialogDescription>Bookings, cancellations and waitlist changes.</UiDialogDescription>
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
