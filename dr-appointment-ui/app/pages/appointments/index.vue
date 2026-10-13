<script setup lang="ts">
  import { appointmentsCsv } from "#shared/csv";
  import { formatDate, formatRange } from "#shared/format";
  import { fullName } from "#shared/patients";
  import { appointmentStatuses } from "#shared/types";
  import {
    downloadFile,
    errorMessage,
    relativeDay,
    statusMeta,
    visitColorClasses,
  } from "~/utils/demo";
  usePageSeo({ title: "Appointments" });
  const { state, bulk } = useDemo();
  const query = useAppointmentsTable();
  const uid = useId();
  const search = ref(query.q.value);
  const selected = ref<string[]>([]);
  const pending = ref(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  watch(search, (value) => {
    clearTimeout(timer);
    timer = setTimeout(() => query.update({ q: value.trim() }), 250);
  });
  watch(query.q, (value) => {
    if (value !== search.value.trim()) search.value = value;
  });
  // A new filter or page changes the rows; a selection should not linger on rows that moved.
  watch(
    () => query.rows.value.map((item) => item.id).join(),
    () => {
      const visible = new Set(query.rows.value.map((item) => item.id));
      selected.value = selected.value.filter((id) => visible.has(id));
    }
  );
  const patients = computed(
    () => new Map((state.value?.patients ?? []).map((item) => [item.id, item]))
  );
  const providers = computed(
    () => new Map((state.value?.providers ?? []).map((item) => [item.id, item]))
  );
  const visits = computed(
    () => new Map((state.value?.visitTypes ?? []).map((item) => [item.id, item]))
  );
  const timeFormat = computed(() => state.value?.preferences.timeFormat ?? "12h");
  const allSelected = computed(
    () => query.rows.value.length > 0 && selected.value.length === query.rows.value.length
  );
  function toggleAll(value: boolean | "indeterminate") {
    selected.value = value === true ? query.rows.value.map((item) => item.id) : [];
  }
  function toggle(id: string, value: boolean | "indeterminate") {
    selected.value =
      value === true
        ? [...new Set([...selected.value, id])]
        : selected.value.filter((item) => item !== id);
  }
  async function apply(action: "confirm" | "cancel") {
    pending.value = true;
    try {
      const result = await bulk(action, selected.value);
      const noun = result.ids.length === 1 ? "visit" : "visits";
      useSonner.success(
        `${result.ids.length} ${noun} ${action === "confirm" ? "confirmed" : "cancelled"}`
      );
      if (result.skipped.length)
        useSonner.info(`${result.skipped.length} could not change from their current status.`);
      selected.value = [];
    } catch (cause) {
      useSonner.error(errorMessage(cause));
    } finally {
      pending.value = false;
    }
  }
  function exportCsv() {
    if (!state.value) return;
    downloadFile(
      "appointments.csv",
      appointmentsCsv(query.filtered.value, {
        patients: state.value.patients,
        providers: state.value.providers,
        visitTypes: state.value.visitTypes,
      })
    );
  }
  const sortLabel = (key: string) =>
    query.sort.value.key === key ? (query.sort.value.desc ? "descending" : "ascending") : "none";
</script>
<template>
  <div class="page-shell">
    <MendlyPageHeader
      title="Appointments"
      description="Search, filter and act on every visit. Your view is saved in the address bar."
    >
      <UiButton variant="outline" @click="exportCsv"
        ><Icon name="lucide:download" />Export CSV</UiButton
      >
      <UiButton to="/appointments/new"
        ><Icon name="lucide:calendar-plus" />Book appointment</UiButton
      >
    </MendlyPageHeader>

    <form class="mb-4 grid gap-3 @2xl:grid-cols-6" role="search" @submit.prevent>
      <div class="space-y-1.5 @2xl:col-span-2">
        <UiLabel :for="`${uid}-q`">Search</UiLabel>
        <div class="relative">
          <Icon
            name="lucide:search"
            class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <UiInput
            :id="`${uid}-q`"
            v-model="search"
            type="search"
            class="pl-9"
            placeholder="Patient, reference or reason"
          />
        </div>
      </div>
      <div class="space-y-1.5">
        <UiLabel :for="`${uid}-range`">When</UiLabel>
        <UiNativeSelect
          :id="`${uid}-range`"
          :model-value="query.range.value"
          @update:model-value="query.update({ range: $event === 'upcoming' ? '' : String($event) })"
        >
          <option v-for="item in ranges" :key="item.value" :value="item.value">
            {{ item.label }}
          </option>
        </UiNativeSelect>
      </div>
      <div class="space-y-1.5">
        <UiLabel :for="`${uid}-status`">Status</UiLabel>
        <UiNativeSelect
          :id="`${uid}-status`"
          :model-value="query.status.value"
          @update:model-value="query.update({ status: String($event) })"
        >
          <option value="">All statuses</option>
          <option v-for="item in appointmentStatuses" :key="item" :value="item">
            {{ statusMeta[item].label }}
          </option>
        </UiNativeSelect>
      </div>
      <div class="space-y-1.5">
        <UiLabel :for="`${uid}-provider`">Provider</UiLabel>
        <UiNativeSelect
          :id="`${uid}-provider`"
          :model-value="query.provider.value"
          @update:model-value="query.update({ provider: String($event) })"
        >
          <option value="">All providers</option>
          <option v-for="item in state?.providers" :key="item.id" :value="item.id">
            {{ item.name }}
          </option>
        </UiNativeSelect>
      </div>
      <div class="space-y-1.5">
        <UiLabel :for="`${uid}-type`">Visit type</UiLabel>
        <UiNativeSelect
          :id="`${uid}-type`"
          :model-value="query.visitType.value"
          @update:model-value="query.update({ type: String($event) })"
        >
          <option value="">All visit types</option>
          <option v-for="item in state?.visitTypes" :key="item.id" :value="item.id">
            {{ item.name }}
          </option>
        </UiNativeSelect>
      </div>
    </form>

    <div class="mb-3 flex min-h-9 flex-wrap items-center justify-between gap-2">
      <p class="text-sm text-muted-foreground" role="status" aria-live="polite">
        {{ query.filtered.value.length }}
        {{ query.filtered.value.length === 1 ? "visit" : "visits" }}
        <template v-if="query.filtering.value">
          ·
          <button
            type="button"
            class="text-primary underline underline-offset-2"
            @click="query.clearFilters()"
          >
            Clear filters
          </button>
        </template>
      </p>
      <div v-if="selected.length" class="flex items-center gap-2">
        <span class="text-sm">{{ selected.length }} selected</span>
        <UiButton size="sm" variant="outline" :loading="pending" @click="apply('confirm')">
          <Icon name="lucide:calendar-check" />Confirm
        </UiButton>
        <UiButton size="sm" variant="outline" :loading="pending" @click="apply('cancel')">
          <Icon name="lucide:circle-x" />Cancel visits
        </UiButton>
      </div>
    </div>

    <div v-if="query.rows.value.length" class="overflow-x-auto rounded-lg border">
      <UiTable>
        <UiTableHeader>
          <UiTableRow>
            <UiTableHead class="w-10">
              <UiCheckbox
                :model-value="allSelected"
                aria-label="Select all visits on this page"
                @update:model-value="toggleAll"
              />
            </UiTableHead>
            <UiTableHead
              v-for="column in [
                { key: 'when', label: 'When' },
                { key: 'patient', label: 'Patient' },
              ]"
              :key="column.key"
              :aria-sort="sortLabel(column.key)"
            >
              <button
                type="button"
                class="inline-flex items-center gap-1 font-medium"
                @click="query.toggleSort(column.key as 'when' | 'patient')"
              >
                {{ column.label }}
                <Icon
                  :name="
                    sortLabel(column.key) === 'none'
                      ? 'lucide:arrow-up-down'
                      : sortLabel(column.key) === 'ascending'
                        ? 'lucide:arrow-up'
                        : 'lucide:arrow-down'
                  "
                  class="size-3.5 opacity-60"
                />
              </button>
            </UiTableHead>
            <UiTableHead>Visit</UiTableHead>
            <UiTableHead :aria-sort="sortLabel('provider')">
              <button
                type="button"
                class="inline-flex items-center gap-1 font-medium"
                @click="query.toggleSort('provider')"
              >
                Provider <Icon name="lucide:arrow-up-down" class="size-3.5 opacity-60" />
              </button>
            </UiTableHead>
            <UiTableHead :aria-sort="sortLabel('status')">
              <button
                type="button"
                class="inline-flex items-center gap-1 font-medium"
                @click="query.toggleSort('status')"
              >
                Status <Icon name="lucide:arrow-up-down" class="size-3.5 opacity-60" />
              </button>
            </UiTableHead>
          </UiTableRow>
        </UiTableHeader>
        <UiTableBody>
          <UiTableRow v-for="item in query.rows.value" :key="item.id">
            <UiTableCell>
              <UiCheckbox
                :model-value="selected.includes(item.id)"
                :aria-label="`Select ${patients.get(item.patientId) ? fullName(patients.get(item.patientId)!) : 'visit'}`"
                @update:model-value="toggle(item.id, $event)"
              />
            </UiTableCell>
            <UiTableCell class="whitespace-nowrap">
              <p class="font-medium">{{ relativeDay(item.date) }}</p>
              <p class="text-xs text-muted-foreground tabular-nums">
                {{ formatRange(item.start, item.end, timeFormat) }} ·
                {{ formatDate(item.date, "short") }}
              </p>
            </UiTableCell>
            <UiTableCell>
              <NuxtLink :to="'/appointments/' + item.id" class="font-medium hover:underline">
                {{
                  patients.get(item.patientId) ? fullName(patients.get(item.patientId)!) : "Unknown"
                }}
              </NuxtLink>
              <p class="text-xs text-muted-foreground">{{ item.reference }}</p>
            </UiTableCell>
            <UiTableCell>
              <span class="flex items-center gap-2">
                <span
                  v-if="visits.get(item.visitTypeId)"
                  :class="[
                    'size-2 shrink-0 rounded-full',
                    visitColorClasses[visits.get(item.visitTypeId)!.color].dot,
                  ]"
                  aria-hidden="true"
                />
                {{ visits.get(item.visitTypeId)?.name }}
              </span>
              <p class="text-xs text-muted-foreground">{{ item.reason }}</p>
            </UiTableCell>
            <UiTableCell class="whitespace-nowrap">{{
              providers.get(item.providerId)?.name
            }}</UiTableCell>
            <UiTableCell><MendlyStatusBadge :status="item.status" /></UiTableCell>
          </UiTableRow>
        </UiTableBody>
      </UiTable>
    </div>
    <MendlyEmpty
      v-else
      title="No visits match"
      description="Try a wider date range or clear the filters."
      icon="lucide:calendar-search"
    >
      <UiButton variant="outline" @click="query.clearFilters()">Clear filters</UiButton>
    </MendlyEmpty>

    <nav
      v-if="query.pageCount.value > 1"
      class="mt-4 flex items-center justify-between"
      aria-label="Pagination"
    >
      <p class="text-sm text-muted-foreground">
        Page {{ query.page.value }} of {{ query.pageCount.value }}
      </p>
      <div class="flex gap-2">
        <UiButton
          variant="outline"
          size="sm"
          :disabled="query.page.value <= 1"
          @click="query.update({ page: query.page.value - 1 })"
        >
          <Icon name="lucide:chevron-left" />Previous
        </UiButton>
        <UiButton
          variant="outline"
          size="sm"
          :disabled="query.page.value >= query.pageCount.value"
          @click="query.update({ page: query.page.value + 1 })"
        >
          Next<Icon name="lucide:chevron-right" />
        </UiButton>
      </div>
    </nav>
  </div>
</template>
