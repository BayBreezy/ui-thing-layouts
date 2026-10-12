<script setup lang="ts">
  import type { Conversation } from "#shared/types";
  const { conversations, deleteConversation } = useDemo();
  const search = ref("");
  const filter = ref("all");
  const selected = ref<Conversation>();
  const renaming = ref(false);
  const deleting = ref(false);
  const name = ref("");
  const results = computed(() =>
    conversations.value.filter(
      (item) =>
        item.title.toLowerCase().includes(search.value.toLowerCase()) &&
        (filter.value !== "favorites" || item.favorite)
    )
  );
  usePageSeo({
    title: "Conversation history",
    description: "Search, favorite, rename, and export every conversation in your Orbit workspace.",
  });
  function rename(item: Conversation) {
    selected.value = item;
    name.value = item.title;
    renaming.value = true;
  }
  function saveName() {
    if (selected.value && name.value.trim()) {
      selected.value.title = name.value.trim().slice(0, 100);
      renaming.value = false;
    }
  }
  function download(item: Conversation, json = false) {
    downloadText(
      `orbit-${item.id}.${json ? "json" : "md"}`,
      json ? JSON.stringify(item, null, 2) : conversationText(item),
      json ? "application/json" : "text/markdown"
    );
  }
</script>
<template>
  <div class="page-shell">
    <OrbitPageHeader
      title="Pick up where you left off"
      description="Every question, fresh perspective, and good idea. Right here when you need it."
    >
      <UiButton to="/"><Icon name="lucide:plus" />New conversation</UiButton>
    </OrbitPageHeader>
    <div class="mb-4 flex flex-wrap items-center justify-between gap-4">
      <UiTabs v-model="filter">
        <UiTabsList>
          <UiTabsTrigger value="all">
            All conversations
            <span class="ml-2 text-xs text-muted-foreground">{{ conversations.length }}</span>
          </UiTabsTrigger>
          <UiTabsTrigger value="favorites">Favorites</UiTabsTrigger>
        </UiTabsList>
      </UiTabs>
      <UiInputGroup class="w-full sm:w-72">
        <UiInputGroupAddon><Icon name="lucide:search" /></UiInputGroupAddon>
        <UiInputGroupInput
          v-model="search"
          aria-label="Search conversations"
          placeholder="Find a conversation…"
        />
      </UiInputGroup>
    </div>
    <UiCard v-if="results.length" class="gap-0 divide-y overflow-hidden py-0">
      <article
        v-for="item in results"
        :key="item.id"
        class="flex items-center gap-2 p-4 transition-colors hover:bg-muted/50"
      >
        <NuxtLink :to="`/chat/${item.id}`" class="min-w-0 flex-1 space-y-1">
          <h2 class="truncate text-sm font-medium">{{ item.title }}</h2>
          <p class="line-clamp-1 text-sm text-muted-foreground">
            {{
              item.messages.findLast((message) => message.role === "user")?.content ??
              "Start your first message"
            }}
          </p>
          <p class="text-xs text-muted-foreground">
            {{ shortDate(item.updatedAt) }} · {{ item.messages.length }} messages ·
            {{ item.preferences.modelId.replace("orbit-", "Orbit ") }}
          </p>
        </NuxtLink>
        <UiButton
          variant="ghost"
          size="icon-sm"
          :aria-label="item.favorite ? `Unfavorite ${item.title}` : `Favorite ${item.title}`"
          :aria-pressed="item.favorite"
          @click="item.favorite = !item.favorite"
        >
          <Icon
            name="lucide:star"
            :class="item.favorite ? 'fill-primary text-primary' : 'text-muted-foreground'"
          />
        </UiButton>
        <UiDropdownMenu>
          <UiDropdownMenuTrigger as-child>
            <UiButton variant="ghost" size="icon-sm" :aria-label="`Actions for ${item.title}`">
              <Icon name="lucide:ellipsis" />
            </UiButton>
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent align="end">
            <UiDropdownMenuItem @select="rename(item)">
              <Icon name="lucide:pen-line" />Rename
            </UiDropdownMenuItem>
            <UiDropdownMenuItem @select="download(item)">
              <Icon name="lucide:download" />Export Markdown
            </UiDropdownMenuItem>
            <UiDropdownMenuItem @select="download(item, true)">Export JSON</UiDropdownMenuItem>
            <UiDropdownMenuSeparator />
            <UiDropdownMenuItem
              variant="destructive"
              @select="
                selected = item;
                deleting = true;
              "
            >
              <Icon name="lucide:trash-2" />Delete
            </UiDropdownMenuItem>
          </UiDropdownMenuContent>
        </UiDropdownMenu>
      </article>
    </UiCard>
    <OrbitEmptyState
      v-else
      title="A fresh page"
      description="No conversations match this view. Try another search, or start something new."
    >
      <UiButton to="/" variant="outline">Start a conversation</UiButton>
    </OrbitEmptyState>
    <UiDialog v-model:open="renaming">
      <UiDialogContent>
        <UiDialogHeader>
          <UiDialogTitle>Give it a name</UiDialogTitle>
          <UiDialogDescription>Make this conversation easier to find later.</UiDialogDescription>
        </UiDialogHeader>
        <form class="space-y-4" @submit.prevent="saveName">
          <div class="space-y-2">
            <UiLabel for="conversation-name">Conversation name</UiLabel>
            <UiInput id="conversation-name" v-model="name" :maxlength="100" />
          </div>
          <UiDialogFooter>
            <UiButton type="submit" :disabled="!name.trim()">Save name</UiButton>
          </UiDialogFooter>
        </form>
      </UiDialogContent>
    </UiDialog>
    <UiAlertDialog v-model:open="deleting">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>Delete this conversation?</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            This removes it and its local attachments from this browser.
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel>Keep conversation</UiAlertDialogCancel>
          <UiAlertDialogAction
            variant="destructive"
            @click="selected && deleteConversation(selected.id)"
            >Delete conversation</UiAlertDialogAction
          >
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  </div>
</template>
