<script setup lang="ts">
  import { manageNavigation, navigation } from "~/utils/navigation";
  const { state, site } = useDemo();
  const route = useRoute();
  const { setOpenMobile } = useSidebar();
  watch(
    () => route.path,
    () => setOpenMobile(false)
  );
  const active = (to: string) => (to === "/" ? route.path === "/" : route.path.startsWith(to));
  const unread = computed(
    () => state.value?.notifications.filter((item) => !item.read).length ?? 0
  );
  function chooseSite(id: string) {
    if (state.value) state.value.preferences.siteId = id;
  }
</script>
<template>
  <UiSidebarHeader>
    <NuxtLink to="/" aria-label="Beacon home" class="px-2 pt-1" @click="setOpenMobile(false)">
      <BeaconLogo />
    </NuxtLink>
    <UiDropdownMenu>
      <UiDropdownMenuTrigger as-child>
        <UiButton
          variant="outline"
          class="mt-2 h-auto w-full justify-between gap-2 py-2 text-left font-normal"
          aria-label="Switch site"
        >
          <span class="grid min-w-0 leading-tight">
            <span class="truncate text-sm font-medium">{{ site?.name ?? "Loading…" }}</span>
            <span class="truncate text-xs text-muted-foreground">{{ site?.domain }}</span>
          </span>
          <Icon name="lucide:chevrons-up-down" class="size-4 shrink-0 text-muted-foreground" />
        </UiButton>
      </UiDropdownMenuTrigger>
      <UiDropdownMenuContent align="start" class="w-64">
        <UiDropdownMenuLabel>Your sites</UiDropdownMenuLabel>
        <UiDropdownMenuItem
          v-for="item in state?.sites ?? []"
          :key="item.id"
          @select="chooseSite(item.id)"
        >
          <span class="grid leading-tight">
            <span class="text-sm font-medium">{{ item.name }}</span>
            <span class="text-xs text-muted-foreground">{{ item.domain }}</span>
          </span>
          <Icon v-if="item.id === site?.id" name="lucide:check" class="ml-auto" />
        </UiDropdownMenuItem>
        <UiDropdownMenuSeparator />
        <UiDropdownMenuItem as-child>
          <NuxtLink to="/settings?tab=sites"><Icon name="lucide:plus" />Add a site</NuxtLink>
        </UiDropdownMenuItem>
      </UiDropdownMenuContent>
    </UiDropdownMenu>
  </UiSidebarHeader>
  <UiSidebarContent>
    <UiSidebarGroup>
      <UiSidebarGroupLabel>Analytics</UiSidebarGroupLabel>
      <UiSidebarMenu>
        <UiSidebarMenuItem v-for="item in navigation" :key="item.to">
          <UiSidebarMenuButton :is-active="active(item.to)" as-child>
            <NuxtLink :to="item.to" @click="setOpenMobile(false)">
              <Icon :name="item.icon" /><span>{{ item.title }}</span>
            </NuxtLink>
          </UiSidebarMenuButton>
        </UiSidebarMenuItem>
      </UiSidebarMenu>
    </UiSidebarGroup>
    <UiSidebarGroup class="mt-auto">
      <UiSidebarGroupLabel>Workspace</UiSidebarGroupLabel>
      <UiSidebarMenu>
        <UiSidebarMenuItem v-for="item in manageNavigation" :key="item.to">
          <UiSidebarMenuButton :is-active="active(item.to)" as-child>
            <NuxtLink :to="item.to" @click="setOpenMobile(false)">
              <Icon :name="item.icon" /><span>{{ item.title }}</span>
              <span
                v-if="item.to === '/notifications' && unread"
                class="ml-auto rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground tabular-nums"
              >
                {{ unread }}<span class="sr-only"> unread</span>
              </span>
            </NuxtLink>
          </UiSidebarMenuButton>
        </UiSidebarMenuItem>
      </UiSidebarMenu>
    </UiSidebarGroup>
  </UiSidebarContent>
  <UiSidebarFooter>
    <UiSidebarMenu>
      <UiSidebarMenuItem>
        <UiSidebarMenuButton size="lg" as-child>
          <NuxtLink to="/settings" @click="setOpenMobile(false)">
            <BeaconAvatar :name="state?.profile.name ?? 'Beacon'" size="sm" />
            <span class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">{{ state?.profile.name }}</span>
              <span class="truncate text-xs text-muted-foreground">{{ state?.profile.role }}</span>
            </span>
          </NuxtLink>
        </UiSidebarMenuButton>
      </UiSidebarMenuItem>
    </UiSidebarMenu>
  </UiSidebarFooter>
</template>
