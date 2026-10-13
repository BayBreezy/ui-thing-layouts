<script setup lang="ts">
  import { isOverdue, missingFields, nextBirthday, primaryEmail } from "#shared/contacts";
  import { addDays } from "#shared/contacts";
  import { findDuplicates } from "#shared/duplicates";
  import { relativeDay, today } from "~/utils/demo";
  usePageSeo({ title: "Overview" });
  const { state, nameOf } = useDemo();
  const active = computed(() => state.value?.contacts.filter((item) => !item.archived) ?? []);
  const overdue = computed(
    () => state.value?.followUps.filter((item) => isOverdue(item, today)) ?? []
  );
  const recent = computed(
    () => active.value.filter((item) => item.createdAt.slice(0, 10) >= addDays(today, -30)).length
  );
  const stats = computed(() => [
    {
      label: "Contacts",
      value: active.value.length,
      icon: "lucide:contact-round",
      to: "/contacts",
    },
    {
      label: "Favorites",
      value: active.value.filter((item) => item.favorite).length,
      icon: "lucide:star",
      to: "/contacts?fav=1",
    },
    {
      label: "Added in 30 days",
      value: recent.value,
      icon: "lucide:user-plus",
      to: "/contacts?sort=-createdAt",
    },
    {
      label: "Overdue follow-ups",
      value: overdue.value.length,
      icon: "lucide:calendar-clock",
      to: "/follow-ups",
    },
  ]);
  const due = computed(() =>
    (state.value?.followUps ?? [])
      .filter((item) => !item.done && item.dueDate <= addDays(today, 7))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5)
  );
  const birthdays = computed(() =>
    active.value
      .map((contact) => ({ contact, next: nextBirthday(contact.birthday, today) }))
      .filter((item) => item.next && item.next.days <= 30)
      .sort((a, b) => a.next!.days - b.next!.days)
      .slice(0, 5)
  );
  const reconnect = computed(() =>
    active.value
      .filter(
        (item) =>
          ["close", "friend"].includes(item.relationship) &&
          (!item.lastContactedAt || item.lastContactedAt.slice(0, 10) < addDays(today, -90))
      )
      .sort((a, b) => a.lastContactedAt.localeCompare(b.lastContactedAt))
      .slice(0, 4)
  );
  const duplicates = computed(() => findDuplicates(state.value?.contacts ?? []).length);
  const health = computed(() => {
    const total = active.value.length || 1;
    const pct = (count: number) => Math.round((count / total) * 100);
    return {
      email: pct(active.value.filter((item) => item.emails.length).length),
      phone: pct(active.value.filter((item) => item.phones.length).length),
      complete: active.value.filter((item) => missingFields(item).length === 0).length,
      missingEmail: active.value.filter((item) => !item.emails.length).length,
      missingPhone: active.value.filter((item) => !item.phones.length).length,
    };
  });
  const byGroup = computed(() =>
    (state.value?.groups ?? []).map((group) => ({
      name: group.name,
      count: active.value.filter((item) => item.groupIds.includes(group.id)).length,
    }))
  );
  const growth = computed(() => {
    const months: { label: string; key: string; count: number }[] = [];
    const end = new Date(today + "T00:00:00Z");
    for (let offset = 5; offset >= 0; offset--) {
      const date = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - offset, 1));
      months.push({
        key: date.toISOString().slice(0, 7),
        label: date.toLocaleString("en-US", { month: "short", timeZone: "UTC" }),
        count: 0,
      });
    }
    for (const contact of active.value) {
      const month = months.find((item) => item.key === contact.createdAt.slice(0, 7));
      if (month) month.count++;
    }
    return months;
  });
  const groupSeries = computed(() => [{ name: "People", data: byGroup.value.map((i) => i.count) }]);
  const groupOptions = computed(() => ({
    colors: ["var(--color-primary)"],
    chart: { animations: { enabled: false }, toolbar: { show: false } },
    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: "60%" } },
    xaxis: { categories: byGroup.value.map((i) => i.name) },
    dataLabels: { enabled: true },
    grid: { show: false },
  }));
  const growthSeries = computed(() => [
    { name: "People added", data: growth.value.map((item) => item.count) },
  ]);
  const growthOptions = computed(() => ({
    colors: ["var(--color-primary)"],
    chart: { animations: { enabled: false }, toolbar: { show: false } },
    xaxis: { categories: growth.value.map((item) => item.label) },
    fill: { type: "gradient", gradient: { opacityFrom: 0.3, opacityTo: 0.02 } },
    stroke: { width: 2 },
    yaxis: { labels: { formatter: (value: number) => String(Math.round(value)) } },
  }));
  const firstName = computed(() => state.value?.profile.name.split(" ")[0] ?? "");
</script>
<template>
  <div class="page-shell">
    <VerdantPageHeader
      :title="`Good to see you, ${firstName}.`"
      description="Here's who and what needs your attention today."
    >
      <UiButton variant="outline" to="/contacts?import=1">
        <Icon name="lucide:upload" />Import
      </UiButton>
      <UiButton to="/contacts/new"><Icon name="lucide:user-plus" />New contact</UiButton>
    </VerdantPageHeader>

    <div class="grid gap-4 @lg:grid-cols-2 @4xl:grid-cols-4">
      <NuxtLink v-for="stat in stats" :key="stat.label" :to="stat.to" class="group block">
        <UiCard class="h-full gap-4 transition-shadow group-hover:shadow-md">
          <UiCardHeader>
            <UiCardDescription>{{ stat.label }}</UiCardDescription>
            <UiCardTitle as="p" class="text-3xl tabular-nums" :data-testid="'stat-' + stat.label">{{
              stat.value
            }}</UiCardTitle>
            <UiCardAction>
              <Icon :name="stat.icon" class="size-5 text-primary" />
            </UiCardAction>
          </UiCardHeader>
        </UiCard>
      </NuxtLink>
    </div>

    <div class="mt-6 grid gap-6 @4xl:grid-cols-3">
      <UiCard class="@4xl:col-span-2">
        <UiCardHeader>
          <UiCardTitle as="h2">Follow-ups on deck</UiCardTitle>
          <UiCardDescription>Overdue, due today and coming up this week.</UiCardDescription>
          <UiCardAction>
            <UiButton to="/follow-ups" variant="ghost" size="sm">View all</UiButton>
          </UiCardAction>
        </UiCardHeader>
        <UiCardContent>
          <VerdantFollowUpList v-if="due.length" :items="due" show-contact />
          <VerdantEmpty
            v-else
            title="You're all caught up"
            description="No follow-ups are due this week."
            icon="lucide:party-popper"
          />
        </UiCardContent>
      </UiCard>

      <UiCard>
        <UiCardHeader>
          <UiCardTitle as="h2">Upcoming birthdays</UiCardTitle>
          <UiCardDescription>In the next 30 days.</UiCardDescription>
        </UiCardHeader>
        <UiCardContent>
          <ul v-if="birthdays.length" class="space-y-3">
            <li v-for="item in birthdays" :key="item.contact.id" class="flex items-center gap-3">
              <VerdantContactAvatar :contact="item.contact" size="sm" />
              <div class="min-w-0 flex-1">
                <NuxtLink
                  :to="'/contacts/' + item.contact.id"
                  class="block truncate text-sm font-medium underline-offset-4 hover:underline"
                  >{{ nameOf(item.contact) }}</NuxtLink
                >
                <p class="text-xs text-muted-foreground">{{ relativeDay(item.next!.date) }}</p>
              </div>
              <UiButton
                v-if="primaryEmail(item.contact)"
                :href="'mailto:' + primaryEmail(item.contact)"
                variant="ghost"
                size="icon-sm"
                :aria-label="`Email ${nameOf(item.contact)}`"
              >
                <Icon name="lucide:mail" />
              </UiButton>
            </li>
          </ul>
          <p v-else class="text-sm text-muted-foreground">No birthdays coming up.</p>
        </UiCardContent>
      </UiCard>

      <UiCard>
        <UiCardHeader>
          <UiCardTitle as="h2">People by group</UiCardTitle>
          <UiCardDescription>A person can be in more than one group.</UiCardDescription>
        </UiCardHeader>
        <UiCardContent>
          <ClientOnly>
            <LazyUiApexchart
              type="bar"
              :height="260"
              :series="groupSeries"
              :options="groupOptions"
            />
            <template #fallback><UiSkeleton class="h-65" /></template>
          </ClientOnly>
          <ul class="sr-only" aria-label="People by group">
            <li v-for="item in byGroup" :key="item.name">{{ item.name }}: {{ item.count }}</li>
          </ul>
        </UiCardContent>
      </UiCard>

      <UiCard>
        <UiCardHeader>
          <UiCardTitle as="h2">Your network over time</UiCardTitle>
          <UiCardDescription>People added in the last six months.</UiCardDescription>
        </UiCardHeader>
        <UiCardContent>
          <ClientOnly>
            <LazyUiApexchart
              type="area"
              :height="260"
              :series="growthSeries"
              :options="growthOptions"
            />
            <template #fallback><UiSkeleton class="h-65" /></template>
          </ClientOnly>
          <ul class="sr-only" aria-label="People added by month">
            <li v-for="item in growth" :key="item.key">{{ item.label }}: {{ item.count }}</li>
          </ul>
        </UiCardContent>
      </UiCard>

      <UiCard>
        <UiCardHeader>
          <UiCardTitle as="h2">Data health</UiCardTitle>
          <UiCardDescription>How complete your address book is.</UiCardDescription>
        </UiCardHeader>
        <UiCardContent class="space-y-4">
          <div class="space-y-1.5">
            <div class="flex justify-between text-sm">
              <span>Have an email</span><span class="tabular-nums">{{ health.email }}%</span>
            </div>
            <UiProgress :model-value="health.email" aria-label="Contacts with an email" />
          </div>
          <div class="space-y-1.5">
            <div class="flex justify-between text-sm">
              <span>Have a phone number</span><span class="tabular-nums">{{ health.phone }}%</span>
            </div>
            <UiProgress :model-value="health.phone" aria-label="Contacts with a phone number" />
          </div>
          <ul class="space-y-1 text-sm">
            <li>
              <NuxtLink
                to="/contacts?missing=email"
                class="text-primary underline underline-offset-4 hover:no-underline"
                >{{ health.missingEmail }} missing an email</NuxtLink
              >
            </li>
            <li>
              <NuxtLink
                to="/contacts?missing=phone"
                class="text-primary underline underline-offset-4 hover:no-underline"
                >{{ health.missingPhone }} missing a phone number</NuxtLink
              >
            </li>
            <li>
              <NuxtLink
                to="/cleanup"
                class="text-primary underline underline-offset-4 hover:no-underline"
                >{{ duplicates }} possible
                {{ duplicates === 1 ? "duplicate" : "duplicates" }}</NuxtLink
              >
            </li>
          </ul>
        </UiCardContent>
      </UiCard>
    </div>

    <UiCard class="mt-6">
      <UiCardHeader>
        <UiCardTitle as="h2">Worth reconnecting</UiCardTitle>
        <UiCardDescription>
          Close friends and family you haven't spoken to in over three months.
        </UiCardDescription>
      </UiCardHeader>
      <UiCardContent>
        <ul v-if="reconnect.length" class="grid gap-3 @2xl:grid-cols-2">
          <li
            v-for="contact in reconnect"
            :key="contact.id"
            class="flex items-center gap-3 rounded-lg border p-3"
          >
            <VerdantContactAvatar :contact="contact" />
            <div class="min-w-0 flex-1">
              <NuxtLink
                :to="'/contacts/' + contact.id"
                class="block truncate text-sm font-medium underline-offset-4 hover:underline"
                >{{ nameOf(contact) }}</NuxtLink
              >
              <p class="text-xs text-muted-foreground">
                Last contact: {{ relativeDay(contact.lastContactedAt) }}
              </p>
            </div>
            <UiButton :to="'/contacts/' + contact.id + '?tab=timeline'" variant="outline" size="sm">
              Log a call
            </UiButton>
          </li>
        </ul>
        <p v-else class="text-sm text-muted-foreground">
          You're in touch with everyone who matters.
        </p>
      </UiCardContent>
    </UiCard>

    <section aria-labelledby="recent-activity" class="mt-6">
      <h2 id="recent-activity" class="mb-3 text-sm font-semibold">Recent activity</h2>
      <ul v-if="state?.activity.length" class="divide-y rounded-lg border">
        <li
          v-for="item in state.activity.slice(0, 6)"
          :key="item.id"
          class="flex gap-3 p-3 text-sm"
        >
          <NuxtLink :to="item.href" class="flex-1 underline-offset-4 hover:underline">{{
            item.title
          }}</NuxtLink>
          <span class="text-xs text-muted-foreground">{{ relativeDay(item.createdAt) }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>
