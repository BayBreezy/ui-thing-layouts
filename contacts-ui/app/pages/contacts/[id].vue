<script setup lang="ts">
  import { primaryEmail, primaryPhone } from "#shared/contacts";
  import { contactToVCard } from "#shared/vcard";
  import { downloadFile, groupColorClasses, relationshipLabels } from "~/utils/demo";
  definePageMeta({ key: (route) => route.fullPath });
  const route = useRoute();
  const router = useRouter();
  const { state, nameOf, toggleFavorite, bulk } = useDemo();
  const { error, run } = useAction();
  const followUpOpen = ref(false);
  const contact = computed(() => state.value?.contacts.find((item) => item.id === route.params.id));
  const tab = computed(() => {
    const value = String(route.query.tab || "");
    return ["timeline", "follow-ups", "edit"].includes(value) ? value : "overview";
  });
  const followUps = computed(() =>
    (state.value?.followUps ?? [])
      .filter((item) => item.contactId === contact.value?.id)
      .sort((a, b) => Number(a.done) - Number(b.done) || a.dueDate.localeCompare(b.dueDate))
  );
  const open = computed(() => followUps.value.filter((item) => !item.done).length);
  const groups = computed(
    () => state.value?.groups.filter((item) => contact.value?.groupIds.includes(item.id)) ?? []
  );
  usePageSeo({ title: () => (contact.value ? nameOf(contact.value) : "Contact") });
  function setTab(value: string | number) {
    void router.replace({
      query: { ...route.query, tab: value === "overview" ? undefined : value },
    });
  }
  async function archiveToggle() {
    if (!contact.value) return;
    const archived = contact.value.archived;
    const result = await run(() => bulk(archived ? "restore" : "archive", [contact.value!.id]));
    if (result) useSonner.success(archived ? "Contact restored" : "Contact archived");
  }
</script>
<template>
  <div class="page-shell">
    <VerdantRecordGate :exists="!!contact" back="/contacts">
      <template v-if="contact">
        <UiAlert
          v-if="contact.archived"
          role="status"
          icon="lucide:archive"
          title="This contact is archived"
          description="It's hidden from your contacts list and reports. Restore it to bring it back."
          class="mb-6"
        />
        <header class="mb-6 flex flex-wrap items-start gap-4">
          <VerdantContactAvatar :contact="contact" size="xl" />
          <div class="min-w-0 flex-1 space-y-2">
            <h1 class="text-2xl font-semibold tracking-tight">{{ nameOf(contact) }}</h1>
            <p class="text-sm text-muted-foreground">
              {{
                [contact.jobTitle, contact.company].filter(Boolean).join(" · ") || "No company yet"
              }}
            </p>
            <ul class="flex flex-wrap items-center gap-2">
              <li>
                <UiBadge variant="outline">{{ relationshipLabels[contact.relationship] }}</UiBadge>
              </li>
              <li v-for="group in groups" :key="group.id">
                <span
                  :class="[
                    'inline-flex rounded-md px-2 py-0.5 text-xs font-medium',
                    groupColorClasses[group.color].soft,
                  ]"
                  >{{ group.name }}</span
                >
              </li>
            </ul>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <UiButton
              variant="outline"
              :aria-pressed="contact.favorite"
              @click="run(() => toggleFavorite(contact!))"
            >
              <VerdantStar :filled="contact.favorite" />{{
                contact.favorite ? "Favorited" : "Favorite"
              }}
            </UiButton>
            <UiButton
              v-if="primaryEmail(contact)"
              :href="'mailto:' + primaryEmail(contact)"
              variant="outline"
            >
              <Icon name="lucide:mail" />Email
            </UiButton>
            <UiButton
              v-if="primaryPhone(contact)"
              :href="'tel:' + primaryPhone(contact).replace(/[^\d+]/g, '')"
              variant="outline"
            >
              <Icon name="lucide:phone" />Call
            </UiButton>
            <UiDropdownMenu>
              <UiDropdownMenuTrigger as-child>
                <UiButton variant="outline" size="icon" aria-label="More actions">
                  <Icon name="lucide:ellipsis" />
                </UiButton>
              </UiDropdownMenuTrigger>
              <UiDropdownMenuContent align="end">
                <UiDropdownMenuItem
                  @select="
                    downloadFile(
                      nameOf(contact!).replace(/\W+/g, '-').toLowerCase() + '.vcf',
                      contactToVCard(contact!),
                      'text/vcard'
                    )
                  "
                >
                  <Icon name="lucide:contact" />Download vCard
                </UiDropdownMenuItem>
                <UiDropdownMenuItem @select="followUpOpen = true">
                  <Icon name="lucide:calendar-plus" />Add follow-up
                </UiDropdownMenuItem>
                <UiDropdownMenuSeparator />
                <UiDropdownMenuItem @select="archiveToggle">
                  <Icon :name="contact.archived ? 'lucide:archive-restore' : 'lucide:archive'" />
                  {{ contact.archived ? "Restore" : "Archive" }}
                </UiDropdownMenuItem>
              </UiDropdownMenuContent>
            </UiDropdownMenu>
          </div>
        </header>
        <VerdantError :message="error" />
        <UiTabs :model-value="tab" @update:model-value="setTab">
          <UiTabsList class="mb-6">
            <UiTabsTrigger value="overview">Overview</UiTabsTrigger>
            <UiTabsTrigger value="timeline">Timeline</UiTabsTrigger>
            <UiTabsTrigger value="follow-ups">
              Follow-ups<span v-if="open" class="ml-1.5 text-xs text-muted-foreground"
                >({{ open }})</span
              >
            </UiTabsTrigger>
            <UiTabsTrigger value="edit">Edit</UiTabsTrigger>
          </UiTabsList>
          <UiTabsContent value="overview"
            ><VerdantContactOverview :contact="contact"
          /></UiTabsContent>
          <UiTabsContent value="timeline"
            ><VerdantContactTimeline :contact="contact"
          /></UiTabsContent>
          <UiTabsContent value="follow-ups" class="space-y-4">
            <div class="flex justify-end">
              <UiButton @click="followUpOpen = true"
                ><Icon name="lucide:calendar-plus" />Add follow-up</UiButton
              >
            </div>
            <VerdantFollowUpList v-if="followUps.length" :items="followUps" />
            <VerdantEmpty
              v-else
              title="Nothing to follow up on"
              description="Add a reminder so you remember to reach back out."
              icon="lucide:calendar-check"
            />
          </UiTabsContent>
          <UiTabsContent value="edit"><VerdantContactEditor :record="contact" /></UiTabsContent>
        </UiTabs>
        <VerdantFollowUpDialog v-model:open="followUpOpen" :contact-id="contact.id" />
      </template>
    </VerdantRecordGate>
  </div>
</template>
