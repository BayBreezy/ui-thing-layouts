<template>
  <div class="@container">
    <div class="@tabUp:flex-row @tabUp:items-start @tabUp:justify-between flex flex-col gap-4">
      <div class="relative flex flex-col gap-1">
        <h1 id="site-h1" class="@tabUp:text-3xl text-2xl font-bold tracking-tight">
          Site Overview
        </h1>
        <p class="@tabUp:text-lg text-muted-foreground">
          This is an overview of your site & data traffic.
        </p>
        <div class="absolute right-0 top-0 md:hidden">
          <UiSidebarTrigger
            class="size-9 rounded-md border text-muted-foreground [&>svg]:size-[18px]"
          />
        </div>
      </div>
      <div class="@tabUp:flex grid grid-cols-3 gap-3">
        <UiButton variant="outline">
          <Icon name="i:link-03" class="size-5 shrink-0 text-muted-foreground/80" />
          <span class="font-semibold">Share link</span>
        </UiButton>
        <UiButton variant="outline" class="shadow-sm">
          <Icon name="i:colors" class="size-5 shrink-0 text-muted-foreground/80" />
          <span class="font-semibold">Customize</span>
        </UiButton>
        <UiButton>
          <Icon name="i:refresh-cw-02" class="size-5 shrink-0 text-primary-foreground/80" />
          <span>Refresh</span>
        </UiButton>
        <UiChip
          class="@tabUp:block hidden"
          position="bottom-right"
          inset
          size="md"
          color="bg-green-500"
        >
          <UiAvatar class="@tabUp:flex ml-3 hidden ring-1 ring-border/50">
            <UiAvatarImage src="https://behonbaker.com/icon.png" alt="Logged in user" />
            <UiAvatarFallback>BB</UiAvatarFallback>
          </UiAvatar>
        </UiChip>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup></script>
