<template>
  <UiDropdownMenu>
    <ClientOnly>
      <template #fallback>
        <UiSkeleton class="size-8 shrink-0 rounded-full" />
      </template>
      <UiDropdownMenuTrigger as-child>
        <button>
          <span class="sr-only"> Clicking this button to see the user dropdown menu </span>
          <UiAvatar v-tippy.bottom-end="'View menu'" class="size-8 shrink-0">
            <UiAvatarImage :src="user.avatar" :alt="`${user.firstName} ${user.lastName}`" />
            <UiAvatarFallback>{{ user.initials }}</UiAvatarFallback>
          </UiAvatar>
        </button>
      </UiDropdownMenuTrigger>
    </ClientOnly>
    <UiDropdownMenuContent align="end">
      <UiDropdownMenuLabel class="flex flex-col">
        <span class="text-sm font-semibold">{{ user.firstName }} {{ user.lastName }}</span>
        <span class="text-sm font-normal text-muted-foreground">{{ user.email }}</span>
      </UiDropdownMenuLabel>
      <UiDropdownMenuSeparator />
      <UiDropdownMenuGroup>
        <template v-for="(item, i) in profileOptions" :key="i">
          <UiDropdownMenuSeparator v-if="item.separator" />
          <UiDropdownMenuItem v-else class="cursor-pointer">
            <Icon :name="item.icon" class="size-[22px] text-muted-foreground" />
            <span>{{ item.label }}</span>
          </UiDropdownMenuItem>
        </template>
      </UiDropdownMenuGroup>
    </UiDropdownMenuContent>
  </UiDropdownMenu>
</template>

<script lang="ts" setup>
  const user = useUser();
  const profileOptions = [
    { label: "My Profile", icon: "solar:user-bold-duotone", action: "/profile" },
    { label: "My Schedule", icon: "solar:calendar-bold-duotone", action: "/schedule" },
    {
      label: "My Patients",
      icon: "solar:users-group-two-rounded-bold-duotone",
      action: "/patients",
    },
    { separator: true },
    {
      label: "Notification Settings",
      icon: "solar:bell-off-bold-duotone",
      action: "/settings/notifications",
    },
    { label: "Theme", icon: "solar:palette-round-bold-duotone", action: "/settings/theme" },
    { label: "Language", icon: "solar:map-bold-duotone", action: "/settings/language" },
    { separator: true },
    {
      label: "Change Password",
      icon: "solar:lock-password-bold-duotone",
      action: "/settings/password",
    },
    {
      label: "Two-Factor Authentication",
      icon: "solar:smartphone-bold-duotone",
      action: "/settings/2fa",
    },
    {
      label: "Privacy Settings",
      icon: "solar:shield-keyhole-bold-duotone",
      action: "/settings/privacy",
    },
    { separator: true },
    { label: "Help Center", icon: "solar:help-bold-duotone", action: "/help" },
    { label: "Contact Support", icon: "solar:chat-line-bold-duotone", action: "/support" },
    { label: "Rate Us", icon: "solar:stars-bold-duotone", action: "/rate-us" },
    { separator: true },
    { label: "Sign Out", icon: "solar:logout-3-bold-duotone", action: "/logout" },
  ];
</script>
