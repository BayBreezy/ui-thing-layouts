<script setup lang="ts">
  import { groupSchema } from "#shared/schemas";
  import type { Group } from "#shared/types";
  import { groupColors, groupIcons } from "#shared/types";
  import { clone, groupColorClasses, newGroup } from "~/utils/demo";
  const props = defineProps<{ group?: Group }>();
  const open = defineModel<boolean>("open", { default: false });
  const emit = defineEmits<{ saved: [Group] }>();
  const uid = useId();
  const { saveGroup } = useDemo();
  const { pending, error, run } = useAction();
  const form = ref(newGroup());
  const message = ref("");
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
        <div class="space-y-2">
          <UiLabel :for="`${uid}-icon`">Icon</UiLabel>
          <UiNativeSelect :id="`${uid}-icon`" v-model="form.icon">
            <option v-for="icon in groupIcons" :key="icon" :value="icon">{{ icon }}</option>
          </UiNativeSelect>
        </div>
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
