<template>
  <UiSidebarProvider v-slot="{ open, isMobile }">
    <Sidebar />
    <UiSidebarInset class="">
      <div class="grid grid-cols-1 xl:grid-cols-[1fr,290px]">
        <div class="mx-auto w-full max-w-[1700px]">
          <header class="flex h-16 items-center justify-between bg-background px-4 lg:h-14 lg:px-8">
            <div class="flex items-center gap-3">
              <ClientOnly>
                <UiSidebarTrigger v-if="isMobile || !open" class="size-8 shrink-0">
                  <Icon
                    name="solar:square-alt-arrow-right-line-duotone"
                    class="size-6 text-muted-foreground"
                  />
                </UiSidebarTrigger>
              </ClientOnly>
              <UiBreadcrumbs
                class="hidden gap-3 md:flex"
                :items="[{ label: 'Campaigns' }, { label: 'Analytics' }]"
              />
            </div>
            <div class="flex items-center gap-1 lg:gap-3">
              <div class="hidden lg:block lg:w-[300px]">
                <UiVeeInput
                  class="border-none bg-muted"
                  icon="solar:magnifer-linear"
                  placeholder="Search..."
                >
                  <template #trailingIcon>
                    <div
                      class="absolute inset-y-0 right-3 flex items-center justify-center text-sm opacity-50"
                    >
                      {{ metaSymbol }} /
                    </div>
                  </template>
                </UiVeeInput>
              </div>
              <UiButton class="shrink-0 lg:hidden" size="icon" variant="ghost">
                <Icon name="solar:minimalistic-magnifer-bold-duotone" class="size-6" />
              </UiButton>
              <UiChip class="bg-sky-500 text-white" inset size="2xl" text="2">
                <UiButton class="shrink-0" size="icon" variant="ghost">
                  <Icon name="solar:bell-bold-duotone" class="size-6" />
                </UiButton>
              </UiChip>
              <UiButton
                class="shrink-0"
                size="icon"
                variant="ghost"
                @click="$colorMode.preference = $colorMode.value == 'dark' ? 'light' : 'dark'"
              >
                <Icon name="solar:cloudy-moon-bold-duotone" class="size-6" />
              </UiButton>
              <SignIn>
                <UiButton class="shrink-0" size="icon" variant="ghost">
                  <Icon name="solar:user-bold-duotone" class="size-6" />
                </UiButton>
              </SignIn>
            </div>
          </header>
          <div class="mx-auto w-full max-w-[1700px] px-4 py-8 lg:px-8">
            <slot />
          </div>
        </div>
        <aside class="sticky top-0 hidden h-dvh border-l xl:block">
          <UiScrollArea class="h-full p-5">
            <SidebarRightSide />
          </UiScrollArea>
        </aside>
      </div>
    </UiSidebarInset>
  </UiSidebarProvider>
</template>

<script lang="ts" setup>
  const { metaSymbol } = useShortcuts();
</script>
