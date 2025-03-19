<template>
  <div>
    <h2 class="text-xl font-bold lg:text-2xl">Recent campaigns</h2>

    <div class="grid w-full grid-cols-1">
      <UiScrollArea type="auto" orientation="horizontal" class="mt-4 w-full pb-4">
        <div class="flex flex-nowrap items-start gap-4 xl:gap-6">
          <div v-for="item in campaigns" :key="item.title">
            <div class="flex items-center gap-4">
              <span class="text-sm text-muted-foreground">{{ item.title }}</span>
              <UiBadge variant="secondary">{{ item.items.length }}</UiBadge>
            </div>
            <ul class="mt-4 flex flex-col gap-4">
              <template v-for="(child, i) in item.items" :key="i">
                <RecentCard v-bind="child" />
              </template>
            </ul>
            <UiButton size="sm" variant="ghost" class="mt-5">
              <Icon name="solar:add-circle-line-duotone" class="size-5 text-muted-foreground" />
              <span>Add new campaign</span>
            </UiButton>
          </div>
        </div>
      </UiScrollArea>
    </div>
  </div>
</template>

<script lang="ts" setup>
  const campaigns = [
    {
      title: "Draft",
      items: [
        {
          title: "10 Simple steps to revolutionize workflows with our product",
          start: "Not Started",
          end: "",
          progress: 0,
          updated: "Apr 10, 2023",
          companyIcon: "logos:facebook",
          users: [
            {
              name: "Sally Roberts",
              image: "https://randomuser.me/api/portraits/thumb/women/6.jpg",
            },
            {
              name: "Sasha Ricketts",
              image: "https://randomuser.me/api/portraits/thumb/women/1.jpg",
            },
            {
              name: "Marlon Green",
              image: "https://randomuser.me/api/portraits/thumb/men/1.jpg",
            },
          ],
        },
        {
          title: "Beyond Boundaries: Explore our new product features",
          start: "Not Started",
          end: "",
          progress: 0,
          updated: "May 8, 2023",
          companyIcon: "skill-icons:instagram",
          users: [
            {
              name: "Sally Roberts",
              image: "https://randomuser.me/api/portraits/thumb/women/6.jpg",
            },
            {
              name: "Sasha Ricketts",
              image: "https://randomuser.me/api/portraits/thumb/women/1.jpg",
            },
            {
              name: "Marlon Green",
              image: "https://randomuser.me/api/portraits/thumb/men/1.jpg",
            },
          ],
        },
      ],
    },
    {
      title: "In Progress",
      items: [
        {
          title: "Boost your performance: start using our new features",
          start: "Jun 1, 2025",
          end: "Aug 1, 2025",
          progress: 40,
          updated: "Jul 10, 2025",
          companyIcon: "logos:google-icon",
          users: [
            {
              name: "Merlina Roberts",
              image: "https://randomuser.me/api/portraits/thumb/women/16.jpg",
            },
          ],
        },
        {
          title: "Skyrocket your productivity: 10 tips to get more done",
          start: "Jun 1, 2025",
          end: "Aug 1, 2025",
          progress: 10,
          updated: "Jun 23, 2025",
          companyIcon: "logos:facebook",
          users: [
            {
              name: "Margarett Holmes",
              image: "https://randomuser.me/api/portraits/thumb/women/61.jpg",
            },
            {
              name: "Chantel Woe",
              image: "https://randomuser.me/api/portraits/thumb/women/11.jpg",
            },
          ],
        },
      ],
    },
    {
      title: "Archived",
      items: [
        {
          title: "The power of simplicity: how to get more done in less time",
          start: "",
          end: "Oct 1, 2025",
          progress: 100,
          updated: "May 5, 2025",
          companyIcon: "logos:google-icon",
          users: [
            {
              name: "Gregory Green",
              image: "https://randomuser.me/api/portraits/thumb/men/16.jpg",
            },
          ],
        },
      ],
    },
  ];
</script>
