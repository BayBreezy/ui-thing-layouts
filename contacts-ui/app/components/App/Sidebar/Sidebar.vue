<template>
  <UiSidebar>
    <UiSidebarHeader :class="GSAP_SIDEBAR">
      <AppSidebarTeamSwitcher />
      <!-- eslint-disable-next-line vue/html-self-closing -->
      <hr class="mx-2 -mt-px border-t border-border" />
      <AppSidebarSearchForm class="mt-3" />
    </UiSidebarHeader>
    <UiSidebarContent :class="GSAP_SIDEBAR">
      <!-- We create a SidebarGroup for each parent. -->

      <template v-for="item in navMain" :key="item.title">
        <UiSidebarGroup>
          <UiSidebarGroupLabel class="uppercase text-muted-foreground/60">
            {{ item.title }}
          </UiSidebarGroupLabel>
          <UiSidebarGroupContent class="px-2">
            <UiSidebarMenu>
              <template v-for="child in item.items" :key="child.title">
                <UiSidebarMenuItem>
                  <UiSidebarMenuButton
                    as-child
                    class="group/menu-button h-9 gap-3 rounded-md bg-gradient-to-r font-medium hover:bg-transparent hover:from-sidebar-accent hover:to-sidebar-accent/40 data-[active=true]:from-primary/20 data-[active=true]:to-primary/5"
                    :is-active="child.isActive"
                  >
                    <NuxtLink :href="item.url">
                      <Icon
                        v-if="child.icon"
                        class="size-[22px] text-muted-foreground/60 group-data-[active=true]/menu-button:text-primary"
                        :name="child.icon"
                        aria-hidden="true"
                      />

                      <span>{{ item.title }}</span>
                    </NuxtLink>
                  </UiSidebarMenuButton>
                </UiSidebarMenuItem>
              </template>
            </UiSidebarMenu>
          </UiSidebarGroupContent>
        </UiSidebarGroup>
      </template>
    </UiSidebarContent>
    <UiSidebarFooter :class="GSAP_SIDEBAR">
      <!-- eslint-disable-next-line vue/html-self-closing -->
      <hr class="mx-2 -mt-px border-t border-border" />
      <UiSidebarMenu>
        <UiSidebarMenuItem>
          <UiSidebarMenuButton
            class="h-9 gap-3 rounded-md bg-gradient-to-r font-medium hover:bg-transparent hover:from-sidebar-accent hover:to-sidebar-accent/40 data-[active=true]:from-primary/20 data-[active=true]:to-primary/5 [&>svg]:size-auto"
          >
            <Icon
              name="ri:logout-box-line"
              mode="svg"
              class="size-[22px] text-muted-foreground/60 group-data-[active=true]/menu-button:text-primary"
              aria-hidden="true"
            />
            <span>Sign Out</span>
          </UiSidebarMenuButton>
        </UiSidebarMenuItem>
      </UiSidebarMenu>
    </UiSidebarFooter>
    <UiSidebarRail />
  </UiSidebar>
</template>

<script lang="ts" setup>
  const navMain = [
    {
      title: "Sections",
      url: "#",
      items: [
        { title: "Dashboard", url: "#", icon: "ri:scan-line" },
        { title: "Insights", url: "#", icon: "ri:bard-line" },
        { title: "Contacts", url: "#", icon: "ri:user-follow-line", isActive: true },
        { title: "Tools", url: "#", icon: "ri:code-s-slash-line" },
        { title: "Integration", url: "#", icon: "ri:login-circle-line" },
        { title: "Layouts", url: "#", icon: "ri-layout-left-line" },
        { title: "Reports", url: "#", icon: "ri:leaf-line" },
      ],
    },
    {
      title: "Other",
      url: "#",
      items: [
        { title: "Settings", url: "#", icon: "ri:settings-3-line" },
        { title: "Help Center", url: "#", icon: "ri:leaf-line" },
      ],
    },
  ];
</script>
