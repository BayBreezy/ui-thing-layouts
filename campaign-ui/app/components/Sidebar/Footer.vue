<template>
  <UiSidebarFooter>
    <UiSidebarMenu>
      <UiSidebarMenuItem>
        <UiDropdownMenu>
          <UiDropdownMenuTrigger as-child>
            <UiSidebarMenuButton class="h-auto">
              <UiAvatar>
                <UiAvatarImage
                  src="https://randomuser.me/api/portraits/med/men/75.jpg"
                  alt="John Doe"
                />
                <UiAvatarFallback>JD</UiAvatarFallback>
              </UiAvatar>
              <div class="flex flex-col gap-1 text-sm leading-none">
                <p class="font-semibold">John Doe</p>
                <p class="text-muted-foreground">j.doe@example.com</p>
              </div>
            </UiSidebarMenuButton>
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent class="w-[250px]" align="end">
            <UiDropdownMenuLabel>
              <div class="flex flex-col gap-1 text-sm leading-none">
                <p class="font-semibold">John Doe</p>
                <p class="font-normal text-muted-foreground">j.doe@example.com</p>
              </div>
            </UiDropdownMenuLabel>
            <UiDropdownMenuSeparator />
            <UiDropdownMenuGroup>
              <template v-for="(item, idx) in profileMenu" :key="idx">
                <UiDropdownMenuItem v-if="!item.divider" class="h-9" :text-value="item.title">
                  <Icon :name="item.icon" class="size-5 text-muted-foreground" />
                  <span>{{ item.title }}</span>
                </UiDropdownMenuItem>
                <UiDropdownMenuSeparator v-if="item.divider" />
              </template>
            </UiDropdownMenuGroup>
          </UiDropdownMenuContent>
        </UiDropdownMenu>
      </UiSidebarMenuItem>
    </UiSidebarMenu>
  </UiSidebarFooter>
</template>

<script lang="ts" setup>
  const profileMenu = [
    { title: "Dashboard", icon: "solar:home-smile-angle-bold-duotone", link: "#" },
    { title: "Profile", icon: "solar:user-bold-duotone", link: "#" },
    { title: "Changelog", icon: "solar:clock-circle-bold-duotone", link: "#" },
    { title: "History", icon: "solar:refresh-circle-bold-duotone", link: "#" },
    { divider: true },
    { title: "Settings", icon: "solar:tuning-square-bold-duotone", link: "#" },
    { title: "Help", icon: "solar:question-square-bold-duotone", link: "#" },
    { title: "Sign Out", icon: "solar:logout-3-bold-duotone", link: "#" },
  ];
</script>
