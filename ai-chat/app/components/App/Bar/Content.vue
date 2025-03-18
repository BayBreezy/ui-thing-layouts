<template>
  <UiSidebarContent>
    <UiSidebarGroup>
      <UiSidebarGroupLabel class="uppercase text-sidebar-foreground/50">
        Playground
      </UiSidebarGroupLabel>
      <UiSidebarGroupContent>
        <UiSidebarMenu>
          <UiSidebarMenuItem v-for="item in menu" :key="item.title">
            <UiSidebarMenuButton
              as-child
              class="group/menu-button h-9 gap-3 rounded-md font-medium data-[active=true]:bg-gradient-to-br data-[active=true]:from-primary data-[active=true]:via-primary data-[active=true]:to-primary/80 data-[active=true]:text-primary-foreground data-[active=true]:[box-shadow:inset_0px_2px_theme(colors.primary.foreground/20%)]"
              :is-active="item.url === $route.path"
            >
              <NuxtLink :href="item.url">
                <Icon
                  class="size-[22px] text-sidebar-foreground/60 group-data-[active=true]/menu-button:text-sidebar/80"
                  :name="item.icon"
                  aria-hidden="true"
                />
                <span>{{ item.title }}</span>
              </NuxtLink>
            </UiSidebarMenuButton>
          </UiSidebarMenuItem>
        </UiSidebarMenu>
      </UiSidebarGroupContent>
    </UiSidebarGroup>
  </UiSidebarContent>
</template>

<script lang="ts" setup>
  const menu = [
    { title: "Chat", url: "/", icon: "ri:chat-1-line" },
    { title: "Real-time", url: "#", icon: "ri:bard-line" },
    { title: "Assistants", url: "#", icon: "ri:mickey-line" },
    { title: "Audio", url: "#", icon: "ri:mic-line" },
    { title: "Metrics", url: "#", icon: "ri:check-double-line" },
    { title: "Documentation", url: "#", icon: "ri:braces-line" },
  ];
</script>
