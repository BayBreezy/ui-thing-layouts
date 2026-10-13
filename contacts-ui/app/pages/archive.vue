<script setup lang="ts">
  import { primaryEmail } from "#shared/contacts";
  import { relativeDay } from "~/utils/demo";
  usePageSeo({ title: "Archive" });
  const { state, nameOf, bulk } = useDemo();
  const { pending, error, run } = useAction();
  const selected = ref<string[]>([]);
  const deleteOpen = ref(false);
  const archived = computed(() =>
    (state.value?.contacts ?? [])
      .filter((item) => item.archived)
      .sort((a, b) => nameOf(a).localeCompare(nameOf(b)))
  );
  const all = computed({
    get: () => archived.value.length > 0 && selected.value.length === archived.value.length,
    set: (value: boolean) => {
      selected.value = value ? archived.value.map((item) => item.id) : [];
    },
  });
  watch(archived, (items) => {
    selected.value = selected.value.filter((id) => items.some((item) => item.id === id));
  });
  async function restore(ids: string[]) {
    const result = await run(() => bulk("restore", ids));
    if (result) {
      useSonner.success(`${result.count} ${result.count === 1 ? "contact" : "contacts"} restored`);
      selected.value = [];
    }
  }
  async function destroy() {
    const result = await run(() => bulk("delete", [...selected.value]));
    if (result) {
      deleteOpen.value = false;
      useSonner.success(`${result.count} ${result.count === 1 ? "contact" : "contacts"} deleted`);
      selected.value = [];
    }
  }
</script>
<template>
  <div class="page-shell">
    <VerdantPageHeader
      title="Archive"
      description="Archived contacts are hidden everywhere else. Restore them any time, or delete them for good."
    >
      <UiButton
        variant="outline"
        :disabled="!selected.length || pending"
        @click="restore([...selected])"
      >
        <Icon name="lucide:archive-restore" />Restore
      </UiButton>
      <UiButton
        variant="destructive"
        :disabled="!selected.length || pending"
        @click="deleteOpen = true"
      >
        <Icon name="lucide:trash-2" />Delete forever
      </UiButton>
    </VerdantPageHeader>
    <VerdantError :message="error" />
    <UiCard v-if="archived.length" class="py-2">
      <UiCardContent class="px-2">
        <UiTable>
          <UiTableCaption class="sr-only">Archived contacts</UiTableCaption>
          <UiTableHeader>
            <UiTableRow>
              <UiTableHead class="w-10">
                <UiCheckbox v-model="all" aria-label="Select all archived contacts" />
              </UiTableHead>
              <UiTableHead>Name</UiTableHead>
              <UiTableHead>Email</UiTableHead>
              <UiTableHead>Last updated</UiTableHead>
              <UiTableHead><span class="sr-only">Actions</span></UiTableHead>
            </UiTableRow>
          </UiTableHeader>
          <UiTableBody>
            <UiTableRow v-for="contact in archived" :key="contact.id">
              <UiTableCell>
                <UiCheckbox
                  :model-value="selected.includes(contact.id)"
                  :aria-label="`Select ${nameOf(contact)}`"
                  @update:model-value="
                    selected = $event
                      ? [...selected, contact.id]
                      : selected.filter((id) => id !== contact.id)
                  "
                />
              </UiTableCell>
              <UiTableCell>
                <NuxtLink
                  :to="'/contacts/' + contact.id"
                  class="font-medium underline-offset-4 hover:text-primary hover:underline"
                  >{{ nameOf(contact) }}</NuxtLink
                >
              </UiTableCell>
              <UiTableCell class="text-muted-foreground">{{
                primaryEmail(contact) || "—"
              }}</UiTableCell>
              <UiTableCell class="text-muted-foreground">{{
                relativeDay(contact.updatedAt)
              }}</UiTableCell>
              <UiTableCell class="text-right">
                <UiButton
                  variant="ghost"
                  size="sm"
                  :aria-label="`Restore ${nameOf(contact)}`"
                  @click="restore([contact.id])"
                >
                  Restore
                </UiButton>
              </UiTableCell>
            </UiTableRow>
          </UiTableBody>
        </UiTable>
      </UiCardContent>
    </UiCard>
    <VerdantEmpty
      v-else
      title="The archive is empty"
      description="Archive a contact to tuck it away without losing its history."
      icon="lucide:archive"
    />
    <UiAlertDialog v-model:open="deleteOpen">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle
            >Delete {{ selected.length }}
            {{ selected.length === 1 ? "contact" : "contacts" }} forever?</UiAlertDialogTitle
          >
          <UiAlertDialogDescription>
            Their history and follow-ups are removed too. This can't be undone.
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel>Cancel</UiAlertDialogCancel>
          <UiAlertDialogAction @click.prevent="destroy">Delete forever</UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  </div>
</template>
