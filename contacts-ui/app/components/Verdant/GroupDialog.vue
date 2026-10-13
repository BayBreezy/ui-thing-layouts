<script setup lang="ts">
  import { groupSchema } from "#shared/schemas";
  import type { Group, GroupIcon } from "#shared/types";
  import { groupColors, groupIcons } from "#shared/types";
  import { clone, groupColorClasses, groupIconNames, newGroup } from "~/utils/demo";
  const props = defineProps<{ group?: Group }>();
  const open = defineModel<boolean>("open", { default: false });
  const emit = defineEmits<{ saved: [Group] }>();
  const uid = useId();
  const { saveGroup } = useDemo();
  const { pending, error, run } = useAction();
  const form = ref(newGroup());
  const message = ref("");
  const iconLabel = (icon: string) => icon.replace(/-\d+$/, "").replace(/-/g, " ");
  watch(open, (value) => {
    if (value) {
      form.value = props.group ? clone(props.group) : newGroup();
      message.value = "";
      error.value = "";
    }
  });
  async function submit() {
    message.value = "";
    try {
      await groupSchema.validate(form.value);
    } catch (cause) {
      message.value = (cause as Error).message;
      return;
    }
    const saved = await run(() => saveGroup(clone(form.value)));
    if (saved) {
      useSonner.success(props.group ? "Group updated" : "Group created");
      open.value = false;
      emit("saved", saved);
    }
  }
</script>
<template>
  <UiDialog v-model:open="open">
    <UiDialogContent class="sm:max-w-md">
      <UiDialogHeader>
        <UiDialogTitle>{{ group ? "Edit group" : "New group" }}</UiDialogTitle>
        <UiDialogDescription>
          Groups keep related people together, like family or clients.
        </UiDialogDescription>
      </UiDialogHeader>
      <form id="group-form" class="space-y-4" novalidate @submit.prevent="submit">
        <div class="space-y-2">
          <UiLabel :for="`${uid}-name`">Name</UiLabel>
          <UiInput :id="`${uid}-name`" v-model="form.name" placeholder="Neighbors" />
        </div>
        <div class="space-y-2">
          <UiLabel :for="`${uid}-desc`">Description</UiLabel>
          <UiTextarea :id="`${uid}-desc`" v-model="form.description" :rows="2" />
        </div>
        <fieldset class="space-y-2">
          <legend class="text-sm font-medium">Color</legend>
          <div class="flex flex-wrap gap-2">
            <label
              v-for="color in groupColors"
              :key="color"
              class="relative cursor-pointer rounded-full"
            >
              <input
                v-model="form.color"
                type="radio"
                name="color"
                :value="color"
                class="peer sr-only"
              />
              <span
                :class="[
                  'block size-7 rounded-full ring-offset-2 ring-offset-background peer-checked:ring-2 peer-checked:ring-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring',
                  groupColorClasses[color].dot,
                ]"
              />
              <span class="sr-only">{{ color }}</span>
            </label>
          </div>
        </fieldset>
        <fieldset class="space-y-2">
          <legend class="text-sm font-medium">Icon</legend>
          <UiToggleGroup
            type="single"
            variant="outline"
            class="flex-wrap justify-start gap-1.5"
            aria-label="Icon"
            :model-value="form.icon"
            @update:model-value="(value) => value && (form.icon = value as GroupIcon)"
          >
            <UiToggleGroupItem
              v-for="icon in groupIcons"
              :key="icon"
              :value="icon"
              :icon="groupIconNames[icon]"
              variant="outline"
              :aria-label="iconLabel(icon)"
              :title="iconLabel(icon)"
              class="size-10 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            />
          </UiToggleGroup>
        </fieldset>
        <VerdantError :message="message || error" />
      </form>
      <UiDialogFooter>
        <UiButton variant="outline" type="button" @click="open = false">Cancel</UiButton>
        <UiButton type="submit" form="group-form" :loading="pending">
          {{ group ? "Save group" : "Create group" }}
        </UiButton>
      </UiDialogFooter>
    </UiDialogContent>
  </UiDialog>
</template>
