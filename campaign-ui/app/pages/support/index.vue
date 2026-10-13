<script setup lang="ts">
  import { ticketSchema } from "#shared/schemas";
  import { faqs } from "~/utils/docs";
  const { state, ready, saveTicket } = useDemo();
  usePageSeo({ title: "Support center" });
  const search = ref("");
  const ticket = ref(newTicket());
  const { pending, error, run } = useAction();
  const { validate } = useForm();
  const { markSaved } = useUnsaved(ticket);
  const questions = computed(() =>
    faqs.filter((f) => (f.question + f.answer).toLowerCase().includes(search.value.toLowerCase()))
  );
  const faqItems = computed(() =>
    questions.value.map((item) => ({
      value: item.question,
      title: item.question,
      content: item.answer,
    }))
  );
  async function submit() {
    if (!(await validate()).valid) return;
    const saved = await run(() => saveTicket(ticket.value));
    if (saved) {
      markSaved();
      await navigateTo("/support/tickets/" + saved.id);
    }
  }
</script>
<template>
  <div class="page-shell">
    <LaunchpadPageHeader
      title="A little help along the way."
      description="Find an answer, explore the guides, or try a demo support ticket."
    >
      <UiButton to="/docs" variant="outline"
        ><Icon name="lucide:book-open" />Browse guides</UiButton
      >
    </LaunchpadPageHeader>
    <UiInput
      v-model="search"
      aria-label="Search frequently asked questions"
      placeholder="Search common questions…"
      class="mb-6 max-w-md"
    />
    <UiCard v-if="questions.length" class="py-2">
      <UiCardContent>
        <UiAccordion :items="faqItems">
          <template #content="{ item }">
            <UiAccordionContent class="text-muted-foreground">{{
              item.content
            }}</UiAccordionContent>
          </template>
        </UiAccordion>
      </UiCardContent>
    </UiCard>
    <LaunchpadEmpty
      v-else
      title="No matching questions"
      description="Try another search or browse the guides."
      icon="lucide:circle-help"
    />
    <div class="mt-8 grid items-start gap-6 @4xl:grid-cols-2">
      <form @submit.prevent="submit">
        <fieldset :disabled="pending || !ready">
          <UiCard>
            <UiCardHeader>
              <UiCardTitle as="h2">Try a support ticket</UiCardTitle>
              <UiCardDescription>
                This form returns a simulated reply. Nothing is sent to a support team.
              </UiCardDescription>
            </UiCardHeader>
            <UiCardContent class="space-y-5">
              <UiVeeInput
                v-model="ticket.subject"
                name="subject"
                label="Subject"
                :rules="ticketSchema.fields.subject"
              />
              <div class="space-y-2">
                <UiLabel for="ticket-category">Category</UiLabel>
                <UiNativeSelect id="ticket-category" v-model="ticket.category">
                  <option>Campaigns</option>
                  <option>Account</option>
                  <option>Feedback</option>
                </UiNativeSelect>
              </div>
              <div class="space-y-2">
                <UiLabel for="ticket-description">How can we help?</UiLabel>
                <UiTextarea
                  id="ticket-description"
                  v-model="ticket.description"
                  required
                  :rows="5"
                  :maxlength="5000"
                />
              </div>
              <LaunchpadError :message="error" />
            </UiCardContent>
            <UiCardFooter>
              <UiButton type="submit" :loading="pending">Create demo ticket</UiButton>
            </UiCardFooter>
          </UiCard>
        </fieldset>
      </form>
      <UiCard>
        <UiCardHeader>
          <UiCardTitle as="h2">Your tickets</UiCardTitle>
          <UiCardDescription>Demo tickets you've created in this browser.</UiCardDescription>
        </UiCardHeader>
        <UiCardContent>
          <ul v-if="state?.tickets.length" class="divide-y">
            <li v-for="item in state.tickets" :key="item.id" class="py-3 first:pt-0 last:pb-0">
              <NuxtLink
                :to="'/support/tickets/' + item.id"
                class="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >{{ item.subject }}</NuxtLink
              >
              <p class="mt-1 text-xs text-muted-foreground">
                {{ item.status }} · {{ dateLabel(item.createdAt) }}
              </p>
            </li>
          </ul>
          <p v-else class="text-sm text-muted-foreground">No tickets yet.</p>
        </UiCardContent>
      </UiCard>
    </div>
  </div>
</template>
