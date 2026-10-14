<script setup lang="ts">
  import { goalSchema } from "#shared/schemas";
  import type { Goal } from "#shared/types";
  import { newId } from "~/utils/demo";

  const props = defineProps<{ goal?: Goal; siteId: string }>();
  const emit = defineEmits<{ saved: [goal: Goal]; cancel: [] }>();
  const { saveGoal } = useDemo();
  const { pending, error, run } = useAction();
  const uid = useId();
  const { handleSubmit, values, setFieldValue } = useForm({
    validationSchema: toTypedSchema(goalSchema),
    initialValues: {
      id: props.goal?.id ?? newId("goal"),
      siteId: props.goal?.siteId ?? props.siteId,
      name: props.goal?.name ?? "",
      kind: props.goal?.kind ?? "pageview",
      match: props.goal?.match ?? "",
    },
  });
  const submit = handleSubmit(async (goal) => {
    const saved = await run(() => saveGoal(goal as Goal));
    if (saved) {
      useSonner.success(props.goal ? "Goal updated" : "Goal added", { description: saved.name });
      emit("saved", saved);
    }
  });
</script>
<template>
  <form class="space-y-5" novalidate @submit="submit">
    <fieldset :disabled="pending" class="space-y-5">
      <UiVeeInput name="name" label="Goal name" placeholder="Started checkout" autocomplete="off" />
      <div class="space-y-1.5">
        <UiLabel :for="`${uid}-kind`">What counts as a conversion?</UiLabel>
        <UiNativeSelect
          :id="`${uid}-kind`"
          :model-value="values.kind"
          @update:model-value="setFieldValue('kind', String($event) as Goal['kind'])"
        >
          <option value="pageview">A visitor views a page</option>
          <option value="event">A custom event fires</option>
        </UiNativeSelect>
      </div>
      <UiVeeInput
        name="match"
        :label="values.kind === 'event' ? 'Event name' : 'Page path'"
        :placeholder="values.kind === 'event' ? 'newsletter_signup' : '/checkout/thanks'"
        :hint="
          values.kind === 'event'
            ? 'Lowercase letters, numbers and underscores.'
            : 'The path must match exactly, starting with a slash.'
        "
        autocomplete="off"
      />
      <BeaconError :message="error" />
      <div class="flex justify-end gap-2">
        <UiButton type="button" variant="outline" @click="emit('cancel')">Cancel</UiButton>
        <UiButton type="submit" :loading="pending">{{ goal ? "Save goal" : "Add goal" }}</UiButton>
      </div>
    </fieldset>
  </form>
</template>
