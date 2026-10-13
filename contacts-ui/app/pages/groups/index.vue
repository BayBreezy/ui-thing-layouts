<script setup lang="ts">
  import { groupColorClasses, groupIconNames } from "~/utils/demo";
  usePageSeo({ title: "Groups" });
  const { state } = useDemo();
  const dialog = ref(false);
  const counts = computed(() => {
    const map = new Map<string, number>();
    for (const contact of state.value?.contacts ?? []) {
      if (contact.archived) continue;
      for (const id of contact.groupIds) map.set(id, (map.get(id) ?? 0) + 1);
    }
    return map;
  });
</script>
<template>
  <div class="page-shell">
    <VerdantPageHeader
      title="Groups"
      description="Gather people the way you think about them: family, clients, the book club."
    >
      <UiButton @click="dialog = true"><Icon name="lucide:plus" />New group</UiButton>
    </VerdantPageHeader>
    <ul v-if="state?.groups.length" class="grid gap-4 @lg:grid-cols-2 @4xl:grid-cols-3">
      <li v-for="group in state.groups" :key="group.id">
        <UiCard class="relative h-full transition-shadow hover:shadow-md">
          <UiCardHeader>
            <div
              :class="[
                'mb-2 flex size-10 items-center justify-center rounded-lg',
                groupColorClasses[group.color].soft,
              ]"
            >
              <Icon :name="groupIconNames[group.icon]" class="size-5" />
            </div>
            <UiCardTitle as="h2" class="text-base">
              <NuxtLink :to="'/groups/' + group.id" class="after:absolute after:inset-0">{{
                group.name
              }}</NuxtLink>
            </UiCardTitle>
            <UiCardDescription>{{ group.description || "No description yet." }}</UiCardDescription>
          </UiCardHeader>
          <UiCardContent class="mt-auto text-sm text-muted-foreground">
            {{ counts.get(group.id) ?? 0 }}
            {{ (counts.get(group.id) ?? 0) === 1 ? "person" : "people" }}
          </UiCardContent>
        </UiCard>
      </li>
    </ul>
    <VerdantEmpty
      v-else
      title="No groups yet"
      description="Create a group to start organizing your contacts."
      icon="lucide:users-round"
    >
      <UiButton @click="dialog = true">Create a group</UiButton>
    </VerdantEmpty>
    <VerdantGroupDialog v-model:open="dialog" />
  </div>
</template>
