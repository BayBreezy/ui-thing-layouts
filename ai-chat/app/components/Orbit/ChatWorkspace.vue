<script setup lang="ts">
  import type { Attachment, Conversation, Message, Preferences } from "#shared/types";
  import { defaultPreferences } from "#shared/types";
  const props = defineProps<{ conversationId?: string }>();
  const { state, ready, newConversation } = useDemo();
  const route = useRoute();
  const currentId = ref(props.conversationId);
  const conversation = computed(() =>
    state.value?.conversations.find(
      (item) => item.id === currentId.value && item.workspaceId === state.value?.activeWorkspaceId
    )
  );
  const preferences = ref<Preferences>({ ...(state.value?.preferences ?? defaultPreferences) });
  const draft = ref("");
  const attachments = ref<Attachment[]>([]);
  const fileInput = ref<HTMLInputElement>();
  const busy = ref(false);
  const error = ref("");
  const preferencesOpen = ref(false);
  let controller: AbortController | undefined;
  const assistant = computed(() =>
    state.value?.assistants.find(
      (item) =>
        item.workspaceId === state.value?.activeWorkspaceId &&
        item.id === (conversation.value?.assistantId ?? route.query.assistant)
    )
  );
  watch(
    assistant,
    (value) => {
      if (value && !conversation.value)
        preferences.value = {
          ...preferences.value,
          modelId: value.modelId,
          writingStyle: value.writingStyle,
        };
    },
    { immediate: true }
  );
  watch(
    [ready, () => state.value?.preferences],
    () => {
      if (ready.value && state.value && !conversation.value)
        preferences.value = {
          ...state.value.preferences,
          ...(assistant.value
            ? { modelId: assistant.value.modelId, writingStyle: assistant.value.writingStyle }
            : {}),
        };
    },
    { immediate: true }
  );
  watch(
    conversation,
    (value) => {
      if (value) preferences.value = value.preferences;
    },
    { immediate: true }
  );
  const suggestions = [
    {
      icon: "lucide:lightbulb",
      title: "Make something better",
      description: "Find a fresh perspective on your product",
      prompt: "Help me design a more welcoming onboarding experience.",
    },
    {
      icon: "lucide:code-2",
      title: "Build with confidence",
      description: "A second pair of eyes for your code",
      prompt: "Review a Vue component for accessibility and clear state management.",
    },
    {
      icon: "lucide:pen-line",
      title: "Find the right words",
      description: "Turn a rough draft into a clear message",
      prompt: "Draft a short launch email for our new workspace.",
    },
    {
      icon: "lucide:search",
      title: "Connect the dots",
      description: "Discover the story in your research",
      prompt: "Summarize the themes from our customer interviews.",
    },
  ];
  const isHome = computed(() => route.path === "/");
  usePageSeo({
    title: () =>
      conversation.value?.title ??
      (isHome.value ? "A little space for your next big idea" : "Chat"),
    description: () =>
      isHome.value
        ? undefined
        : "Ask questions, draft ideas, and explore simulated AI replies in your Orbit workspace.",
  });
  function cancel() {
    controller?.abort();
  }
  onBeforeRouteLeave(cancel);
  onBeforeUnmount(() => {
    cancel();
    for (const file of attachments.value)
      if (file.blobId) void removeBlob(file.blobId).catch(() => {});
  });
  async function attach(event: Event) {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    for (const file of files) {
      if (attachments.value.length >= 3) {
        useSonner.error("You can attach up to three files.");
        break;
      }
      if (
        file.size > 10 * 1024 * 1024 ||
        !["image/png", "image/jpeg", "text/plain", "application/pdf"].includes(file.type)
      ) {
        useSonner.error("Choose a PNG, JPG, TXT, or PDF under 10 MB.");
        continue;
      }
      const id = crypto.randomUUID();
      try {
        await saveBlob(id, file);
      } catch {
        useSonner.warning(
          "This file is available for this visit, but couldn't be saved for next time."
        );
      }
      attachments.value.push({ id, blobId: id, name: file.name, type: file.type, size: file.size });
    }
    if (fileInput.value) fileInput.value.value = "";
  }
  function removeAttachment(id: string) {
    attachments.value = attachments.value.filter((item) => item.id !== id);
    void removeBlob(id).catch(() => {});
  }
  async function reveal(message: Message, content: string, signal: AbortSignal) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      message.content = content;
      return;
    }
    for (let end = 24; end < content.length + 24; end += 24) {
      if (signal.aborted) throw new DOMException("Stopped", "AbortError");
      message.content = content.slice(0, end);
      await new Promise<void>((resolve) => setTimeout(resolve, 16));
    }
  }
  async function send(retry = false) {
    if (!state.value || busy.value || (!retry && !draft.value.trim())) return;
    const run = new AbortController();
    controller = run;
    error.value = "";
    busy.value = true;
    let target: Conversation;
    if (conversation.value) target = conversation.value;
    else {
      target = newConversation(assistant.value);
      target.preferences = { ...preferences.value };
      currentId.value = target.id;
      preferences.value = target.preferences;
    }
    let prompt: string;
    if (retry) {
      prompt = target.messages.findLast((item) => item.role === "user")?.content ?? "";
      if (target.messages.at(-1)?.role === "assistant") target.messages.pop();
    } else {
      prompt = draft.value.trim();
      draft.value = "";
      target.messages.push({
        id: crypto.randomUUID(),
        role: "user",
        content: prompt,
        createdAt: new Date().toISOString(),
        status: "complete",
        attachments: attachments.value.length ? [...attachments.value] : undefined,
      });
      attachments.value = [];
      if (target.title === "Untitled conversation") target.title = prompt.slice(0, 60);
    }
    target.updatedAt = new Date().toISOString();
    let message: Message | undefined;
    try {
      const result = await $fetch("/api/demo/chat", {
        method: "POST",
        body: {
          prompt,
          workspaceId: target.workspaceId,
          preferences: target.preferences,
          assistant: assistant.value,
          turn: target.messages.filter((item) => item.role === "user").length - 1,
        },
        signal: run.signal,
        retry: 0,
      });
      if (run.signal.aborted) return;
      target.messages.push({ ...result.message, content: "" });
      message = target.messages.at(-1)!;
      await reveal(message, result.message.content, run.signal);
      if (!run.signal.aborted) state.value.usage.unshift(result.usage);
    } catch (cause) {
      if (run.signal.aborted) {
        if (message) message.status = "stopped";
      } else error.value = apiError(cause);
    } finally {
      if (controller === run) {
        busy.value = false;
        controller = undefined;
      }
      if (!props.conversationId && route.path === "/" && !run.signal.aborted && !error.value)
        await navigateTo(`/chat/${target.id}`);
    }
  }
  function exportConversation(format: "markdown" | "json") {
    if (!conversation.value) return;
    downloadText(
      `orbit-conversation.${format === "json" ? "json" : "md"}`,
      format === "json"
        ? JSON.stringify(conversation.value, null, 2)
        : conversationText(conversation.value),
      format === "json" ? "application/json" : "text/markdown"
    );
  }
</script>
<template>
  <div v-if="conversationId && !conversation" class="page-shell">
    <div v-if="!ready" class="space-y-4">
      <UiSkeleton class="h-8 w-64" /><UiSkeleton class="h-48 w-full" />
    </div>
    <OrbitEmptyState
      v-else
      title="This conversation isn't here"
      description="It may belong to another workspace or browser, or have been deleted."
    >
      <UiButton to="/history" variant="outline">Browse history</UiButton>
    </OrbitEmptyState>
  </div>
  <div v-else class="flex h-full min-h-0">
    <section class="flex min-w-0 flex-1 flex-col">
      <header class="flex h-14 shrink-0 items-center justify-between gap-3 border-b px-4 md:px-6">
        <div class="flex min-w-0 items-center gap-2">
          <h1 class="truncate text-sm font-medium">
            {{ conversation?.title ?? "New conversation" }}
          </h1>
          <UiBadge v-if="assistant" variant="secondary" class="hidden sm:inline-flex">
            {{ assistant.name }}
          </UiBadge>
        </div>
        <div class="flex shrink-0 items-center gap-1">
          <UiTooltip v-if="conversation">
            <UiTooltipTrigger as-child>
              <UiButton
                size="icon-sm"
                variant="ghost"
                aria-label="Copy conversation"
                @click="copyText(conversationText(conversation))"
              >
                <Icon name="lucide:copy" />
              </UiButton>
            </UiTooltipTrigger>
            <UiTooltipContent>Copy conversation</UiTooltipContent>
          </UiTooltip>
          <UiDropdownMenu v-if="conversation">
            <UiDropdownMenuTrigger as-child>
              <UiButton variant="ghost" size="icon-sm" aria-label="Export conversation">
                <Icon name="lucide:download" />
              </UiButton>
            </UiDropdownMenuTrigger>
            <UiDropdownMenuContent>
              <UiDropdownMenuItem @select="exportConversation('markdown')">
                Download Markdown
              </UiDropdownMenuItem>
              <UiDropdownMenuItem @select="exportConversation('json')">
                Download JSON
              </UiDropdownMenuItem>
            </UiDropdownMenuContent>
          </UiDropdownMenu>
          <UiButton
            variant="ghost"
            size="icon-sm"
            aria-label="Chat preferences"
            class="xl:hidden"
            @click="preferencesOpen = true"
          >
            <Icon name="lucide:sliders-horizontal" />
          </UiButton>
        </div>
      </header>
      <div
        v-if="!conversation?.messages.length"
        class="flex min-h-0 flex-1 overflow-y-auto px-4 md:px-6"
      >
        <div
          class="mx-auto my-auto flex w-full max-w-3xl animate-in flex-col gap-6 py-8 duration-300 fade-in slide-in-from-bottom-2"
        >
          <div class="space-y-3">
            <UiFancyIcon theme="gradient" size="md" icon="lucide:orbit" />
            <h2 class="text-3xl font-semibold tracking-tight text-balance">
              Good ideas start with a conversation<span class="text-primary">.</span>
            </h2>
            <p class="max-w-md text-sm text-muted-foreground">
              A fresh perspective, a first draft, or a little help getting unstuck. What are we
              working on today?
            </p>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <UiCard
              v-for="suggestion in suggestions"
              :key="suggestion.title"
              as="button"
              type="button"
              class="cursor-pointer gap-3 py-4 text-left transition-colors outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
              @click="draft = suggestion.prompt"
            >
              <UiCardHeader class="gap-1 px-4">
                <UiFancyIcon theme="gradient" size="sm" class="mb-2" :icon="suggestion.icon" />
                <UiCardTitle as="span" class="text-sm">{{ suggestion.title }}</UiCardTitle>
                <UiCardDescription as="span">{{ suggestion.description }}</UiCardDescription>
              </UiCardHeader>
            </UiCard>
          </div>
          <UiButton
            to="/assistants"
            variant="link"
            class="w-fit px-0 text-muted-foreground hover:text-primary"
          >
            <Icon name="lucide:bot" />Or find an assistant for the job
            <Icon name="lucide:arrow-right" />
          </UiButton>
        </div>
      </div>
      <UiMessageScrollerProvider v-else :key="conversation.id" default-scroll-position="end">
        <UiMessageScroller class="min-h-0 flex-1">
          <UiMessageScrollerViewport>
            <UiMessageScrollerContent
              :aria-busy="busy"
              class="mx-auto max-w-3xl gap-6 px-4 py-6 md:px-6"
            >
              <UiMarker variant="separator">
                <UiMarkerContent>Your conversation</UiMarkerContent>
              </UiMarker>
              <UiMessageScrollerItem
                v-for="message in conversation.messages"
                :key="message.id"
                :message-id="message.id"
                :scroll-anchor="message.role === 'user'"
              >
                <UiMessage :align="message.role === 'user' ? 'end' : 'start'" class="gap-3">
                  <UiMessageAvatar v-if="message.role === 'assistant'">
                    <OrbitLogo compact class="[&_img]:size-7" />
                  </UiMessageAvatar>
                  <UiMessageContent class="max-w-full min-w-0">
                    <UiMessageHeader class="mb-1 text-xs text-muted-foreground">
                      {{ message.role === "user" ? "You" : (assistant?.name ?? "Orbit") }}
                    </UiMessageHeader>
                    <UiBubble :variant="message.role === 'user' ? 'muted' : 'ghost'">
                      <UiBubbleContent>
                        <p
                          v-if="message.role === 'user'"
                          class="text-sm leading-6 whitespace-pre-wrap"
                        >
                          {{ message.content }}
                        </p>
                        <p
                          v-else-if="busy && message.id === conversation.messages.at(-1)?.id"
                          class="text-sm leading-7 whitespace-pre-wrap"
                        >
                          {{ message.content }}
                        </p>
                        <OrbitMarkdown
                          v-else-if="message.content"
                          :value="message.content"
                          class="min-w-0"
                        />
                        <span v-else class="inline-flex gap-1 p-2" aria-label="Preparing response">
                          <span
                            v-for="dot in 3"
                            :key="dot"
                            class="size-1.5 animate-pulse rounded-full bg-muted-foreground"
                          />
                        </span>
                      </UiBubbleContent>
                    </UiBubble>
                    <UiAttachmentGroup v-if="message.attachments?.length" class="mt-3">
                      <OrbitAttachmentCard
                        v-for="file in message.attachments"
                        :key="file.id"
                        :attachment="file"
                      />
                    </UiAttachmentGroup>
                    <UiMessageFooter
                      v-if="message.role === 'assistant'"
                      class="mt-2 flex items-center gap-1"
                    >
                      <UiButton
                        size="icon-xs"
                        variant="ghost"
                        aria-label="Copy reply"
                        @click="copyText(message.content)"
                      >
                        <Icon name="lucide:copy" />
                      </UiButton>
                      <UiButton
                        size="icon-xs"
                        variant="ghost"
                        aria-label="Helpful reply"
                        :aria-pressed="message.feedback === 'up'"
                        :class="message.feedback === 'up' ? 'text-primary' : ''"
                        @click="message.feedback = message.feedback === 'up' ? undefined : 'up'"
                      >
                        <Icon name="lucide:thumbs-up" />
                      </UiButton>
                      <UiButton
                        size="icon-xs"
                        variant="ghost"
                        aria-label="Unhelpful reply"
                        :aria-pressed="message.feedback === 'down'"
                        @click="message.feedback = message.feedback === 'down' ? undefined : 'down'"
                      >
                        <Icon name="lucide:thumbs-down" />
                      </UiButton>
                      <UiButton
                        v-if="message.id === conversation.messages.at(-1)?.id"
                        size="icon-xs"
                        variant="ghost"
                        :disabled="busy"
                        aria-label="Regenerate reply"
                        @click="send(true)"
                      >
                        <Icon name="lucide:rotate-cw" />
                      </UiButton>
                      <span
                        v-if="message.status === 'stopped'"
                        class="ml-2 text-xs text-muted-foreground"
                      >
                        Stopped
                      </span>
                    </UiMessageFooter>
                  </UiMessageContent>
                </UiMessage>
              </UiMessageScrollerItem>
            </UiMessageScrollerContent>
          </UiMessageScrollerViewport>
          <UiMessageScrollerButton aria-label="Scroll to latest reply" variant="outline" />
        </UiMessageScroller>
      </UiMessageScrollerProvider>
      <div class="shrink-0 px-4 pt-3 pb-4 md:px-6">
        <div class="mx-auto max-w-3xl space-y-3">
          <UiButton
            v-if="conversation?.messages.at(-1)?.role === 'user' && !busy"
            variant="ghost"
            size="sm"
            aria-label="Regenerate reply"
            @click="send(true)"
          >
            Retry last prompt
          </UiButton>
          <UiAlert v-if="error" role="alert" variant="destructive" icon="lucide:circle-alert">
            <div class="flex items-center justify-between gap-3 text-sm">
              {{ error }}
              <UiButton variant="outline" size="xs" @click="send(true)">Retry</UiButton>
            </div>
          </UiAlert>
          <form @submit.prevent="send()">
            <UiInputGroup>
              <UiInputGroupAddon v-if="attachments.length" align="block-start">
                <UiAttachmentGroup class="w-full">
                  <OrbitAttachmentCard
                    v-for="file in attachments"
                    :key="file.id"
                    :attachment="file"
                    removable
                    @remove="removeAttachment(file.id)"
                  />
                </UiAttachmentGroup>
              </UiInputGroupAddon>
              <UiInputGroupTextarea
                v-model="draft"
                aria-label="Message Orbit"
                placeholder="Ask a question, share an idea, or just start typing…"
                :maxlength="10000"
                :disabled="busy"
                :rows="2"
                @keydown.enter="
                  if (!$event.shiftKey && !$event.isComposing) {
                    $event.preventDefault();
                    send();
                  }
                "
              />
              <UiInputGroupAddon align="block-end">
                <input
                  ref="fileInput"
                  type="file"
                  class="hidden"
                  accept="image/png,image/jpeg,text/plain,application/pdf"
                  multiple
                  @change="attach"
                />
                <UiInputGroupButton
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Attach files"
                  :disabled="busy"
                  @click="fileInput?.click()"
                >
                  <Icon name="lucide:paperclip" />
                </UiInputGroupButton>
                <OrbitModelPicker v-model="preferences.modelId" class="w-48" />
                <UiButton
                  v-if="busy"
                  variant="secondary"
                  size="sm"
                  aria-label="Stop response"
                  class="ml-auto"
                  @click="cancel"
                >
                  <Icon name="lucide:square" />Stop
                </UiButton>
                <UiButton
                  v-else
                  type="submit"
                  size="sm"
                  :disabled="!draft.trim() || !ready"
                  class="ml-auto"
                >
                  Send<Icon name="lucide:arrow-up" />
                </UiButton>
              </UiInputGroupAddon>
            </UiInputGroup>
          </form>
          <p class="text-center text-xs text-muted-foreground">
            A demo workspace with simulated AI responses. A real place to explore ideas.
          </p>
        </div>
      </div>
    </section>
    <aside class="hidden w-72 shrink-0 overflow-y-auto border-l p-6 xl:block">
      <OrbitPreferences v-model="preferences" />
    </aside>
    <UiSheet v-model:open="preferencesOpen">
      <UiSheetContent side="right" class="overflow-y-auto p-6">
        <UiSheetTitle class="sr-only">Chat preferences</UiSheetTitle>
        <UiSheetDescription class="sr-only"
          >Adjust the model and response style.</UiSheetDescription
        >
        <OrbitPreferences v-model="preferences" />
      </UiSheetContent>
    </UiSheet>
  </div>
</template>
