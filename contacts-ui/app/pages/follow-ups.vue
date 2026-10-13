<script setup lang="ts">
  import { addDays } from "#shared/contacts";
  import { today } from "~/utils/demo";
  usePageSeo({ title: "Follow-ups" });
  const { state } = useDemo();
  const dialog = ref(false);
  const all = computed(() => state.value?.followUps ?? []);
  const sorted = (items: typeof all.value) =>
    [...items].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const overdue = computed(() => sorted(all.value.filter((i) => !i.done && i.dueDate < today)));
  const dueToday = computed(() => sorted(all.value.filter((i) => !i.done && i.dueDate === today)));
  const upcoming = computed(() => sorted(all.value.filter((i) => !i.done && i.dueDate > today)));
  const done = computed(() =>
    sorted(all.value.filter((i) => i.done))
      .reverse()
      .slice(0, 20)
  );
  const week = computed(() => upcoming.value.filter((i) => i.dueDate <= addDays(today, 7)).length);
  const sections = computed(() => [
    { id: "overdue", title: "Overdue", items: overdue.value, tone: "text-destructive" },
    { id: "today", title: "Due today", items: dueToday.value, tone: "" },
    { id: "upcoming", title: "Upcoming", items: upcoming.value, tone: "" },
    { id: "done", title: "Recently completed", items: done.value, tone: "text-muted-foreground" },
  ]);
</script>
<template>
  <div class="page-shell">
    <VerdantPageHeader
      title="Follow-ups"
      description="The little nudges that keep relationships warm."
    >
      <UiButton @click="dialog = true"><Icon name="lucide:calendar-plus" />New follow-up</UiButton>
    </VerdantPageHeader>
    <p class="mb-6 text-sm text-muted-foreground" role="status">
      {{ overdue.length }} overdue · {{ dueToday.length }} due today · {{ week }} due in the next 7
      days
    </p>
    <div class="space-y-8">
      <section
        v-for="section in sections"
        :key="section.id"
        :aria-labelledby="'section-' + section.id"
      >
        <h2 :id="'section-' + section.id" :class="['mb-3 text-sm font-semibold', section.tone]">
          {{ section.title }}
          <span class="font-normal text-muted-foreground">({{ section.items.length }})</span>
        </h2>
        <VerdantFollowUpList v-if="section.items.length" :items="section.items" show-contact />
        <p v-else class="text-sm text-muted-foreground">
          {{
            section.id === "overdue"
              ? "Nothing is overdue. Nicely done."
              : section.id === "today"
                ? "Nothing due today."
                : section.id === "upcoming"
                  ? "No upcoming follow-ups. Add one to stay on top of things."
                  : "Completed follow-ups will show up here."
          }}
        </p>
      </section>
    </div>
    <VerdantFollowUpDialog v-model:open="dialog" />
  </div>
</template>
