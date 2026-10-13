<script setup lang="ts">
  import { patientsCsv } from "#shared/csv";
  import { formatDate } from "#shared/format";
  import { ageOn, fullName, searchPatients } from "#shared/patients";
  import { holdsSlot } from "#shared/schedule";
  import { downloadFile, today } from "~/utils/demo";
  usePageSeo({ title: "Patients" });
  const route = useRoute();
  const router = useRouter();
  const { state } = useDemo();
  const uid = useId();
  const q = computed(() => (typeof route.query.q === "string" ? route.query.q : ""));
  const page = computed(() =>
    Math.max(
      1,
      Number.parseInt(typeof route.query.page === "string" ? route.query.page : "1", 10) || 1
    )
  );
  const search = ref(q.value);
  let timer: ReturnType<typeof setTimeout> | undefined;
  watch(search, (value) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const query: Record<string, string> = {};
      if (value.trim()) query.q = value.trim();
      router.replace({ query });
    }, 250);
  });
  const pageSize = computed(() => state.value?.preferences.pageSize ?? 20);

  /** Next upcoming and most recent past visit for each patient, computed once per change. */
  const visitMap = computed(() => {
    const map = new Map<string, { next?: string; last?: string }>();
    for (const item of state.value?.appointments ?? []) {
      if (!holdsSlot(item.status) && item.status !== "no-show") continue;
      const entry = map.get(item.patientId) ?? {};
      if (item.date >= today && holdsSlot(item.status) && (!entry.next || item.date < entry.next))
        entry.next = item.date;
      if (
        item.date < today &&
        item.status === "completed" &&
        (!entry.last || item.date > entry.last)
      )
        entry.last = item.date;
      map.set(item.patientId, entry);
    }
    return map;
  });
  const results = computed(() =>
    searchPatients(state.value?.patients ?? [], q.value).sort((a, b) =>
      fullName(a).localeCompare(fullName(b))
    )
  );
  const pageCount = computed(() => Math.max(1, Math.ceil(results.value.length / pageSize.value)));
  const current = computed(() => Math.min(page.value, pageCount.value));
  const rows = computed(() =>
    results.value.slice((current.value - 1) * pageSize.value, current.value * pageSize.value)
  );
  function goPage(next: number) {
    router.replace({ query: { ...route.query, page: String(next) } });
  }
  function exportCsv() {
    if (state.value)
      downloadFile("patients.csv", patientsCsv(results.value, state.value.providers));
  }
  const providerName = (id: string) =>
    state.value?.providers.find((item) => item.id === id)?.name ?? "";
</script>
<template>
  <div class="page-shell">
    <MendlyPageHeader title="Patients" description="Everyone your clinic looks after.">
      <UiButton variant="outline" @click="exportCsv"
        ><Icon name="lucide:download" />Export CSV</UiButton
      >
      <UiButton to="/patients/new"><Icon name="lucide:user-plus" />Add patient</UiButton>
    </MendlyPageHeader>

    <form class="mb-4 max-w-md space-y-1.5" role="search" @submit.prevent>
      <UiLabel :for="`${uid}-q`">Search patients</UiLabel>
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
          placeholder="Name, email, phone, insurance or tag"
        />
      </div>
    </form>
    <p class="mb-3 text-sm text-muted-foreground" role="status" aria-live="polite">
      {{ results.length }} {{ results.length === 1 ? "patient" : "patients" }}
    </p>

    <div v-if="rows.length" class="overflow-x-auto rounded-lg border">
      <UiTable>
        <UiTableHeader>
          <UiTableRow>
            <UiTableHead>Patient</UiTableHead>
            <UiTableHead>Contact</UiTableHead>
            <UiTableHead>Insurance</UiTableHead>
            <UiTableHead>Preferred provider</UiTableHead>
            <UiTableHead>Next visit</UiTableHead>
            <UiTableHead>Last visit</UiTableHead>
          </UiTableRow>
        </UiTableHeader>
        <UiTableBody>
          <UiTableRow v-for="patient in rows" :key="patient.id">
            <UiTableCell>
              <NuxtLink :to="'/patients/' + patient.id" class="flex items-center gap-3">
                <MendlyAvatar :name="fullName(patient)" />
                <span>
                  <span class="block font-medium hover:underline">{{ fullName(patient) }}</span>
                  <span class="block text-xs text-muted-foreground">
                    {{ ageOn(patient.birthday, today) ?? "–" }} yrs
                    <template v-for="tag in patient.tags.slice(0, 2)" :key="tag">
                      · {{ tag }}</template
                    >
                  </span>
                </span>
              </NuxtLink>
            </UiTableCell>
            <UiTableCell class="text-sm">
              <p>{{ patient.email }}</p>
              <p class="text-muted-foreground tabular-nums">{{ patient.phone }}</p>
            </UiTableCell>
            <UiTableCell class="text-sm">{{ patient.insurance || "–" }}</UiTableCell>
            <UiTableCell class="text-sm">{{
              providerName(patient.preferredProviderId) || "–"
            }}</UiTableCell>
            <UiTableCell class="text-sm whitespace-nowrap">
              {{
                visitMap.get(patient.id)?.next
                  ? formatDate(visitMap.get(patient.id)!.next!, "short")
                  : "–"
              }}
            </UiTableCell>
            <UiTableCell class="text-sm whitespace-nowrap">
              {{
                visitMap.get(patient.id)?.last
                  ? formatDate(visitMap.get(patient.id)!.last!, "short")
                  : "–"
              }}
            </UiTableCell>
          </UiTableRow>
        </UiTableBody>
      </UiTable>
    </div>
    <MendlyEmpty
      v-else
      title="No patients match"
      description="Check the spelling, or add this person as a new patient."
      icon="lucide:user-search"
    >
      <UiButton to="/patients/new">Add patient</UiButton>
    </MendlyEmpty>

    <nav
      v-if="pageCount > 1"
      class="mt-4 flex items-center justify-between"
      aria-label="Pagination"
    >
      <p class="text-sm text-muted-foreground">Page {{ current }} of {{ pageCount }}</p>
      <div class="flex gap-2">
        <UiButton variant="outline" size="sm" :disabled="current <= 1" @click="goPage(current - 1)">
          <Icon name="lucide:chevron-left" />Previous
        </UiButton>
        <UiButton
          variant="outline"
          size="sm"
          :disabled="current >= pageCount"
          @click="goPage(current + 1)"
        >
          Next<Icon name="lucide:chevron-right" />
        </UiButton>
      </div>
    </nav>
  </div>
</template>
