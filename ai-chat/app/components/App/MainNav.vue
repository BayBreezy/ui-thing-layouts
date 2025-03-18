<template>
  <UiNavbar class="rounded-t-[inherit]" sticky>
    <div class="flex h-14 items-center justify-between px-4 md:px-6 lg:px-8">
      <div class="flex items-center gap-6">
        <UiSidebarTrigger
          v-slot="{ state }"
          class="group size-8 shrink-0 ring-1 ring-border/30 transition hover:ring-border/50"
        >
          <Icon
            :name="state === 'expanded' ? 'ri:skip-left-line' : 'ri:skip-right-line'"
            class="size-5 text-sidebar-foreground/60 transition group-hover:text-sidebar-foreground"
          />
        </UiSidebarTrigger>
      </div>
      <div class="flex items-center gap-2.5">
        <div class="max-[900px]:hidden">
          <UiBreadcrumbs class="mr-8 gap-3" :items="breadcrumbs" />
        </div>
        <AppThemeSwitcher />
        <UiDropdownMenu>
          <UiDropdownMenuTrigger as-child>
            <UiAvatar class="size-8">
              <UiAvatarImage :src="user.image" />
              <UiAvatarFallback>{{ initials }}</UiAvatarFallback>
            </UiAvatar>
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent class="md:min-w-[200px]" side="bottom" align="end">
            <UiDropdownMenuLabel class="flex flex-col">
              <p>{{ user.name }}</p>
              <p class="text-xs font-normal text-muted-foreground">{{ user.email }}</p>
            </UiDropdownMenuLabel>
            <UiDropdownMenuSeparator />
            <UiDropdownMenuGroup>
              <template v-for="(item, idx) in profileMenu" :key="idx">
                <UiDropdownMenuItem v-if="!item.divider" :text-value="item.title">
                  <Icon :name="item.icon" class="size-4 text-muted-foreground" />
                  <span>{{ item.title }}</span>
                </UiDropdownMenuItem>
                <UiDropdownMenuSeparator v-if="item.divider" />
              </template>
            </UiDropdownMenuGroup>
          </UiDropdownMenuContent>
        </UiDropdownMenu>
      </div>
    </div>
  </UiNavbar>
</template>

<script lang="ts" setup>
  import type { Crumbs } from "@/components/Ui/Breadcrumbs.vue";

  const profileMenu = [
    { title: "Dashboard", icon: "ri:dashboard-line", link: "#" },
    { title: "Profile", icon: "ri:user-3-line", link: "#" },
    { title: "Changelog", icon: "ri:pulse-ai-line", link: "#" },
    { title: "History", icon: "ri:find-replace-line", link: "#" },
    { divider: true },
    { title: "Settings", icon: "ri:settings-3-line", link: "#" },
    { title: "Help", icon: "ri:questionnaire-line", link: "#" },
    { title: "Sign Out", icon: "ri:logout-box-line", link: "#" },
  ];
  const { user, initials } = useUser();

  const breadcrumbs: Crumbs[] = [
    { label: "API Reference", link: "#" },
    { label: "Docs", link: "#" },
    { label: "Dashboard", link: "#" },
    { label: "Playground", link: "#" },
  ];
</script>
