<template>
  <div>
    <div class="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-center">
      <div class="w-full md:w-[300px]">
        <UiVeeInput v-model="search" icon="ri:search-2-line" placeholder="Search contacts" />
      </div>
      <div class="flex items-center gap-3">
        <TransitionScale>
          <UiButton v-if="selectedValues && selectedValues.length" variant="outline">
            <Icon
              name="ri:delete-bin-7-line"
              class="-ms-1.5 size-5 text-muted-foreground/60"
              aria-hidden="true"
            />
            Delete ({{ selectedValues.length }})
          </UiButton>
        </TransitionScale>
        <UiDropdownMenu>
          <UiDropdownMenuTrigger as-child>
            <UiButton variant="outline">
              <Icon name="ri:filter-3-line" class="size-5 text-muted-foreground/60" />
              <span class="">Filter</span>
            </UiButton>
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent>
            <UiDropdownMenuLabel>Filters</UiDropdownMenuLabel>
            <UiDropdownMenuSeparator />
            <UiDropdownMenuRadioGroup v-model="filter">
              <UiDropdownMenuRadioItem value="active">Active</UiDropdownMenuRadioItem>
              <UiDropdownMenuRadioItem value="inactive">Inactive</UiDropdownMenuRadioItem>
            </UiDropdownMenuRadioGroup>
          </UiDropdownMenuContent>
        </UiDropdownMenu>
        <UiButton variant="outline">
          <Icon
            name="ri:bard-line"
            class="-ms-1.5 size-5 text-muted-foreground/60"
            aria-hidden="true"
          />
          New Filter
        </UiButton>
      </div>
    </div>

    <UiDatatable
      class="nowrap hover row-border"
      :options
      :data="data?.data"
      @select="handleRowSelect"
      @deselect="handleRowSelect"
      @ready="tableRef = $event"
    >
      <template #column-status="{ cellData }">
        <UiBadge
          class="gap-1 px-2 py-0.5 text-sm"
          :class="[cellData === 'Inactive' ? 'text-muted-foreground' : 'text-primary-foreground']"
          variant="outline"
        >
          <UiIcon
            v-if="cellData === 'Active'"
            name="ri:check-line"
            class="size-[14px] text-emerald-500"
          />
          <span v-else>- </span>
          {{ cellData }}</UiBadge
        >
      </template>
      <template #column-verified="{ cellData }">
        <div>
          <span class="sr-only">
            {{ cellData ? "Verified" : "Not Verified" }}
          </span>
          <UiIcon
            name="ri:verified-badge-fill"
            :class="['size-5', cellData == true ? 'text-emerald-600' : 'text-muted-foreground/50']"
            aria-hidden="true"
          />
        </div>
      </template>
      <template #column-referral="{ cellData }">
        <div class="flex items-center gap-3">
          <img
            class="rounded-full"
            :src="cellData.image"
            width="20"
            height="20"
            :alt="cellData.name"
          />
          <div class="text-muted-foreground">{{ cellData.name }}</div>
        </div>
      </template>
      <template #column-value="{ cellData }">
        <UiTooltip>
          <UiTooltipTrigger as-child>
            <div class="flex h-full w-full items-center">
              <UiProgress class="h-1 max-w-14" :model-value="cellData" />
            </div>
          </UiTooltipTrigger>
          <UiTooltipContent align="start">
            <p>{{ cellData }}%</p>
          </UiTooltipContent>
        </UiTooltip>
      </template>
      <template #column-actions="{ rowData }">
        <UiDropdownMenu>
          <UiDropdownMenuTrigger as-child>
            <UiButton size="icon" variant="ghost">
              <UiIcon name="ri:more-line" class="size-5" />
            </UiButton>
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent align="end" class="w-auto">
            <UiDropdownMenuGroup>
              <UiDropdownMenuItem>
                {{ rowData.status === "Active" ? "Deactivate contact" : "Activate contact" }}
              </UiDropdownMenuItem>
              <UiDropdownMenuItem>
                {{ rowData.verified ? "Unverify contact" : "Verify contact" }}
              </UiDropdownMenuItem>
            </UiDropdownMenuGroup>
            <UiDropdownMenuSeparator />
            <UiDropdownMenuItem class="focus:bg-destructive/10 focus:text-destructive">
              Delete
            </UiDropdownMenuItem>
          </UiDropdownMenuContent>
        </UiDropdownMenu>
      </template>
    </UiDatatable>

    <div class="mt-4 flex items-center justify-between gap-3">
      <div class="text-sm text-muted-foreground">
        Page <span class="font-medium text-foreground">{{ data?.page }}</span> of
        <span class="font-medium text-foreground">{{ data?.totalPages }}</span>
      </div>
      <div>
        <UiPagination
          v-model:page="page"
          :total="data?.total"
          :items-per-page="10"
          class="flex items-center gap-2"
        >
          <UiPaginationPrev as-child>
            <UiButton size="sm" variant="outline">Previous</UiButton>
          </UiPaginationPrev>
          <UiPaginationNext as-child>
            <UiButton size="sm" variant="outline">Next</UiButton>
          </UiPaginationNext>
        </UiPagination>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useRouteQuery } from "@vueuse/router";
  import DT from "datatables.net";
  import type { Config } from "datatables.net";

  const tableRef = shallowRef<InstanceType<typeof DT> | null>(null);
  const filter = useRouteQuery<"active" | "inactive">("filter");
  const search = useRouteQuery<string>("search");
  const page = useRouteQuery<number>("page", 1, { transform: Number });
  const { data } = await useFetch("/api/contacts", {
    query: { filter, search, page },
  });

  const options: Config = {
    columns: [
      {
        data: null,
        orderable: false,
        searchable: false,
        render: DT?.render?.select(),
        className: "no-export no-column",
      },
      { data: "name", title: "Name" },
      { data: "id", title: "ID" },
      { data: "status", title: "Status", name: "status" },
      { data: "location", title: "Location" },
      { data: "verified", title: "Verified", name: "verified" },
      { data: "referral", title: "Referral", name: "referral" },
      { data: "value", title: "Value", name: "value" },
      { data: null, title: "", name: "actions", orderable: false },
    ],
    paging: false,
    select: {
      style: "multi",
      selector: "td:first-child",
    },
    layout: {
      topStart: null,
      topEnd: null,
      bottomStart: null,
      bottomEnd: null,
    },
  };
  const selectedValues = ref<string[]>([]);

  const handleClientDeSelection = (client: string[]) => {
    selectedValues.value = selectedValues.value.filter((c) => !client.includes(c));
  };
  const handleClientSelection = (client: string[]) => {
    selectedValues.value = [...selectedValues.value, ...client];
  };

  const handleRowSelect = (
    e: { event: { type: string } },
    dt: any,
    type: any,
    indexes: Array<number>
  ) => {
    const selectedList = tableRef?.value?.rows(indexes).data().pluck("id").toArray() as string[];
    if (e.event?.type === "select") {
      handleClientSelection(selectedList);
    } else {
      handleClientDeSelection(selectedList);
    }
  };
</script>

<style scoped>
  :deep(.datatable) {
    .dt-select-checkbox {
      @apply form-checkbox size-4 cursor-pointer rounded-sm border-border bg-background checked:bg-primary checked:text-primary indeterminate:bg-primary hover:indeterminate:bg-primary focus:outline-none focus:ring-ring focus:ring-offset-background;
    }
    .dt-layout-full {
      @apply overflow-x-auto;
    }
    thead {
      tr th {
        @apply bg-muted;
      }
    }
  }
</style>
