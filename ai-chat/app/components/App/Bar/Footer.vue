<template>
  <UiSidebarFooter>
    <UiSidebarGroup>
      <UiSidebarGroupLabel class="uppercase text-sidebar-foreground/50"> More </UiSidebarGroupLabel>
      <UiSidebarGroupContent>
        <UiSidebarMenu>
          <UiSidebarMenuItem v-for="item in footerMenu" :key="item.title">
            <UiSidebarMenuButton
              as-child
              class="group/menu-button h-9 gap-3 rounded-md font-medium"
            >
              <NuxtLink :href="item.url">
                <Icon
                  v-if="item.icon"
                  class="size-[22px] text-sidebar-foreground/50 group-data-[active=true]/menu-button:text-primary"
                  aria-hidden="true"
                  :name="item.icon"
                />

                <span>{{ item.title }}</span>
              </NuxtLink>
            </UiSidebarMenuButton>
          </UiSidebarMenuItem>
        </UiSidebarMenu>
      </UiSidebarGroupContent>
    </UiSidebarGroup>
  </UiSidebarFooter>
</template>

<script lang="ts" setup>
  const footerMenu = [
    { title: "Community", url: "#", icon: "ri:planet-line" },
    { title: "Help Centre", url: "#", icon: "ri:seedling-line" },
    { title: "Settings", url: "#", icon: "ri:settings-3-line" },
  ];
</script>
