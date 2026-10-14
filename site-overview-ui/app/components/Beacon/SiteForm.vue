<script setup lang="ts">
  import { siteSchema } from "#shared/schemas";
  import type { Site } from "#shared/types";
  import { newId, now } from "~/utils/demo";

  const props = defineProps<{ site?: Site }>();
  const emit = defineEmits<{ saved: [site: Site]; cancel: [] }>();
  const { saveSite, state } = useDemo();
  const { pending, error, run } = useAction();
  const starterPages = [
    { path: "/", title: "Home" },
    { path: "/pricing", title: "Pricing" },
    { path: "/blog", title: "Blog" },
    { path: "/about", title: "About" },
    { path: "/contact", title: "Contact" },
    { path: "/signup", title: "Sign up" },
  ];
  const { handleSubmit } = useForm({
    validationSchema: toTypedSchema(siteSchema),
    initialValues: {
      id: props.site?.id ?? newId("site"),
      name: props.site?.name ?? "",
      domain: props.site?.domain ?? "",
      blurb: props.site?.blurb ?? "",
      pages: props.site?.pages ?? starterPages,
      createdAt: props.site?.createdAt ?? now(),
    },
  });
  const submit = handleSubmit(async (values) => {
    const duplicate = state.value?.sites.some(
      (item) => item.id !== values.id && item.domain.toLowerCase() === values.domain.toLowerCase()
    );
    if (duplicate) {
      error.value = "That domain is already in this workspace.";
      return;
    }
    const saved = await run(() => saveSite(values as Site));
    if (saved) {
      useSonner.success(props.site ? "Site updated" : "Site added", { description: saved.name });
      emit("saved", saved);
    }
  });
</script>
<template>
  <form class="space-y-5" novalidate @submit="submit">
    <fieldset :disabled="pending" class="space-y-5">
      <UiVeeInput name="name" label="Site name" placeholder="Acme Studio" autocomplete="off" />
      <UiVeeInput
        name="domain"
        label="Domain"
        placeholder="acme.example"
        hint="Without https://. A demo site gets generated sample traffic."
        autocomplete="off"
      />
      <UiVeeInput
        name="blurb"
        label="What is it? (optional)"
        placeholder="Design studio portfolio"
      />
      <BeaconError :message="error" />
      <div class="flex justify-end gap-2">
        <UiButton type="button" variant="outline" @click="emit('cancel')">Cancel</UiButton>
        <UiButton type="submit" :loading="pending">{{ site ? "Save site" : "Add site" }}</UiButton>
      </div>
    </fieldset>
  </form>
</template>
