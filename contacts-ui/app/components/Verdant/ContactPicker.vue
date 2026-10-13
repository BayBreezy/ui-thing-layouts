<script setup lang="ts">
  import { searchText } from "#shared/contacts";
  import type { Contact } from "#shared/types";

  const props = withDefaults(
    defineProps<{
      /** Candidates to choose from. Pass a filtered list to exclude people. */
      contacts: Contact[];
      id?: string;
      placeholder?: string;
      /** Shown when nothing matches the search. */
      emptyText?: string;
      /** Lets the person clear the choice again. */
      clearable?: boolean;
      disabled?: boolean;
    }>(),
    {
      id: undefined,
      placeholder: "Search people…",
      emptyText: "No one matches that search.",
      clearable: false,
      disabled: false,
    }
  );
  /** The chosen contact's id, or an empty string when nobody is chosen. */
  const model = defineModel<string>({ default: "" });
  const { nameOf } = useDemo();

  const options = computed(() =>
    props.contacts
      .map((contact) => ({
        contact,
        name: nameOf(contact),
        // Everything searchable lives in one string, because the row shows more than plain text.
        text: `${nameOf(contact)} ${searchText(contact)}`,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  );
  const selected = computed(() => options.value.find((item) => item.contact.id === model.value));
</script>
<template>
  <UiCombobox
    :model-value="model || undefined"
    :disabled="disabled"
    reset-model-value-on-clear
    @update:model-value="model = typeof $event === 'string' ? $event : ''"
  >
    <UiComboboxAnchor>
      <UiComboboxInput
        :id="id"
        :placeholder="placeholder"
        :display-value="
          (value: string) => options.find((item) => item.contact.id === value)?.name ?? ''
        "
      />
      <UiComboboxCancel
        v-if="clearable && selected"
        class="mr-1 inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
        aria-label="Clear selection"
      >
        <Icon name="lucide:x" class="size-4" />
      </UiComboboxCancel>
      <UiComboboxTrigger aria-label="Show all people">
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
          v-for="item in options"
          :key="item.contact.id"
          :value="item.contact.id"
          :text-value="item.text"
        >
          <span class="flex min-w-0 items-center gap-2">
            <VerdantContactAvatar :contact="item.contact" size="xs" />
            <span class="min-w-0">
              <span class="block truncate leading-tight">{{ item.name }}</span>
              <span
                v-if="item.contact.company || item.contact.jobTitle"
                class="block truncate text-xs text-muted-foreground"
                >{{
                  [item.contact.jobTitle, item.contact.company].filter(Boolean).join(" · ")
                }}</span
              >
            </span>
          </span>
        </UiComboboxItem>
      </UiComboboxGroup>
    </UiComboboxContent>
  </UiCombobox>
</template>
