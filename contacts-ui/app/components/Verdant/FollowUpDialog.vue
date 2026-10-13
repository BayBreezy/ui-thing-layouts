<script setup lang="ts">
  import { followUpSchema } from "#shared/schemas";
  import { priorities } from "#shared/types";
  import { clone, newFollowUp } from "~/utils/demo";
  const props = defineProps<{ contactId?: string }>();
  const open = defineModel<boolean>("open", { default: false });
  const uid = useId();
  const { state, nameOf, saveFollowUp } = useDemo();
  const { pending, error, run } = useAction();
  const form = ref(newFollowUp(props.contactId));
  const message = ref("");
  const contacts = computed(() =>
    (state.value?.contacts ?? [])
      .filter((item) => !item.archived)
      .sort((a, b) => nameOf(a).localeCompare(nameOf(b)))
  );
  watch(open, (value) => {
    if (value) {
      form.value = newFollowUp(props.contactId ?? "");
      message.value = "";
      error.value = "";
    }
  });
  async function submit() {
    message.value = "";
    if (!form.value.contactId) {
      message.value = "Choose who this follow-up is for";
      return;
    }
    try {
      await followUpSchema.validate(form.value, { abortEarly: true });
    } catch (cause) {
      message.value = (cause as Error).message;
      return;
    }
    const saved = await run(() => saveFollowUp(clone(form.value)));
    if (saved) {
      useSonner.success("Follow-up added");
      open.value = false;
    }
  }
</script>
<template>
  <UiDialog v-model:open="open">
    <UiDialogContent class="sm:max-w-md">
      <UiDialogHeader>
        <UiDialogTitle>New follow-up</UiDialogTitle>
        <UiDialogDescription>A reminder to get back in touch.</UiDialogDescription>
      </UiDialogHeader>
      <form id="follow-up-form" class="space-y-4" novalidate @submit.prevent="submit">
        <div class="space-y-2">
          <UiLabel :for="`${uid}-title`">What do you need to do?</UiLabel>
          <UiInput :id="`${uid}-title`" v-model="form.title" placeholder="Send the proposal" />
        </div>
        <div v-if="!contactId" class="space-y-2">
          <UiLabel :for="`${uid}-contact`">Contact</UiLabel>
          <VerdantContactPicker
            :id="`${uid}-contact`"
            v-model="form.contactId"
            :contacts="contacts"
            placeholder="Search for a contact…"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <UiLabel :for="`${uid}-due`">Due date</UiLabel>
            <UiInput :id="`${uid}-due`" v-model="form.dueDate" type="date" />
          </div>
          <div class="space-y-2">
            <UiLabel :for="`${uid}-priority`">Priority</UiLabel>
            <UiNativeSelect :id="`${uid}-priority`" v-model="form.priority">
              <option v-for="item in priorities" :key="item">{{ item }}</option>
            </UiNativeSelect>
          </div>
        </div>
        <VerdantError :message="message || error" />
      </form>
      <UiDialogFooter>
        <UiButton variant="outline" type="button" @click="open = false">Cancel</UiButton>
        <UiButton type="submit" form="follow-up-form" :loading="pending">Add follow-up</UiButton>
      </UiDialogFooter>
    </UiDialogContent>
  </UiDialog>
</template>
