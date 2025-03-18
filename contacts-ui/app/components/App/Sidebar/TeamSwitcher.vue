<template>
  <UiSidebarMenu>
    <UiSidebarMenuItem>
      <UiDropdownMenu>
        <UiDropdownMenuTrigger as-child>
          <UiSidebarMenuButton
            size="lg"
            class="gap-3 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground [&>svg]:size-auto"
          >
            <div
              class="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-md bg-sidebar-primary text-sidebar-primary-foreground"
            >
              <img
                v-if="activeTeam"
                :src="activeTeam?.logo"
                width="36"
                height="36"
                :alt="activeTeam.name"
              />
            </div>
            <div class="grid flex-1 text-left text-base leading-tight">
              <span class="truncate font-medium"> {{ activeTeam?.name ?? "Select a Team" }} </span>
            </div>
            <Icon
              name="ri:expand-up-down-line"
              class="ms-auto size-5 shrink-0 text-muted-foreground/60"
              aria-hidden="true"
            />
          </UiSidebarMenuButton>
        </UiDropdownMenuTrigger>
        <UiDropdownMenuContent
          class="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-md"
          align="start"
          side="bottom"
          :side-offset="4"
        >
          <UiDropdownMenuLabel class="text-xs uppercase text-muted-foreground/60">
            Teams
          </UiDropdownMenuLabel>
          <template v-for="(team, i) in teams" :key="team.name">
            <UiDropdownMenuItem class="gap-2 p-2" @select="activeTeam = team">
              <div class="flex size-6 items-center justify-center overflow-hidden rounded-md">
                <img :src="team.logo" width="36" height="36" :alt="team.name" />
              </div>
              {{ team.name }}
              <UiDropdownMenuShortcut>⌘{{ i + 1 }}</UiDropdownMenuShortcut>
            </UiDropdownMenuItem>
          </template>
          <UiDropdownMenuSeparator />
          <UiDropdownMenuItem class="gap-2 p-2">
            <Icon name="ri:add-line" class="size-4 opacity-60" aria-hidden="true" />
            <div class="font-medium">Add team</div>
          </UiDropdownMenuItem>
        </UiDropdownMenuContent>
      </UiDropdownMenu>
    </UiSidebarMenuItem>
  </UiSidebarMenu>
</template>

<script lang="ts" setup>
  const teams = [
    { name: "InnovaCraft", logo: "/teams/team-icon.png" },
    { name: "Acme Corp.", logo: "/teams/team-icon.png" },
    { name: "Evil Corp.", logo: "/teams/team-icon.png" },
  ];
  const activeTeam = ref(teams[0]);
</script>
