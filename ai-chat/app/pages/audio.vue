<script setup lang="ts">
  import type { Recording, TranscriptSegment } from "#shared/types";
  usePageSeo({
    title: "Audio studio",
    description:
      "Record up to 60 seconds of audio in your browser, then run a simulated transcription. Nothing is uploaded.",
  });
  const { state, ready, storageWarning } = useDemo();
  const recorder = useRecorder();
  const {
    recording,
    requesting,
    duration,
    error: recordingError,
    blob,
    url,
    start,
    stop,
  } = recorder;
  const selected = ref<Recording>();
  const playbackUrl = ref("");
  const player = useTemplateRef<HTMLAudioElement>("player");
  const busy = ref(false);
  const error = ref("");
  let controller: AbortController | undefined;
  let selectionVersion = 0;
  const recordings = computed(
    () =>
      state.value?.recordings.filter(
        (item) => item.workspaceId === state.value?.activeWorkspaceId
      ) ?? []
  );
  const transcriptText = computed(
    () =>
      selected.value?.transcript
        ?.map((segment) => `[${time(segment.start)}] ${segment.speaker}: ${segment.text}`)
        .join("\n\n") ?? ""
  );
  function time(seconds: number) {
    return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0")}`;
  }
  async function select(item: Recording) {
    controller?.abort();
    busy.value = false;
    error.value = "";
    const version = ++selectionVersion;
    player.value?.pause();
    if (playbackUrl.value.startsWith("blob:")) URL.revokeObjectURL(playbackUrl.value);
    playbackUrl.value = "";
    selected.value = item;
    if (item.sampleUrl) playbackUrl.value = item.sampleUrl;
    else if (item.blobId) {
      try {
        const saved = await loadBlob(item.blobId);
        if (version !== selectionVersion) return;
        if (saved) playbackUrl.value = URL.createObjectURL(saved);
        else error.value = "The local audio file is unavailable. Choose the sample to continue.";
      } catch {
        error.value = "Browser media storage is unavailable. Choose the sample to continue.";
      }
    }
  }
  watch(
    [ready, () => state.value?.activeWorkspaceId],
    () => {
      if (ready.value && recordings.value[0]) void select(recordings.value[0]);
    },
    { immediate: true }
  );
  watch(blob, async (value) => {
    if (!value || !state.value) return;
    const id = crypto.randomUUID();
    const workspaceId = state.value.activeWorkspaceId;
    const item: Recording = {
      id,
      blobId: id,
      workspaceId,
      name: `Voice note ${recordings.value.length + 1}`,
      duration: duration.value,
      mimeType: value.type,
      createdAt: new Date().toISOString(),
    };
    try {
      await saveBlob(id, value);
    } catch {
      storageWarning.value =
        "This recording is available for this session. Browser media storage could not save it.";
    }
    state.value.recordings.unshift(item);
    if (workspaceId === state.value.activeWorkspaceId) await select(state.value.recordings[0]!);
  });
  async function transcribe() {
    const target = selected.value;
    if (!target || busy.value) return;
    busy.value = true;
    error.value = "";
    controller = new AbortController();
    const signal = controller.signal;
    try {
      const result = await $fetch<{ segments: TranscriptSegment[] }>("/api/demo/audio/transcribe", {
        method: "POST",
        body: {
          name: target.name,
          duration: target.duration,
          mimeType: target.mimeType,
          workspaceId: target.workspaceId,
        },
        signal,
        retry: 0,
      });
      if (signal.aborted) return;
      target.transcript = result.segments;
      state.value?.usage.unshift({
        id: crypto.randomUUID(),
        workspaceId: target.workspaceId,
        modelId: "orbit-fast",
        source: "audio",
        tokens: 180,
        cost: 0.00036,
        latencyMs: 300,
        createdAt: new Date().toISOString(),
      });
      useSonner.success("Demo transcript ready");
    } catch (err) {
      if (!signal.aborted) error.value = apiError(err);
    } finally {
      if (!signal.aborted) busy.value = false;
    }
  }
  function remove(item: Recording) {
    if (!state.value) return;
    if (item.blobId) void removeBlob(item.blobId).catch(() => {});
    state.value.recordings = state.value.recordings.filter((record) => record.id !== item.id);
    if (selected.value?.id === item.id) {
      selected.value = undefined;
      player.value?.pause();
      if (playbackUrl.value.startsWith("blob:")) URL.revokeObjectURL(playbackUrl.value);
      playbackUrl.value = "";
    }
  }
  onBeforeRouteLeave(() => {
    controller?.abort();
    player.value?.pause();
  });
  onBeforeUnmount(() => {
    selectionVersion++;
    controller?.abort();
    player.value?.pause();
    if (playbackUrl.value.startsWith("blob:")) URL.revokeObjectURL(playbackUrl.value);
  });
</script>
<template>
  <div class="page-shell">
    <OrbitPageHeader
      title="Audio studio"
      description="Capture a thought. Find the useful parts. Keep the conversation going."
    />
    <div class="grid items-start gap-6 lg:grid-cols-3">
      <div class="space-y-6 lg:col-span-2">
        <UiCard>
          <UiCardHeader>
            <UiCardTitle as="h2">Your voice, your device</UiCardTitle>
            <UiCardDescription
              >Record up to 60 seconds. Audio stays in your browser.</UiCardDescription
            >
            <UiCardAction>
              <UiFancyIcon theme="gradient" size="sm" icon="lucide:mic" />
            </UiCardAction>
          </UiCardHeader>
          <UiCardContent class="space-y-6">
            <div class="flex h-16 items-center justify-center gap-1" aria-hidden="true">
              <span
                v-for="i in 42"
                :key="i"
                class="w-1 rounded-full"
                :class="recording ? 'bg-primary motion-safe:animate-pulse' : 'bg-primary/20'"
                :style="{ height: `${10 + ((i * 17) % 44)}px`, animationDelay: `${i * 30}ms` }"
              />
            </div>
            <div class="flex flex-wrap items-center justify-center gap-3">
              <UiButton v-if="recording" variant="destructive" @click="stop">
                <Icon name="lucide:square" />Stop recording · {{ time(duration) }}
              </UiButton>
              <UiButton v-else :loading="requesting" @click="start">
                <Icon name="lucide:mic" />Record audio
              </UiButton>
              <UiButton
                variant="outline"
                :disabled="recording || !recordings.some((item) => item.sampleUrl)"
                @click="select(recordings.find((item) => item.sampleUrl)!)"
              >
                Try sample audio
              </UiButton>
            </div>
            <p v-if="recordingError" role="alert" class="text-center text-sm text-destructive">
              {{ recordingError }}
            </p>
            <p v-if="recording" role="status" class="text-center text-sm text-muted-foreground">
              Recording… microphone is active.
            </p>
          </UiCardContent>
        </UiCard>
        <UiCard>
          <UiCardHeader>
            <UiCardTitle as="h2">{{ selected?.name ?? "Choose a recording" }}</UiCardTitle>
            <UiCardDescription>
              {{
                selected
                  ? `${time(selected.duration)} · ${selected.sampleUrl ? "Bundled sample" : "Local recording"}`
                  : "Record something or choose the sample."
              }}
            </UiCardDescription>
            <UiCardAction>
              <UiButton :disabled="!selected || recording" :loading="busy" @click="transcribe">
                <Icon name="lucide:captions" />{{
                  selected?.transcript ? "Transcribe again" : "Transcribe"
                }}
              </UiButton>
            </UiCardAction>
          </UiCardHeader>
          <UiCardContent class="space-y-4">
            <audio
              v-if="playbackUrl"
              ref="player"
              :src="playbackUrl"
              controls
              class="w-full"
              aria-label="Play selected recording"
            />
            <p class="text-sm text-muted-foreground">
              Simulated transcription: this returns a scripted discovery conversation. Your recorded
              speech is not recognized or uploaded. Only duration, name, and format are sent.
            </p>
            <p v-if="error" role="alert" class="text-sm text-destructive">{{ error }}</p>
          </UiCardContent>
        </UiCard>
        <UiCard v-if="selected?.transcript">
          <UiCardHeader>
            <UiCardTitle as="h2">Transcript</UiCardTitle>
            <UiCardAction class="flex gap-1">
              <UiButton
                variant="ghost"
                size="icon-sm"
                aria-label="Copy transcript"
                @click="copyText(transcriptText)"
              >
                <Icon name="lucide:copy" />
              </UiButton>
              <UiButton
                variant="ghost"
                size="icon-sm"
                aria-label="Download transcript"
                @click="downloadText('orbit-transcript.txt', transcriptText)"
              >
                <Icon name="lucide:download" />
              </UiButton>
            </UiCardAction>
          </UiCardHeader>
          <UiCardContent class="space-y-5">
            <div v-for="segment in selected.transcript" :key="segment.start" class="flex gap-4">
              <UiButton
                variant="link"
                size="xs"
                class="h-auto shrink-0 p-0 font-mono"
                :aria-label="`Seek to ${time(segment.start)}`"
                @click="player && (player.currentTime = segment.start)"
              >
                {{ time(segment.start) }}
              </UiButton>
              <div class="space-y-1">
                <p class="text-sm font-medium">{{ segment.speaker }}</p>
                <p class="text-sm leading-relaxed text-muted-foreground">{{ segment.text }}</p>
              </div>
            </div>
          </UiCardContent>
        </UiCard>
        <OrbitEmptyState
          v-else
          title="A transcript starts here"
          description="Choose a recording, then run the simulated transcription."
          icon="lucide:captions"
        />
      </div>
      <UiCard>
        <UiCardHeader>
          <UiCardTitle as="h2">Your recordings</UiCardTitle>
          <UiCardAction>
            <UiBadge variant="secondary">{{ recordings.length }}</UiBadge>
          </UiCardAction>
        </UiCardHeader>
        <UiCardContent class="space-y-1">
          <div v-for="item in recordings" :key="item.id" class="flex items-center gap-1">
            <UiButton
              :variant="selected?.id === item.id ? 'secondary' : 'ghost'"
              class="h-auto min-w-0 flex-1 justify-start py-2 text-left"
              @click="select(item)"
            >
              <Icon name="lucide:audio-lines" class="text-primary" />
              <span class="min-w-0">
                <span class="block truncate text-sm font-medium">{{ item.name }}</span>
                <span class="block text-xs font-normal text-muted-foreground">
                  {{ time(item.duration) }} · {{ shortDate(item.createdAt) }}
                </span>
              </span>
            </UiButton>
            <UiButton
              v-if="!item.sampleUrl"
              variant="ghost"
              size="icon-sm"
              :aria-label="`Delete ${item.name}`"
              @click="remove(item)"
            >
              <Icon name="lucide:trash-2" />
            </UiButton>
          </div>
          <p v-if="!recordings.length" class="text-sm text-muted-foreground">
            No recordings in this workspace.
          </p>
        </UiCardContent>
      </UiCard>
    </div>
  </div>
</template>
