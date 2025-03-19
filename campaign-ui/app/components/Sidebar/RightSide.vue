<template>
  <div class="flex flex-col gap-12">
    <div>
      <p class="mb-5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Recent Documents
      </p>
      <ul class="flex flex-col gap-4">
        <li v-for="item in recentDocuments" :key="item.title" class="flex items-center gap-3">
          <div
            class="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary via-primary to-primary/50 text-primary-foreground shadow-sm"
          >
            <Icon name="solar:document-text-line-duotone" class="size-5 shrink-0" />
          </div>
          <div class="flex flex-col text-sm">
            <p class="font-semibold">{{ item.title }}</p>
            <p class="text-xs text-muted-foreground/90">{{ item.date }}</p>
          </div>
        </li>
      </ul>
    </div>
    <div>
      <p class="mb-5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Team Members
      </p>
      <ul class="flex flex-col gap-4">
        <li v-for="item in users" :key="item.name" class="flex items-center gap-3">
          <UiAvatar :src="item.image" :alt="item.name" class="size-9" />
          <div class="flex flex-col text-sm">
            <p class="font-semibold">{{ item.name }}</p>
            <p class="text-xs text-muted-foreground/90">{{ item.jobTitle }}</p>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
  const recentDocuments = [
    { title: "Summer Campaign", date: "2 minutes ago" },
    { title: "Inspiration Notes", date: "3 minutes ago" },
    { title: "Campaign Mood Board", date: "3 hours ago" },
    { title: "UI Design Assets", date: "5 hours ago" },
    { title: "Product Roadmap", date: "1 day ago" },
    { title: "Marketing Plan", date: "2 days ago" },
    { title: "Design System", date: "3 days ago" },
    { title: "Product Launch", date: "1 week ago" },
  ];

  const users = [
    {
      name: "Jerome Francis",
      image: "https://randomuser.me/api/portraits/thumb/men/5.jpg",
      jobTitle: "Product Designer",
    },
    {
      name: "Mildred Wagner",
      image: "https://randomuser.me/api/portraits/thumb/men/6.jpg",
      jobTitle: "Marketing Manager",
    },
    {
      name: "Lena Mccoy",
      image: "https://randomuser.me/api/portraits/thumb/women/5.jpg",
      jobTitle: "Assistant Coach",
    },
    {
      name: "Shawna Chin",
      image: "https://randomuser.me/api/portraits/thumb/women/6.jpg",
      jobTitle: "Medical Nurse",
    },
  ];
</script>
