<script setup lang="ts">
  import { interactionSchema } from "#shared/schemas";
  import type { Contact } from "#shared/types";
  import { interactionTypes } from "#shared/types";
  import { clone, interactionIcons, newInteraction, relativeDay } from "~/utils/demo";
  const props = defineProps<{ contact: Contact }>();
  const uid = useId();
  const { state, logInteraction, deleteInteraction } = useDemo();
  const { pending, error, run } = useAction();
  const form = ref(newInteraction(props.contact.id));
  const message = ref("");
  const items = computed(() =>
    (state.value?.interactions ?? [])
      .filter((item) => item.contactId === props.contact.id)
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
  );
  async function submit() {
    message.value = "";
    const record = { ...clone(form.value), occurredAt: new Date().toISOString() };
    try {
      await interactionSchema.validate(record);
    } catch (cause) {
      message.value = (cause as Error).message;
      return;
    }
    const saved = await run(() => logInteraction(record));
    if (saved) {
      useSonner.success("Logged");
      form.value = newInteraction(props.contact.id);
    }
  }
</script>
<template>
  <div class="space-y-6">
    <UiCard>
      <UiCardHeader>
        <UiCardTitle as="h2">Log an interaction</UiCardTitle>
        <UiCardDescription>
          Keep a short record of calls, emails and meetings so nothing slips.
        </UiCardDescription>
      </UiCardHeader>
      <UiCardContent>
        <form class="space-y-4" novalidate @submit.prevent="submit">
          <div class="grid gap-4 @xl:grid-cols-[10rem_1fr]">
            <div class="space-y-2">
              <UiLabel :for="`${uid}-type`">Type</UiLabel>
              <UiNativeSelect :id="`${uid}-type`" v-model="form.type">
                <option v-for="type in interactionTypes" :key="type" :value="type">
                  {{ type[0]!.toUpperCase() + type.slice(1) }}
                </option>
              </UiNativeSelect>
            </div>
            <div class="space-y-2">
              <UiLabel :for="`${uid}-summary`">What happened?</UiLabel>
              <UiInput
                :id="`${uid}-summary`"
                v-model="form.summary"
                placeholder="Talked through the renewal and next steps"
              />
            </div>
          </div>
          <VerdantError :message="message || error" />
          <UiButton type="submit" :loading="pending"><Icon name="lucide:plus" />Log it</UiButton>
        </form>
      </UiCardContent>
    </UiCard>
    <section aria-labelledby="timeline-heading">
      <h2 id="timeline-heading" class="mb-3 text-sm font-medium">History</h2>
      <ol v-if="items.length" class="space-y-3 border-l pl-6">
        <li v-for="item in items" :key="item.id" class="relative">
          <span
            class="absolute top-0.5 -left-[2.1rem] flex size-7 items-center justify-center rounded-full border bg-background"
          >
            <Icon :name="interactionIcons[item.type]" class="size-3.5 text-primary" />
          </span>
          <div class="flex items-start gap-2">
            <div class="flex-1">
              <p class="text-sm">{{ item.summary }}</p>
              <p class="text-xs text-muted-foreground">
                <span class="capitalize">{{ item.type }}</span> · {{ relativeDay(item.occurredAt) }}
              </p>
            </div>
            <UiButton
              variant="ghost"
              size="icon-sm"
              :aria-label="`Delete ${item.type} from ${relativeDay(item.occurredAt)}`"
              @click="run(() => deleteInteraction(item.id))"
            >
              <Icon name="lucide:trash-2" />
            </UiButton>
          </div>
        </li>
      </ol>
      <VerdantEmpty
        v-else
        title="No history yet"
        description="Log your first call, email or meeting above."
        icon="lucide:history"
      />
    </section>
  </div>
</template>
