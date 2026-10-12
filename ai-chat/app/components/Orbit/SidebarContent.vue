<script setup lang="ts">
  import { navigation, moreNavigation } from "~/utils/navigation";
  const { state, conversations, workspace, switchWorkspace, openNewChat } = useDemo();
  const route = useRoute();
  const { setOpenMobile } = useSidebar();
  watch(
    () => route.fullPath,
    () => setOpenMobile(false)
  );
  const active = (to: string) =>
    to === "/" ? route.path === "/" || route.path.startsWith("/chat") : route.path.startsWith(to);
  const profileInitials = computed(() =>
    state.value?.profile.name
      .split(" ")
      .map((word) => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
  );
</script>
<template>
  <UiSidebarHeader>
    <NuxtLink to="/" aria-label="Orbit home" class="px-2 pt-1" @click="setOpenMobile(false)">
      <OrbitLogo />
    </NuxtLink>
    <UiSidebarMenu>
      <UiSidebarMenuItem>
        <UiDropdownMenu>
          <UiDropdownMenuTrigger as-child>
            <UiSidebarMenuButton
              size="lg"
              class="border bg-transparent data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <span
                class="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"
              >
                <Icon name="lucide:orbit" class="size-4" />
              </span>
              <span class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-medium">{{ workspace?.name }}</span>
                <span class="truncate text-xs text-muted-foreground">
                  {{ workspace?.id === "studio" ? "Demo workspace" : "Personal workspace" }}
                </span>
              </span>
              <Icon name="lucide:chevrons-up-down" class="ml-auto size-4" />
            </UiSidebarMenuButton>
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent align="start" class="w-(--reka-dropdown-menu-trigger-width)">
            <UiDropdownMenuLabel>Switch workspace</UiDropdownMenuLabel>
            <UiDropdownMenuItem
              v-for="item in state?.workspaces"
              :key="item.id"
              @select="switchWorkspace(item.id)"
            >
              <Icon name="lucide:orbit" />{{ item.name }}
              <Icon
                v-if="item.id === state?.activeWorkspaceId"
                name="lucide:check"
                class="ml-auto"
              />
            </UiDropdownMenuItem>
          </UiDropdownMenuContent>
        </UiDropdownMenu>
      </UiSidebarMenuItem>
    </UiSidebarMenu>
  </UiSidebarHeader>
  <UiSidebarContent>
    <UiSidebarGroup>
      <UiButton
        to="/"
        class="w-full justify-start"
        @click="
          setOpenMobile(false);
          openNewChat();
        "
      >
        <Icon name="lucide:plus" />New conversation
        <UiKbd class="ml-auto bg-primary-foreground/20 text-primary-foreground">N</UiKbd>
      </UiButton>
    </UiSidebarGroup>
    <UiSidebarGroup>
      <UiSidebarGroupLabel>Workspace</UiSidebarGroupLabel>
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
    <UiSidebarGroup v-if="conversations.length">
      <UiSidebarGroupLabel>Recent conversations</UiSidebarGroupLabel>
      <UiSidebarGroupAction as-child title="View all conversations">
        <NuxtLink to="/history" aria-label="View all conversations">
          <Icon name="lucide:arrow-up-right" />
        </NuxtLink>
      </UiSidebarGroupAction>
      <UiSidebarMenu>
        <UiSidebarMenuItem v-for="conversation in conversations.slice(0, 5)" :key="conversation.id">
          <UiSidebarMenuButton as-child :is-active="route.params.id === conversation.id">
            <NuxtLink :to="`/chat/${conversation.id}`" @click="setOpenMobile(false)">
              <span class="truncate">{{ conversation.title }}</span>
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
            <UiAvatar class="size-8 rounded-lg">
              <UiAvatarFallback class="rounded-lg">{{ profileInitials }}</UiAvatarFallback>
            </UiAvatar>
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
