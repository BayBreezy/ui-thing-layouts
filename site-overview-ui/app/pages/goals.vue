<script setup lang="ts">
  import { formatNumber, formatPercent } from "#shared/format";
  import type { Goal } from "#shared/types";
  import { errorMessage } from "~/utils/demo";

  usePageSeo({ title: "Goals" });
  const { state, site, siteGoals, removeGoal } = useDemo();
  const { current, error } = useReport();
  const editing = ref<Goal | null>(null);
  const formOpen = ref(false);
  const removing = ref<Goal | null>(null);
  const confirmOpen = ref(false);
  const funnelIds = computed(() => {
    const ids = new Set(siteGoals.value.map((goal) => goal.id));
    return (state.value?.preferences.funnel ?? []).filter((id) => ids.has(id));
  });
  const rows = computed(() =>
    siteGoals.value.map((goal) => ({
      goal,
      stats: current.value?.goals.find((item) => item.goalId === goal.id),
    }))
  );
  function ask(goal: Goal) {
    removing.value = goal;
    confirmOpen.value = true;
  }
  function addGoal() {
    editing.value = null;
    formOpen.value = true;
  }
  function edit(goal: Goal) {
    editing.value = goal;
    formOpen.value = true;
  }
  function toggleStep(id: string, on: boolean) {
    const prefs = state.value?.preferences;
    if (!prefs) return;
    prefs.funnel = on
      ? [...prefs.funnel.filter((item) => item !== id), id]
      : prefs.funnel.filter((item) => item !== id);
  }
  async function confirmRemove() {
    const goal = removing.value;
    if (!goal) return;
    try {
      await removeGoal(goal.id);
      useSonner.success("Goal removed", { description: goal.name });
    } catch (cause) {
      useSonner.error(errorMessage(cause));
    } finally {
      confirmOpen.value = false;
    }
  }
  const uid = useId();
</script>
<template>
  <div class="page-shell">
    <BeaconPageHeader
      title="Goals"
      :description="`What visitors do that matters on ${site?.name ?? 'this site'}, and how many get there.`"
    >
      <UiButton @click="addGoal"><Icon name="lucide:plus" />Add goal</UiButton>
    </BeaconPageHeader>
    <BeaconFilterBar />
    <BeaconError :message="error" class="mb-4" />

    <div class="grid gap-6 @4xl:grid-cols-[1.4fr_1fr]">
      <UiCard>
        <UiCardHeader>
          <UiCardTitle as="h2" class="text-base">Conversions</UiCardTitle>
          <UiCardDescription>Sessions that reached each goal in this range.</UiCardDescription>
        </UiCardHeader>
        <UiCardContent>
          <div v-if="!rows.length">
            <BeaconEmpty
              title="No goals yet"
              description="Add a goal to start counting what matters."
              icon="lucide:target"
            >
              <UiButton @click="addGoal">Add your first goal</UiButton>
            </BeaconEmpty>
          </div>
          <div v-else class="overflow-x-auto">
            <UiTable>
              <UiTableHeader>
                <UiTableRow>
                  <UiTableHead>Goal</UiTableHead>
                  <UiTableHead class="text-right">Conversions</UiTableHead>
                  <UiTableHead class="text-right">Rate</UiTableHead>
                  <UiTableHead class="text-right">Change</UiTableHead>
                  <UiTableHead><span class="sr-only">Actions</span></UiTableHead>
                </UiTableRow>
              </UiTableHeader>
              <UiTableBody>
                <UiTableRow v-for="row in rows" :key="row.goal.id">
                  <UiTableCell>
                    <p class="font-medium">{{ row.goal.name }}</p>
                    <p class="font-mono text-xs text-muted-foreground">
                      {{ row.goal.kind === "event" ? "event" : "page" }} · {{ row.goal.match }}
                    </p>
                  </UiTableCell>
                  <UiTableCell class="text-right tabular-nums">
                    <UiSkeleton v-if="!row.stats" class="ml-auto h-5 w-12" />
                    <template v-else>{{ formatNumber(row.stats.conversions) }}</template>
                  </UiTableCell>
                  <UiTableCell class="text-right tabular-nums">
                    {{ row.stats ? formatPercent(row.stats.rate) : "" }}
                  </UiTableCell>
                  <UiTableCell class="text-right">
                    <BeaconDelta
                      v-if="row.stats && row.stats.change !== null"
                      :change="row.stats.change"
                    />
                    <span v-else class="text-xs text-muted-foreground">—</span>
                  </UiTableCell>
                  <UiTableCell class="text-right whitespace-nowrap">
                    <UiButton
                      variant="ghost"
                      size="icon-sm"
                      :aria-label="`Edit ${row.goal.name}`"
                      @click="edit(row.goal)"
                    >
                      <Icon name="lucide:pencil" />
                    </UiButton>
                    <UiButton
                      variant="ghost"
                      size="icon-sm"
                      :aria-label="`Remove ${row.goal.name}`"
                      @click="ask(row.goal)"
                    >
                      <Icon name="lucide:trash-2" />
                    </UiButton>
                  </UiTableCell>
                </UiTableRow>
              </UiTableBody>
            </UiTable>
          </div>
        </UiCardContent>
      </UiCard>

      <UiCard>
        <UiCardHeader>
          <UiCardTitle as="h2" class="text-base">Funnel</UiCardTitle>
          <UiCardDescription>
            Sessions that reached every step so far, in the order you pick them.
          </UiCardDescription>
        </UiCardHeader>
        <UiCardContent class="space-y-5">
          <ol v-if="current" class="space-y-3" aria-label="Funnel steps">
            <li v-for="(step, index) in current.funnel" :key="step.label + index">
              <div class="mb-1 flex items-baseline justify-between gap-2 text-sm">
                <span class="font-medium">{{ step.label }}</span>
                <span class="tabular-nums">
                  {{ formatNumber(step.sessions) }}
                  <span class="text-xs text-muted-foreground"
                    >· {{ formatPercent(step.rate) }}</span
                  >
                </span>
              </div>
              <UiProgress
                :model-value="step.rate * 100"
                :aria-label="`${step.label}: ${formatPercent(step.rate)} of sessions`"
              />
            </li>
          </ol>
          <UiSkeleton v-else class="h-40" />
          <fieldset v-if="siteGoals.length" class="space-y-2">
            <legend class="mb-1 text-sm font-medium">Steps</legend>
            <div v-for="goal in siteGoals" :key="goal.id" class="flex items-center gap-2">
              <UiCheckbox
                :id="`${uid}-${goal.id}`"
                :model-value="funnelIds.includes(goal.id)"
                @update:model-value="toggleStep(goal.id, $event === true)"
              />
              <UiLabel :for="`${uid}-${goal.id}`" class="font-normal">{{ goal.name }}</UiLabel>
              <span
                v-if="funnelIds.includes(goal.id)"
                class="ml-auto text-xs text-muted-foreground"
              >
                Step {{ funnelIds.indexOf(goal.id) + 1 }}
              </span>
            </div>
          </fieldset>
        </UiCardContent>
      </UiCard>
    </div>

    <UiSheet v-model:open="formOpen">
      <UiSheetContent side="right" class="sm:max-w-md">
        <UiSheetHeader>
          <UiSheetTitle>{{ editing ? "Edit goal" : "Add a goal" }}</UiSheetTitle>
          <UiSheetDescription>
            Goals count sessions that view a page or fire a custom event.
          </UiSheetDescription>
        </UiSheetHeader>
        <div class="px-4">
          <BeaconGoalForm
            v-if="site"
            :key="editing?.id ?? 'new'"
            :goal="editing ?? undefined"
            :site-id="site.id"
            @saved="formOpen = false"
            @cancel="formOpen = false"
          />
        </div>
      </UiSheetContent>
    </UiSheet>
    <UiAlertDialog v-model:open="confirmOpen">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>Remove “{{ removing?.name }}”?</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            Beacon will stop counting this goal and take it out of the funnel. Past traffic is not
            affected.
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel>Keep goal</UiAlertDialogCancel>
          <UiAlertDialogAction @click.prevent="confirmRemove">Remove goal</UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  </div>
</template>
