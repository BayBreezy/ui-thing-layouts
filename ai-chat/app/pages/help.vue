<script setup lang="ts">
  usePageSeo({
    title: "Help centre",
    description:
      "Answers about the Orbit demo: where data is saved, how simulated AI works, microphone access, exports, and keyboard shortcuts.",
  });
  const query = ref("");
  const faqs = [
    {
      q: "Is this connected to a real AI model?",
      a: "Orbit is a portfolio demo. Fictional models return handwritten, scripted replies influenced by your prompt and preferences. No external AI service is called.",
    },
    {
      q: "Where are my conversations saved?",
      a: "In this browser’s localStorage. Recordings and attachments use IndexedDB. If storage is unavailable, your active session continues in memory and a save warning appears.",
    },
    {
      q: "Do I need an account?",
      a: "No. Continue demo gives you immediate access. Login and signup simulate an identity without creating an account or storing passwords.",
    },
    {
      q: "Why doesn’t the transcript match my recording?",
      a: "Transcription is simulated. It returns a scripted discovery conversation and sends only metadata. Audio is never uploaded or recognized.",
    },
    {
      q: "What if microphone access is denied?",
      a: "Use the bundled sample in Audio studio or type in Real-time. Check browser permissions if you want to record. Microphone tracks are released when recording stops or you leave the page.",
    },
    {
      q: "Can I take my work with me?",
      a: "Use Markdown or JSON exports in History, transcript downloads in Audio and Real-time, CSV export in Metrics, or the complete text-data export in Settings. Media blobs are not included in JSON exports.",
    },
    {
      q: "How do I restore the original examples?",
      a: "Open Settings and choose Reset demo. Confirming removes local edits and media, then restores the seeded workspace.",
    },
    {
      q: "What keyboard shortcuts are available?",
      a: "Command/Ctrl + K opens workspace search. N opens a new conversation outside text fields. Enter sends a chat message; Shift + Enter adds a line. Tab moves through controls.",
    },
  ];
  const results = computed(() =>
    faqs.filter((item) => `${item.q} ${item.a}`.toLowerCase().includes(query.value.toLowerCase()))
  );
  const items = computed(() =>
    results.value.map((item) => ({ value: item.q, title: item.q, content: item.a }))
  );
</script>
<template>
  <div class="page-shell max-w-4xl">
    <OrbitPageHeader
      title="We’ve got a little guidance"
      description="Answers to the questions you might be thinking about."
    />
    <UiInput
      v-model="query"
      aria-label="Search FAQs"
      placeholder="Search for an answer…"
      class="mb-6 max-w-md"
    />
    <UiCard v-if="results.length" class="py-2">
      <UiCardContent>
        <UiAccordion :items="items">
          <template #content="{ item }">
            <UiAccordionContent class="text-muted-foreground">{{
              item.content
            }}</UiAccordionContent>
          </template>
        </UiAccordion>
      </UiCardContent>
    </UiCard>
    <OrbitEmptyState
      v-else
      title="No answers found"
      description="Try another search or explore the guides."
      icon="lucide:circle-help"
    />
    <div class="mt-6 flex flex-wrap gap-3">
      <UiButton to="/docs" variant="outline"
        ><Icon name="lucide:book-open" />Read the guides</UiButton
      >
      <UiButton to="/community" variant="ghost">
        Explore resources <Icon name="lucide:arrow-up-right" />
      </UiButton>
    </div>
  </div>
</template>
