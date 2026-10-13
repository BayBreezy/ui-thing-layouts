<script setup lang="ts">
  import { patientSchema } from "#shared/schemas";
  import type { Patient } from "#shared/types";
  import { newId, now } from "~/utils/demo";

  const props = defineProps<{ patient?: Patient }>();
  const emit = defineEmits<{ saved: [patient: Patient]; cancel: [] }>();
  const uid = useId();
  const { state, savePatient } = useDemo();
  const { pending, error, run } = useAction();
  const form = ref({
    firstName: props.patient?.firstName ?? "",
    lastName: props.patient?.lastName ?? "",
    email: props.patient?.email ?? "",
    phone: props.patient?.phone ?? "",
    birthday: props.patient?.birthday ?? "",
    insurance: props.patient?.insurance ?? "",
    preferredProviderId: props.patient?.preferredProviderId ?? "",
    tags: (props.patient?.tags ?? []).join(", "),
    notes: props.patient?.notes ?? "",
  });
  const { dirty, markSaved } = useUnsaved(form);
  const message = ref("");
  const fieldErrors = ref<Record<string, string>>({});

  async function submit() {
    message.value = "";
    fieldErrors.value = {};
    const record: Patient = {
      id: props.patient?.id ?? newId("patient"),
      firstName: form.value.firstName.trim(),
      lastName: form.value.lastName.trim(),
      email: form.value.email.trim(),
      phone: form.value.phone.trim(),
      birthday: form.value.birthday,
      insurance: form.value.insurance.trim(),
      preferredProviderId: form.value.preferredProviderId,
      tags: form.value.tags
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      notes: form.value.notes,
      createdAt: props.patient?.createdAt ?? now(),
    };
    try {
      await patientSchema.validate(record, { abortEarly: false });
    } catch (cause) {
      const inner = (cause as { inner?: { path?: string; message: string }[] }).inner ?? [];
      for (const item of inner)
        if (item.path && !fieldErrors.value[item.path]) fieldErrors.value[item.path] = item.message;
      message.value = "Please fix the highlighted fields.";
      return;
    }
    const saved = await run(() => savePatient(record));
    if (saved) {
      markSaved();
      useSonner.success(props.patient ? "Patient updated" : "Patient added");
      emit("saved", saved);
    }
  }
</script>
<template>
  <form class="space-y-5" novalidate @submit.prevent="submit">
    <div class="grid gap-4 sm:grid-cols-2">
      <div class="space-y-2">
        <UiLabel :for="`${uid}-first`">First name</UiLabel>
        <UiInput
          :id="`${uid}-first`"
          v-model="form.firstName"
          autocomplete="given-name"
          :aria-invalid="Boolean(fieldErrors.firstName)"
          :aria-describedby="fieldErrors.firstName ? `${uid}-first-error` : undefined"
        />
        <p v-if="fieldErrors.firstName" :id="`${uid}-first-error`" class="text-sm text-destructive">
          {{ fieldErrors.firstName }}
        </p>
      </div>
      <div class="space-y-2">
        <UiLabel :for="`${uid}-last`">Last name</UiLabel>
        <UiInput
          :id="`${uid}-last`"
          v-model="form.lastName"
          autocomplete="family-name"
          :aria-invalid="Boolean(fieldErrors.lastName)"
          :aria-describedby="fieldErrors.lastName ? `${uid}-last-error` : undefined"
        />
        <p v-if="fieldErrors.lastName" :id="`${uid}-last-error`" class="text-sm text-destructive">
          {{ fieldErrors.lastName }}
        </p>
      </div>
      <div class="space-y-2">
        <UiLabel :for="`${uid}-email`">Email</UiLabel>
        <UiInput
          :id="`${uid}-email`"
          v-model="form.email"
          type="email"
          autocomplete="email"
          :aria-invalid="Boolean(fieldErrors.email)"
          :aria-describedby="fieldErrors.email ? `${uid}-email-error` : undefined"
        />
        <p v-if="fieldErrors.email" :id="`${uid}-email-error`" class="text-sm text-destructive">
          {{ fieldErrors.email }}
        </p>
      </div>
      <div class="space-y-2">
        <UiLabel :for="`${uid}-phone`">Phone</UiLabel>
        <UiInput
          :id="`${uid}-phone`"
          v-model="form.phone"
          type="tel"
          autocomplete="tel"
          :aria-invalid="Boolean(fieldErrors.phone)"
          :aria-describedby="fieldErrors.phone ? `${uid}-phone-error` : undefined"
        />
        <p v-if="fieldErrors.phone" :id="`${uid}-phone-error`" class="text-sm text-destructive">
          {{ fieldErrors.phone }}
        </p>
      </div>
      <div class="space-y-2">
        <UiLabel :for="`${uid}-birthday`">Date of birth</UiLabel>
        <UiInput :id="`${uid}-birthday`" v-model="form.birthday" type="date" autocomplete="bday" />
      </div>
      <div class="space-y-2">
        <UiLabel :for="`${uid}-insurance`">Insurance</UiLabel>
        <UiInput :id="`${uid}-insurance`" v-model="form.insurance" placeholder="Blue Harbor PPO" />
      </div>
      <div class="space-y-2">
        <UiLabel :for="`${uid}-provider`">Preferred provider</UiLabel>
        <UiNativeSelect :id="`${uid}-provider`" v-model="form.preferredProviderId">
          <option value="">No preference</option>
          <option v-for="item in state?.providers" :key="item.id" :value="item.id">
            {{ item.name }}
          </option>
        </UiNativeSelect>
      </div>
      <div class="space-y-2">
        <UiLabel :for="`${uid}-tags`">Tags</UiLabel>
        <UiInput
          :id="`${uid}-tags`"
          v-model="form.tags"
          placeholder="Prefers mornings, Chronic care"
        />
      </div>
    </div>
    <div class="space-y-2">
      <UiLabel :for="`${uid}-notes`">Notes</UiLabel>
      <UiTextarea :id="`${uid}-notes`" v-model="form.notes" :rows="3" :maxlength="5000" />
    </div>
    <MendlyError :message="message || error" />
    <div class="flex flex-wrap items-center justify-end gap-2">
      <span v-if="dirty" class="mr-auto text-xs text-muted-foreground">Unsaved changes</span>
      <UiButton variant="outline" type="button" @click="emit('cancel')">Cancel</UiButton>
      <UiButton type="submit" :loading="pending">{{
        patient ? "Save changes" : "Add patient"
      }}</UiButton>
    </div>
  </form>
</template>
