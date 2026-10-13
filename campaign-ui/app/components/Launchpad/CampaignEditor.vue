<script setup lang="ts">
  import { campaignSchema } from "#shared/schemas";
  import type { Campaign } from "#shared/types";
  import { channels, statuses } from "#shared/types";
  const props = defineProps<{ record: Campaign }>();
  const uid = useId();
  const emit = defineEmits<{ saved: [Campaign] }>();
  const form = ref(clone(props.record));
  const { state, saveCampaign } = useDemo();
  const { pending, error, run } = useAction();
  const { validate } = useForm();
  const { dirty, markSaved } = useUnsaved(form);
  defineExpose({ dirty, pending });
  async function submit() {
    if (!(await validate()).valid) return;
    const saved = await run(() => saveCampaign(form.value));
    if (saved) {
      form.value = clone(saved);
      markSaved();
      useSonner.success("Campaign saved");
      emit("saved", saved);
    }
  }
</script>
<template>
  <form @submit.prevent="submit">
    <fieldset :disabled="pending" class="space-y-6">
      <UiCard>
        <UiCardHeader>
          <UiCardTitle as="h2">The campaign brief</UiCardTitle>
          <UiCardDescription>The goal, the channel, and who is involved.</UiCardDescription>
          <UiCardAction v-if="dirty">
            <UiBadge variant="outline">Unsaved changes</UiBadge>
          </UiCardAction>
        </UiCardHeader>
        <UiCardContent class="space-y-5">
          <UiVeeInput
            v-model="form.name"
            name="name"
            label="Campaign name"
            :rules="campaignSchema.fields.name"
            placeholder="Give your next idea a name"
          />
          <UiVeeInput
            v-model="form.objective"
            name="objective"
            label="Objective"
            :rules="campaignSchema.fields.objective"
            placeholder="What would you like to achieve?"
          />
          <div class="space-y-2">
            <UiLabel :for="`${uid}-description`">Description</UiLabel>
            <UiTextarea
              :id="`${uid}-description`"
              v-model="form.description"
              :rows="4"
              placeholder="The audience, the message, and the opportunity."
            />
          </div>
          <div class="grid gap-5 @xl:grid-cols-2">
            <div class="space-y-2">
              <UiLabel :for="`${uid}-channel`">Channel</UiLabel>
              <UiNativeSelect :id="`${uid}-channel`" v-model="form.channel">
                <option v-for="channel in channels" :key="channel">{{ channel }}</option>
              </UiNativeSelect>
            </div>
            <div class="space-y-2">
              <UiLabel :for="`${uid}-status`">Status</UiLabel>
              <UiNativeSelect :id="`${uid}-status`" v-model="form.status">
                <option v-for="status in statuses" :key="status">{{ status }}</option>
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
            <div class="space-y-2">
              <UiLabel :for="`${uid}-budget`">Budget (USD)</UiLabel>
              <UiInput
                :id="`${uid}-budget`"
                v-model.number="form.budget"
                type="number"
                min="0"
                max="10000000"
                required
              />
            </div>
            <div class="space-y-2">
              <UiLabel :for="`${uid}-start`">Start date</UiLabel>
              <UiInput :id="`${uid}-start`" v-model="form.startDate" type="date" />
            </div>
            <div class="space-y-2">
              <UiLabel :for="`${uid}-end`">End date</UiLabel>
              <UiInput :id="`${uid}-end`" v-model="form.endDate" type="date" />
            </div>
          </div>
          <fieldset class="space-y-3">
            <legend class="mb-3 text-sm leading-none font-medium">Campaign team</legend>
            <UiCheckboxGroup v-model="form.memberIds" class="flex flex-wrap gap-3">
              <UiLabel
                v-for="member in state?.members"
                :key="member.id"
                class="cursor-pointer gap-2 rounded-md border px-3 py-2 font-normal transition-colors hover:bg-accent/50 has-data-[state=checked]:border-primary/50"
              >
                <UiCheckbox :value="member.id" />{{ member.name }}
              </UiLabel>
            </UiCheckboxGroup>
          </fieldset>
        </UiCardContent>
      </UiCard>
      <UiCard>
        <UiCardHeader>
          <UiCardTitle as="h2">A thoughtful launch checklist</UiCardTitle>
          <UiCardDescription>
            Checklist completion sets progress. Campaign status is managed separately.
          </UiCardDescription>
        </UiCardHeader>
        <UiCardContent class="space-y-3">
          <div
            v-for="item in form.checklist"
            :key="item.id"
            class="flex items-center gap-3 rounded-md border p-3"
          >
            <UiCheckbox :id="`${uid}-${item.id}`" v-model="item.done" />
            <UiLabel
              :for="`${uid}-${item.id}`"
              class="flex-1 font-normal"
              :class="item.done && 'text-muted-foreground line-through'"
              >{{ item.title }}</UiLabel
            >
          </div>
        </UiCardContent>
      </UiCard>
      <LaunchpadError :message="error" />
      <div class="flex items-center justify-between">
        <UiButton to="/campaigns" variant="outline">Back to campaigns</UiButton>
        <UiButton type="submit" :loading="pending">Save campaign</UiButton>
      </div>
    </fieldset>
  </form>
</template>
