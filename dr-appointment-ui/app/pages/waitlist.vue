<script setup lang="ts">
  import { formatDate, formatTime } from "#shared/format";
  import { fullName } from "#shared/patients";
  import { availability } from "#shared/schedule";
  import { waitlistSchema } from "#shared/schemas";
  import type { WaitlistEntry } from "#shared/types";
  import { urgencies } from "#shared/types";
  import { errorMessage, newId, now, relativeDay, today } from "~/utils/demo";

  usePageSeo({ title: "Waitlist" });
  const { state, saveWaitlist, removeWaitlist, offerWaitlist, scheduleContext } = useDemo();
  const { pending, error, run } = useAction();
  const uid = useId();
  const timeFormat = computed(() => state.value?.preferences.timeFormat ?? "12h");
  const busy = ref("");

  const rank = { urgent: 0, soon: 1, routine: 2 } as const;
  const entries = computed(() =>
    [...(state.value?.waitlist ?? [])].sort(
      (a, b) => rank[a.urgency] - rank[b.urgency] || a.createdAt.localeCompare(b.createdAt)
    )
  );
  const patientOf = (entry: WaitlistEntry) =>
    state.value?.patients.find((item) => item.id === entry.patientId);
  const visitOf = (entry: WaitlistEntry) =>
    state.value?.visitTypes.find((item) => item.id === entry.visitTypeId);
  const providerOf = (entry: WaitlistEntry) =>
    state.value?.providers.find((item) => item.id === entry.providerId);

  /** Up to three of the earliest open slots that suit the entry. Computed from the live schedule. */
  const suggestions = computed(() => {
    const map = new Map<string, { providerId: string; date: string; start: string }[]>();
    if (!state.value) return map;
    const context = scheduleContext(today, 21);
    for (const entry of entries.value) {
      const visit = visitOf(entry);
      if (!visit) continue;
      const from = entry.earliest && entry.earliest > today ? entry.earliest : today;
      const days = availability({
        visitType: visit,
        providerId: entry.providerId,
        from,
        days: 14,
        context,
      });
      const slots: { providerId: string; date: string; start: string }[] = [];
      for (const day of days) {
        for (const slot of day.slots) {
          if (slots.length >= 3) break;
          // Show a spread across the day instead of three back-to-back times.
          if (!slots.some((s) => s.date === day.date && s.providerId === slot.providerId))
            slots.push({ ...slot, date: day.date });
        }
        if (slots.length >= 3) break;
      }
      map.set(entry.id, slots);
    }
    return map;
  });

  async function book(
    entry: WaitlistEntry,
    slot: { providerId: string; date: string; start: string }
  ) {
    busy.value = entry.id;
    try {
      const visit = await offerWaitlist(entry, slot);
      useSonner.success("Booked from the waitlist", {
        action: { label: "Open visit", onClick: () => navigateTo("/appointments/" + visit.id) },
      });
    } catch (cause) {
      useSonner.error(errorMessage(cause));
    } finally {
      busy.value = "";
    }
  }
  async function remove(entry: WaitlistEntry) {
    busy.value = entry.id;
    try {
      await removeWaitlist(entry.id);
      useSonner.success("Removed from the waitlist");
    } catch (cause) {
      useSonner.error(errorMessage(cause));
    } finally {
      busy.value = "";
    }
  }

  const addOpen = ref(false);
  const form = ref({
    patientId: "",
    visitTypeId: "visit-follow-up",
    providerId: "",
    urgency: "routine" as WaitlistEntry["urgency"],
    earliest: "",
    notes: "",
  });
  const message = ref("");
  function openAdd() {
    form.value = {
      patientId: "",
      visitTypeId: state.value?.visitTypes[0]?.id ?? "",
      providerId: "",
      urgency: "routine",
      earliest: "",
      notes: "",
    };
    message.value = "";
    error.value = "";
    addOpen.value = true;
  }
  async function submit() {
    message.value = "";
    if (!form.value.patientId) return void (message.value = "Choose a patient.");
    const record: WaitlistEntry = { id: newId("waitlist"), ...form.value, createdAt: now() };
    try {
      await waitlistSchema.validate(record, { abortEarly: true });
    } catch (cause) {
      message.value = (cause as Error).message;
      return;
    }
    const saved = await run(() => saveWaitlist(record));
    if (saved) {
      useSonner.success("Added to the waitlist");
      addOpen.value = false;
    }
  }
  const urgencyBadge = {
    urgent: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200",
    soon: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
    routine: "bg-muted text-foreground",
  } as const;
  const urgencyIcon = {
    urgent: "lucide:siren",
    soon: "lucide:clock-alert",
    routine: "lucide:clock",
  } as const;
</script>
<template>
  <div class="page-shell">
    <MendlyPageHeader
      title="Waitlist"
      description="Patients who want an earlier visit. Suggested slots come from the live schedule, so cancellations get filled."
    >
      <UiButton @click="openAdd"><Icon name="lucide:user-plus" />Add to waitlist</UiButton>
    </MendlyPageHeader>

    <ul v-if="entries.length" class="space-y-4">
      <li v-for="entry in entries" :key="entry.id">
        <UiCard>
          <UiCardContent class="space-y-4">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="flex items-start gap-3">
                <MendlyAvatar v-if="patientOf(entry)" :name="fullName(patientOf(entry)!)" />
                <div>
                  <NuxtLink
                    :to="'/patients/' + entry.patientId"
                    class="font-medium hover:underline"
                    >{{
                      patientOf(entry) ? fullName(patientOf(entry)!) : "Unknown patient"
                    }}</NuxtLink
                  >
                  <p class="text-sm text-muted-foreground">
                    {{ visitOf(entry)?.name }} ·
                    {{ providerOf(entry)?.name ?? "Any provider" }}
                    <template v-if="entry.earliest">
                      · from {{ formatDate(entry.earliest, "short") }}</template
                    >
                  </p>
                  <p v-if="entry.notes" class="mt-1 text-sm">{{ entry.notes }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span
                  :class="[
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                    urgencyBadge[entry.urgency],
                  ]"
                >
                  <Icon :name="urgencyIcon[entry.urgency]" class="size-3.5" aria-hidden="true" />
                  {{ entry.urgency }}
                </span>
                <UiButton
                  variant="ghost"
                  size="icon-sm"
                  :aria-label="`Remove ${patientOf(entry) ? fullName(patientOf(entry)!) : 'patient'} from the waitlist`"
                  :disabled="busy === entry.id"
                  @click="remove(entry)"
                >
                  <Icon name="lucide:trash-2" />
                </UiButton>
              </div>
            </div>
            <div>
              <p class="mb-2 text-xs font-medium text-muted-foreground">Earliest openings</p>
              <ul v-if="suggestions.get(entry.id)?.length" class="flex flex-wrap gap-2">
                <li
                  v-for="slot in suggestions.get(entry.id)"
                  :key="slot.date + slot.providerId + slot.start"
                >
                  <UiButton
                    variant="outline"
                    size="sm"
                    :loading="busy === entry.id"
                    @click="book(entry, slot)"
                  >
                    <Icon name="lucide:calendar-plus" />
                    {{ relativeDay(slot.date) }}
                    {{ formatTime(slot.start, timeFormat) }}
                    <span class="text-muted-foreground">
                      · {{ state?.providers.find((p) => p.id === slot.providerId)?.name }}
                    </span>
                  </UiButton>
                </li>
              </ul>
              <p v-else class="text-sm text-muted-foreground">
                No openings in the next two weeks that match.
              </p>
            </div>
          </UiCardContent>
        </UiCard>
      </li>
    </ul>
    <MendlyEmpty
      v-else
      title="The waitlist is empty"
      description="When a patient wants an earlier visit, add them here and Mendly will suggest openings."
      icon="lucide:hourglass"
    >
      <UiButton @click="openAdd">Add to waitlist</UiButton>
    </MendlyEmpty>

    <UiDialog v-model:open="addOpen">
      <UiDialogContent class="sm:max-w-lg">
        <UiDialogHeader>
          <UiDialogTitle>Add to waitlist</UiDialogTitle>
          <UiDialogDescription>
            They'll be offered earlier openings as the schedule changes.
          </UiDialogDescription>
        </UiDialogHeader>
        <form id="waitlist-form" class="space-y-4" novalidate @submit.prevent="submit">
          <div class="space-y-2">
            <UiLabel :for="`${uid}-patient`">Patient</UiLabel>
            <MendlyPatientPicker
              :id="`${uid}-patient`"
              v-model="form.patientId"
              :patients="state?.patients ?? []"
            />
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <UiLabel :for="`${uid}-visit`">Visit type</UiLabel>
              <UiNativeSelect :id="`${uid}-visit`" v-model="form.visitTypeId">
                <option v-for="item in state?.visitTypes" :key="item.id" :value="item.id">
                  {{ item.name }}
                </option>
              </UiNativeSelect>
            </div>
            <div class="space-y-2">
              <UiLabel :for="`${uid}-provider`">Provider</UiLabel>
              <UiNativeSelect :id="`${uid}-provider`" v-model="form.providerId">
                <option value="">Any provider</option>
                <option
                  v-for="item in state?.providers.filter((p) =>
                    p.visitTypeIds.includes(form.visitTypeId)
                  )"
                  :key="item.id"
                  :value="item.id"
                >
                  {{ item.name }}
                </option>
              </UiNativeSelect>
            </div>
            <div class="space-y-2">
              <UiLabel :for="`${uid}-urgency`">Urgency</UiLabel>
              <UiNativeSelect :id="`${uid}-urgency`" v-model="form.urgency">
                <option v-for="item in urgencies" :key="item" :value="item" class="capitalize">
                  {{ item }}
                </option>
              </UiNativeSelect>
            </div>
            <div class="space-y-2">
              <UiLabel :for="`${uid}-earliest`">Earliest date</UiLabel>
              <UiInput :id="`${uid}-earliest`" v-model="form.earliest" type="date" :min="today" />
            </div>
          </div>
          <div class="space-y-2">
            <UiLabel :for="`${uid}-notes`">Notes</UiLabel>
            <UiTextarea :id="`${uid}-notes`" v-model="form.notes" :rows="2" :maxlength="1000" />
          </div>
          <MendlyError :message="message || error" />
        </form>
        <UiDialogFooter>
          <UiButton variant="outline" type="button" @click="addOpen = false">Cancel</UiButton>
          <UiButton type="submit" form="waitlist-form" :loading="pending">Add to waitlist</UiButton>
        </UiDialogFooter>
      </UiDialogContent>
    </UiDialog>
  </div>
</template>
