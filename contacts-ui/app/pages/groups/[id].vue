<script setup lang="ts">
  import { primaryEmail } from "#shared/contacts";
  import { contactsToCsv } from "#shared/csv";
  import { downloadFile, groupColorClasses } from "~/utils/demo";
  definePageMeta({ key: (route) => route.fullPath });
  const route = useRoute();
  const { state, nameOf, bulk, deleteGroup } = useDemo();
  const { error, run } = useAction();
  const editOpen = ref(false);
  const deleteOpen = ref(false);
  const addId = ref("");
  const group = computed(() => state.value?.groups.find((item) => item.id === route.params.id));
  usePageSeo({ title: () => group.value?.name ?? "Group" });
  const members = computed(() =>
    (state.value?.contacts ?? [])
      .filter((item) => !item.archived && item.groupIds.includes(String(route.params.id)))
      .sort((a, b) => nameOf(a).localeCompare(nameOf(b)))
  );
  const candidates = computed(() =>
    (state.value?.contacts ?? [])
      .filter((item) => !item.archived && !item.groupIds.includes(String(route.params.id)))
      .sort((a, b) => nameOf(a).localeCompare(nameOf(b)))
  );
  async function add() {
    if (!addId.value || !group.value) return;
    const result = await run(() => bulk("add-group", [addId.value], group.value!.id));
    if (result) {
      useSonner.success("Added to group");
      addId.value = "";
    }
  }
  async function remove(id: string) {
    if (!group.value) return;
    await run(() => bulk("remove-group", [id], group.value!.id));
  }
  async function destroy() {
    const id = group.value?.id;
    if (!id) return;
    const done = await run(async () => {
      await deleteGroup(id);
      return true;
    });
    if (done) {
      deleteOpen.value = false;
      useSonner.success("Group deleted");
      await navigateTo("/groups");
    }
  }
  function exportGroup() {
    if (!state.value || !group.value) return;
    downloadFile(
      group.value.name.replace(/\W+/g, "-").toLowerCase() + ".csv",
      contactsToCsv(members.value, state.value.groups),
      "text/csv"
    );
  }
</script>
<template>
  <div class="page-shell">
    <VerdantRecordGate :exists="!!group" back="/groups">
      <template v-if="group">
        <VerdantPageHeader
          :title="group.name"
          :description="group.description || 'No description yet.'"
        >
          <UiButton variant="outline" @click="exportGroup"
            ><Icon name="lucide:download" />Export CSV</UiButton
          >
          <UiButton variant="outline" @click="editOpen = true"
            ><Icon name="lucide:pencil" />Edit</UiButton
          >
          <UiButton :to="'/contacts/new?group=' + group.id"
            ><Icon name="lucide:user-plus" />New contact</UiButton
          >
        </VerdantPageHeader>
        <VerdantError :message="error" />
        <div class="mb-6 flex flex-wrap items-end gap-3">
          <div class="space-y-2">
            <UiLabel for="add-member">Add someone to this group</UiLabel>
            <div class="w-72">
              <VerdantContactPicker
                id="add-member"
                v-model="addId"
                :contacts="candidates"
                placeholder="Search for a contact…"
              />
            </div>
          </div>
          <UiButton :disabled="!addId" @click="add">Add to group</UiButton>
        </div>
        <UiCard v-if="members.length" class="py-2">
          <UiCardContent class="px-2">
            <UiTable>
              <UiTableCaption class="sr-only">Members of {{ group.name }}</UiTableCaption>
              <UiTableHeader>
                <UiTableRow>
                  <UiTableHead>Name</UiTableHead>
                  <UiTableHead>Email</UiTableHead>
                  <UiTableHead><span class="sr-only">Actions</span></UiTableHead>
                </UiTableRow>
              </UiTableHeader>
              <UiTableBody>
                <UiTableRow v-for="member in members" :key="member.id">
                  <UiTableCell>
                    <div class="flex items-center gap-3">
                      <VerdantContactAvatar :contact="member" size="sm" />
                      <NuxtLink
                        :to="'/contacts/' + member.id"
                        class="font-medium underline-offset-4 hover:text-primary hover:underline"
                        >{{ nameOf(member) }}</NuxtLink
                      >
                    </div>
                  </UiTableCell>
                  <UiTableCell class="text-muted-foreground">{{
                    primaryEmail(member) || "—"
                  }}</UiTableCell>
                  <UiTableCell class="text-right">
                    <UiButton
                      variant="ghost"
                      size="sm"
                      :aria-label="`Remove ${nameOf(member)} from ${group.name}`"
                      @click="remove(member.id)"
                    >
                      Remove
                    </UiButton>
                  </UiTableCell>
                </UiTableRow>
              </UiTableBody>
            </UiTable>
          </UiCardContent>
        </UiCard>
        <VerdantEmpty
          v-else
          title="No one here yet"
          description="Add people from the menu above, or create a new contact in this group."
          icon="lucide:users-round"
        />
        <div class="mt-10 flex items-center justify-between rounded-lg border p-4">
          <div>
            <p class="text-sm font-medium">Delete this group</p>
            <p class="text-sm text-muted-foreground">
              People stay in your contacts. They just won't be in {{ group.name }} anymore.
            </p>
          </div>
          <UiButton variant="destructive" @click="deleteOpen = true">Delete group</UiButton>
        </div>
        <span :class="['hidden', groupColorClasses[group.color].dot]" />
        <VerdantGroupDialog v-model:open="editOpen" :group="group" />
        <UiAlertDialog v-model:open="deleteOpen">
          <UiAlertDialogContent>
            <UiAlertDialogHeader>
              <UiAlertDialogTitle>Delete {{ group.name }}?</UiAlertDialogTitle>
              <UiAlertDialogDescription>
                This removes the group. No contacts are deleted.
              </UiAlertDialogDescription>
            </UiAlertDialogHeader>
            <UiAlertDialogFooter>
              <UiAlertDialogCancel>Cancel</UiAlertDialogCancel>
              <UiAlertDialogAction @click.prevent="destroy">Delete group</UiAlertDialogAction>
            </UiAlertDialogFooter>
          </UiAlertDialogContent>
        </UiAlertDialog>
      </template>
    </VerdantRecordGate>
  </div>
</template>
