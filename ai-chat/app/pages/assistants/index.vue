<script setup lang="ts">
  import type { Assistant } from "#shared/types";
  usePageSeo({
    title: "Assistants",
    description:
      "A little expertise for every kind of work. Browse, duplicate, or create specialist assistants for design, engineering, writing, and research.",
  });
  const { state, assistants } = useDemo();
  const query = ref("");
  const selectedTag = ref("All");
  // The dialog's open state is separate from the target: the confirm button closes the dialog
  // before its click handler runs, so the target must survive the close.
  const deleteOpen = ref(false);
  const deleting = ref<Assistant>();
  const results = computed(() =>
    assistants.value.filter(
      (item) =>
        `${item.name} ${item.description} ${item.tags.join(" ")}`
          .toLowerCase()
          .includes(query.value.toLowerCase()) &&
        (selectedTag.value === "All" || item.tags.includes(selectedTag.value))
    )
  );
  function duplicate(item: Assistant) {
    state.value?.assistants.unshift({
      ...structuredClone(toRaw(item)),
      id: crypto.randomUUID(),
      name: `${item.name.slice(0, 55)} copy`,
      createdAt: new Date().toISOString(),
    });
    useSonner.success("Assistant duplicated");
  }
  function confirmDelete(item: Assistant) {
    deleting.value = item;
    deleteOpen.value = true;
  }
  function remove() {
    const target = deleting.value;
    if (state.value && target) {
      state.value.assistants = state.value.assistants.filter((item) => item.id !== target.id);
      useSonner.success("Assistant deleted");
    }
  }
</script>
<template>
  <div class="page-shell">
    <OrbitPageHeader
      title="Meet your assistants"
      description="Specialists for the work that matters. Make them your own."
    >
      <UiButton to="/assistants/new"><Icon name="lucide:plus" />Create assistant</UiButton>
    </OrbitPageHeader>
    <div class="mb-6 flex flex-wrap items-center gap-4">
      <UiInput
        v-model="query"
        aria-label="Search assistants"
        placeholder="Search assistants…"
        class="max-w-xs"
      />
      <UiTagGroup
        v-model="selectedTag"
        type="single"
        color="primary"
        aria-label="Filter assistants"
      >
        <UiTagGroupItem
          v-for="tag in ['All', 'Product', 'Design', 'Engineering', 'Writing', 'Research']"
          :key="tag"
          :value="tag"
          >{{ tag }}</UiTagGroupItem
        >
      </UiTagGroup>
    </div>
    <div v-if="results.length" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <UiCard v-for="assistant in results" :key="assistant.id">
        <UiCardHeader>
          <UiCardTitle as="h2" class="flex items-center gap-3">
            <UiFancyIcon theme="gradient" size="sm" :icon="assistant.icon" />
            {{ assistant.name }}
          </UiCardTitle>
          <UiCardDescription>{{ assistant.description }}</UiCardDescription>
          <UiCardAction>
            <UiDropdownMenu>
              <UiDropdownMenuTrigger as-child>
                <UiButton
                  variant="ghost"
                  size="icon-sm"
                  :aria-label="`Actions for ${assistant.name}`"
                >
                  <Icon name="lucide:ellipsis" />
                </UiButton>
              </UiDropdownMenuTrigger>
              <UiDropdownMenuContent align="end">
                <UiDropdownMenuItem @select="navigateTo(`/assistants/${assistant.id}`)">
                  Edit assistant
                </UiDropdownMenuItem>
                <UiDropdownMenuItem @select="duplicate(assistant)">Duplicate</UiDropdownMenuItem>
                <UiDropdownMenuItem variant="destructive" @select="confirmDelete(assistant)">
                  Delete
                </UiDropdownMenuItem>
              </UiDropdownMenuContent>
            </UiDropdownMenu>
          </UiCardAction>
        </UiCardHeader>
        <UiCardContent class="flex flex-wrap gap-2">
          <UiBadge v-for="tag in assistant.tags" :key="tag" variant="outline">{{ tag }}</UiBadge>
        </UiCardContent>
        <UiCardFooter class="mt-auto">
          <UiButton
            :to="`/?assistant=${assistant.id}`"
            variant="outline"
            class="w-full justify-between"
            >Start a conversation<Icon name="lucide:arrow-up-right"
          /></UiButton>
        </UiCardFooter>
      </UiCard>
    </div>
    <OrbitEmptyState
      v-else
      title="No assistants found"
      description="Try a different search or create your first specialist."
      icon="lucide:bot"
    >
      <UiButton to="/assistants/new">Create assistant</UiButton>
    </OrbitEmptyState>
    <UiAlertDialog v-model:open="deleteOpen">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>Delete {{ deleting?.name }}?</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            Your conversations will stay in history. This assistant will be removed from this
            browser.
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel>Cancel</UiAlertDialogCancel>
          <UiAlertDialogAction variant="destructive" @click="remove">
            Delete assistant
          </UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  </div>
</template>
