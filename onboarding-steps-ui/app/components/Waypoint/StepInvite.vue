<script setup lang="ts">
  import { toTypedSchema } from "@vee-validate/yup";
  import { object } from "yup";

  import { cleanInvites, inviteSchema, maxInvites } from "#shared/onboarding";

  const { progress, complete, back } = useOnboarding();

  const schema = object({ members: inviteSchema.fields.members });
  const { handleSubmit, isSubmitting, values } = useForm({
    name: "invite-form",
    validationSchema: toTypedSchema(schema),
    initialValues: { members: progress.value.invited.length ? [...progress.value.invited] : [""] },
  });
  const { fields, push, remove } = useFieldArray<string>("members");

  async function send(members: string[]) {
    const result = await $fetch<{ invited: string[] }>("/api/onboarding/invite", {
      method: "POST",
      body: { email: progress.value.email || "you@example.com", members },
    });
    if (result.invited.length) {
      useSonner.success(
        result.invited.length === 1
          ? "Teammate invited"
          : `${result.invited.length} teammates invited`,
        { description: "They'll get an email with a link to join." }
      );
    } else {
      useSonner.info("No teammates yet", {
        description: "You can always invite people later from settings.",
      });
    }
    await complete({ invited: result.invited });
  }

  const submit = handleSubmit(async (formValues) => {
    const members = cleanInvites(
      (formValues.members as string[] | undefined) ?? [],
      progress.value.email
    );
    try {
      await send(members);
    } catch {
      useSonner.error("We couldn't send the invites", { description: "Please try again." });
    }
  });
  async function skip() {
    try {
      await send([]);
    } catch {
      useSonner.error("We couldn't continue", { description: "Please try again." });
    }
  }
  const filled = computed(
    () => cleanInvites((values.members as string[] | undefined) ?? [], progress.value.email).length
  );
</script>
<template>
  <WaypointStep>
    <WaypointHeading title="Invite your team" description="Start collaborating with your team" />
    <form class="w-full" novalidate @submit.prevent="submit">
      <fieldset :disabled="isSubmitting" class="grid grid-cols-1 gap-5">
        <ul class="grid gap-4" aria-label="Teammates to invite">
          <li v-for="(item, idx) in fields" :key="item.key" class="flex items-start gap-2">
            <UiVeeInput
              class="flex-1"
              :name="`members[${idx}]`"
              type="email"
              autocomplete="off"
              :aria-label="`Teammate ${idx + 1} email`"
              placeholder="teammate@company.com"
            />
            <UiButton
              type="button"
              size="icon"
              variant="outline"
              class="shrink-0 text-muted-foreground hover:text-foreground"
              :aria-label="`Remove teammate ${idx + 1}`"
              @click="remove(idx)"
            >
              <Icon name="lucide:trash-2" />
            </UiButton>
          </li>
        </ul>
        <UiButton
          v-if="fields.length < maxInvites"
          type="button"
          variant="secondary"
          class="w-full"
          @click="push('')"
        >
          <Icon name="lucide:plus" class="text-muted-foreground" />
          <span>Add another member</span>
        </UiButton>
        <UiButton type="submit" :loading="isSubmitting" class="w-full">
          {{ filled ? `Send ${filled === 1 ? "invite" : "invites"} and continue` : "Continue" }}
        </UiButton>
        <div class="flex items-center justify-center gap-2">
          <UiButton type="button" variant="ghost" @click="back()">
            <Icon name="lucide:arrow-left" /> Back
          </UiButton>
          <UiButton type="button" variant="ghost" @click="skip">Skip for now</UiButton>
        </div>
      </fieldset>
    </form>
  </WaypointStep>
</template>
