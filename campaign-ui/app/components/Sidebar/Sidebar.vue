<template>
  <UiSidebar>
    <SidebarHeader />
    <UiSidebarContent class="mt-4">
      <template v-for="item in menu" :key="item.title">
        <UiSidebarGroup>
          <UiSidebarGroupLabel class="mb-3 uppercase tracking-widest">{{
            item.title
          }}</UiSidebarGroupLabel>
          <UiSidebarGroupContent>
            <UiSidebarMenu>
              <template v-for="child in item.items" :key="child.title">
                <UiSidebarMenuItem>
                  <UiSidebarMenuButton
                    as-child
                    class="group/menu-button h-10 data-[active=true]:bg-gradient-to-br data-[active=true]:from-primary data-[active=true]:via-primary data-[active=true]:to-primary/80"
                    :is-active="child.link === route.path"
                  >
                    <NuxtLink :href="child.link">
                      <Icon
                        :name="child.icon"
                        class="size-[22px] text-muted-foreground/80 group-data-[active=true]/menu-button:text-primary-foreground"
                      />
                      <span class="group-data-[active=true]/menu-button:text-primary-foreground">{{
                        child.title
                      }}</span>
                    </NuxtLink>
                  </UiSidebarMenuButton>
                </UiSidebarMenuItem>
              </template>
            </UiSidebarMenu>
          </UiSidebarGroupContent>
        </UiSidebarGroup>
      </template>
    </UiSidebarContent>
    <SidebarFooter />
    <UiSidebarRail />
  </UiSidebar>
</template>

<script lang="ts" setup>
  const route = useRoute();

  const menu = [
    {
      title: "Favorites",
      items: [
        { title: "Technical Docs", icon: "solar:document-text-bold-duotone", link: "#" },
        { title: "Campaign Guidelines", icon: "solar:document-text-bold-duotone", link: "#" },
        { title: "Important Rules", icon: "solar:document-text-bold-duotone", link: "#" },
        { title: "Onboarding", icon: "solar:videocamera-record-bold-duotone", link: "#" },
      ],
    },
    {
      title: "Main Menu",
      items: [
        { title: "Dashboard", icon: "solar:home-smile-angle-bold-duotone", link: "#" },
        { title: "Campaigns", icon: "solar:pie-chart-2-bold-duotone", link: "/" },
        { title: "Chat", icon: "solar:chat-unread-bold-duotone", link: "#" },
        { title: "Support Center", icon: "solar:question-square-bold-duotone", link: "#" },
        { title: "Leads", icon: "solar:user-speak-rounded-bold-duotone", link: "#" },
        { title: "Archive", icon: "solar:archive-bold-duotone", link: "#" },
      ],
    },
  ];
</script>
