<template>
  <div class="mx-auto">
    <UiSidebarProvider>
      <UiSidebar variant="inset">
        <AppBarHeader />
        <AppBarContent />
        <AppBarFooter />
      </UiSidebar>
      <UiSidebarInset class="flex flex-col bg-background">
        <AppMainNav />
        <div class="grid h-[calc(100vh-5rem)] grow grid-cols-1 lg:grid-cols-[1fr_350px]">
          <div class="flex h-[calc(100vh-5rem)] flex-col px-5">
            <AppSubNav />

            <UiScrollArea class="pr-4 [&_[data-radix-scroll-area-viewport]>div]:h-full">
              <div class="mx-auto mt-6 max-w-3xl space-y-6">
                <div class="my-8 text-center">
                  <UiBadge
                    variant="outline"
                    class="gap-2 px-3 py-1 ps-2 text-xs font-medium text-foreground/80 shadow-sm"
                  >
                    <Icon
                      name="ri:shining-2-line"
                      class="size-[14px] text-muted-foreground/70"
                      aria-hidden="true"
                    />
                    Today
                  </UiBadge>
                </div>
                <template v-for="item in messages" :key="item">
                  <AppChatMessage :id="item.id" :is-user="item.sender === 'user'">
                    <MDC :value="item.message" unwrap="p" />
                  </AppChatMessage>
                </template>
              </div>
            </UiScrollArea>
            <AppChatInput />
          </div>
          <div class="hidden rounded-2xl rounded-tr-none bg-muted px-5 dark:bg-sidebar lg:block">
            <AppChatPreferences />
          </div>
        </div>
      </UiSidebarInset>
    </UiSidebarProvider>
    <UiVueSonner />
  </div>
</template>
<script lang="ts" setup>
  const title = "AI Chat UI Template - Build Your AI-Powered Chat Interface | UI Thing";
  const description =
    "Create a sleek and responsive AI chat UI with this customizable template. Perfect for building AI-powered chat interfaces with fast performance and modern design.";
  const image = "/cover.jpeg";
  useHead({
    htmlAttrs: { lang: "en", class: "bg-sidebar" },
    link: [{ rel: "icon", type: "image/png", href: "/icon.png" }],
  });

  useSeoMeta({
    title,
    description,
    author: "UI Thing",
    keywords: "AI chat, chatbot UI, AI interface, chat app, AI-powered chat, Vue chat, React chat",
    robots: "index, follow",
    ogTitle: title,
    ogDescription: description,
    ogType: "website",
    ogImage: image,
    ogUrl: import.meta.env.PUBLIC_URL || "http://localhost:3000",
    twitterTitle: title,
    twitterDescription: description,
    twitterCard: "summary_large_image",
    twitterImage: image,
    themeColor: "#09090b",
  });

  const messages = [
    {
      id: 1,
      sender: "user",
      message: "Hey, can you help me set up authentication in a NestJS app?",
      timestamp: "2025-03-17T10:05:00Z",
    },
    {
      id: 2,
      sender: "ai",
      message: "Sure! Do you want to use JWT or OAuth for authentication?",
      timestamp: "2025-03-17T10:05:10Z",
    },
    {
      id: 3,
      sender: "user",
      message: "I think JWT would work better for my use case.",
      timestamp: "2025-03-17T10:06:00Z",
    },
    {
      id: 4,
      sender: "ai",
      message:
        "Got it! First, install the necessary packages:\n```bash\nnpm install @nestjs/jwt @nestjs/passport passport passport-jwt\n```\nNext, create an `AuthService` to handle JWT logic.",
      timestamp: "2025-03-17T10:06:20Z",
    },
    {
      id: 5,
      sender: "user",
      message: "Should I store the JWT token in localStorage or as an HTTP-only cookie?",
      timestamp: "2025-03-17T10:07:10Z",
    },
    {
      id: 6,
      sender: "ai",
      message:
        "For better security, use an HTTP-only cookie. That way, it won’t be accessible by JavaScript and helps prevent XSS attacks.",
      timestamp: "2025-03-17T10:07:30Z",
    },
    {
      id: 7,
      sender: "user",
      message: "Makes sense. How do I handle token refresh?",
      timestamp: "2025-03-17T10:08:00Z",
    },
    {
      id: 8,
      sender: "ai",
      message:
        "You can set up a refresh token strategy. Issue a longer-lived refresh token alongside the access token. When the access token expires, use the refresh token to get a new one.\n\nWant me to generate sample code for that?",
      timestamp: "2025-03-17T10:08:20Z",
    },
  ];
</script>

<style>
  pre {
    @apply my-3 whitespace-normal rounded-lg border px-3 py-2 shadow-sm dark:border-none;
    code {
      @apply text-sm;
    }
  }
  code:not(pre code) {
    @apply inline-block rounded-md bg-muted px-2 py-1 text-sm;
  }
</style>
