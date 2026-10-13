<script setup lang="ts">
  import type { ColumnDef } from "@tanstack/vue-table";

  import {
    location,
    matchesSearch,
    missingFields,
    primaryEmail,
    primaryPhone,
    sortedLabels,
  } from "#shared/contacts";
  import { contactsToCsv } from "#shared/csv";
  import type { Contact } from "#shared/types";
  import { relationships } from "#shared/types";
  import { contactsToVCard } from "#shared/vcard";
  import type { TanStackTableFeatures } from "~/components/Ui/TanStackTable.vue";
  import { downloadFile, groupColorClasses, relationshipLabels, relativeDay } from "~/utils/demo";

  interface TableHandle {
    table: any;
    sorting: { id: string; desc: boolean }[];
    columnFilters: { id: string; value: unknown }[];
    columnVisibility: Record<string, boolean>;
    rowSelection: Record<string, boolean>;
    globalFilter: string;
    pagination: { pageIndex: number; pageSize: number };
  }
  const { state, nameOf, bulk, toggleFavorite } = useDemo();
  const { pending, error, run } = useAction();
  const query = useContactsTable();
  const tableRef = ref<TableHandle | null>(null);
  const importOpen = ref(false);
  const route = useRoute();
  const searchBox = ref(query.q.value);

  const data = computed(() => state.value?.contacts.filter((item) => !item.archived) ?? []);
  const labels = computed(() => sortedLabels(data.value));
  const groupName = (id: string) => state.value?.groups.find((item) => item.id === id)?.name ?? "";

  const columns = computed<ColumnDef<TanStackTableFeatures, Contact, any>[]>(() => [
    { id: "select", header: "", enableSorting: false, enableHiding: false },
    {
      id: "name",
      header: "Name",
      accessorFn: (contact) => nameOf(contact),
      enableHiding: false,
    },
    { id: "company", header: "Company", accessorFn: (contact) => contact.company },
    {
      id: "email",
      header: "Email",
      accessorFn: (contact) => primaryEmail(contact),
      enableSorting: false,
    },
    {
      id: "phone",
      header: "Phone",
      accessorFn: (contact) => primaryPhone(contact),
      enableSorting: false,
    },
    {
      id: "location",
      header: "Location",
      accessorFn: (contact) => location(contact),
      enableSorting: false,
    },
    {
      id: "groups",
      header: "Groups",
      accessorFn: (contact) => contact.groupIds.map(groupName).join(", "),
      enableSorting: false,
      filterFn: (row, _id, value) => row.original.groupIds.includes(String(value)),
    },
    {
      id: "labels",
      header: "Labels",
      accessorFn: (contact) => contact.labels.join(", "),
      enableSorting: false,
      filterFn: (row, _id, value) => row.original.labels.includes(String(value)),
    },
    {
      id: "relationship",
      header: "Relationship",
      accessorFn: (contact) => relationshipLabels[contact.relationship],
      filterFn: (row, _id, value) => row.original.relationship === value,
    },
    {
      id: "lastContacted",
      header: "Last contact",
      accessorFn: (contact) => contact.lastContactedAt,
    },
    { id: "createdAt", header: "Added", accessorFn: (contact) => contact.createdAt },
    {
      id: "favorite",
      header: "Favorite",
      accessorFn: (contact) => contact.favorite,
      enableSorting: false,
      filterFn: (row, _id, value) => row.original.favorite === Boolean(value),
    },
    {
      id: "missing",
      header: "Missing",
      accessorFn: (contact) => missingFields(contact).join(","),
      enableSorting: false,
      enableHiding: false,
      filterFn: (row, _id, value) => missingFields(row.original).includes(value),
    },
    { id: "actions", header: "", enableSorting: false, enableHiding: false },
  ]);
  const tableOptions = {
    getRowId: (row: Contact) => row.id,
    // Search every word against the contact's names, company, emails, phones, labels and places.
    globalFilterFn: (row: any, _id: string, value: string) => matchesSearch(row.original, value),
    getColumnCanGlobalFilter: (column: { id: string }) => column.id === "name",
    autoResetPageIndex: false,
  } as any;
  const hiddenByDefault = {
    phone: false,
    location: false,
    relationship: false,
    labels: false,
    createdAt: false,
    missing: false,
  };

  /** Pushes the URL-derived state into the table. Table events write back to the URL. */
  function syncFromRoute() {
    const handle = tableRef.value;
    if (!handle) return;
    handle.globalFilter = query.q.value;
    handle.columnFilters = query.columnFilters.value;
    handle.sorting = query.sorting.value;
    handle.pagination = { pageIndex: query.page.value - 1, pageSize: query.pageSize.value };
  }
  function ready() {
    if (tableRef.value) tableRef.value.columnVisibility = { ...hiddenByDefault };
    syncFromRoute();
    importOpen.value = route.query.import === "1";
  }
  watch(
    () => [
      query.q.value,
      query.columnFilters.value,
      query.sorting.value,
      query.page.value,
      query.pageSize.value,
    ],
    syncFromRoute,
    { deep: true }
  );
  watch(
    () => query.q.value,
    (value) => {
      if (value !== searchBox.value) searchBox.value = value;
    }
  );
  // Typing is debounced into the URL so every keystroke is not a navigation.
  const commitSearch = useDebounceFn((value: string) => query.update({ q: value.trim() }), 200);
  watch(searchBox, (value) => {
    if (value.trim() !== query.q.value) commitSearch(value);
  });
  function onSorting(value: { id: string; desc: boolean }[]) {
    const first = value[0];
    query.update({ sort: first ? (first.desc ? "-" : "") + first.id : "" }, true);
  }
  function onPagination(value: { pageIndex: number; pageSize: number }) {
    query.update(
      {
        page: value.pageIndex > 0 ? value.pageIndex + 1 : "",
        size: value.pageSize === (state.value?.preferences.pageSize ?? 10) ? "" : value.pageSize,
      },
      true
    );
  }
  watch(
    () => route.query.import,
    (value) => {
      if (value === "1") importOpen.value = true;
    }
  );
  watch(importOpen, (open) => {
    if (!open && route.query.import) query.update({ import: "" }, true);
  });

  const selectedIds = computed(() => {
    const handle = tableRef.value;
    if (!handle) return [];
    const selected = handle.table.getFilteredSelectedRowModel().rows as { original: Contact }[];
    return selected.map((row) => row.original.id);
  });
  const rows = computed(() => (tableRef.value?.table.getRowModel().rows ?? []) as any[]);
  const filteredCount = computed(
    () => (tableRef.value?.table.getFilteredRowModel().rows.length as number | undefined) ?? 0
  );
  const toggleable = computed(
    () =>
      (tableRef.value?.table.getAllLeafColumns().filter((column: any) => column.getCanHide()) as
        | any[]
        | undefined) ?? []
  );
  const selectedContacts = computed(() => {
    const set = new Set(selectedIds.value);
    return data.value.filter((item) => set.has(item.id));
  });
  function clearSelection() {
    if (tableRef.value) tableRef.value.rowSelection = {};
  }
  async function applyBulk(action: Parameters<typeof bulk>[0], value = "") {
    const ids = [...selectedIds.value];
    const result = await run(() => bulk(action, ids, value));
    if (result) {
      useSonner.success(`${result.count} ${result.count === 1 ? "contact" : "contacts"} updated`);
      clearSelection();
    }
  }
  const labelDraft = ref("");
  async function addLabel() {
    const value = labelDraft.value.trim();
    if (!value) return;
    await applyBulk("add-label", value);
    labelDraft.value = "";
  }
  /** Exports the selected contacts, or everything matching the current filters. */
  function exportContacts(format: "csv" | "vcf") {
    if (!state.value) return;
    const list = selectedContacts.value.length
      ? selectedContacts.value
      : ((tableRef.value?.table.getFilteredRowModel().rows ?? []) as { original: Contact }[]).map(
          (row) => row.original
        );
    if (format === "csv")
      downloadFile("verdant-contacts.csv", contactsToCsv(list, state.value.groups), "text/csv");
    else downloadFile("verdant-contacts.vcf", contactsToVCard(list), "text/vcard");
    useSonner.success(`Exported ${list.length} ${list.length === 1 ? "contact" : "contacts"}`);
  }
  async function favorite(contact: Contact) {
    await run(() => toggleFavorite(contact));
  }
  async function archive(contact: Contact) {
    const result = await run(() => bulk("archive", [contact.id]));
    if (result) useSonner.success(`${nameOf(contact)} was archived`);
  }
  async function copyEmail(contact: Contact) {
    const email = primaryEmail(contact);
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      useSonner.success("Email copied");
    } catch {
      useSonner.error("Couldn't copy. Select the address manually instead.");
    }
  }
</script>
<template>
  <section aria-label="Contacts" class="space-y-4">
    <div class="flex flex-wrap items-center gap-3">
      <div class="relative w-full sm:w-72">
        <Icon
          name="lucide:search"
          class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <UiInput
          v-model="searchBox"
          type="search"
          class="pl-9"
          aria-label="Search contacts"
          placeholder="Search name, company, email…"
        />
      </div>
      <div class="w-full sm:w-40">
        <UiNativeSelect
          aria-label="Filter by group"
          :model-value="query.group.value"
          @update:model-value="query.update({ group: $event as string })"
        >
          <option value="">All groups</option>
          <option v-for="group in state?.groups" :key="group.id" :value="group.id">
            {{ group.name }}
          </option>
        </UiNativeSelect>
      </div>
      <div class="w-full sm:w-40">
        <UiNativeSelect
          aria-label="Filter by label"
          :model-value="query.label.value"
          @update:model-value="query.update({ label: $event as string })"
        >
          <option value="">All labels</option>
          <option v-for="item in labels" :key="item.label" :value="item.label">
            {{ item.label }} ({{ item.count }})
          </option>
        </UiNativeSelect>
      </div>
      <div class="w-full sm:w-44">
        <UiNativeSelect
          aria-label="Filter by relationship"
          :model-value="query.relationship.value"
          @update:model-value="query.update({ rel: $event as string })"
        >
          <option value="">Any relationship</option>
          <option v-for="item in relationships" :key="item" :value="item">
            {{ relationshipLabels[item] }}
          </option>
        </UiNativeSelect>
      </div>
      <div class="w-full sm:w-44">
        <UiNativeSelect
          aria-label="Filter by missing details"
          :model-value="query.missing.value"
          @update:model-value="query.update({ missing: $event as string })"
        >
          <option value="">Any details</option>
          <option value="email">Missing email</option>
          <option value="phone">Missing phone</option>
          <option value="company">Missing company</option>
          <option value="groups">Not in a group</option>
        </UiNativeSelect>
      </div>
      <UiButton
        variant="outline"
        :aria-pressed="query.favorites.value"
        :class="query.favorites.value && 'border-primary text-primary'"
        @click="query.update({ fav: !query.favorites.value })"
      >
        <VerdantStar :filled="query.favorites.value" />Favorites
      </UiButton>
      <UiButton v-if="query.filtering.value" variant="ghost" @click="query.clearFilters()">
        <Icon name="lucide:x" />Clear filters
      </UiButton>
      <div class="ml-auto flex flex-wrap items-center gap-2">
        <div role="group" aria-label="View" class="flex rounded-md border">
          <UiButton
            variant="ghost"
            size="icon"
            class="rounded-r-none"
            :class="query.view.value === 'table' && 'bg-accent'"
            :aria-pressed="query.view.value === 'table'"
            aria-label="Table view"
            @click="query.update({ view: 'table' }, true)"
          >
            <Icon name="lucide:table-2" />
          </UiButton>
          <UiButton
            variant="ghost"
            size="icon"
            class="rounded-l-none"
            :class="query.view.value === 'grid' && 'bg-accent'"
            :aria-pressed="query.view.value === 'grid'"
            aria-label="Card view"
            @click="query.update({ view: 'grid' }, true)"
          >
            <Icon name="lucide:layout-grid" />
          </UiButton>
        </div>
        <UiDropdownMenu>
          <UiDropdownMenuTrigger as-child>
            <UiButton variant="outline"><Icon name="lucide:columns-3" />Columns</UiButton>
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent align="end" class="w-48">
            <UiDropdownMenuLabel>Show columns</UiDropdownMenuLabel>
            <UiDropdownMenuSeparator />
            <UiDropdownMenuCheckboxItem
              v-for="column in toggleable"
              :key="column.id"
              :model-value="column.getIsVisible()"
              @update:model-value="column.toggleVisibility(!!$event)"
              @select.prevent
            >
              {{ column.columnDef.header }}
            </UiDropdownMenuCheckboxItem>
          </UiDropdownMenuContent>
        </UiDropdownMenu>
        <UiButton variant="outline" @click="importOpen = true">
          <Icon name="lucide:upload" />Import
        </UiButton>
        <UiDropdownMenu>
          <UiDropdownMenuTrigger as-child>
            <UiButton variant="outline"><Icon name="lucide:download" />Export</UiButton>
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent align="end">
            <UiDropdownMenuLabel>
              {{ selectedIds.length ? "Selected contacts" : "Contacts matching filters" }}
            </UiDropdownMenuLabel>
            <UiDropdownMenuSeparator />
            <UiDropdownMenuItem @select="exportContacts('csv')">
              <Icon name="lucide:file-spreadsheet" />CSV spreadsheet
            </UiDropdownMenuItem>
            <UiDropdownMenuItem @select="exportContacts('vcf')">
              <Icon name="lucide:contact" />vCard (.vcf)
            </UiDropdownMenuItem>
          </UiDropdownMenuContent>
        </UiDropdownMenu>
      </div>
    </div>

    <div
      v-if="selectedIds.length"
      role="region"
      aria-label="Bulk actions"
      class="flex flex-wrap items-center gap-2 rounded-lg border bg-primary/5 px-3 py-2"
    >
      <p class="mr-2 text-sm font-medium" data-testid="selected-count">
        {{ selectedIds.length }} selected
      </p>
      <UiDropdownMenu>
        <UiDropdownMenuTrigger as-child>
          <UiButton variant="outline" size="sm" :disabled="pending">
            <Icon name="lucide:users-round" />Add to group
          </UiButton>
        </UiDropdownMenuTrigger>
        <UiDropdownMenuContent align="start">
          <UiDropdownMenuItem
            v-for="group in state?.groups"
            :key="group.id"
            @select="applyBulk('add-group', group.id)"
          >
            <span :class="['size-2 rounded-full', groupColorClasses[group.color].dot]" />
            {{ group.name }}
          </UiDropdownMenuItem>
        </UiDropdownMenuContent>
      </UiDropdownMenu>
      <UiPopover>
        <UiPopoverTrigger as-child>
          <UiButton variant="outline" size="sm" :disabled="pending">
            <Icon name="lucide:tag" />Add label
          </UiButton>
        </UiPopoverTrigger>
        <UiPopoverContent align="start" class="w-64">
          <form class="flex gap-2" @submit.prevent="addLabel">
            <UiInput v-model="labelDraft" aria-label="New label" placeholder="e.g. VIP" />
            <UiButton type="submit" size="sm">Add</UiButton>
          </form>
        </UiPopoverContent>
      </UiPopover>
      <UiButton variant="outline" size="sm" :disabled="pending" @click="applyBulk('favorite')">
        <Icon name="lucide:star" />Favorite
      </UiButton>
      <UiButton variant="outline" size="sm" :disabled="pending" @click="applyBulk('archive')">
        <Icon name="lucide:archive" />Archive
      </UiButton>
      <UiButton variant="outline" size="sm" @click="exportContacts('csv')">
        <Icon name="lucide:download" />Export
      </UiButton>
      <UiButton variant="ghost" size="sm" class="ml-auto" @click="clearSelection">
        Clear selection
      </UiButton>
    </div>
    <VerdantError :message="error" />

    <p class="sr-only" role="status">{{ filteredCount }} contacts match</p>
    <div
      v-if="query.view.value === 'grid' && rows.length"
      class="grid gap-4 @lg:grid-cols-2 @4xl:grid-cols-3"
    >
      <VerdantContactCard
        v-for="row in rows"
        :key="row.id"
        :contact="row.original"
        :selected="row.getIsSelected()"
        @select="row.toggleSelected($event)"
        @favorite="favorite(row.original)"
      />
    </div>
    <VerdantEmpty
      v-else-if="query.view.value === 'grid' && !filteredCount"
      title="No contacts match these filters"
      description="Try a different search, or clear the filters to see everyone."
      icon="lucide:users-round"
    >
      <UiButton variant="outline" @click="query.clearFilters()">Clear filters</UiButton>
    </VerdantEmpty>

    <UiCard v-show="query.view.value === 'table'" class="py-2">
      <UiCardContent class="px-2">
        <ClientOnly>
          <UiTanStackTable
            ref="tableRef"
            :data="data"
            :columns="columns"
            :table-options="tableOptions"
            :initial-page-size="query.pageSize.value"
            :page-size-options="[10, 20, 50]"
            :enable-row-pinning="false"
            show-selected-count
            @ready="ready"
            @update:sorting="onSorting"
            @update:pagination="onPagination"
          >
            <template #select-header="{ table }">
              <UiCheckbox
                aria-label="Select all on this page"
                :model-value="
                  table.getIsAllPageRowsSelected()
                    ? true
                    : table.getIsSomePageRowsSelected()
                      ? 'indeterminate'
                      : false
                "
                @update:model-value="table.toggleAllPageRowsSelected(!!$event)"
              />
            </template>
            <template #select-cell="{ row }">
              <UiCheckbox
                :aria-label="`Select ${nameOf(row.original)}`"
                :model-value="row.getIsSelected()"
                @update:model-value="row.toggleSelected(!!$event)"
              />
            </template>
            <template #name-header="{ column }">
              <UiButton
                variant="ghost"
                size="sm"
                class="-ml-3"
                :aria-label="`Sort by name${column.getIsSorted() ? ', currently ' + (column.getIsSorted() === 'asc' ? 'ascending' : 'descending') : ''}`"
                @click="column.toggleSorting(column.getIsSorted() === 'asc')"
              >
                Name
                <Icon
                  :name="
                    column.getIsSorted() === 'asc'
                      ? 'lucide:arrow-up'
                      : column.getIsSorted() === 'desc'
                        ? 'lucide:arrow-down'
                        : 'lucide:arrow-up-down'
                  "
                  class="size-3.5 opacity-70"
                />
              </UiButton>
            </template>
            <template #name-cell="{ row }">
              <div class="flex min-w-48 items-center gap-3">
                <VerdantContactAvatar :contact="row.original" size="sm" />
                <div class="min-w-0">
                  <NuxtLink
                    :to="'/contacts/' + row.original.id"
                    class="block truncate font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
                    >{{ nameOf(row.original) }}</NuxtLink
                  >
                  <p class="truncate text-xs text-muted-foreground">
                    {{ row.original.jobTitle }}
                  </p>
                </div>
              </div>
            </template>
            <template #company-header="{ column }">
              <UiButton
                variant="ghost"
                size="sm"
                class="-ml-3"
                @click="column.toggleSorting(column.getIsSorted() === 'asc')"
              >
                Company
                <Icon
                  :name="
                    column.getIsSorted() === 'asc'
                      ? 'lucide:arrow-up'
                      : column.getIsSorted() === 'desc'
                        ? 'lucide:arrow-down'
                        : 'lucide:arrow-up-down'
                  "
                  class="size-3.5 opacity-70"
                />
              </UiButton>
            </template>
            <template #email-cell="{ row }">
              <span class="text-sm">{{ primaryEmail(row.original) || "—" }}</span>
            </template>
            <template #phone-cell="{ row }">
              <span class="text-sm whitespace-nowrap">{{ primaryPhone(row.original) || "—" }}</span>
            </template>
            <template #groups-cell="{ row }">
              <ul class="flex flex-wrap gap-1">
                <li v-for="id in row.original.groupIds.slice(0, 2)" :key="id">
                  <span
                    :class="[
                      'inline-flex rounded-md px-1.5 py-0.5 text-xs font-medium',
                      groupColorClasses[state?.groups.find((g) => g.id === id)?.color ?? 'slate']
                        .soft,
                    ]"
                    >{{ groupName(id) }}</span
                  >
                </li>
                <li v-if="row.original.groupIds.length > 2" class="text-xs text-muted-foreground">
                  +{{ row.original.groupIds.length - 2 }}
                </li>
              </ul>
            </template>
            <template #labels-cell="{ row }">
              <span class="text-sm">{{ row.original.labels.join(", ") || "—" }}</span>
            </template>
            <template #relationship-header="{ column }">
              <UiButton
                variant="ghost"
                size="sm"
                class="-ml-3"
                @click="column.toggleSorting(column.getIsSorted() === 'asc')"
              >
                Relationship
                <Icon
                  :name="
                    column.getIsSorted() === 'asc'
                      ? 'lucide:arrow-up'
                      : column.getIsSorted() === 'desc'
                        ? 'lucide:arrow-down'
                        : 'lucide:arrow-up-down'
                  "
                  class="size-3.5 opacity-70"
                />
              </UiButton>
            </template>
            <template #relationship-cell="{ row }">
              <UiBadge variant="outline">{{
                relationshipLabels[row.original.relationship]
              }}</UiBadge>
            </template>
            <template #lastContacted-header="{ column }">
              <UiButton
                variant="ghost"
                size="sm"
                class="-ml-3"
                @click="column.toggleSorting(column.getIsSorted() === 'asc')"
              >
                Last contact
                <Icon
                  :name="
                    column.getIsSorted() === 'asc'
                      ? 'lucide:arrow-up'
                      : column.getIsSorted() === 'desc'
                        ? 'lucide:arrow-down'
                        : 'lucide:arrow-up-down'
                  "
                  class="size-3.5 opacity-70"
                />
              </UiButton>
            </template>
            <template #lastContacted-cell="{ row }">
              <span class="text-sm whitespace-nowrap text-muted-foreground">{{
                relativeDay(row.original.lastContactedAt)
              }}</span>
            </template>
            <template #createdAt-cell="{ row }">
              <span class="text-sm whitespace-nowrap text-muted-foreground">{{
                relativeDay(row.original.createdAt)
              }}</span>
            </template>
            <template #favorite-header>
              <span class="sr-only">Favorite</span>
            </template>
            <template #favorite-cell="{ row }">
              <UiButton
                variant="ghost"
                size="icon-sm"
                :aria-label="
                  row.original.favorite
                    ? `Remove ${nameOf(row.original)} from favorites`
                    : `Add ${nameOf(row.original)} to favorites`
                "
                :aria-pressed="row.original.favorite"
                @click="favorite(row.original)"
              >
                <VerdantStar :filled="row.original.favorite" />
              </UiButton>
            </template>
            <template #actions-header><span class="sr-only">Actions</span></template>
            <template #actions-cell="{ row }">
              <UiDropdownMenu>
                <UiDropdownMenuTrigger as-child>
                  <UiButton
                    variant="ghost"
                    size="icon-sm"
                    :aria-label="`Actions for ${nameOf(row.original)}`"
                  >
                    <Icon name="lucide:ellipsis" />
                  </UiButton>
                </UiDropdownMenuTrigger>
                <UiDropdownMenuContent align="end" class="w-48">
                  <UiDropdownMenuItem as-child>
                    <NuxtLink :to="'/contacts/' + row.original.id">
                      <Icon name="lucide:external-link" />Open
                    </NuxtLink>
                  </UiDropdownMenuItem>
                  <UiDropdownMenuItem
                    :disabled="!primaryEmail(row.original)"
                    @select="copyEmail(row.original)"
                  >
                    <Icon name="lucide:copy" />Copy email
                  </UiDropdownMenuItem>
                  <UiDropdownMenuItem @select="favorite(row.original)">
                    <Icon name="lucide:star" />{{
                      row.original.favorite ? "Remove favorite" : "Add favorite"
                    }}
                  </UiDropdownMenuItem>
                  <UiDropdownMenuSeparator />
                  <UiDropdownMenuItem @select="archive(row.original)">
                    <Icon name="lucide:archive" />Archive
                  </UiDropdownMenuItem>
                </UiDropdownMenuContent>
              </UiDropdownMenu>
            </template>
            <template #empty>
              <VerdantEmpty
                class="border-0"
                title="No contacts match these filters"
                description="Try a different search, or clear the filters to see everyone."
                icon="lucide:users-round"
              >
                <UiButton variant="outline" @click="query.clearFilters()">Clear filters</UiButton>
              </VerdantEmpty>
            </template>
          </UiTanStackTable>
          <template #fallback><UiSkeleton class="h-96" /></template>
        </ClientOnly>
      </UiCardContent>
    </UiCard>

    <div
      v-if="query.view.value === 'grid'"
      class="flex flex-wrap items-center justify-between gap-3"
    >
      <p class="text-sm text-muted-foreground">
        {{ filteredCount }} {{ filteredCount === 1 ? "contact" : "contacts" }}
        <template v-if="tableRef">
          · Page {{ tableRef.pagination.pageIndex + 1 }} of
          {{ Math.max(1, tableRef.table.getPageCount()) }}
        </template>
      </p>
      <div class="flex gap-2">
        <UiButton
          variant="outline"
          size="sm"
          :disabled="!tableRef?.table.getCanPreviousPage()"
          @click="tableRef?.table.previousPage()"
        >
          Previous
        </UiButton>
        <UiButton
          variant="outline"
          size="sm"
          :disabled="!tableRef?.table.getCanNextPage()"
          @click="tableRef?.table.nextPage()"
        >
          Next
        </UiButton>
      </div>
    </div>
    <VerdantImportDialog v-model:open="importOpen" />
  </section>
</template>
