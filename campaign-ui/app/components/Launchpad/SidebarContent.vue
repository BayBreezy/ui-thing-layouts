<script setup lang="ts">
  import { navigation, moreNavigation } from "~/utils/navigation";
  const { state } = useDemo();
  const route = useRoute();
  const { setOpenMobile } = useSidebar();
  watch(
    () => route.fullPath,
    () => setOpenMobile(false)
  );
  const active = (to: string) => (to === "/" ? route.path === "/" : route.path.startsWith(to));
  const profileMember = computed(() =>
    state.value?.members.find((m) => m.id === state.value?.profile.id)
  );
  const favorites = computed(() =>
    (state.value?.documents ?? []).filter((d) => d.favorite).slice(0, 3)
  );
</script>
<template>
  <UiSidebarHeader>
    <NuxtLink to="/" aria-label="Launchpad home" class="px-2 pt-1" @click="setOpenMobile(false)">
      <LaunchpadLogo />
    </NuxtLink>
  </UiSidebarHeader>
  <UiSidebarContent>
    <UiSidebarGroup>
      <UiButton to="/campaigns/new" class="w-full justify-start" @click="setOpenMobile(false)">
        <Icon name="lucide:plus" />New campaign
      </UiButton>
    </UiSidebarGroup>
    <UiSidebarGroup>
      <UiSidebarGroupLabel>Workspace</UiSidebarGroupLabel>
      <UiSidebarMenu>
        <UiSidebarMenuItem v-for="item in navigation" :key="item.to">
          <UiSidebarMenuButton :is-active="active(item.to)" as-child>
            <NuxtLink :to="item.to" @click="setOpenMobile(false)">
              <Icon :name="item.icon" /><span>{{ item.title }}</span>
              <span
                v-if="item.to === '/chat' && state?.threads.some((t) => t.unread)"
                class="ml-auto size-2 rounded-full bg-primary"
              />
            </NuxtLink>
          </UiSidebarMenuButton>
        </UiSidebarMenuItem>
      </UiSidebarMenu>
    </UiSidebarGroup>
    <UiSidebarGroup v-if="favorites.length">
      <UiSidebarGroupLabel>Favorites</UiSidebarGroupLabel>
      <UiSidebarGroupAction as-child title="View all documents">
        <NuxtLink to="/documents" aria-label="View all documents">
          <Icon name="lucide:arrow-up-right" />
        </NuxtLink>
      </UiSidebarGroupAction>
      <UiSidebarMenu>
        <UiSidebarMenuItem v-for="brief in favorites" :key="brief.id">
          <UiSidebarMenuButton as-child :is-active="route.params.id === brief.id">
            <NuxtLink :to="'/documents/' + brief.id" @click="setOpenMobile(false)">
              <Icon name="lucide:file-text" /><span class="truncate">{{ brief.title }}</span>
            </NuxtLink>
          </UiSidebarMenuButton>
        </UiSidebarMenuItem>
      </UiSidebarMenu>
    </UiSidebarGroup>
    <UiSidebarGroup class="mt-auto">
      <UiSidebarMenu>
        <UiSidebarMenuItem v-for="item in moreNavigation" :key="item.to">
          <UiSidebarMenuButton :is-active="active(item.to)" as-child>
            <NuxtLink :to="item.to" @click="setOpenMobile(false)">
              <Icon :name="item.icon" /><span>{{ item.title }}</span>
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
            <LaunchpadAvatar :member="profileMember" />
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
