<template>
  <div class="container py-6">
    <Heading />
    <div class="@container">
      <div
        class="mt-6 grid grid-cols-1 gap-6 @[800px]:mt-8 @[1100px]:flex @[1100px]:items-center @[1100px]:justify-between"
      >
        <SessionTabs />
        <div class="@tabUp:flex @tabUp:items-center grid grid-cols-2 gap-3">
          <UiButton variant="outline">
            <Icon name="i:filter-lines" class="size-5 text-muted-foreground/80" />
            <span>Filter</span>
          </UiButton>
          <UiButton variant="outline">
            <span>Last 30 days</span>
            <Icon name="i:chevron-down" class="size-5 text-muted-foreground/80" />
          </UiButton>
        </div>
      </div>
    </div>

    <StatCards />

    <!-- Grid with two lists -->
    <div class="@container">
      <div
        aria-label="Grid showing two lists of data"
        class="@tabUp:grid-cols-2 mb-8 mt-6 grid grid-cols-1 gap-6 gap-y-10"
      >
        <List title="Top clicked buttons and links">
          <ul
            aria-label="a list showing top clicked buttons and links"
            class="flex w-full flex-col gap-4"
          >
            <ListItem v-for="item in list1" :key="item.title" v-bind="item" />
          </ul>
        </List>
        <List title="Top pages by traffic">
          <ul aria-label="a list showing top pages by traffic" class="flex w-full flex-col gap-4">
            <ListItem v-for="item in list2" :key="item.title" v-bind="item" />
          </ul>
        </List>
      </div>
    </div>

    <VTour
      auto-start
      :show-arrow="false"
      :start-delay="1000"
      name="intro"
      highlight
      :steps="steps"
    />
  </div>
</template>

<script lang="ts" setup>
  import type { TourStep } from "#nuxt-tour/props";

  const steps: TourStep[] = [
    {
      target: "#site-h1",
      title: "Welcome to the Site Analytics Dashboard",
      popperConfig: { placement: "bottom-start" },
      body: "Check out the overview of your site & data traffic.",
    },
    {
      target: "#draggable-item-512",
      title: "Drag Stats Around",
      subText: "Their positions are saved",
      popperConfig: { placement: "bottom-start" },
      body: "You can drag the stats around to reorder them. The position will be saved in local storage 💪🏽.",
    },
  ];

  const list1 = [
    { title: "Preview in Figma", progress: 80, sessions: 12 },
    { title: "Free icons", progress: 60, sessions: 21 },
    { title: "New landing page", progress: 40, sessions: 82 },
    { title: "New logo", progress: 20, sessions: 51 },
    { title: "New website", progress: 10, sessions: 32 },
    { title: "New dashboard", progress: 22, sessions: 24 },
    { title: "New app", progress: 43, sessions: 87 },
    { title: "New design system", progress: 13, sessions: 53 },
    { title: "New UI kit", progress: 91, sessions: 12 },
  ];

  const list2 = [
    { title: "ui-thing.com/", progress: 80, sessions: 12 },
    { title: "ui-thing.com/blog", progress: 60, sessions: 21 },
    { title: "ui-thing.com/dashboard", progress: 40, sessions: 82 },
    { title: "ui-thing.com/pricing", progress: 20, sessions: 51 },
    { title: "ui-thing.com/about", progress: 10, sessions: 32 },
    { title: "ui-thing.com/contact", progress: 22, sessions: 24 },
    { title: "ui-thing.com/faq", progress: 43, sessions: 87 },
    { title: "ui-thing.com/support", progress: 13, sessions: 53 },
    { title: "ui-thing.com/404", progress: 91, sessions: 12 },
  ];
</script>
