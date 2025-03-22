<template>
  <UiSidebarProvider>
    <UiSidebar variant="floating" collapsible="icon">
      <UiSidebarHeader>
        <UiSidebarMenu>
          <UiSidebarMenuItem>
            <UiSidebarMenuButton class="h-auto py-3 group-data-[collapsible=icon]:!p-0">
              <img src="/logo.jpg" class="size-8 shrink-0 rounded-lg" alt="Logo" />
              <span class="text-lg font-bold">UI Thing</span>
              <div class="ml-auto flex items-center gap-2">
                <Icon name="i:search-lg" class="size-5 shrink-0 text-muted-foreground/80" />
                <Icon
                  name="i:chevron-selector-vertical"
                  class="size-5 shrink-0 text-muted-foreground/80"
                />
              </div>
            </UiSidebarMenuButton>
          </UiSidebarMenuItem>
        </UiSidebarMenu>
      </UiSidebarHeader>
      <UiSidebarContent>
        <UiSidebarGroup>
          <UiSidebarGroupLabel class="mb-2 text-sm">UI THING</UiSidebarGroupLabel>
          <UiSidebarMenu>
            <UiSidebarMenuItem v-for="item in menu" :key="item.title">
              <UiSidebarMenuButton
                as-child
                class="h-auto gap-3 text-muted-foreground [&>svg]:size-[20px] group-data-[collapsible=icon]:[&>svg]:size-[19px]"
                :is-active="route.path === item.route"
                :tooltip="item.title"
              >
                <NuxtLink :to="item.route">
                  <Icon :name="item.icon" class="text-muted-foreground" />
                  <span class="font-semibold lg:text-base">{{ item.title }}</span>
                </NuxtLink>
              </UiSidebarMenuButton>
            </UiSidebarMenuItem>
          </UiSidebarMenu>
        </UiSidebarGroup>
      </UiSidebarContent>
      <UiSidebarFooter>
        <UiSidebarMenu>
          <UiSidebarMenuItem>
            <UiSidebarMenuButton
              class="h-auto gap-3 text-muted-foreground [&>svg]:size-[20px] group-data-[collapsible=icon]:[&>svg]:size-[18px]"
              tooltip="Change color more"
              @click="$colorMode.preference = $colorMode.value === 'dark' ? 'light' : 'dark'"
            >
              <Icon name="lucide:sun" class="text-muted-foreground" />
              <span class="font-semibold lg:text-base">Change theme</span>
            </UiSidebarMenuButton>
          </UiSidebarMenuItem>
          <UiSidebarMenuItem v-for="item in footerMenu" :key="item.title">
            <UiSidebarMenuButton
              as-child
              class="h-auto gap-3 text-muted-foreground [&>svg]:size-[20px] group-data-[collapsible=icon]:[&>svg]:size-[18px]"
              :is-active="route.path === item.route"
              :tooltip="item.title"
            >
              <NuxtLink :to="item.route">
                <Icon :name="item.icon" class="text-muted-foreground" />
                <span class="font-semibold lg:text-base">{{ item.title }}</span>
              </NuxtLink>
            </UiSidebarMenuButton>
          </UiSidebarMenuItem>
        </UiSidebarMenu>
      </UiSidebarFooter>
      <UiSidebarRail />
    </UiSidebar>
    <UiSidebarInset>
      <slot />
    </UiSidebarInset>
  </UiSidebarProvider>
</template>

<script lang="ts" setup>
  const route = useRoute();
  const menu = [
    { title: "Overview", icon: "i:home-line", route: "/" },
    { title: "Dashboards", icon: "i:bar-chart-01", route: "#" },
    { title: "Notifications", icon: "i:notification-text", route: "#" },
    { title: "Analyze", icon: "i:target-04", route: "#" },
    { title: "Clicks", icon: "i:cursor-click-01", route: "#" },
    { title: "Manage access", icon: "i:users-check", route: "#" },
    { title: "All charts", icon: "i:line-chart-up-03", route: "#" },
    { title: "Explore events", icon: "i:rows-02", route: "#" },
    { title: "Visual labels", icon: "i:tag-02", route: "#" },
    { title: "Live data feed", icon: "i:grid-02", route: "#" },
  ];

  const footerMenu = [
    { title: "Settings", icon: "i:settings-02", route: "#" },
    { title: "Support", icon: "i:help-circle", route: "#" },
  ];
</script>
