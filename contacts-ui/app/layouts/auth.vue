<template>
  <div class="grid min-h-dvh lg:grid-cols-2">
    <aside class="relative hidden overflow-hidden border-r bg-muted p-10 lg:flex lg:flex-col">
      <VerdantLogo />
      <div class="absolute top-28 -right-28 size-150 rounded-full border border-primary/20">
        <div class="absolute inset-16 rounded-full border border-primary/20">
          <div class="absolute inset-16 rounded-full border border-primary/20" />
        </div>
        <div
          class="absolute top-28 left-10 size-6 rounded-full bg-primary shadow-lg shadow-primary/40"
        />
      </div>
      <div class="relative mt-auto max-w-md pb-16">
        <UiBadge variant="outline" class="mb-6">Relationships, tended to</UiBadge>
        <h2 class="text-3xl font-semibold tracking-tight">
          Everyone you know.<br />Right where you left them.
        </h2>
        <p class="mt-4 text-sm leading-6 text-muted-foreground">
          Keep your contacts, conversations and follow-ups together in one calm, green workspace.
        </p>
      </div>
      <p class="relative text-xs text-muted-foreground">
        Designed & built by
        <NuxtLink
          class="text-primary underline underline-offset-2"
          target="_blank"
          external
          href="https://behonbaker.com"
          >Behon Baker</NuxtLink
        >
        · Powered by
        <NuxtLink
          class="text-primary underline underline-offset-2"
          target="_blank"
          external
          href="https://uithing.com"
          >UI Thing</NuxtLink
        >
      </p>
    </aside>
    <main class="flex flex-col p-6 sm:p-10">
      <div class="flex items-center justify-between">
        <NuxtLink to="/" aria-label="Verdant home" class="lg:invisible"><VerdantLogo /></NuxtLink>
        <UiButton to="/" variant="link" class="text-muted-foreground">
          Back to contacts <Icon name="lucide:arrow-up-right" />
        </UiButton>
      </div>
      <div class="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-14"><slot /></div>
      <p class="text-center text-xs text-muted-foreground">
        Demo accounts only. Use fictional credentials.
      </p>
    </main>
  </div>
</template>
