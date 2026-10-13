<script setup lang="ts">
  import { isOverdue } from "#shared/contacts";
  import { findDuplicates } from "#shared/duplicates";
  import { groupColorClasses, today } from "~/utils/demo";
  import { navigation, moreNavigation } from "~/utils/navigation";
  const { state, nameOf } = useDemo();
  const route = useRoute();
  const { setOpenMobile } = useSidebar();
  watch(
    () => route.fullPath,
    () => setOpenMobile(false)
  );
  const active = (to: string) => (to === "/" ? route.path === "/" : route.path.startsWith(to));
  const overdue = computed(
    () => state.value?.followUps.filter((item) => isOverdue(item, today)).length ?? 0
  );
  const duplicates = computed(() => findDuplicates(state.value?.contacts ?? []).length);
  const counts = computed(() => {
    const map = new Map<string, number>();
    for (const contact of state.value?.contacts ?? []) {
      if (contact.archived) continue;
      for (const id of contact.groupIds) map.set(id, (map.get(id) ?? 0) + 1);
    }
    return map;
  });
  const favorites = computed(() =>
    (state.value?.contacts ?? []).filter((item) => item.favorite && !item.archived).slice(0, 4)
  );
  const badge = (to: string) =>
    to === "/follow-ups" ? overdue.value : to === "/cleanup" ? duplicates.value : 0;
</script>
<template>
  <UiSidebarHeader>
    <NuxtLink to="/" aria-label="Verdant home" class="px-2 pt-1" @click="setOpenMobile(false)">
      <VerdantLogo />
    </NuxtLink>
  </UiSidebarHeader>
  <UiSidebarContent>
    <UiSidebarGroup>
      <UiButton to="/contacts/new" class="w-full justify-start" @click="setOpenMobile(false)">
        <Icon name="lucide:user-plus" />New contact
      </UiButton>
    </UiSidebarGroup>
    <UiSidebarGroup>
      <UiSidebarGroupLabel>Manage</UiSidebarGroupLabel>
      <UiSidebarMenu>
        <UiSidebarMenuItem v-for="item in navigation" :key="item.to">
          <UiSidebarMenuButton :is-active="active(item.to)" as-child>
            <NuxtLink :to="item.to" @click="setOpenMobile(false)">
              <Icon :name="item.icon" /><span>{{ item.title }}</span>
              <span
                v-if="badge(item.to)"
                class="ml-auto rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground tabular-nums"
              >
                {{ badge(item.to) }}<span class="sr-only"> need attention</span>
              </span>
            </NuxtLink>
          </UiSidebarMenuButton>
        </UiSidebarMenuItem>
      </UiSidebarMenu>
    </UiSidebarGroup>
    <UiSidebarGroup v-if="state?.groups.length">
      <UiSidebarGroupLabel>Groups</UiSidebarGroupLabel>
      <UiSidebarGroupAction as-child title="Manage groups">
        <NuxtLink to="/groups" aria-label="Manage groups"
          ><Icon name="lucide:arrow-up-right"
        /></NuxtLink>
      </UiSidebarGroupAction>
      <UiSidebarMenu>
        <UiSidebarMenuItem v-for="group in state.groups" :key="group.id">
          <UiSidebarMenuButton as-child :is-active="route.path === '/groups/' + group.id">
            <NuxtLink :to="'/groups/' + group.id" @click="setOpenMobile(false)">
              <span :class="['size-2 shrink-0 rounded-full', groupColorClasses[group.color].dot]" />
              <span class="truncate">{{ group.name }}</span>
              <span class="ml-auto text-xs text-muted-foreground tabular-nums">{{
                counts.get(group.id) ?? 0
              }}</span>
            </NuxtLink>
          </UiSidebarMenuButton>
        </UiSidebarMenuItem>
      </UiSidebarMenu>
    </UiSidebarGroup>
    <UiSidebarGroup v-if="favorites.length">
      <UiSidebarGroupLabel>Favorites</UiSidebarGroupLabel>
      <UiSidebarMenu>
        <UiSidebarMenuItem v-for="contact in favorites" :key="contact.id">
          <UiSidebarMenuButton as-child :is-active="route.params.id === contact.id">
            <NuxtLink :to="'/contacts/' + contact.id" @click="setOpenMobile(false)">
              <VerdantContactAvatar :contact="contact" size="xs" />
              <span class="truncate">{{ nameOf(contact) }}</span>
            </NuxtLink>
          </UiSidebarMenuButton>
        </UiSidebarMenuItem>
      </UiSidebarMenu>
    </UiSidebarGroup>
    <UiSidebarGroup class="mt-auto">
      <UiSidebarMenu>
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
            <UiAvatar size="sm" aria-hidden="true">
              <UiAvatarFallback class="contact-avatar text-xs font-semibold" style="--hue: 160">{{
                state?.profile.name.slice(0, 1)
              }}</UiAvatarFallback>
            </UiAvatar>
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
