<script setup lang="ts">
  import { assistantSchema } from "#shared/schemas";
  import type { Assistant } from "#shared/types";
  const props = defineProps<{ assistant?: Assistant }>();
  const { state } = useDemo();
  const icons = [
    "lucide:code-2",
    "lucide:pen-line",
    "lucide:search",
    "lucide:chart-no-axes-combined",
    "lucide:lightbulb",
    "lucide:megaphone",
  ];
  const { handleSubmit, isSubmitting } = useForm({
    validationSchema: assistantSchema,
    initialValues: props.assistant ?? {
      id: crypto.randomUUID(),
      workspaceId: state.value?.activeWorkspaceId,
      name: "",
      description: "",
      instructions: "",
      icon: "lucide:lightbulb",
      tags: ["Product"],
      modelId: "orbit-pro",
      writingStyle: "concise",
      createdAt: new Date().toISOString(),
    },
  });
  const { value: modelId } = useField<string>("modelId");
  const { value: writingStyle } = useField<string>("writingStyle");
  const { value: icon } = useField<string>("icon");
  const { value: tags } = useField<string[]>("tags");
  const error = ref("");
  const controller = new AbortController();
  onBeforeUnmount(() => controller.abort());
  const save = handleSubmit(async (values) => {
    error.value = "";
    try {
      const assistant = await $fetch<Assistant>("/api/demo/assistants/save", {
        method: "POST",
        body: values,
        signal: controller.signal,
        retry: 0,
      });
      if (!state.value || controller.signal.aborted) return;
      const index = state.value.assistants.findIndex((item) => item.id === assistant.id);
      if (index < 0) state.value.assistants.unshift(assistant);
      else state.value.assistants[index] = assistant;
      useSonner.success("Assistant saved");
      await navigateTo("/assistants");
    } catch (err) {
      if (!controller.signal.aborted) error.value = apiError(err);
    }
  });
</script>
<template>
  <form @submit="save">
    <UiCard class="max-w-3xl">
      <UiCardContent class="space-y-6">
        <div class="space-y-2">
          <UiLabel>Icon</UiLabel>
          <div class="flex flex-wrap items-center gap-2">
            <UiButton
              v-for="item in icons"
              :key="item"
              type="button"
              size="icon"
              :variant="icon === item ? 'default' : 'outline'"
              :aria-label="item.split(':')[1]"
              :aria-pressed="icon === item"
              @click="icon = item"
            >
              <Icon :name="item" />
            </UiButton>
          </div>
        </div>
        <UiVeeInput name="name" label="Assistant name" placeholder="e.g. Product strategist" />
        <UiVeeInput
          name="description"
          label="Description"
          placeholder="What does this assistant help with?"
        />
        <UiVeeTextarea
          name="instructions"
          label="Instructions"
          :rows="5"
          placeholder="Describe the role, goals, and how this assistant should respond."
        />
        <div class="grid gap-5 sm:grid-cols-2">
          <div class="space-y-2">
            <UiLabel>Model</UiLabel>
            <OrbitModelPicker v-model="modelId" />
          </div>
          <div class="space-y-2">
            <UiLabel for="response-style">Response style</UiLabel>
            <UiSelect v-model="writingStyle">
              <UiSelectTrigger id="response-style" />
              <UiSelectContent>
                <UiSelectItem value="concise">Concise</UiSelectItem>
                <UiSelectItem value="detailed">Detailed</UiSelectItem>
                <UiSelectItem value="technical">Technical</UiSelectItem>
              </UiSelectContent>
            </UiSelect>
          </div>
        </div>
        <div class="space-y-2">
          <UiLabel>Specialties</UiLabel>
          <UiTagGroup
            v-model="tags"
            type="multiple"
            color="primary"
            aria-label="Assistant specialties"
          >
            <UiTagGroupItem
              v-for="tag in [
                'Product',
                'Design',
                'Engineering',
                'Writing',
                'Research',
                'Analytics',
              ]"
              :key="tag"
              :value="tag"
              >{{ tag }}</UiTagGroupItem
            >
          </UiTagGroup>
        </div>
        <p class="text-sm text-muted-foreground">
          Instructions and preferences select a scripted demo response. No external model is called.
        </p>
        <p v-if="error" role="alert" class="text-sm text-destructive">{{ error }}</p>
      </UiCardContent>
      <UiCardFooter class="gap-2">
        <UiButton type="submit" :loading="isSubmitting">Save assistant</UiButton>
        <UiButton variant="outline" to="/assistants">Cancel</UiButton>
      </UiCardFooter>
    </UiCard>
  </form>
</template>
