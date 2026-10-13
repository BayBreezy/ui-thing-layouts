<script setup lang="ts">
  import { primaryEmail, primaryPhone } from "#shared/contacts";
  import { mergeContacts, type DuplicatePair } from "#shared/duplicates";
  const props = defineProps<{ pair: DuplicatePair | null }>();
  const open = defineModel<boolean>("open", { default: false });
  const { merge, nameOf } = useDemo();
  const { pending, error, run } = useAction();
  const keep = ref<"a" | "b">("a");
  watch(open, (value) => {
    if (value) {
      keep.value = "a";
      error.value = "";
    }
  });
  const primary = computed(() => (keep.value === "a" ? props.pair?.a : props.pair?.b));
  const secondary = computed(() => (keep.value === "a" ? props.pair?.b : props.pair?.a));
  const preview = computed(() =>
    primary.value && secondary.value
      ? mergeContacts(primary.value, secondary.value, new Date().toISOString())
      : null
  );
  async function confirm() {
    if (!primary.value || !secondary.value) return;
    const merged = await run(() => merge(primary.value!, secondary.value!));
    if (merged) {
      useSonner.success(`Merged into ${nameOf(merged)}`);
      open.value = false;
    }
  }
</script>
<template>
  <UiDialog v-model:open="open">
    <UiDialogContent class="sm:max-w-2xl">
      <UiDialogHeader>
        <UiDialogTitle>Merge duplicates</UiDialogTitle>
        <UiDialogDescription>
          Choose which record to keep. Missing details are filled in from the other, and its history
          and follow-ups move over.
        </UiDialogDescription>
      </UiDialogHeader>
      <div v-if="pair" class="space-y-5">
        <fieldset class="grid gap-3 sm:grid-cols-2">
          <legend class="sr-only">Record to keep</legend>
          <label
            v-for="side in ['a', 'b'] as const"
            :key="side"
            class="flex cursor-pointer gap-3 rounded-lg border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
          >
            <input
              v-model="keep"
              type="radio"
              name="keep"
              :value="side"
              class="mt-1 accent-[var(--primary)]"
            />
            <span class="min-w-0 text-sm">
              <span class="block font-medium">{{ nameOf(pair[side]) }}</span>
              <span class="block truncate text-muted-foreground">{{
                pair[side].company || "No company"
              }}</span>
              <span class="block truncate text-muted-foreground">{{
                primaryEmail(pair[side]) || "No email"
              }}</span>
              <span class="block text-muted-foreground">{{
                primaryPhone(pair[side]) || "No phone"
              }}</span>
            </span>
          </label>
        </fieldset>
        <div v-if="preview" class="rounded-lg bg-muted p-4 text-sm" aria-live="polite">
          <p class="mb-2 font-medium">The merged contact will have</p>
          <ul class="space-y-1 text-muted-foreground">
            <li>Name: {{ nameOf(preview) }}</li>
            <li>
              {{ preview.emails.length }} {{ preview.emails.length === 1 ? "email" : "emails" }},
              {{ preview.phones.length }}
              {{ preview.phones.length === 1 ? "phone number" : "phone numbers" }}
            </li>
            <li>
              {{ preview.groupIds.length }}
              {{ preview.groupIds.length === 1 ? "group" : "groups" }}, {{ preview.labels.length }}
              {{ preview.labels.length === 1 ? "label" : "labels" }}
            </li>
          </ul>
        </div>
        <VerdantError :message="error" />
      </div>
      <UiDialogFooter>
        <UiButton variant="outline" @click="open = false">Cancel</UiButton>
        <UiButton :loading="pending" @click="confirm">Merge contacts</UiButton>
      </UiDialogFooter>
    </UiDialogContent>
  </UiDialog>
</template>
