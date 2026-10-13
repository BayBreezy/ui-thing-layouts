<script setup lang="ts">
  import { location, primaryEmail, primaryPhone } from "#shared/contacts";
  import type { Contact } from "#shared/types";
  import { groupColorClasses } from "~/utils/demo";
  const props = defineProps<{ contact: Contact; selected?: boolean }>();
  const emit = defineEmits<{ select: [boolean]; favorite: [] }>();
  const { state, nameOf } = useDemo();
  const groups = computed(
    () => state.value?.groups.filter((group) => props.contact.groupIds.includes(group.id)) ?? []
  );
  const name = computed(() => nameOf(props.contact));
</script>
<template>
  <UiCard
    class="relative gap-4 py-5 transition-shadow hover:shadow-md"
    :class="selected && 'ring-2 ring-primary'"
  >
    <UiCardContent class="space-y-4">
      <div class="flex items-start gap-3">
        <UiCheckbox
          :model-value="selected"
          :aria-label="`Select ${name}`"
          class="mt-1"
          @update:model-value="emit('select', $event === true)"
        />
        <VerdantContactAvatar :contact="contact" size="lg" />
        <div class="min-w-0 flex-1">
          <NuxtLink
            :to="'/contacts/' + contact.id"
            class="block truncate font-medium after:absolute after:inset-0 hover:underline"
            >{{ name }}</NuxtLink
          >
          <p class="truncate text-sm text-muted-foreground">
            {{ [contact.jobTitle, contact.company].filter(Boolean).join(" · ") || "No company" }}
          </p>
        </div>
        <UiButton
          variant="ghost"
          size="icon-sm"
          class="relative z-10"
          :aria-label="
            contact.favorite ? `Remove ${name} from favorites` : `Add ${name} to favorites`
          "
          :aria-pressed="contact.favorite"
          @click="emit('favorite')"
        >
          <VerdantStar :filled="contact.favorite" />
        </UiButton>
      </div>
      <dl class="space-y-1.5 text-sm">
        <div v-if="primaryEmail(contact)" class="flex items-center gap-2">
          <dt class="sr-only">Email</dt>
          <Icon name="lucide:mail" class="size-4 shrink-0 text-muted-foreground" />
          <dd class="truncate">{{ primaryEmail(contact) }}</dd>
        </div>
        <div v-if="primaryPhone(contact)" class="flex items-center gap-2">
          <dt class="sr-only">Phone</dt>
          <Icon name="lucide:phone" class="size-4 shrink-0 text-muted-foreground" />
          <dd>{{ primaryPhone(contact) }}</dd>
        </div>
        <div v-if="location(contact)" class="flex items-center gap-2">
          <dt class="sr-only">Location</dt>
          <Icon name="lucide:map-pin" class="size-4 shrink-0 text-muted-foreground" />
          <dd class="truncate">{{ location(contact) }}</dd>
        </div>
      </dl>
      <ul v-if="groups.length" class="flex flex-wrap gap-1.5" aria-label="Groups">
        <li v-for="group in groups" :key="group.id">
          <span
            :class="[
              'inline-flex rounded-md px-2 py-0.5 text-xs font-medium',
              groupColorClasses[group.color].soft,
            ]"
            >{{ group.name }}</span
          >
        </li>
      </ul>
    </UiCardContent>
  </UiCard>
</template>
