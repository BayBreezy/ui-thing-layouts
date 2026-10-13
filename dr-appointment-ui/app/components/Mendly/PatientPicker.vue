<script setup lang="ts">
  import { fullName, searchPatients } from "#shared/patients";
  import type { Patient } from "#shared/types";

  const props = withDefaults(
    defineProps<{
      patients: Patient[];
      id?: string;
      placeholder?: string;
      emptyText?: string;
      disabled?: boolean;
    }>(),
    {
      id: undefined,
      placeholder: "Search patients…",
      emptyText: "No patient matches that search.",
      disabled: false,
    }
  );
  /** The chosen patient's id, or an empty string when nobody is chosen. */
  const model = defineModel<string>({ default: "" });
  const search = ref("");

  const options = computed(() =>
    props.patients
      .map((patient) => ({ patient, name: fullName(patient) }))
      .sort((a, b) => a.name.localeCompare(b.name))
  );
  /** The list is long, so cap what renders and let the search narrow it. */
  const visible = computed(() => {
    const matches = search.value
      ? new Set(searchPatients(props.patients, search.value).map((item) => item.id))
      : null;
    const list = matches
      ? options.value.filter((item) => matches.has(item.patient.id))
      : options.value;
    const selected = options.value.find((item) => item.patient.id === model.value);
    const head = list.slice(0, 40);
    return selected && !head.includes(selected) ? [selected, ...head] : head;
  });
</script>
<template>
  <UiCombobox
    :model-value="model || undefined"
    :disabled="disabled"
    :ignore-filter="true"
    reset-model-value-on-clear
    @update:model-value="model = typeof $event === 'string' ? $event : ''"
  >
    <UiComboboxAnchor>
      <UiComboboxInput
        :id="id"
        :placeholder="placeholder"
        :display-value="
          (value: string) => options.find((item) => item.patient.id === value)?.name ?? ''
        "
        @input="search = ($event.target as HTMLInputElement).value"
      />
      <UiComboboxTrigger aria-label="Show patients">
        <Icon name="lucide:chevrons-up-down" class="size-4 text-muted-foreground" />
      </UiComboboxTrigger>
    </UiComboboxAnchor>
    <UiComboboxContent>
      <UiComboboxEmpty
        class="flex items-center justify-center p-4 text-center text-sm font-medium text-pretty"
      >
        {{ emptyText }}
      </UiComboboxEmpty>
      <UiComboboxGroup>
        <UiComboboxItem
          v-for="item in visible"
          :key="item.patient.id"
          :value="item.patient.id"
          :text-value="item.name"
        >
          <span class="flex min-w-0 items-center gap-2">
            <MendlyAvatar :name="item.name" size="xs" />
            <span class="min-w-0">
              <span class="block truncate leading-tight">{{ item.name }}</span>
              <span class="block truncate text-xs text-muted-foreground">{{
                item.patient.email
              }}</span>
            </span>
          </span>
        </UiComboboxItem>
      </UiComboboxGroup>
    </UiComboboxContent>
  </UiCombobox>
</template>
