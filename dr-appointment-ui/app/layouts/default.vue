<template>
  <UiSidebarProvider>
    <UiSidebar variant="floating" collapsible="icon">
      <UiSidebarHeader>
        <UiSidebarMenu>
          <UiSidebarMenuItem>
            <UiSidebarMenuButton class="h-auto py-3 group-data-[collapsible=icon]:!p-0">
              <img src="/logo.jpg" class="size-8 shrink-0 rounded-lg" alt="Logo" />
              <span class="text-lg font-bold">UI Thing</span>
            </UiSidebarMenuButton>
          </UiSidebarMenuItem>
        </UiSidebarMenu>
      </UiSidebarHeader>
      <UiSidebarContent>
        <UiSidebarGroup>
          <UiSidebarGroupLabel class="mb-2 text-sm">MAIN MENU</UiSidebarGroupLabel>
          <UiSidebarMenu>
            <template v-for="(item, i) in sidebarMenu.main" :key="i">
              <UiSidebarSeparator v-if="item.separator" />
              <UiSidebarMenuItem v-else>
                <UiSidebarMenuButton
                  as-child
                  class="group/menu-button h-auto gap-3 text-muted-foreground group-data-[collapsible=icon]:!p-1.5 [&>svg]:size-[24px] group-data-[collapsible=icon]:[&>svg]:size-[20px]"
                  :is-active="route.path === item.action"
                  :tooltip="item.label"
                >
                  <NuxtLink :to="item.action">
                    <Icon
                      :name="item.icon"
                      class="text-muted-foreground group-data-[active=true]/menu-button:text-primary"
                    />
                    <span class="group-data-[active=true]/menu-button:text-primary lg:text-base">{{
                      item.label
                    }}</span>
                  </NuxtLink>
                </UiSidebarMenuButton>
              </UiSidebarMenuItem>
            </template>
          </UiSidebarMenu>
        </UiSidebarGroup>
      </UiSidebarContent>
      <UiSidebarFooter>
        <UiSidebarMenu>
          <UiSidebarMenuItem v-for="item in sidebarMenu.footer" :key="item.label">
            <UiSidebarMenuButton
              as-child
              class="group/menu-button h-auto gap-3 text-muted-foreground group-data-[collapsible=icon]:!p-1.5 [&>svg]:size-[24px] group-data-[collapsible=icon]:[&>svg]:size-[20px]"
              :is-active="route.path === item.action"
              :tooltip="item.label"
            >
              <NuxtLink :to="item.action">
                <Icon :name="item.icon" class="text-muted-foreground" />
                <span class="lg:text-base">{{ item.label }}</span>
              </NuxtLink>
            </UiSidebarMenuButton>
          </UiSidebarMenuItem>
        </UiSidebarMenu>
      </UiSidebarFooter>
      <UiSidebarRail />
    </UiSidebar>
    <UiSidebarInset>
      <div class="sticky top-0 z-10 bg-background @container">
        <header class="flex h-16 items-center justify-between px-5 @[800px]:px-8">
          <div class="flex items-center gap-4">
            <UiSidebarTrigger v-slot="{ state }" v-tippy="'Toggle sidebar'" class="shrink-0">
              <Icon
                name="lucide:panel-left-open"
                class="size-5 text-muted-foreground transition-all"
                :class="[state != 'collapsed' ? 'rotate-180 transform' : '']"
              />
            </UiSidebarTrigger>
            <UiBreadcrumbs
              separator="solar:alt-arrow-right-line-duotone"
              :items="breadcrumbs"
              class="hidden gap-2 @[750px]:flex [&_svg]:size-5"
            />
          </div>
          <div class="flex items-center gap-2">
            <UiChip position="top-right" inset size="md">
              <UiButton
                v-tippy.bottom-end="'View notifications'"
                class="shrink-0"
                variant="ghost"
                size="icon-sm"
              >
                <span class="sr-only">Clicking this button shows your notifications</span>
                <Icon name="solar:bell-bold-duotone" />
              </UiButton>
            </UiChip>
            <UiButton
              v-tippy.bottom-end="'Search website'"
              variant="ghost"
              size="icon-sm"
              class="shrink-0"
            >
              <span class="sr-only">Clicking this button shows the search dialog</span>
              <Icon name="solar:minimalistic-magnifer-bold-duotone" />
            </UiButton>
            <UiButton
              v-tippy.bottom-end="'Change color mode'"
              variant="ghost"
              size="icon-sm"
              class="shrink-0"
              @click="$colorMode.preference = $colorMode.value === 'dark' ? 'light' : 'dark'"
            >
              <span class="sr-only">
                Clicking this button changes the color mode of the website
              </span>
              <Icon name="solar:moon-sleep-bold-duotone" />
            </UiButton>
            <UiDivider class="mx-2.5 h-5" orientation="vertical" />
            <UserDropdown />
          </div>
        </header>
      </div>
      <div class="container px-5 py-6 @[800px]:px-8">
        <slot />
      </div>
    </UiSidebarInset>
  </UiSidebarProvider>
</template>

<script lang="ts" setup>
  const route = useRoute();
  const breadcrumbs = useCurrentBreadcrumbs();

  const sidebarMenu = {
    main: [
      { label: "Dashboard", icon: "solar:home-2-bold-duotone", action: "/" },
      { label: "Appointments", icon: "solar:calendar-bold-duotone", action: "#" },
      { label: "Patients", icon: "solar:users-group-two-rounded-bold-duotone", action: "#" },
      { label: "Messages", icon: "solar:chat-line-bold-duotone", action: "#" },
      { label: "Reports", icon: "solar:chart-bold-duotone", action: "#" },
      { separator: true },
      { label: "Settings", icon: "solar:settings-bold-duotone", action: "#" },
    ],
    footer: [
      { label: "Help Center", icon: "solar:help-bold-duotone", action: "#" },
      { label: "Privacy Policy", icon: "solar:shield-keyhole-bold-duotone", action: "#" },
      { label: "Sign Out", icon: "solar:logout-3-bold-duotone", action: "#" },
    ],
  };
</script>
