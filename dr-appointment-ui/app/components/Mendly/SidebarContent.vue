<script setup lang="ts">
  import { holdsSlot } from "#shared/schedule";
  import { today } from "~/utils/demo";
  import { moreNavigation, navigation } from "~/utils/navigation";
  const { state } = useDemo();
  const route = useRoute();
  const { setOpenMobile } = useSidebar();
  watch(
    () => route.fullPath,
    () => setOpenMobile(false)
  );
  const active = (to: string) => (to === "/" ? route.path === "/" : route.path.startsWith(to));
  const todayCount = computed(
    () =>
      state.value?.appointments.filter((item) => item.date === today && holdsSlot(item.status))
        .length ?? 0
  );
  const waiting = computed(
    () =>
      state.value?.appointments.filter(
        (item) => item.date === today && item.status === "checked-in"
      ).length ?? 0
  );
  const badge = (to: string) =>
    to === "/" ? waiting.value : to === "/waitlist" ? (state.value?.waitlist.length ?? 0) : 0;
  const badgeLabel = (to: string) => (to === "/" ? "checked in and waiting" : "waiting");
</script>
<template>
  <UiSidebarHeader>
    <NuxtLink to="/" aria-label="Mendly home" class="px-2 pt-1" @click="setOpenMobile(false)">
      <MendlyLogo />
    </NuxtLink>
  </UiSidebarHeader>
  <UiSidebarContent>
    <UiSidebarGroup>
      <UiButton to="/appointments/new" class="w-full justify-start" @click="setOpenMobile(false)">
        <Icon name="lucide:calendar-plus" />Book appointment
      </UiButton>
    </UiSidebarGroup>
    <UiSidebarGroup>
      <UiSidebarGroupLabel>Front desk</UiSidebarGroupLabel>
      <UiSidebarMenu>
        <UiSidebarMenuItem v-for="item in navigation" :key="item.to">
          <UiSidebarMenuButton :is-active="active(item.to)" as-child>
            <NuxtLink :to="item.to" @click="setOpenMobile(false)">
              <Icon :name="item.icon" /><span>{{ item.title }}</span>
              <span
                v-if="badge(item.to)"
                class="ml-auto rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground tabular-nums"
              >
                {{ badge(item.to) }}<span class="sr-only"> {{ badgeLabel(item.to) }}</span>
              </span>
            </NuxtLink>
          </UiSidebarMenuButton>
        </UiSidebarMenuItem>
      </UiSidebarMenu>
    </UiSidebarGroup>
    <UiSidebarGroup v-if="state?.providers.length">
      <UiSidebarGroupLabel>On the schedule today</UiSidebarGroupLabel>
      <UiSidebarMenu>
        <UiSidebarMenuItem
          v-for="provider in state.providers.filter((item) => item.active)"
          :key="provider.id"
        >
          <UiSidebarMenuButton as-child :is-active="route.path === '/providers/' + provider.id">
            <NuxtLink :to="'/providers/' + provider.id" @click="setOpenMobile(false)">
              <MendlyAvatar :name="provider.name" :hue="provider.hue" size="xs" />
              <span class="truncate">{{ provider.name }}</span>
            </NuxtLink>
          </UiSidebarMenuButton>
        </UiSidebarMenuItem>
      </UiSidebarMenu>
      <p class="mt-2 px-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
        {{ todayCount }} visits today
      </p>
    </UiSidebarGroup>
    <UiSidebarGroup class="mt-auto">
      <UiSidebarMenu>
        <UiSidebarMenuItem>
          <UiSidebarMenuButton as-child>
            <NuxtLink to="/book" @click="setOpenMobile(false)">
              <Icon name="lucide:globe" /><span>Patient booking page</span>
            </NuxtLink>
          </UiSidebarMenuButton>
        </UiSidebarMenuItem>
        <UiSidebarMenuItem v-for="item in moreNavigation" :key="item.to">
          <UiSidebarMenuButton :is-active="active(item.to)" as-child>
            <NuxtLink :to="item.to" @click="setOpenMobile(false)">
              <Icon :name="item.icon" /><span>{{ item.title }}</span>
            </NuxtLink>
          </UiSidebarMenuButton>
        </UiSidebarMenuItem>
      </UiSidebarMenu>
    </UiSidebarGroup>
  </UiSidebarContent>
  <UiSidebarFooter>
    <UiSidebarMenu>
      <UiSidebarMenuItem>
        <UiSidebarMenuButton size="lg" as-child>
          <NuxtLink to="/settings" @click="setOpenMobile(false)">
            <MendlyAvatar :name="state?.profile.name ?? 'Front Desk'" size="sm" />
            <span class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">{{ state?.profile.name }}</span>
              <span class="truncate text-xs text-muted-foreground">{{ state?.profile.role }}</span>
            </span>
          </NuxtLink>
        </UiSidebarMenuButton>
      </UiSidebarMenuItem>
    </UiSidebarMenu>
  </UiSidebarFooter>
</template>
