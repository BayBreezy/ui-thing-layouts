<script setup lang="ts">
  import { defaultPreferences } from "#shared/types";
  import type { RealtimeSession, ChatResult } from "#shared/types";
  usePageSeo({
    title: "Real-time",
    description:
      "Start a scripted real-time session by typing or using your microphone. Replies are simulated and nothing is uploaded.",
  });
  const { state } = useDemo();
  const sessionId = ref("");
  const phase = ref<"idle" | "connecting" | "listening" | "thinking" | "responding">("idle");
  const prompt = ref("");
  const error = ref("");
  const speechEnabled = ref(false);
  const recorder = useRecorder();
  const { recording, requesting, error: microphoneError, blob, start: record, stop } = recorder;
  const session = computed(() => state.value?.sessions.find((item) => item.id === sessionId.value));
  const history = computed(
    () =>
      state.value?.sessions.filter((item) => item.workspaceId === state.value?.activeWorkspaceId) ??
      []
  );
  let controller: AbortController | undefined;
  let disposed = false;
  function stopSpeech() {
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  }
  async function begin() {
    if (!state.value) return;
    phase.value = "connecting";
    error.value = "";
    controller = new AbortController();
    const signal = controller.signal;
    try {
      const result = await $fetch<RealtimeSession>("/api/demo/realtime/session", {
        method: "POST",
        body: { workspaceId: state.value.activeWorkspaceId, name: "Discovery session" },
        signal,
        retry: 0,
      });
      if (signal.aborted) return;
      state.value.sessions.unshift(result);
      sessionId.value = result.id;
      phase.value = "listening";
    } catch (err) {
      if (!signal.aborted) {
        error.value = apiError(err);
        phase.value = "idle";
      }
    }
  }
  async function turn(text = prompt.value) {
    const target = session.value;
    if (!target || !text.trim() || phase.value !== "listening") return;
    stopSpeech();
    prompt.value = "";
    error.value = "";
    phase.value = "thinking";
    target.messages.push({
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
      status: "complete",
    });
    controller = new AbortController();
    const signal = controller.signal;
    try {
      const result = await $fetch<ChatResult>("/api/demo/realtime/turn", {
        method: "POST",
        body: {
          prompt: text,
          workspaceId: target.workspaceId,
          preferences: defaultPreferences,
          turn: target.messages.length,
        },
        signal,
        retry: 0,
      });
      if (signal.aborted) return;
      target.messages.push(result.message);
      state.value?.usage.unshift(result.usage);
      phase.value = "responding";
      if (speechEnabled.value && typeof speechSynthesis !== "undefined") {
        const speech = new SpeechSynthesisUtterance(
          result.message.content.replace(/[#*`]/g, "").slice(0, 1200)
        );
        speech.onend = speech.onerror = () => {
          if (!disposed && !signal.aborted) phase.value = "listening";
        };
        speechSynthesis.speak(speech);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 600));
        if (!signal.aborted) phase.value = "listening";
      }
    } catch (err) {
      if (!signal.aborted) {
        error.value = apiError(err);
        phase.value = "listening";
      }
    }
  }
  watch(blob, (value) => {
    if (value && !disposed && phase.value === "listening")
      void turn("Help me improve the onboarding experience for our product.");
  });
  function end() {
    controller?.abort();
    stop();
    stopSpeech();
    if (session.value)
      session.value.summary = `Explored ${session.value.messages.filter((item) => item.role === "user").length} ideas. Next step: test a focused onboarding improvement and measure activation.`;
    sessionId.value = "";
    phase.value = "idle";
  }
  watch(() => state.value?.activeWorkspaceId, end);
  onBeforeRouteLeave(end);
  onBeforeUnmount(() => {
    disposed = true;
    end();
  });
</script>
<template>
  <div class="page-shell">
    <OrbitPageHeader
      title="Think out loud"
      description="A space for ideas that haven’t found their words yet."
    />
    <div class="grid items-start gap-6 lg:grid-cols-3">
      <UiCard class="gap-0 overflow-hidden py-0 lg:col-span-2">
        <div class="flex flex-col items-center border-b bg-muted/30 px-6 py-10 text-center">
          <span
            class="relative flex size-24 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20"
          >
            <span
              v-if="phase !== 'idle'"
              class="absolute inset-3 rounded-full border border-primary/20 motion-safe:animate-pulse"
            />
            <Icon name="lucide:audio-lines" class="size-9 text-primary" />
          </span>
          <h2 class="mt-5 text-lg font-semibold">
            {{
              phase === "idle"
                ? "Let’s start a conversation"
                : recording
                  ? "Listening to your microphone"
                  : phase === "listening"
                    ? "Ready when you are"
                    : phase === "thinking"
                      ? "Connecting the dots…"
                      : phase === "responding"
                        ? "Orbit is responding"
                        : "Starting your session…"
            }}
          </h2>
          <p role="status" class="mt-1 text-sm text-muted-foreground">
            {{
              phase === "idle" ? "Scripted replies. Real possibilities." : `${phase} · Demo session`
            }}
          </p>
          <div class="mt-6 flex flex-wrap justify-center gap-3">
            <UiButton
              v-if="phase === 'idle' || phase === 'connecting'"
              :loading="phase === 'connecting'"
              @click="begin"
            >
              <Icon name="lucide:play" />Start session
            </UiButton>
            <template v-else>
              <UiButton v-if="recording" variant="destructive" @click="stop">
                <Icon name="lucide:square" />Stop microphone
              </UiButton>
              <UiButton
                v-else
                :loading="requesting"
                :disabled="phase !== 'listening'"
                @click="record"
              >
                <Icon name="lucide:mic" />Use microphone
              </UiButton>
              <UiButton variant="outline" @click="end">
                <Icon name="lucide:phone-off" />End session
              </UiButton>
            </template>
          </div>
          <ClientOnly>
            <div class="mt-5 flex items-center gap-2">
              <UiSwitch
                id="speech-playback"
                v-model="speechEnabled"
                @update:model-value="!$event && stopSpeech()"
              />
              <UiLabel for="speech-playback" class="text-muted-foreground">
                Play replies with browser speech
              </UiLabel>
            </div>
          </ClientOnly>
        </div>
        <div class="space-y-4 p-6">
          <p class="text-sm text-muted-foreground">
            Microphone input triggers a scripted onboarding prompt; speech is not recognized or
            uploaded. You can also type below. Browser speech playback depends on device support.
          </p>
          <div
            v-if="session?.messages.length"
            class="max-h-80 space-y-3 overflow-y-auto"
            aria-label="Session transcript"
          >
            <div
              v-for="message in session.messages"
              :key="message.id"
              class="space-y-1 rounded-lg p-4"
              :class="message.role === 'user' ? 'bg-muted' : 'border'"
            >
              <p class="text-xs font-medium text-muted-foreground">
                {{ message.role === "user" ? "You" : "Orbit" }}
              </p>
              <p class="text-sm leading-relaxed whitespace-pre-line">{{ message.content }}</p>
            </div>
          </div>
          <form class="flex gap-2" @submit.prevent="turn()">
            <UiInput
              v-model="prompt"
              aria-label="Message for real-time session"
              placeholder="What’s on your mind?"
              :disabled="!session || phase !== 'listening' || recording"
            />
            <UiButton
              type="submit"
              size="icon"
              aria-label="Send real-time message"
              :disabled="!session || phase !== 'listening' || !prompt.trim() || recording"
            >
              <Icon name="lucide:arrow-up" />
            </UiButton>
          </form>
          <p v-if="error || microphoneError" role="alert" class="text-sm text-destructive">
            {{ error || microphoneError }}
          </p>
          <UiButton
            v-if="error && session"
            variant="link"
            @click="turn(session.messages.filter((item) => item.role === 'user').at(-1)?.content)"
          >
            Retry last turn
          </UiButton>
        </div>
      </UiCard>
      <div class="space-y-6">
        <UiCard>
          <UiCardHeader>
            <UiCardTitle as="h2">Recent sessions</UiCardTitle>
          </UiCardHeader>
          <UiCardContent class="space-y-4">
            <template
              v-for="(item, index) in history.filter((item) => item.id !== sessionId).slice(0, 5)"
              :key="item.id"
            >
              <UiSeparator v-if="index" />
              <article class="space-y-2">
                <div>
                  <p class="text-sm font-medium">{{ item.name }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ shortDate(item.createdAt) }} · {{ item.messages.length }} messages
                  </p>
                </div>
                <p class="text-sm text-muted-foreground">
                  {{ item.summary || "Session ended before a summary was available." }}
                </p>
                <UiButton
                  size="sm"
                  variant="ghost"
                  @click="
                    downloadText(
                      'orbit-session.txt',
                      `${item.summary}\n\n${item.messages.map((message) => `${message.role}: ${message.content}`).join('\n\n')}`
                    )
                  "
                >
                  <Icon name="lucide:download" />Download transcript
                </UiButton>
              </article>
            </template>
          </UiCardContent>
        </UiCard>
        <UiAlert
          icon="lucide:sparkles"
          icon-class="text-primary"
          title="A conversation, on your terms"
          description="No microphone needed to get started. Type a thought and explore the same demo experience."
          class="shadow-none"
        />
      </div>
    </div>
  </div>
</template>
