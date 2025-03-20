<template>
  <div class="@container/main">
    <div
      class="mx-auto grid max-w-screen-2xl grid-cols-1 gap-6 p-5 @[800px]/main:grid-cols-[100px,1fr] @[1100px]/main:grid-cols-[350px,1fr]"
    >
      <aside class="hidden h-[calc(100dvh-20px-20px)] flex-col @[800px]/main:flex">
        <Sidebar />
      </aside>
      <main class="flex h-[calc(100dvh-20px-20px)] flex-col items-center justify-center">
        <slot />
      </main>
    </div>
  </div>
</template>
