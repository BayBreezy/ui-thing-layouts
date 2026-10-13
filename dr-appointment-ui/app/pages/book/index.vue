<script setup lang="ts">
  import { formatDate, formatDuration, formatPrice, formatTime } from "#shared/format";
  import { addDays } from "#shared/schedule";
  import { bookingSchema } from "#shared/schemas";
  import type { DayAvailability, Slot } from "#shared/types";
  import { errorMessage, today } from "~/utils/demo";

  definePageMeta({ layout: "booking" });
  usePageSeo({
    title: "Book a visit",
    description:
      "Choose a visit type, pick a time with the provider you want, and confirm in under a minute. Demo clinic, fictional data.",
  });
  const uid = useId();
  const { state, ready, loadAvailability, book } = useDemo();
  const { pending, error, run } = useAction();

  const step = ref(1);
  const stepTitles = ["Visit type", "Date and time", "Your details", "Review"];
  const visitTypeId = ref("");
  const providerId = ref("");
  const date = ref("");
  const selected = ref<Slot | null>(null);
  const weekOffset = ref(0);
  const details = ref({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthday: "",
    reason: "",
  });
  const fieldErrors = ref<Record<string, string>>({});
  const message = ref("");
  const timeFormat = computed(() => state.value?.preferences.timeFormat ?? "12h");

  const open = computed(() => state.value?.clinic.onlineBooking ?? true);
  const types = computed(() =>
    (state.value?.visitTypes ?? []).filter((visit) => {
      if (!visit.online) return false;
      return (state.value?.providers ?? []).some(
        (provider) =>
          provider.active &&
          provider.visitTypeIds.includes(visit.id) &&
          (visit.id !== "visit-new" || provider.acceptingNew)
      );
    })
  );
  const visit = computed(() => types.value.find((item) => item.id === visitTypeId.value));
  const providers = computed(() =>
    (state.value?.providers ?? []).filter(
      (provider) =>
        provider.active &&
        provider.visitTypeIds.includes(visitTypeId.value) &&
        (visitTypeId.value !== "visit-new" || provider.acceptingNew)
    )
  );
  const provider = computed(() => providers.value.find((item) => item.id === providerId.value));

  /* Availability comes from the demo API, so loading, empty and failure states are real. */
  const windowDays = computed(() => Math.min(state.value?.clinic.bookingWindowDays ?? 28, 28));
  const days = ref<DayAvailability[]>([]);
  const loading = ref(false);
  const loadError = ref("");
  let loadToken = 0;
  async function load() {
    if (!visitTypeId.value || !state.value) return;
    const token = ++loadToken;
    loading.value = true;
    loadError.value = "";
    try {
      const result = await loadAvailability({
        visitTypeId: visitTypeId.value,
        providerId: providerId.value,
        from: addDays(today, weekOffset.value * 7),
        days: 7,
      });
      if (token !== loadToken) return;
      days.value = result;
      if (!result.some((item) => item.date === date.value))
        date.value = result.find((item) => item.slots.length)?.date ?? result[0]?.date ?? "";
    } catch (cause) {
      if (token === loadToken) loadError.value = errorMessage(cause);
    } finally {
      if (token === loadToken) loading.value = false;
    }
  }
  watch([visitTypeId, providerId, weekOffset], () => {
    selected.value = null;
    if (step.value === 2) void load();
  });
  watch(step, (value) => {
    if (value === 2) void load();
  });
  const times = computed(() => {
    const slots = days.value.find((item) => item.date === date.value)?.slots ?? [];
    const seen = new Set<string>();
    return slots.filter((slot) => (seen.has(slot.start) ? false : (seen.add(slot.start), true)));
  });
  const canPageBack = computed(() => weekOffset.value > 0);
  const canPageForward = computed(() => (weekOffset.value + 1) * 7 < windowDays.value);

  function chooseType(id: string) {
    visitTypeId.value = id;
    if (providerId.value && !providers.value.some((item) => item.id === providerId.value))
      providerId.value = "";
    step.value = 2;
  }
  function chooseSlot(slot: Slot) {
    selected.value = slot;
  }
  function toDetails() {
    if (!selected.value) {
      message.value = "Choose a time to continue.";
      return;
    }
    message.value = "";
    step.value = 3;
  }
  async function toReview() {
    fieldErrors.value = {};
    try {
      await bookingSchema.validate(buildBooking(), { abortEarly: false });
    } catch (cause) {
      const inner = (cause as { inner?: { path?: string; message: string }[] }).inner ?? [];
      for (const item of inner) {
        const key = item.path?.replace("patient.", "") ?? "";
        if (key && !fieldErrors.value[key]) fieldErrors.value[key] = item.message;
      }
      message.value = "Please fix the highlighted fields.";
      return;
    }
    message.value = "";
    step.value = 4;
  }
  function buildBooking() {
    return {
      visitTypeId: visitTypeId.value,
      providerId: selected.value?.providerId ?? "",
      date: date.value,
      start: selected.value?.start ?? "",
      reason: details.value.reason.trim(),
      patient: {
        firstName: details.value.firstName.trim(),
        lastName: details.value.lastName.trim(),
        email: details.value.email.trim(),
        phone: details.value.phone.trim(),
        birthday: details.value.birthday,
      },
    };
  }
  async function confirm() {
    message.value = "";
    const result = await run(() => book(buildBooking()));
    if (result) await navigateTo("/book/confirmed?id=" + result.appointment.id);
  }
  // A slot taken in another tab or by someone else sends the visitor back to pick again.
  watch(error, (value) => {
    if (value && step.value === 4) {
      selected.value = null;
      step.value = 2;
      void load();
    }
  });
  const selectedProvider = computed(() =>
    state.value?.providers.find((item) => item.id === selected.value?.providerId)
  );
  const dayLabel = (item: DayAvailability) => ({
    weekday: formatDate(item.date, "weekday"),
    day: formatDate(item.date, "short"),
  });
</script>
<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-semibold tracking-tight">Book a visit</h1>
      <p class="mt-2 text-muted-foreground">
        Choose a time that suits you. It takes about a minute, and no account is needed.
      </p>
    </div>

    <UiAlert
      v-if="!open"
      role="status"
      icon="lucide:phone"
      :description="`Online booking is paused. Please call ${state?.clinic.phone} to book a visit.`"
    />
    <div v-else-if="!ready" role="status" aria-label="Loading"><UiSkeleton class="h-96" /></div>
    <template v-else>
      <ol class="mb-6 grid grid-cols-4 gap-2 text-xs" aria-label="Booking steps">
        <li
          v-for="(title, index) in stepTitles"
          :key="title"
          :aria-current="step === index + 1 ? 'step' : undefined"
          :class="[
            'flex items-center gap-2 border-b-2 pb-2',
            step === index + 1
              ? 'border-primary font-medium text-foreground'
              : step > index + 1
                ? 'border-primary/40 text-muted-foreground'
                : 'border-border text-muted-foreground',
          ]"
        >
          <span
            :class="[
              'flex size-5 shrink-0 items-center justify-center rounded-full text-[11px]',
              step >= index + 1 ? 'bg-primary text-primary-foreground' : 'bg-muted',
            ]"
            aria-hidden="true"
          >
            <Icon v-if="step > index + 1" name="lucide:check" class="size-3" />
            <template v-else>{{ index + 1 }}</template>
          </span>
          <span class="hidden sm:inline">{{ title }}</span>
          <span class="sr-only sm:hidden">Step {{ index + 1 }}: {{ title }}</span>
        </li>
      </ol>

      <!-- 1. Visit type -->
      <section v-if="step === 1" aria-labelledby="step-1">
        <h2 id="step-1" class="mb-4 text-lg font-semibold">What do you need?</h2>
        <ul class="grid gap-3 sm:grid-cols-2">
          <li v-for="item in types" :key="item.id">
            <button
              type="button"
              class="flex h-full w-full flex-col items-start gap-1 rounded-lg border bg-background p-4 text-left transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              @click="chooseType(item.id)"
            >
              <span class="font-medium">{{ item.name }}</span>
              <span class="text-sm text-muted-foreground">{{ item.description }}</span>
              <span class="mt-1 text-xs text-muted-foreground">
                {{ formatDuration(item.minutes) }} · {{ formatPrice(item.price) }}
              </span>
            </button>
          </li>
        </ul>
      </section>

      <!-- 2. Date and time -->
      <section v-else-if="step === 2" aria-labelledby="step-2" class="space-y-6">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 id="step-2" class="text-lg font-semibold">{{ visit?.name }}</h2>
          <UiButton variant="ghost" size="sm" @click="step = 1">
            <Icon name="lucide:arrow-left" />Change visit type
          </UiButton>
        </div>
        <div class="space-y-2">
          <UiLabel :for="`${uid}-provider`">Provider</UiLabel>
          <UiNativeSelect :id="`${uid}-provider`" v-model="providerId">
            <option value="">First available</option>
            <option v-for="item in providers" :key="item.id" :value="item.id">
              {{ item.name }} · {{ item.specialty }}
            </option>
          </UiNativeSelect>
        </div>

        <div>
          <div class="mb-2 flex items-center justify-between">
            <p class="text-sm font-medium">Choose a day</p>
            <div class="flex gap-1">
              <UiButton
                variant="outline"
                size="icon-sm"
                aria-label="Earlier days"
                :disabled="!canPageBack"
                @click="weekOffset--"
              >
                <Icon name="lucide:chevron-left" />
              </UiButton>
              <UiButton
                variant="outline"
                size="icon-sm"
                aria-label="Later days"
                :disabled="!canPageForward"
                @click="weekOffset++"
              >
                <Icon name="lucide:chevron-right" />
              </UiButton>
            </div>
          </div>
          <div
            v-if="loading"
            role="status"
            aria-label="Loading availability"
            class="grid grid-cols-4 gap-2 sm:grid-cols-7"
          >
            <UiSkeleton v-for="n in 7" :key="n" class="h-16" />
          </div>
          <UiAlert
            v-else-if="loadError"
            role="alert"
            variant="destructive"
            icon="lucide:circle-alert"
            :description="loadError"
          />
          <ul v-else class="grid grid-cols-4 gap-2 sm:grid-cols-7">
            <li v-for="item in days" :key="item.date">
              <button
                type="button"
                :disabled="item.slots.length === 0"
                :aria-pressed="date === item.date"
                :class="[
                  'flex w-full flex-col items-center rounded-lg border p-2 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                  date === item.date
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-background hover:border-primary',
                ]"
                @click="
                  date = item.date;
                  selected = null;
                "
              >
                <span class="text-xs">{{ dayLabel(item).weekday }}</span>
                <span class="font-medium">{{ dayLabel(item).day }}</span>
                <span class="text-[11px] opacity-80">
                  {{
                    item.slots.length
                      ? `${new Set(item.slots.map((s) => s.start)).size} times`
                      : "Full"
                  }}
                </span>
              </button>
            </li>
          </ul>
        </div>

        <div v-if="!loading && !loadError">
          <p class="mb-2 text-sm font-medium">
            Times on {{ date ? formatDate(date, "full") : "…" }}
          </p>
          <ul v-if="times.length" class="grid grid-cols-3 gap-2 sm:grid-cols-5">
            <li v-for="slot in times" :key="slot.start">
              <button
                type="button"
                :aria-pressed="selected?.start === slot.start"
                :class="[
                  'w-full rounded-md border px-2 py-2 text-sm tabular-nums transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  selected?.start === slot.start
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-background hover:border-primary',
                ]"
                @click="chooseSlot(slot)"
              >
                {{ formatTime(slot.start, timeFormat) }}
              </button>
            </li>
          </ul>
          <p
            v-else
            class="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground"
          >
            No times left on this day. Try another day, or choose a different provider.
          </p>
        </div>
        <p v-if="message" role="alert" class="text-sm text-destructive">{{ message }}</p>
        <div class="flex justify-end">
          <UiButton :disabled="!selected" @click="toDetails">
            Continue<Icon name="lucide:arrow-right" />
          </UiButton>
        </div>
      </section>

      <!-- 3. Details -->
      <section v-else-if="step === 3" aria-labelledby="step-3" class="space-y-5">
        <h2 id="step-3" class="text-lg font-semibold">Your details</h2>
        <form class="space-y-5" novalidate @submit.prevent="toReview">
          <div class="grid gap-4 sm:grid-cols-2">
            <div
              v-for="field in [
                { key: 'firstName', label: 'First name', type: 'text', auto: 'given-name' },
                { key: 'lastName', label: 'Last name', type: 'text', auto: 'family-name' },
                { key: 'email', label: 'Email', type: 'email', auto: 'email' },
                { key: 'phone', label: 'Phone', type: 'tel', auto: 'tel' },
              ] as const"
              :key="field.key"
              class="space-y-2"
            >
              <UiLabel :for="`${uid}-${field.key}`">{{ field.label }}</UiLabel>
              <UiInput
                :id="`${uid}-${field.key}`"
                v-model="details[field.key]"
                :type="field.type"
                :autocomplete="field.auto"
                :aria-invalid="Boolean(fieldErrors[field.key])"
                :aria-describedby="fieldErrors[field.key] ? `${uid}-${field.key}-error` : undefined"
              />
              <p
                v-if="fieldErrors[field.key]"
                :id="`${uid}-${field.key}-error`"
                class="text-sm text-destructive"
              >
                {{ fieldErrors[field.key] }}
              </p>
            </div>
            <div class="space-y-2">
              <UiLabel :for="`${uid}-birthday`">Date of birth (optional)</UiLabel>
              <UiInput
                :id="`${uid}-birthday`"
                v-model="details.birthday"
                type="date"
                autocomplete="bday"
              />
            </div>
          </div>
          <div class="space-y-2">
            <UiLabel :for="`${uid}-reason`">What brings you in? (optional)</UiLabel>
            <UiTextarea :id="`${uid}-reason`" v-model="details.reason" :rows="3" :maxlength="300" />
          </div>
          <p v-if="message" role="alert" class="text-sm text-destructive">{{ message }}</p>
          <p class="text-xs text-muted-foreground">
            This is a demo clinic. Please use fictional details. Nothing is sent or stored on a
            server.
          </p>
          <div class="flex justify-between">
            <UiButton type="button" variant="ghost" @click="step = 2">
              <Icon name="lucide:arrow-left" />Back
            </UiButton>
            <UiButton type="submit">Review<Icon name="lucide:arrow-right" /></UiButton>
          </div>
        </form>
      </section>

      <!-- 4. Review -->
      <section v-else aria-labelledby="step-4" class="space-y-5">
        <h2 id="step-4" class="text-lg font-semibold">Check and confirm</h2>
        <UiCard>
          <UiCardContent class="space-y-3 text-sm">
            <p class="text-base font-medium">{{ visit?.name }}</p>
            <p class="flex items-center gap-2">
              <Icon name="lucide:calendar" class="size-4" />
              {{ formatDate(date, "full") }} at {{ formatTime(selected?.start ?? "", timeFormat) }}
              <span v-if="visit" class="text-muted-foreground"
                >({{ formatDuration(visit.minutes) }})</span
              >
            </p>
            <p class="flex items-center gap-2">
              <Icon name="lucide:stethoscope" class="size-4" />
              {{ selectedProvider?.name }} · {{ selectedProvider?.specialty }}
            </p>
            <p class="flex items-center gap-2">
              <Icon name="lucide:map-pin" class="size-4" />{{ state?.clinic.name }} ·
              {{ state?.clinic.address }}
            </p>
            <p class="flex items-center gap-2">
              <Icon name="lucide:user" class="size-4" />
              {{ details.firstName }} {{ details.lastName }} · {{ details.email }}
            </p>
            <p v-if="provider === undefined && !providerId" class="text-xs text-muted-foreground">
              Booked with the first available provider.
            </p>
          </UiCardContent>
        </UiCard>
        <MendlyError :message="error" />
        <div class="flex justify-between">
          <UiButton variant="ghost" @click="step = 3"
            ><Icon name="lucide:arrow-left" />Back</UiButton
          >
          <UiButton :loading="pending" @click="confirm">
            Confirm booking<Icon name="lucide:check" />
          </UiButton>
        </div>
      </section>
    </template>
  </div>
</template>
