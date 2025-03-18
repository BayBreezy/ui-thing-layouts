<template>
  <form>
    <UiSidebarGroup class="py-0">
      <UiSidebarGroupContent class="relative">
        <div class="relative">
          <UiSidebarInput ref="input" class="pe-9 ps-9" aria-label="Search" />
          <div
            class="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-2 text-muted-foreground/60 peer-disabled:opacity-50"
          >
            <Icon name="ri:search-2-line" class="size-5" aria-hidden="true" />
          </div>
          <div
            class="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-2 text-muted-foreground"
          >
            <kbd
              class="inline-flex size-5 max-h-full items-center justify-center rounded bg-input px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70"
            >
              /
            </kbd>
          </div>
        </div>
      </UiSidebarGroupContent>
    </UiSidebarGroup>
  </form>
</template>
