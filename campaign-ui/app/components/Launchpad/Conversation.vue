<script setup lang="ts">
  import type { Thread } from "#shared/types";
  const props = defineProps<{ thread: Thread }>();
  const { state, sendMessage } = useDemo();
  const text = ref("");
  const { pending, error, run } = useAction();
  const { markSaved } = useUnsaved(text);
  const member = (id: string) => state.value?.members.find((m) => m.id === id);
  async function send() {
    if (!text.value.trim() || pending.value) return;
    const result = await run(async () => {
      await sendMessage(props.thread, text.value);
      return true;
    });
    if (result) {
      text.value = "";
      markSaved();
    }
  }
</script>
<template>
  <UiCard class="gap-0 overflow-hidden py-0">
    <UiMessageScrollerProvider :key="thread.id" default-scroll-position="end">
      <UiMessageScroller class="h-[28rem] max-h-[60vh]">
        <UiMessageScrollerViewport>
          <UiMessageScrollerContent :aria-busy="pending" class="gap-6 p-4 md:p-6">
            <UiMarker variant="separator">
              <UiMarkerContent>Team conversation</UiMarkerContent>
            </UiMarker>
            <UiMessageScrollerItem
              v-for="message in thread.messages"
              :key="message.id"
              :message-id="message.id"
            >
              <UiMessage
                :align="message.memberId === state?.profile.id ? 'end' : 'start'"
                class="gap-3"
              >
                <UiMessageAvatar v-if="message.memberId !== state?.profile.id">
                  <LaunchpadAvatar :member="member(message.memberId)" />
                </UiMessageAvatar>
                <UiMessageContent class="max-w-full min-w-0">
                  <UiMessageHeader
                    class="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
                  >
                    <span class="font-medium text-foreground">{{
                      member(message.memberId)?.name
                    }}</span>
                    <span>{{ dateLabel(message.createdAt) }}</span>
                    <UiBadge v-if="message.simulated" variant="outline">Simulated teammate</UiBadge>
                  </UiMessageHeader>
                  <UiBubble :variant="message.memberId === state?.profile.id ? 'default' : 'muted'">
                    <UiBubbleContent>
                      <p class="text-sm leading-6 whitespace-pre-wrap">{{ message.content }}</p>
                    </UiBubbleContent>
                  </UiBubble>
                </UiMessageContent>
              </UiMessage>
            </UiMessageScrollerItem>
          </UiMessageScrollerContent>
        </UiMessageScrollerViewport>
        <UiMessageScrollerButton aria-label="Scroll to latest message" variant="outline" />
      </UiMessageScroller>
    </UiMessageScrollerProvider>
    <form class="space-y-3 border-t p-4" @submit.prevent="send">
      <LaunchpadError :message="error" />
      <UiInputGroup>
        <UiInputGroupTextarea
          v-model="text"
          aria-label="Message your team"
          placeholder="Share an update, a thought, or a little feedback…"
          :rows="2"
          :maxlength="3000"
          :disabled="pending"
          @keydown.enter="
            if (!$event.shiftKey && !$event.isComposing) {
              $event.preventDefault();
              send();
            }
          "
        />
        <UiInputGroupAddon align="block-end">
          <span class="text-xs font-normal text-muted-foreground">
            Demo conversation · your message stays local
          </span>
          <UiButton
            type="submit"
            size="sm"
            class="ml-auto"
            aria-label="Send message"
            :loading="pending"
            :disabled="!text.trim()"
          >
            Send<Icon name="lucide:arrow-up" />
          </UiButton>
        </UiInputGroupAddon>
      </UiInputGroup>
    </form>
  </UiCard>
</template>
