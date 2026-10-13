<script setup lang="ts">
  const { state, storageWarning } = useDemo();
</script>
<template>
  <div class="flex min-h-dvh flex-col bg-muted/30">
    <a
      href="#main-content"
      class="sr-only z-50 rounded-md bg-primary p-3 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >Skip to content</a
    >
    <header class="border-b bg-background">
      <div class="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4">
        <NuxtLink to="/book" aria-label="Book a visit" class="flex items-center gap-3">
          <MendlyLogo compact />
          <span class="leading-tight">
            <span class="block text-sm font-semibold">{{
              state?.clinic.name ?? "Harbor Light Family Clinic"
            }}</span>
            <span class="block text-xs text-muted-foreground">Online booking</span>
          </span>
        </NuxtLink>
        <UiButton to="/" variant="ghost" size="sm" class="text-muted-foreground">
          <Icon name="lucide:layout-dashboard" />Staff view
        </UiButton>
      </div>
    </header>
    <UiAlert
      v-if="storageWarning"
      role="status"
      icon="lucide:triangle-alert"
      icon-class="text-amber-600"
      :description="storageWarning"
      class="rounded-none border-x-0 border-t-0 py-3 shadow-none"
    />
    <main
      id="main-content"
      class="mx-auto w-full max-w-3xl flex-1 px-4 py-8 outline-none"
      tabindex="-1"
    >
      <slot />
    </main>
    <footer class="border-t bg-background py-6 text-center text-xs text-muted-foreground">
      <p>
        {{ state?.clinic.name }} · {{ state?.clinic.phone }} · Fictional clinic, demo data only.
      </p>
      <p class="mt-1">
        Powered by <span class="font-medium text-foreground">Mendly</span> · Designed & built by
        <NuxtLink
          class="text-primary underline underline-offset-2"
          external
          href="https://behonbaker.com"
          >Behon Baker</NuxtLink
        >
      </p>
    </footer>
  </div>
</template>
