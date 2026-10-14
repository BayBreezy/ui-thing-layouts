<template>
  <div
    class="mx-auto grid min-h-svh max-w-screen-2xl grid-cols-1 gap-6 p-4 md:grid-cols-[96px_1fr] md:p-5 lg:grid-cols-[350px_1fr]"
  >
    <aside class="sticky top-5 hidden h-[calc(100svh-2.5rem)] md:block">
      <WaypointSidebar />
    </aside>
    <div class="flex min-h-0 flex-col gap-6">
      <WaypointMobileHeader />
      <main class="flex flex-1 flex-col items-center justify-center">
        <slot />
      </main>
      <WaypointProgress />
    </div>
  </div>
</template>
