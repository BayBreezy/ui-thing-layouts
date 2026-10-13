<script setup lang="ts">
  import { formatDate, formatRange, formatTime } from "#shared/format";
  import { fullName } from "#shared/patients";
  import {
    addDays,
    findConflict,
    fromMinutes,
    holdsSlot,
    isValidDate,
    slim,
    startOfWeek,
    toMinutes,
    weekdayOf,
    workingDay,
  } from "#shared/schedule";
  import type { Appointment, Provider } from "#shared/types";
  import { nowTime, today, visitColorClasses } from "~/utils/demo";

  usePageSeo({ title: "Calendar" });
  const route = useRoute();
  const router = useRouter();
  const { state } = useDemo();

  /* View state lives in the URL so a calendar position can be shared and survives reloads. */
  const view = computed<"week" | "day">(() => (route.query.view === "day" ? "day" : "week"));
  const focus = computed(() => {
    const value = typeof route.query.date === "string" ? route.query.date : "";
    return isValidDate(value) ? value : today;
  });
  const providers = computed(() => (state.value?.providers ?? []).filter((item) => item.active));
  const providerId = computed(() => {
    const value = typeof route.query.provider === "string" ? route.query.provider : "";
    if (providers.value.some((item) => item.id === value)) return value;
    // The week view shows one provider at a time; the day view shows everyone.
    return view.value === "week" ? (providers.value[0]?.id ?? "") : "";
  });
  function go(patch: Record<string, string | undefined>) {
    const query: Record<string, string> = {};
    for (const [key, value] of Object.entries({ ...route.query, ...patch }))
      if (typeof value === "string" && value) query[key] = value;
    return router.replace({ query });
  }
  const step = computed(() => (view.value === "week" ? 7 : 1));
  const weekStart = computed(() => startOfWeek(focus.value));

  const selectedProvider = computed(() =>
    providers.value.find((item) => item.id === providerId.value)
  );
  const columns = computed(() => {
    if (view.value === "day") {
      const list = selectedProvider.value ? [selectedProvider.value] : providers.value;
      return list.map((provider) => ({
        key: provider.id,
        date: focus.value,
        provider,
        title: provider.name,
        subtitle: provider.specialty,
      }));
    }
    const provider = selectedProvider.value ?? providers.value[0];
    if (!provider) return [];
    const days = [0, 1, 2, 3, 4, 5, 6].map((offset) => addDays(weekStart.value, offset));
    const works = (date: string) => Boolean(workingDay(provider, date));
    return days
      .filter((date) => {
        const weekday = weekdayOf(date);
        // Weekends only appear when the provider has hours then.
        return (weekday !== 0 && weekday !== 6) || provider.hours[weekday] !== null;
      })
      .map((date) => ({
        key: date,
        date,
        provider,
        title: `${formatDate(date, "weekday")} ${Number(date.slice(8))}`,
        subtitle: works(date) ? "" : "Off",
      }));
  });

  /* The grid spans the earliest opening to the latest close of everyone on screen. */
  const bounds = computed(() => {
    let open = 24 * 60;
    let close = 0;
    for (const column of columns.value) {
      const day = workingDay(column.provider, column.date);
      if (!day) continue;
      open = Math.min(open, toMinutes(day.start));
      close = Math.max(close, toMinutes(day.end));
    }
    if (close === 0) return { start: 8 * 60, end: 17 * 60 };
    return { start: Math.floor(open / 60) * 60, end: Math.ceil(close / 60) * 60 };
  });
  const pxPerMinute = 1.5;
  const gridHeight = computed(() => (bounds.value.end - bounds.value.start) * pxPerMinute);
  const hours = computed(() => {
    const list: number[] = [];
    for (let minute = bounds.value.start; minute < bounds.value.end; minute += 60)
      list.push(minute);
    return list;
  });
  const timeFormat = computed(() => state.value?.preferences.timeFormat ?? "12h");

  const visitsByColumn = computed(() => {
    const map = new Map<string, Appointment[]>();
    for (const column of columns.value) {
      map.set(
        column.key,
        (state.value?.appointments ?? [])
          .filter(
            (item) =>
              item.date === column.date &&
              item.providerId === column.provider.id &&
              holdsSlot(item.status)
          )
          .sort((a, b) => a.start.localeCompare(b.start))
      );
    }
    return map;
  });
  const patients = computed(
    () => new Map((state.value?.patients ?? []).map((item) => [item.id, item]))
  );
  const visitTypes = computed(
    () => new Map((state.value?.visitTypes ?? []).map((item) => [item.id, item]))
  );
  const nameOf = (item: Appointment) => {
    const patient = patients.value.get(item.patientId);
    return patient ? fullName(patient) : "Unknown patient";
  };

  /** Shaded bands for time outside working hours, breaks and days off. */
  function closedBands(provider: Provider, date: string) {
    const day = workingDay(provider, date);
    const top = bounds.value.start;
    const bottom = bounds.value.end;
    if (!day) return [{ from: top, to: bottom, label: "Not working" }];
    const bands = [];
    if (toMinutes(day.start) > top) bands.push({ from: top, to: toMinutes(day.start), label: "" });
    if (toMinutes(day.end) < bottom)
      bands.push({ from: toMinutes(day.end), to: bottom, label: "" });
    if (day.breakStart && day.breakEnd)
      bands.push({ from: toMinutes(day.breakStart), to: toMinutes(day.breakEnd), label: "Break" });
    return bands;
  }
  const blockStyle = (from: number, to: number) => ({
    top: (from - bounds.value.start) * pxPerMinute + "px",
    height: Math.max((to - from) * pxPerMinute, 20) + "px",
  });

  /* Booking from the grid. Pointer users click a free spot; keyboard users use the column's
   * "Add visit" button, which opens the same dialog. */
  const bookOpen = ref(false);
  const bookDefaults = ref<{ providerId: string; date: string; start: string }>({
    providerId: "",
    date: today,
    start: "",
  });
  const bookKey = ref(0);
  function openBook(provider: Provider, date: string, start = "") {
    bookDefaults.value = { providerId: provider.id, date, start };
    bookKey.value++;
    bookOpen.value = true;
  }
  function clickColumn(event: MouseEvent, column: (typeof columns.value)[number]) {
    if ((event.target as HTMLElement).closest("a")) return;
    const target = event.currentTarget as HTMLElement;
    const minute =
      bounds.value.start +
      Math.floor((event.clientY - target.getBoundingClientRect().top) / pxPerMinute);
    const slot = state.value?.clinic.slotMinutes ?? 15;
    const snapped = Math.floor(minute / slot) * slot;
    const start = fromMinutes(snapped);
    const day = workingDay(column.provider, column.date);
    if (!day || snapped < toMinutes(day.start) || snapped >= toMinutes(day.end)) return;
    const held = (state.value?.appointments ?? [])
      .filter((item) => item.date === column.date)
      .map(slim);
    const clash = findConflict(held, {
      id: "",
      patientId: "",
      providerId: column.provider.id,
      date: column.date,
      start,
      end: fromMinutes(snapped + slot),
    });
    if (clash) return;
    openBook(column.provider, column.date, start);
  }
  const nowTop = computed(() => (toMinutes(nowTime) - bounds.value.start) * pxPerMinute);
  const rangeLabel = computed(() =>
    view.value === "day"
      ? formatDate(focus.value, "full")
      : `${formatDate(weekStart.value, "short")} – ${formatDate(addDays(weekStart.value, 6), "long")}`
  );
  const agenda = computed(() =>
    columns.value
      .map((column) => ({
        key: column.key,
        title:
          view.value === "day"
            ? `${column.title} · ${column.subtitle}`
            : formatDate(column.date, "full"),
        items: visitsByColumn.value.get(column.key) ?? [],
      }))
      .filter((group) => group.items.length)
  );
  const legend = computed(() => state.value?.visitTypes ?? []);
</script>
<template>
  <div class="page-shell max-w-none!">
    <MendlyPageHeader title="Calendar" :description="rangeLabel">
      <UiButton to="/appointments/new"
        ><Icon name="lucide:calendar-plus" />Book appointment</UiButton
      >
    </MendlyPageHeader>

    <div class="mb-4 flex flex-wrap items-end gap-3">
      <div class="flex items-center gap-1">
        <UiButton
          variant="outline"
          size="icon"
          :aria-label="view === 'week' ? 'Previous week' : 'Previous day'"
          @click="go({ date: addDays(focus, -step) })"
        >
          <Icon name="lucide:chevron-left" />
        </UiButton>
        <UiButton variant="outline" @click="go({ date: '' })">Today</UiButton>
        <UiButton
          variant="outline"
          size="icon"
          :aria-label="view === 'week' ? 'Next week' : 'Next day'"
          @click="go({ date: addDays(focus, step) })"
        >
          <Icon name="lucide:chevron-right" />
        </UiButton>
      </div>
      <UiToggleGroup
        type="single"
        variant="outline"
        :model-value="view"
        aria-label="Calendar view"
        @update:model-value="(value) => value && go({ view: String(value), provider: '' })"
      >
        <UiToggleGroupItem value="week">Week</UiToggleGroupItem>
        <UiToggleGroupItem value="day">Day</UiToggleGroupItem>
      </UiToggleGroup>
      <div class="space-y-1">
        <UiLabel for="calendar-provider" class="sr-only">Provider</UiLabel>
        <UiNativeSelect
          id="calendar-provider"
          :model-value="providerId"
          class="min-w-56"
          @update:model-value="go({ provider: String($event) })"
        >
          <option v-if="view === 'day'" value="">All providers</option>
          <option v-for="item in providers" :key="item.id" :value="item.id">
            {{ item.name }} · {{ item.specialty }}
          </option>
        </UiNativeSelect>
      </div>
      <ul
        class="ml-auto hidden flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground @3xl:flex"
        aria-label="Visit colors"
      >
        <li v-for="item in legend" :key="item.id" class="flex items-center gap-1.5">
          <span
            :class="['size-2 rounded-full', visitColorClasses[item.color].dot]"
            aria-hidden="true"
          />
          {{ item.name }}
        </li>
      </ul>
    </div>

    <!-- Wide screens: time grid -->
    <div
      v-if="columns.length"
      class="hidden overflow-x-auto rounded-lg border @3xl:block"
      role="group"
      :aria-label="`Schedule for ${rangeLabel}`"
    >
      <div class="flex min-w-[48rem]">
        <div class="w-20 shrink-0 border-r bg-muted/30">
          <div class="h-14 border-b" />
          <div class="relative" :style="{ height: gridHeight + 'px' }">
            <span
              v-for="minute in hours"
              :key="minute"
              class="absolute right-2 -translate-y-2 text-xs whitespace-nowrap text-muted-foreground tabular-nums"
              :style="{ top: (minute - bounds.start) * pxPerMinute + 'px' }"
              >{{
                minute === bounds.start ? "" : formatTime(fromMinutes(minute), timeFormat)
              }}</span
            >
          </div>
        </div>
        <div
          v-for="column in columns"
          :key="column.key"
          class="min-w-0 flex-1 border-r last:border-r-0"
        >
          <div class="flex h-14 items-center justify-between gap-2 border-b px-3">
            <div class="min-w-0">
              <p
                :class="[
                  'truncate text-sm font-medium',
                  column.date === today && view === 'week' ? 'text-primary' : '',
                ]"
              >
                {{ column.title }}
              </p>
              <p class="truncate text-xs text-muted-foreground">{{ column.subtitle }}</p>
            </div>
            <UiButton
              v-if="workingDay(column.provider, column.date)"
              variant="ghost"
              size="icon-sm"
              :aria-label="`Add a visit for ${column.provider.name} on ${formatDate(column.date, 'long')}`"
              @click="openBook(column.provider, column.date)"
            >
              <Icon name="lucide:plus" />
            </UiButton>
          </div>
          <div
            class="relative cursor-cell"
            :style="{ height: gridHeight + 'px' }"
            @click="clickColumn($event, column)"
          >
            <div
              v-for="minute in hours"
              :key="minute"
              class="pointer-events-none absolute inset-x-0 border-t border-border/60"
              :style="{ top: (minute - bounds.start) * pxPerMinute + 'px' }"
            />
            <div
              v-for="band in closedBands(column.provider, column.date)"
              :key="band.from"
              class="pointer-events-none absolute inset-x-0 flex items-center justify-center bg-muted/40 bg-[repeating-linear-gradient(135deg,transparent,transparent_6px,var(--muted)_6px,var(--muted)_7px)] text-xs text-muted-foreground"
              :style="blockStyle(band.from, band.to)"
            >
              {{ band.label }}
            </div>
            <div
              v-if="column.date === today"
              class="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-primary"
              :style="{ top: nowTop + 'px' }"
            >
              <span class="absolute -top-1.5 -left-1 size-2.5 rounded-full bg-primary" />
            </div>
            <NuxtLink
              v-for="item in visitsByColumn.get(column.key)"
              :key="item.id"
              :to="'/appointments/' + item.id"
              :class="[
                'absolute inset-x-1 z-[5] overflow-hidden rounded-md border-l-4 px-2 py-0.5 text-xs leading-tight shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                visitColorClasses[visitTypes.get(item.visitTypeId)?.color ?? 'slate'].block,
              ]"
              :style="blockStyle(toMinutes(item.start), toMinutes(item.end))"
              :aria-label="`${nameOf(item)}, ${visitTypes.get(item.visitTypeId)?.name}, ${formatRange(item.start, item.end, timeFormat)}, ${item.status}`"
            >
              <span
                v-if="toMinutes(item.end) - toMinutes(item.start) >= 30"
                class="block truncate font-medium"
                >{{ nameOf(item) }}</span
              >
              <span v-if="toMinutes(item.end) - toMinutes(item.start) >= 30" class="block truncate">
                {{ formatTime(item.start, timeFormat) }} ·
                {{ visitTypes.get(item.visitTypeId)?.name }}
              </span>
              <span v-else class="block truncate">
                <span class="font-medium">{{ nameOf(item) }}</span>
                · {{ formatTime(item.start, timeFormat) }}
              </span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Narrow screens: an agenda of the same visits -->
    <div class="space-y-4 @3xl:hidden">
      <section v-for="group in agenda" :key="group.key" :aria-label="group.title">
        <h2 class="mb-2 text-sm font-semibold">{{ group.title }}</h2>
        <ul class="divide-y rounded-lg border">
          <MendlyVisitRow v-for="item in group.items" :key="item.id" :appointment="item" />
        </ul>
      </section>
      <MendlyEmpty
        v-if="!agenda.length"
        title="Nothing booked in this range"
        description="Try another day or provider, or book a visit."
        icon="lucide:calendar"
      >
        <UiButton to="/appointments/new">Book appointment</UiButton>
      </MendlyEmpty>
    </div>

    <UiDialog v-model:open="bookOpen">
      <UiDialogContent class="sm:max-w-xl">
        <UiDialogHeader>
          <UiDialogTitle>Book appointment</UiDialogTitle>
          <UiDialogDescription>
            {{ formatDate(bookDefaults.date, "full") }}
            <template v-if="bookDefaults.start">
              at {{ formatTime(bookDefaults.start, timeFormat) }}</template
            >.
          </UiDialogDescription>
        </UiDialogHeader>
        <MendlyAppointmentEditor
          :key="bookKey"
          :defaults="bookDefaults"
          @saved="bookOpen = false"
          @cancel="bookOpen = false"
        />
      </UiDialogContent>
    </UiDialog>
  </div>
</template>
