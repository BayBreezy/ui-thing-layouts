<template>
  <UiSidebarProvider>
    <AppSidebar />
    <UiSidebarInset class="overflow-hidden px-4 md:px-6 lg:px-8">
      <header :class="GSAP_EL" class="flex h-16 shrink-0 items-center gap-2 border-b">
        <div class="flex flex-1 items-center gap-2 px-3">
          <UiSidebarTrigger :class="GSAP_EL" class="-ms-4" />
          <UiDivider :class="GSAP_EL" orientation="vertical" class="mr-2 h-4 w-auto" />
          <UiBreadcrumbs
            :class="GSAP_EL"
            class="hidden gap-3 md:flex"
            :items="[{ label: 'Dashboard', icon: 'ri:scan-line' }, { label: 'Contacts' }]"
          >
          </UiBreadcrumbs>
        </div>
        <div class="ml-auto flex gap-3">
          <div :class="GSAP_EL">
            <FeedbackDialog />
          </div>
          <div :class="GSAP_EL">
            <UserDropdown />
          </div>
        </div>
      </header>
      <slot />
    </UiSidebarInset>
  </UiSidebarProvider>
</template>
