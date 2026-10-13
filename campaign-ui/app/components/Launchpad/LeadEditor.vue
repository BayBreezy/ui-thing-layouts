<script setup lang="ts">
  import { leadSchema } from "#shared/schemas";
  import type { Lead } from "#shared/types";
  import { stages } from "#shared/types";
  const props = defineProps<{ record: Lead }>();
  const uid = useId();
  const emit = defineEmits<{ saved: [Lead] }>();
  const form = ref(clone(props.record));
  const { state, saveLead } = useDemo();
  const { pending, error, run } = useAction();
  const { validate } = useForm();
  const { markSaved } = useUnsaved(form);
  async function submit() {
    if (!(await validate()).valid) return;
    const saved = await run(() => saveLead(form.value));
    if (saved) {
      form.value = clone(saved);
      markSaved();
      useSonner.success("Lead saved");
      emit("saved", saved);
    }
  }
</script>
<template>
  <form @submit.prevent="submit">
    <fieldset :disabled="pending">
      <UiCard>
        <UiCardHeader>
          <UiCardTitle as="h2">Contact details</UiCardTitle>
          <UiCardDescription>Who they are, and where they are in the pipeline.</UiCardDescription>
        </UiCardHeader>
        <UiCardContent class="space-y-5">
          <div class="grid gap-5 @xl:grid-cols-2">
            <UiVeeInput
              v-model="form.name"
              name="name"
              label="Full name"
              :rules="leadSchema.fields.name"
            />
            <UiVeeInput
              v-model="form.email"
              name="email"
              type="email"
              label="Email"
              :rules="leadSchema.fields.email"
            />
            <UiVeeInput
              v-model="form.company"
              name="company"
              label="Company"
              :rules="leadSchema.fields.company"
            />
            <div class="space-y-2">
              <UiLabel :for="`${uid}-value`">Potential value (USD)</UiLabel>
              <UiInput
                :id="`${uid}-value`"
                v-model.number="form.value"
                type="number"
                min="0"
                required
              />
            </div>
            <div class="space-y-2">
              <UiLabel :for="`${uid}-stage`">Stage</UiLabel>
              <UiNativeSelect :id="`${uid}-stage`" v-model="form.stage">
                <option v-for="stage in stages" :key="stage">{{ stage }}</option>
              </UiNativeSelect>
            </div>
            <div class="space-y-2">
              <UiLabel :for="`${uid}-owner`">Owner</UiLabel>
              <UiNativeSelect :id="`${uid}-owner`" v-model="form.ownerId">
                <option v-for="member in state?.members" :key="member.id" :value="member.id">
                  {{ member.name }}
                </option>
              </UiNativeSelect>
            </div>
            <div class="space-y-2 @xl:col-span-2">
              <UiLabel :for="`${uid}-campaign`">Campaign</UiLabel>
              <UiNativeSelect :id="`${uid}-campaign`" v-model="form.campaignId">
                <option value="">No campaign</option>
                <option
                  v-for="campaign in state?.campaigns"
                  :key="campaign.id"
                  :value="campaign.id"
                >
                  {{ campaign.name }}{{ campaign.archived ? " (archived)" : "" }}
                </option>
              </UiNativeSelect>
            </div>
          </div>
          <div class="space-y-2">
            <UiLabel :for="`${uid}-notes`">Notes</UiLabel>
            <UiTextarea :id="`${uid}-notes`" v-model="form.notes" :rows="5" />
          </div>
          <LaunchpadError :message="error" />
        </UiCardContent>
        <UiCardFooter class="justify-end">
          <UiButton type="submit" :loading="pending">Save lead</UiButton>
        </UiCardFooter>
      </UiCard>
    </fieldset>
  </form>
</template>
