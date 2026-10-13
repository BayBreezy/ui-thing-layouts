<script setup lang="ts">
  import { briefSchema } from "#shared/schemas";
  import type { Brief } from "#shared/types";
  const props = defineProps<{ record: Brief }>();
  const uid = useId();
  const emit = defineEmits<{ saved: [Brief] }>();
  const form = ref(clone(props.record));
  const preview = ref(false);
  const { state, saveBrief } = useDemo();
  const { pending, error, run } = useAction();
  const { validate } = useForm();
  const { dirty, markSaved } = useUnsaved(form);
  async function submit() {
    if (!(await validate()).valid) return;
    const saved = await run(() => saveBrief(form.value));
    if (saved) {
      form.value = clone(saved);
      markSaved();
      useSonner.success("Document saved");
      emit("saved", saved);
    }
  }
</script>
<template>
  <form @submit.prevent="submit">
    <fieldset :disabled="pending" class="space-y-6">
      <UiCard>
        <UiCardHeader>
          <UiCardTitle as="h2">Campaign document</UiCardTitle>
          <UiCardDescription>Briefs, notes, and plans for your team.</UiCardDescription>
          <UiCardAction v-if="dirty">
            <UiBadge variant="outline">Unsaved changes</UiBadge>
          </UiCardAction>
        </UiCardHeader>
        <UiCardContent class="space-y-5">
          <UiVeeInput
            v-model="form.title"
            name="title"
            label="Document title"
            :rules="briefSchema.fields.title"
          />
          <div class="space-y-2">
            <UiLabel :for="`${uid}-campaign`">Campaign</UiLabel>
            <UiNativeSelect :id="`${uid}-campaign`" v-model="form.campaignId">
              <option value="">General document</option>
              <option v-for="campaign in state?.campaigns" :key="campaign.id" :value="campaign.id">
                {{ campaign.name }}
              </option>
            </UiNativeSelect>
          </div>
          <div class="flex items-center gap-3">
            <UiSwitch :id="`${uid}-favorite`" v-model="form.favorite" />
            <UiLabel :for="`${uid}-favorite`" class="font-normal">Add to favorites</UiLabel>
          </div>
          <UiSeparator />
          <div class="space-y-2">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <UiLabel for="brief-content">Content</UiLabel>
              <div class="flex gap-2">
                <UiButton
                  type="button"
                  variant="outline"
                  size="sm"
                  :aria-pressed="preview"
                  @click="preview = !preview"
                >
                  <Icon :name="preview ? 'lucide:pen-line' : 'lucide:eye'" />{{
                    preview ? "Edit Markdown" : "Preview"
                  }}
                </UiButton>
                <UiButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  @click="downloadFile('launchpad-brief.md', form.content, 'text/markdown')"
                >
                  <Icon name="lucide:download" />Export Markdown
                </UiButton>
              </div>
            </div>
            <div v-if="preview" class="min-h-80 rounded-md border p-5">
              <LaunchpadMarkdown :content="form.content || 'Your preview will appear here.'" />
            </div>
            <UiTextarea
              v-else
              id="brief-content"
              v-model="form.content"
              :rows="18"
              class="font-mono text-sm"
              placeholder="# A thoughtful campaign brief"
              required
              :maxlength="20000"
            />
            <p class="text-sm text-muted-foreground">
              Supports headings, lists, paragraphs, and fenced code. HTML and executable links are
              displayed as plain text.
            </p>
          </div>
        </UiCardContent>
      </UiCard>
      <LaunchpadError :message="error" />
      <div class="flex items-center justify-between">
        <UiButton to="/documents" variant="outline">Back to documents</UiButton>
        <UiButton type="submit" :loading="pending">Save document</UiButton>
      </div>
    </fieldset>
  </form>
</template>
