<template>
  <UiCard as="li" class="w-full min-w-[300px] max-w-[500px] xl:min-w-[350px]">
    <UiCardContent>
      <div class="flex items-center justify-between">
        <Icon :name="companyIcon" class="size-7" />
        <div class="flex items-center -space-x-2">
          <UiAvatar
            v-for="(item, i) in users"
            :key="i"
            class="ring-2 ring-background"
            :src="item.image"
            :alt="item.name"
          />
        </div>
      </div>
      <UiCardTitle class="mt-6 line-clamp-2 text-lg">{{ title }}</UiCardTitle>
      <div class="mt-4 flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <p v-if="start">
          <span>Start</span>:
          <span class="text-foreground">{{ start }}</span>
        </p>
        <p v-if="end">
          <span>End</span>: <span class="text-foreground">{{ end }}</span>
        </p>
      </div>
      <UiProgress :model-value="progress" class="mt-3 h-2 [&>div]:bg-green-500" />
      <div class="mt-6 text-sm">
        <span class="text-muted-foreground">Last updated:</span> <span>{{ updated }}</span>
      </div>
    </UiCardContent>
  </UiCard>
</template>

<script lang="ts" setup>
  type Item = {
    title: string;
    start: string;
    end: string;
    progress: number;
    updated: string;
    companyIcon: string;
    users: User[];
  };
  type User = {
    name: string;
    image: string;
  };

  defineProps<Item>();
</script>
