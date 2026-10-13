<script setup lang="ts">
  import { ValidationError } from "yup";

  import { contactSchema } from "#shared/schemas";
  import type { Address, Contact, LabeledValue } from "#shared/types";
  import { fieldLabels, relationships } from "#shared/types";
  import { clone, groupColorClasses, relationshipLabels } from "~/utils/demo";
  const props = defineProps<{ record: Contact }>();
  const emit = defineEmits<{ saved: [Contact] }>();
  const uid = useId();
  const form = ref(clone(props.record));
  const { state, saveContact, nameOf } = useDemo();
  const { pending, error, run } = useAction();
  const { markSaved } = useUnsaved(form);
  const problems = ref<Record<string, string>>({});

  const referrers = computed(() =>
    (state.value?.contacts ?? [])
      .filter((item) => item.id !== form.value.id)
      .sort((a, b) => nameOf(a).localeCompare(nameOf(b)))
  );
  const addressLabels = ["home", "work", "other"];

  function addValue(list: LabeledValue[], label: string) {
    list.push({ label, value: "", primary: list.length === 0 });
  }
  function removeValue(list: LabeledValue[], index: number) {
    const [removed] = list.splice(index, 1);
    if (removed?.primary && list[0]) list[0].primary = true;
  }
  function makePrimary(list: LabeledValue[], index: number) {
    list.forEach((item, position) => (item.primary = position === index));
  }
  function addAddress() {
    form.value.addresses.push({
      label: "home",
      street: "",
      city: "",
      region: "",
      postal: "",
      country: "",
    } satisfies Address);
  }
  function toggleGroup(id: string, on: boolean) {
    const set = new Set(form.value.groupIds);
    if (on) set.add(id);
    else set.delete(id);
    form.value.groupIds = [...set];
  }

  /** Trims input and drops blank rows before the record is validated or saved. */
  function normalized(): Contact {
    const draft = clone(form.value);
    const text = (value: string) => value.trim();
    const compact = (list: LabeledValue[]) => {
      const kept = list
        .map((item) => ({ ...item, value: text(item.value) }))
        .filter((item) => item.value);
      if (kept.length && !kept.some((item) => item.primary)) kept[0]!.primary = true;
      let seen = false;
      return kept.map((item) => {
        const primary = item.primary && !seen;
        seen = seen || primary;
        return { ...item, primary };
      });
    };
    draft.firstName = text(draft.firstName);
    draft.lastName = text(draft.lastName);
    draft.nickname = text(draft.nickname);
    draft.company = text(draft.company);
    draft.jobTitle = text(draft.jobTitle);
    draft.emails = compact(draft.emails);
    draft.phones = compact(draft.phones);
    draft.addresses = draft.addresses
      .map((item) => ({
        ...item,
        street: text(item.street),
        city: text(item.city),
        region: text(item.region),
        postal: text(item.postal),
        country: text(item.country),
      }))
      .filter((item) => item.street || item.city || item.region || item.postal || item.country);
    draft.websites = draft.websites.map(text).filter(Boolean);
    draft.labels = [...new Set(draft.labels.map(text).filter(Boolean))];
    draft.socials = {
      linkedin: text(draft.socials.linkedin),
      x: text(draft.socials.x),
      github: text(draft.socials.github),
      instagram: text(draft.socials.instagram),
    };
    draft.notes = draft.notes.trim();
    return draft;
  }
  async function submit() {
    const draft = normalized();
    problems.value = {};
    try {
      await contactSchema.validate(draft, { abortEarly: false });
    } catch (cause) {
      if (cause instanceof ValidationError) {
        const found: Record<string, string> = {};
        for (const inner of cause.inner.length ? cause.inner : [cause])
          found[inner.path || "form"] ??= inner.message;
        problems.value = found;
        error.value = "";
        return;
      }
      throw cause;
    }
    const saved = await run(() => saveContact(draft));
    if (saved) {
      form.value = clone(saved);
      markSaved();
      useSonner.success("Contact saved");
      emit("saved", saved);
    }
  }
  const summary = computed(() => Object.values(problems.value));
</script>
<template>
  <form novalidate class="space-y-6" @submit.prevent="submit">
    <fieldset :disabled="pending" class="space-y-6">
      <UiAlert
        v-if="summary.length"
        role="alert"
        variant="destructive"
        icon="lucide:circle-alert"
        title="Please fix the following"
      >
        <ul class="mt-1 list-disc space-y-0.5 pl-4 text-sm">
          <li v-for="item in summary" :key="item">{{ item }}</li>
        </ul>
      </UiAlert>

      <UiCard>
        <UiCardHeader>
          <UiCardTitle as="h2">Basics</UiCardTitle>
          <UiCardDescription>Who they are and how you know them.</UiCardDescription>
        </UiCardHeader>
        <UiCardContent class="grid gap-5 @xl:grid-cols-2">
          <div class="space-y-2">
            <UiLabel :for="`${uid}-first`">First name</UiLabel>
            <UiInput
              :id="`${uid}-first`"
              v-model="form.firstName"
              autocomplete="off"
              :aria-invalid="!!problems.form"
            />
          </div>
          <div class="space-y-2">
            <UiLabel :for="`${uid}-last`">Last name</UiLabel>
            <UiInput :id="`${uid}-last`" v-model="form.lastName" autocomplete="off" />
          </div>
          <div class="space-y-2">
            <UiLabel :for="`${uid}-nick`">Nickname</UiLabel>
            <UiInput :id="`${uid}-nick`" v-model="form.nickname" autocomplete="off" />
          </div>
          <div class="space-y-2">
            <UiLabel :for="`${uid}-birthday`">Birthday</UiLabel>
            <UiInput :id="`${uid}-birthday`" v-model="form.birthday" type="date" />
          </div>
          <div class="space-y-2">
            <UiLabel :for="`${uid}-company`">Company</UiLabel>
            <UiInput :id="`${uid}-company`" v-model="form.company" autocomplete="off" />
          </div>
          <div class="space-y-2">
            <UiLabel :for="`${uid}-title`">Job title</UiLabel>
            <UiInput :id="`${uid}-title`" v-model="form.jobTitle" autocomplete="off" />
          </div>
          <div class="space-y-2">
            <UiLabel :for="`${uid}-rel`">Relationship</UiLabel>
            <UiNativeSelect :id="`${uid}-rel`" v-model="form.relationship">
              <option v-for="item in relationships" :key="item" :value="item">
                {{ relationshipLabels[item] }}
              </option>
            </UiNativeSelect>
          </div>
          <div class="space-y-2">
            <UiLabel :for="`${uid}-referrer`">Introduced by</UiLabel>
            <UiNativeSelect :id="`${uid}-referrer`" v-model="form.referredById">
              <option value="">Nobody in particular</option>
              <option v-for="item in referrers" :key="item.id" :value="item.id">
                {{ nameOf(item) }}
              </option>
            </UiNativeSelect>
          </div>
          <div class="flex items-center gap-3 @xl:col-span-2">
            <UiSwitch :id="`${uid}-fav`" v-model="form.favorite" />
            <UiLabel :for="`${uid}-fav`">Favorite</UiLabel>
          </div>
        </UiCardContent>
      </UiCard>

      <UiCard>
        <UiCardHeader>
          <UiCardTitle as="h2">Ways to reach them</UiCardTitle>
          <UiCardDescription>Add as many emails and phone numbers as you need.</UiCardDescription>
        </UiCardHeader>
        <UiCardContent class="space-y-6">
          <section aria-labelledby="emails-heading" class="space-y-3">
            <h3 id="emails-heading" class="text-sm font-medium">Email addresses</h3>
            <div v-for="(item, index) in form.emails" :key="index" class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <UiNativeSelect
                  v-model="item.label"
                  class="w-28"
                  :aria-label="`Email ${index + 1} type`"
                >
                  <option v-for="label in fieldLabels" :key="label">{{ label }}</option>
                </UiNativeSelect>
                <UiInput
                  v-model="item.value"
                  type="email"
                  class="min-w-48 flex-1"
                  :aria-label="`Email ${index + 1}`"
                  :aria-invalid="!!problems[`emails[${index}].value`]"
                  placeholder="name@example.com"
                />
                <UiButton v-if="item.primary" type="button" variant="secondary" size="sm" disabled
                  >Primary</UiButton
                >
                <UiButton
                  v-else
                  type="button"
                  variant="ghost"
                  size="sm"
                  @click="makePrimary(form.emails, index)"
                  >Make primary</UiButton
                >
                <UiButton
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  :aria-label="`Remove email ${index + 1}`"
                  @click="removeValue(form.emails, index)"
                >
                  <Icon name="lucide:trash-2" />
                </UiButton>
              </div>
              <p v-if="problems[`emails[${index}].value`]" class="text-sm text-destructive">
                {{ problems[`emails[${index}].value`] }}
              </p>
            </div>
            <UiButton
              type="button"
              variant="outline"
              size="sm"
              @click="addValue(form.emails, 'work')"
            >
              <Icon name="lucide:plus" />Add email
            </UiButton>
          </section>
          <section aria-labelledby="phones-heading" class="space-y-3">
            <h3 id="phones-heading" class="text-sm font-medium">Phone numbers</h3>
            <div v-for="(item, index) in form.phones" :key="index" class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <UiNativeSelect
                  v-model="item.label"
                  class="w-28"
                  :aria-label="`Phone ${index + 1} type`"
                >
                  <option v-for="label in fieldLabels" :key="label">{{ label }}</option>
                </UiNativeSelect>
                <UiInput
                  v-model="item.value"
                  type="tel"
                  class="min-w-48 flex-1"
                  :aria-label="`Phone ${index + 1}`"
                  :aria-invalid="!!problems[`phones[${index}].value`]"
                  placeholder="+1 555 555 0100"
                />
                <UiButton v-if="item.primary" type="button" variant="secondary" size="sm" disabled
                  >Primary</UiButton
                >
                <UiButton
                  v-else
                  type="button"
                  variant="ghost"
                  size="sm"
                  @click="makePrimary(form.phones, index)"
                  >Make primary</UiButton
                >
                <UiButton
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  :aria-label="`Remove phone ${index + 1}`"
                  @click="removeValue(form.phones, index)"
                >
                  <Icon name="lucide:trash-2" />
                </UiButton>
              </div>
              <p v-if="problems[`phones[${index}].value`]" class="text-sm text-destructive">
                {{ problems[`phones[${index}].value`] }}
              </p>
            </div>
            <UiButton
              type="button"
              variant="outline"
              size="sm"
              @click="addValue(form.phones, 'mobile')"
            >
              <Icon name="lucide:plus" />Add phone
            </UiButton>
          </section>
        </UiCardContent>
      </UiCard>

      <UiCard>
        <UiCardHeader>
          <UiCardTitle as="h2">Where to find them</UiCardTitle>
          <UiCardDescription>Addresses, websites and social profiles.</UiCardDescription>
        </UiCardHeader>
        <UiCardContent class="space-y-6">
          <section aria-labelledby="addresses-heading" class="space-y-4">
            <h3 id="addresses-heading" class="text-sm font-medium">Addresses</h3>
            <div
              v-for="(address, index) in form.addresses"
              :key="index"
              class="space-y-3 rounded-lg border p-4"
            >
              <div class="flex items-center gap-2">
                <UiNativeSelect
                  v-model="address.label"
                  class="w-32"
                  :aria-label="`Address ${index + 1} type`"
                >
                  <option v-for="label in addressLabels" :key="label">{{ label }}</option>
                </UiNativeSelect>
                <UiButton
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  class="ml-auto"
                  :aria-label="`Remove address ${index + 1}`"
                  @click="form.addresses.splice(index, 1)"
                >
                  <Icon name="lucide:trash-2" />
                </UiButton>
              </div>
              <UiInput v-model="address.street" aria-label="Street" placeholder="Street" />
              <div class="grid gap-3 @xl:grid-cols-4">
                <UiInput v-model="address.city" aria-label="City" placeholder="City" />
                <UiInput
                  v-model="address.region"
                  aria-label="State or region"
                  placeholder="State / region"
                />
                <UiInput
                  v-model="address.postal"
                  aria-label="Postal code"
                  placeholder="Postal code"
                />
                <UiInput v-model="address.country" aria-label="Country" placeholder="Country" />
              </div>
            </div>
            <UiButton type="button" variant="outline" size="sm" @click="addAddress">
              <Icon name="lucide:plus" />Add address
            </UiButton>
          </section>
          <VerdantWebsiteList v-model="form.websites" />
          <section aria-labelledby="social-heading" class="space-y-3">
            <h3 id="social-heading" class="text-sm font-medium">Social profiles</h3>
            <div class="grid gap-3 @xl:grid-cols-2">
              <UiInput
                v-model="form.socials.linkedin"
                aria-label="LinkedIn"
                placeholder="LinkedIn"
              />
              <UiInput v-model="form.socials.x" aria-label="X" placeholder="X (Twitter)" />
              <UiInput v-model="form.socials.github" aria-label="GitHub" placeholder="GitHub" />
              <UiInput
                v-model="form.socials.instagram"
                aria-label="Instagram"
                placeholder="Instagram"
              />
            </div>
          </section>
        </UiCardContent>
      </UiCard>

      <UiCard>
        <UiCardHeader>
          <UiCardTitle as="h2">Organize</UiCardTitle>
          <UiCardDescription>Groups, labels and private notes.</UiCardDescription>
        </UiCardHeader>
        <UiCardContent class="space-y-6">
          <fieldset class="space-y-3">
            <legend class="text-sm font-medium">Groups</legend>
            <div v-if="state?.groups.length" class="grid gap-3 @lg:grid-cols-2">
              <label
                v-for="group in state.groups"
                :key="group.id"
                class="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm"
              >
                <UiCheckbox
                  :model-value="form.groupIds.includes(group.id)"
                  @update:model-value="toggleGroup(group.id, $event === true)"
                />
                <span :class="['size-2 rounded-full', groupColorClasses[group.color].dot]" />
                {{ group.name }}
              </label>
            </div>
            <p v-else class="text-sm text-muted-foreground">
              You haven't created any groups yet.
              <NuxtLink to="/groups" class="text-primary underline-offset-4 hover:underline"
                >Create one</NuxtLink
              >.
            </p>
          </fieldset>
          <UiVeeTagsInput
            v-model="form.labels"
            name="labels"
            label="Labels"
            placeholder="Add a label and press Enter"
            hint="Labels are free-form, like “VIP” or “Birthday card”."
          />
          <div class="space-y-2">
            <UiLabel :for="`${uid}-notes`">Notes</UiLabel>
            <UiTextarea :id="`${uid}-notes`" v-model="form.notes" :rows="5" />
          </div>
          <VerdantError :message="error" />
        </UiCardContent>
        <UiCardFooter class="justify-end gap-2">
          <UiButton type="submit" :loading="pending">Save contact</UiButton>
        </UiCardFooter>
      </UiCard>
    </fieldset>
  </form>
</template>
