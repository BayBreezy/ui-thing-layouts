<script setup lang="ts">
  import { addDays, isOverdue } from "#shared/contacts";
  import type { FollowUp } from "#shared/types";
  import { relativeDay, today } from "~/utils/demo";
  defineProps<{ items: FollowUp[]; showContact?: boolean }>();
  const { state, nameOf, saveFollowUp, deleteFollowUp } = useDemo();
  const { error, run } = useAction();
  const contactFor = (id: string) => state.value?.contacts.find((item) => item.id === id);
  const priorityClass = {
    high: "text-destructive",
    medium: "text-amber-700 dark:text-amber-400",
    low: "text-muted-foreground",
  };
  async function toggle(item: FollowUp, done: boolean) {
    const saved = await run(() => saveFollowUp({ ...item, done }));
    if (saved && done) useSonner.success("Marked as done");
  }
  async function snooze(item: FollowUp) {
    const from = item.dueDate < today ? today : item.dueDate;
    const saved = await run(() => saveFollowUp({ ...item, dueDate: addDays(from, 7) }));
    if (saved) useSonner.success("Pushed back a week");
  }
  async function remove(item: FollowUp) {
    await run(() => deleteFollowUp(item.id));
  }
</script>
<template>
  <div>
    <VerdantError :message="error" />
    <ul v-if="items.length" class="divide-y rounded-lg border">
      <li v-for="item in items" :key="item.id" class="flex flex-wrap items-center gap-3 p-3">
        <UiCheckbox
          :model-value="item.done"
          :aria-label="`Mark “${item.title}” as ${item.done ? 'not done' : 'done'}`"
          @update:model-value="toggle(item, $event === true)"
        />
        <div class="min-w-0 flex-1">
          <p :class="['text-sm font-medium', item.done && 'text-muted-foreground line-through']">
            {{ item.title }}
          </p>
          <p class="text-xs text-muted-foreground">
            <template v-if="showContact && contactFor(item.contactId)">
              <NuxtLink
                :to="'/contacts/' + item.contactId"
                class="text-foreground underline underline-offset-4 hover:text-primary"
                >{{ nameOf(contactFor(item.contactId)!) }}</NuxtLink
              >
              ·
            </template>
            <span :class="isOverdue(item, today) && 'font-medium text-destructive'">
              {{ isOverdue(item, today) ? "Overdue · " : "" }}{{ relativeDay(item.dueDate) }}
            </span>
            ·
            <span :class="priorityClass[item.priority]">{{ item.priority }} priority</span>
          </p>
        </div>
        <div class="flex items-center gap-1">
          <UiButton
            v-if="!item.done"
            variant="ghost"
            size="sm"
            :aria-label="`Snooze “${item.title}” for a week`"
            @click="snooze(item)"
          >
            <Icon name="lucide:alarm-clock" />Snooze
          </UiButton>
          <UiButton
            variant="ghost"
            size="icon-sm"
            :aria-label="`Delete “${item.title}”`"
            @click="remove(item)"
          >
            <Icon name="lucide:trash-2" />
          </UiButton>
        </div>
      </li>
    </ul>
  </div>
</template>
