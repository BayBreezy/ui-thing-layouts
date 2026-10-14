<script setup lang="ts">
  import { resolveRange } from "#shared/dates";
  import {
    channelLabels,
    countryNames,
    deviceLabels,
    describeRange,
    presetLabels,
  } from "#shared/format";
  import { savedReportSchema } from "#shared/schemas";
  import type { SavedReport } from "#shared/types";
  import { clone, errorMessage, newId, now } from "~/utils/demo";

  usePageSeo({ title: "Reports" });
  const { state, site, saveReport, removeReport } = useDemo();
  const { pending, error, run } = useAction();
  const uid = useId();
  const name = ref("");
  const nameError = ref("");
  const removing = ref<SavedReport | null>(null);
  const confirmOpen = ref(false);
  const reports = computed(
    () => state.value?.reports.filter((item) => item.siteId === site.value?.id) ?? []
  );

  const rangeText = (report: SavedReport) => {
    if (report.range.preset === "custom") {
      const { from, to } = resolveRange(report.range);
      return describeRange(from, to);
    }
    return presetLabels[report.range.preset];
  };
  function summary(report: SavedReport) {
    const parts: string[] = [];
    if (report.segment !== "all")
      parts.push(
        report.segment === "mobile"
          ? "Mobile users"
          : report.segment === "returning"
            ? "Returning users"
            : channelLabels[report.segment]
      );
    const f = report.filters;
    if (f.channel) parts.push(channelLabels[f.channel]);
    if (f.device) parts.push(deviceLabels[f.device]);
    if (f.country) parts.push(countryNames[f.country] ?? f.country);
    if (f.page) parts.push(f.page);
    return parts.length ? parts.join(" · ") : "All traffic";
  }

  async function saveCurrent() {
    const draft = state.value;
    if (!draft || !site.value) return;
    const record: SavedReport = {
      id: newId("report"),
      siteId: site.value.id,
      name: name.value.trim(),
      range: clone(draft.preferences.range),
      compare: draft.preferences.compare,
      segment: draft.preferences.segment,
      filters: clone(draft.preferences.filters),
      digest: "off",
      createdAt: now(),
    };
    nameError.value = "";
    try {
      await savedReportSchema.validate(record, { abortEarly: false });
    } catch (cause) {
      nameError.value = (cause as { errors?: string[] }).errors?.[0] ?? "Enter a name";
      return;
    }
    const saved = await run(() => saveReport(record));
    if (saved) {
      name.value = "";
      useSonner.success("Report saved", { description: saved.name });
    }
  }
  function ask(report: SavedReport) {
    removing.value = report;
    confirmOpen.value = true;
  }
  async function open(report: SavedReport) {
    await openOverview(() => {
      const prefs = state.value?.preferences;
      if (!prefs) return;
      prefs.siteId = report.siteId;
      prefs.range = clone(report.range);
      prefs.compare = report.compare;
      prefs.segment = report.segment;
      prefs.filters = clone(report.filters);
    });
  }
  async function duplicate(report: SavedReport) {
    const saved = await run(() =>
      saveReport({
        ...clone(report),
        id: newId("report"),
        name: `${report.name} copy`,
        createdAt: now(),
      })
    );
    if (saved) useSonner.success("Report duplicated", { description: saved.name });
  }
  async function setDigest(report: SavedReport, digest: SavedReport["digest"]) {
    const saved = await run(() => saveReport({ ...clone(report), digest }));
    if (saved)
      useSonner.success(digest === "off" ? "Digest turned off" : `Digest set to ${digest}`, {
        description: "Demo only. No email is sent.",
      });
  }
  async function confirmRemove() {
    const report = removing.value;
    if (!report) return;
    try {
      await removeReport(report.id);
      useSonner.success("Report deleted", { description: report.name });
    } catch (cause) {
      useSonner.error(errorMessage(cause));
    } finally {
      confirmOpen.value = false;
    }
  }
</script>
<template>
  <div class="page-shell">
    <BeaconPageHeader
      title="Reports"
      description="Save a view of your analytics (date range, segment and filters) and come back to it in one click."
    />
    <UiCard class="mb-6">
      <UiCardHeader>
        <UiCardTitle as="h2" class="text-base">Save the current view</UiCardTitle>
        <UiCardDescription>
          Captures whatever range, segment and filters are active on the overview right now.
        </UiCardDescription>
      </UiCardHeader>
      <UiCardContent>
        <form class="flex flex-wrap items-start gap-3" novalidate @submit.prevent="saveCurrent">
          <div class="min-w-64 flex-1 space-y-1.5">
            <UiLabel :for="`${uid}-name`">Report name</UiLabel>
            <UiInput
              :id="`${uid}-name`"
              v-model="name"
              placeholder="Mobile organic, last 30 days"
              :aria-invalid="Boolean(nameError)"
              :aria-describedby="nameError ? `${uid}-name-error` : undefined"
            />
            <p v-if="nameError" :id="`${uid}-name-error`" class="text-sm text-destructive">
              {{ nameError }}
            </p>
          </div>
          <UiButton type="submit" class="mt-6" :loading="pending">
            <Icon name="lucide:bookmark-plus" />Save report
          </UiButton>
        </form>
        <BeaconError :message="error" class="mt-3" />
      </UiCardContent>
    </UiCard>

    <ul v-if="reports.length" class="grid gap-4 @3xl:grid-cols-2" aria-label="Saved reports">
      <li v-for="report in reports" :key="report.id">
        <UiCard class="h-full">
          <UiCardHeader>
            <UiCardTitle as="h2" class="text-base">{{ report.name }}</UiCardTitle>
            <UiCardDescription>
              {{ rangeText(report) }}{{ report.compare ? " · compared" : "" }}
            </UiCardDescription>
          </UiCardHeader>
          <UiCardContent class="space-y-4">
            <p class="text-sm text-muted-foreground">{{ summary(report) }}</p>
            <div class="flex flex-wrap items-center gap-2">
              <UiButton size="sm" @click="open(report)">
                Open<Icon name="lucide:arrow-up-right" />
              </UiButton>
              <UiButton size="sm" variant="outline" @click="duplicate(report)">
                <Icon name="lucide:copy" />Duplicate
              </UiButton>
              <UiButton
                size="sm"
                variant="ghost"
                :aria-label="`Delete ${report.name}`"
                @click="ask(report)"
              >
                <Icon name="lucide:trash-2" />
              </UiButton>
              <div class="ml-auto flex items-center gap-2">
                <UiLabel
                  :for="`${uid}-${report.id}`"
                  class="text-xs font-normal text-muted-foreground"
                >
                  Email digest
                </UiLabel>
                <UiNativeSelect
                  :id="`${uid}-${report.id}`"
                  class="w-28"
                  :model-value="report.digest"
                  @update:model-value="setDigest(report, String($event) as SavedReport['digest'])"
                >
                  <option value="off">Off</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </UiNativeSelect>
              </div>
            </div>
          </UiCardContent>
        </UiCard>
      </li>
    </ul>
    <BeaconEmpty
      v-else
      title="No saved reports for this site"
      description="Set up the overview the way you like it, then save it above."
      icon="lucide:bookmark"
    />

    <UiAlertDialog v-model:open="confirmOpen">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>Delete “{{ removing?.name }}”?</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            The saved view will be removed. Your analytics data is not affected.
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel>Keep report</UiAlertDialogCancel>
          <UiAlertDialogAction @click.prevent="confirmRemove">Delete report</UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  </div>
</template>
