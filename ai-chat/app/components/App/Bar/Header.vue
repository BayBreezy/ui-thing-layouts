<template>
  <UiSidebarHeader>
    <UiSidebarMenu>
      <UiSidebarMenuItem>
        <UiDropdownMenu>
          <UiDropdownMenuTrigger as-child>
            <UiSidebarMenuButton class="h-auto gap-3 data-[state=open]:bg-sidebar-accent">
              <div
                class="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary via-primary to-primary/60 shadow-md [box-shadow:inset_0px_2px_rgba(255,255,255,0.1)]"
              >
                <Icon
                  mode="svg"
                  :name="selectedTeam?.icon"
                  class="size-4 text-primary-foreground"
                />
              </div>
              <span class="truncate text-base font-medium">{{ selectedTeam?.name }}</span>
              <Icon
                name="ri:expand-up-down-line"
                class="ms-auto size-5 shrink-0 text-sidebar-foreground/50"
              />
            </UiSidebarMenuButton>
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent
            class="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-md"
            align="start"
            side="bottom"
            :side-offset="4"
          >
            <UiDropdownMenuLabel class="text-xs uppercase text-muted-foreground/70">
              Teams
            </UiDropdownMenuLabel>
            <UiDropdownMenuItem
              v-for="(team, index) in teams"
              :key="team.name"
              class="gap-2 p-2"
              @select="selectedTeam = team"
            >
              <div
                class="flex size-7 items-center justify-center rounded-md bg-gradient-to-br from-primary via-primary to-primary/60 shadow-md [box-shadow:inset_0px_2px_rgba(255,255,255,0.15)]"
              >
                <Icon :name="team.icon" class="size-4 text-primary-foreground" />
              </div>
              {{ team.name }}
              <UiDropdownMenuShortcut>⌘{{ index + 1 }}</UiDropdownMenuShortcut>
            </UiDropdownMenuItem>

            <UiDropdownMenuSeparator />
            <UiDropdownMenuItem class="gap-2 p-2">
              <Icon name="ri:add-line" class="size-4 opacity-60" aria-hidden="true" />
              <div class="font-medium">Add team</div>
            </UiDropdownMenuItem>
          </UiDropdownMenuContent>
        </UiDropdownMenu>
      </UiSidebarMenuItem>
    </UiSidebarMenu>
  </UiSidebarHeader>
</template>

<script lang="ts" setup>
  const teams = [
    { name: "Sunny Digital", icon: "ri:ai-generate" },
    { name: "Rox Loco", icon: "ri:voice-ai-line" },
    { name: "Spreek AI", icon: "ri:color-filter-ai-line" },
  ];

  const selectedTeam = ref(teams[0]);
</script>
