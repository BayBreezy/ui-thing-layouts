<script setup lang="ts">
  import { nextBirthday } from "#shared/contacts";
  import type { Contact } from "#shared/types";
  import {
    dateLabel,
    groupColorClasses,
    relationshipLabels,
    relativeDay,
    today,
  } from "~/utils/demo";
  const props = defineProps<{ contact: Contact }>();
  const { state, nameOf } = useDemo();
  const groups = computed(
    () => state.value?.groups.filter((item) => props.contact.groupIds.includes(item.id)) ?? []
  );
  const referrer = computed(() =>
    state.value?.contacts.find((item) => item.id === props.contact.referredById)
  );
  const referred = computed(
    () => state.value?.contacts.filter((item) => item.referredById === props.contact.id) ?? []
  );
  const birthday = computed(() => nextBirthday(props.contact.birthday, today));
  const nextFollowUp = computed(
    () =>
      (state.value?.followUps ?? [])
        .filter((item) => item.contactId === props.contact.id && !item.done)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
  );
  const socials = computed(() =>
    Object.entries(props.contact.socials).filter(([, value]) => value)
  );
  const socialUrl = (network: string, value: string) => {
    if (/^https?:\/\//.test(value)) return value;
    if (network === "linkedin") return `https://${value.replace(/^\/+/, "")}`;
    const handle = value.replace(/^@/, "");
    return (
      {
        x: `https://x.com/${handle}`,
        github: `https://github.com/${handle}`,
        instagram: `https://instagram.com/${handle}`,
      }[network] ?? `https://${value}`
    );
  };
</script>
<template>
  <div class="grid gap-6 @3xl:grid-cols-2">
    <UiCard>
      <UiCardHeader><UiCardTitle as="h2">Contact details</UiCardTitle></UiCardHeader>
      <UiCardContent class="space-y-4 text-sm">
        <p
          v-if="
            !contact.emails.length &&
            !contact.phones.length &&
            !contact.addresses.length &&
            !contact.websites.length &&
            !socials.length
          "
          class="text-muted-foreground"
        >
          No contact details yet. Add some from the Edit tab.
        </p>
        <ul v-if="contact.emails.length" class="space-y-2" aria-label="Email addresses">
          <li v-for="item in contact.emails" :key="item.value" class="flex items-center gap-2">
            <Icon name="lucide:mail" class="size-4 text-muted-foreground" />
            <a
              :href="'mailto:' + item.value"
              class="text-primary underline underline-offset-4 hover:no-underline"
              >{{ item.value }}</a
            >
            <UiBadge variant="outline" class="capitalize">{{ item.label }}</UiBadge>
            <UiBadge v-if="item.primary" variant="secondary">Primary</UiBadge>
          </li>
        </ul>
        <ul v-if="contact.phones.length" class="space-y-2" aria-label="Phone numbers">
          <li v-for="item in contact.phones" :key="item.value" class="flex items-center gap-2">
            <Icon name="lucide:phone" class="size-4 text-muted-foreground" />
            <a
              :href="'tel:' + item.value.replace(/[^\d+]/g, '')"
              class="text-primary underline underline-offset-4 hover:no-underline"
              >{{ item.value }}</a
            >
            <UiBadge variant="outline" class="capitalize">{{ item.label }}</UiBadge>
            <UiBadge v-if="item.primary" variant="secondary">Primary</UiBadge>
          </li>
        </ul>
        <ul v-if="contact.addresses.length" class="space-y-2" aria-label="Addresses">
          <li v-for="(item, index) in contact.addresses" :key="index" class="flex gap-2">
            <Icon name="lucide:map-pin" class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span>
              {{
                [item.street, item.city, item.region, item.postal, item.country]
                  .filter(Boolean)
                  .join(", ")
              }}
              <UiBadge variant="outline" class="ml-1 capitalize">{{ item.label }}</UiBadge>
            </span>
          </li>
        </ul>
        <ul v-if="contact.websites.length" class="space-y-2" aria-label="Websites">
          <li v-for="item in contact.websites" :key="item" class="flex items-center gap-2">
            <Icon name="lucide:globe" class="size-4 text-muted-foreground" />
            <a
              :href="item"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary underline underline-offset-4 hover:no-underline"
              >{{ item }}</a
            >
          </li>
        </ul>
        <ul v-if="socials.length" class="flex flex-wrap gap-2" aria-label="Social profiles">
          <li v-for="[network, value] in socials" :key="network">
            <UiButton
              :href="socialUrl(network, value)"
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
              size="sm"
              class="capitalize"
            >
              {{ network === "x" ? "X" : network }}<Icon name="lucide:arrow-up-right" />
            </UiButton>
          </li>
        </ul>
      </UiCardContent>
    </UiCard>

    <UiCard>
      <UiCardHeader><UiCardTitle as="h2">About</UiCardTitle></UiCardHeader>
      <UiCardContent>
        <dl class="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-3 text-sm">
          <dt class="text-muted-foreground">Relationship</dt>
          <dd>{{ relationshipLabels[contact.relationship] }}</dd>
          <dt class="text-muted-foreground">Last contact</dt>
          <dd>{{ relativeDay(contact.lastContactedAt) }}</dd>
          <dt class="text-muted-foreground">Next follow-up</dt>
          <dd>
            <template v-if="nextFollowUp">
              {{ nextFollowUp.title }} ·
              <span :class="nextFollowUp.dueDate < today && 'font-medium text-destructive'">{{
                relativeDay(nextFollowUp.dueDate)
              }}</span>
            </template>
            <template v-else>None scheduled</template>
          </dd>
          <dt class="text-muted-foreground">Birthday</dt>
          <dd>
            <template v-if="contact.birthday">
              {{ dateLabel(contact.birthday) }}
              <span v-if="birthday" class="text-muted-foreground">
                ·
                {{ birthday.days === 0 ? "today" : `in ${birthday.days} days` }}</span
              >
            </template>
            <template v-else>—</template>
          </dd>
          <dt class="text-muted-foreground">Introduced by</dt>
          <dd>
            <NuxtLink
              v-if="referrer"
              :to="'/contacts/' + referrer.id"
              class="text-primary underline underline-offset-4 hover:no-underline"
              >{{ nameOf(referrer) }}</NuxtLink
            >
            <template v-else>—</template>
          </dd>
          <dt v-if="referred.length" class="text-muted-foreground">Introduced</dt>
          <dd v-if="referred.length">
            <template v-for="(item, index) in referred" :key="item.id">
              <NuxtLink
                :to="'/contacts/' + item.id"
                class="text-primary underline underline-offset-4 hover:no-underline"
                >{{ nameOf(item) }}</NuxtLink
              ><template v-if="index < referred.length - 1">, </template>
            </template>
          </dd>
          <dt class="text-muted-foreground">Source</dt>
          <dd class="capitalize">{{ contact.source }}</dd>
          <dt class="text-muted-foreground">Added</dt>
          <dd>{{ dateLabel(contact.createdAt) }}</dd>
        </dl>
      </UiCardContent>
    </UiCard>

    <UiCard>
      <UiCardHeader><UiCardTitle as="h2">Groups & labels</UiCardTitle></UiCardHeader>
      <UiCardContent class="space-y-4">
        <ul v-if="groups.length" class="flex flex-wrap gap-2" aria-label="Groups">
          <li v-for="group in groups" :key="group.id">
            <NuxtLink
              :to="'/groups/' + group.id"
              :class="[
                'inline-flex rounded-md px-2 py-1 text-xs font-medium hover:underline',
                groupColorClasses[group.color].soft,
              ]"
              >{{ group.name }}</NuxtLink
            >
          </li>
        </ul>
        <p v-else class="text-sm text-muted-foreground">Not in any group.</p>
        <ul v-if="contact.labels.length" class="flex flex-wrap gap-2" aria-label="Labels">
          <li v-for="label in contact.labels" :key="label">
            <UiBadge variant="outline">{{ label }}</UiBadge>
          </li>
        </ul>
      </UiCardContent>
    </UiCard>

    <UiCard>
      <UiCardHeader><UiCardTitle as="h2">Notes</UiCardTitle></UiCardHeader>
      <UiCardContent>
        <p v-if="contact.notes" class="text-sm leading-6 whitespace-pre-wrap">
          {{ contact.notes }}
        </p>
        <p v-else class="text-sm text-muted-foreground">No notes yet.</p>
      </UiCardContent>
    </UiCard>
  </div>
</template>
