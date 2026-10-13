<script setup lang="ts">
  import { missingFields, primaryEmail, primaryPhone, type MissingField } from "#shared/contacts";
  import { findDuplicates, type DuplicatePair } from "#shared/duplicates";
  usePageSeo({ title: "Clean up" });
  const { state, nameOf } = useDemo();
  const dismissed = useState<string[]>("verdant-dismissed-duplicates", () => []);
  const mergeOpen = ref(false);
  const selected = ref<DuplicatePair | null>(null);
  const pairs = computed(() =>
    findDuplicates(state.value?.contacts ?? []).filter(
      (pair) => !dismissed.value.includes(pair.key)
    )
  );
  const reasonLabels = { email: "Same email", phone: "Same phone", name: "Same name" } as const;
  const gaps = computed(() => {
    const contacts = (state.value?.contacts ?? []).filter((item) => !item.archived);
    const fields: { field: MissingField; label: string; to: string }[] = [
      { field: "email", label: "Missing an email", to: "/contacts?missing=email" },
      { field: "phone", label: "Missing a phone number", to: "/contacts?missing=phone" },
      { field: "company", label: "Missing a company", to: "/contacts?missing=company" },
      { field: "groups", label: "Not in any group", to: "/contacts?missing=groups" },
    ];
    return fields.map((item) => ({
      ...item,
      contacts: contacts.filter((contact) => missingFields(contact).includes(item.field)),
    }));
  });
  function openMerge(pair: DuplicatePair) {
    selected.value = pair;
    mergeOpen.value = true;
  }
  function dismiss(pair: DuplicatePair) {
    dismissed.value = [...dismissed.value, pair.key];
  }
</script>
<template>
  <div class="page-shell">
    <VerdantPageHeader
      title="Clean up"
      description="Merge duplicates and fill in the gaps so your address book stays trustworthy."
    />
    <section aria-labelledby="duplicates-heading" class="mb-10">
      <h2 id="duplicates-heading" class="mb-3 text-sm font-semibold">
        Possible duplicates
        <span class="font-normal text-muted-foreground">({{ pairs.length }})</span>
      </h2>
      <ul v-if="pairs.length" class="space-y-3">
        <li v-for="pair in pairs" :key="pair.key">
          <UiCard class="gap-4 py-4">
            <UiCardContent class="flex flex-wrap items-center gap-4">
              <div class="grid min-w-0 flex-1 gap-3 @xl:grid-cols-2">
                <div
                  v-for="side in ['a', 'b'] as const"
                  :key="side"
                  class="flex min-w-0 items-center gap-3"
                >
                  <VerdantContactAvatar :contact="pair[side]" />
                  <div class="min-w-0">
                    <NuxtLink
                      :to="'/contacts/' + pair[side].id"
                      class="block truncate text-sm font-medium underline-offset-4 hover:underline"
                      >{{ nameOf(pair[side]) }}</NuxtLink
                    >
                    <p class="truncate text-xs text-muted-foreground">
                      {{
                        primaryEmail(pair[side]) ||
                        primaryPhone(pair[side]) ||
                        pair[side].company ||
                        "No details"
                      }}
                    </p>
                  </div>
                </div>
              </div>
              <UiBadge variant="outline">{{ reasonLabels[pair.reason] }}</UiBadge>
              <div class="flex gap-2">
                <UiButton size="sm" @click="openMerge(pair)">
                  <Icon name="lucide:merge" />Merge
                </UiButton>
                <UiButton variant="ghost" size="sm" @click="dismiss(pair)"
                  >Not a duplicate</UiButton
                >
              </div>
            </UiCardContent>
          </UiCard>
        </li>
      </ul>
      <VerdantEmpty
        v-else
        title="No duplicates found"
        description="Every contact looks unique. Check back after your next import."
        icon="lucide:sparkles"
      />
    </section>
    <section aria-labelledby="gaps-heading">
      <h2 id="gaps-heading" class="mb-3 text-sm font-semibold">Missing details</h2>
      <div class="grid gap-4 @lg:grid-cols-2">
        <UiCard v-for="item in gaps" :key="item.field" class="gap-3">
          <UiCardHeader>
            <UiCardTitle as="h3" class="text-base">{{ item.label }}</UiCardTitle>
            <UiCardDescription>
              {{ item.contacts.length }} {{ item.contacts.length === 1 ? "contact" : "contacts" }}
            </UiCardDescription>
            <UiCardAction>
              <UiButton :to="item.to" variant="ghost" size="sm">See all</UiButton>
            </UiCardAction>
          </UiCardHeader>
          <UiCardContent>
            <ul v-if="item.contacts.length" class="space-y-1.5 text-sm">
              <li v-for="contact in item.contacts.slice(0, 4)" :key="contact.id">
                <NuxtLink
                  :to="'/contacts/' + contact.id + '?tab=edit'"
                  class="text-primary underline underline-offset-4 hover:no-underline"
                  >{{ nameOf(contact) }}</NuxtLink
                >
              </li>
              <li v-if="item.contacts.length > 4" class="text-muted-foreground">
                and {{ item.contacts.length - 4 }} more
              </li>
            </ul>
            <p v-else class="text-sm text-muted-foreground">Nothing missing here.</p>
          </UiCardContent>
        </UiCard>
      </div>
    </section>
    <VerdantMergeDialog v-model:open="mergeOpen" :pair="selected" />
  </div>
</template>
