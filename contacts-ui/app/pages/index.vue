<template>
  <div class="flex flex-1 flex-col gap-4 py-4 lg:gap-6 lg:py-6">
    <!-- Page intro  -->
    <div class="flex items-center justify-between gap-4">
      <div class="space-y-1">
        <h1 :class="GSAP_EL" class="text-2xl font-semibold">Oilà, Larry!</h1>
        <p :class="GSAP_EL" class="text-sm text-muted-foreground">
          Here's an overview of your contacts. Manage or create new ones with ease!
        </p>
      </div>
      <div :class="GSAP_EL">
        <UiButton class="px-3">Add Contact</UiButton>
      </div>
    </div>
    <!-- Status Grid  -->
    <AppStats :class="GSAP_EL" />
    <!-- Table  -->
    <div :class="GSAP_EL" class="min-h-[100vh] flex-1 md:min-h-min">
      <ClientOnly>
        <ContactsTable />
      </ClientOnly>
    </div>
  </div>
</template>
