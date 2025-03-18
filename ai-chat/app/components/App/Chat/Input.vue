<template>
  <div class="z-9999 sticky bottom-0 pt-4 md:pt-8">
    <div class="mx-auto max-w-3xl rounded-[20px] bg-background pb-4 md:pb-2">
      <div
        class="relative rounded-[20px] border border-transparent bg-muted transition-colors focus-within:border-input focus-within:bg-muted/50 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 [&:has(input:is(:disabled))_*]:pointer-events-none"
      >
        <textarea
          class="flex w-full bg-transparent px-4 py-3 text-[15px] leading-relaxed text-foreground [resize:none] placeholder:text-muted-foreground/70 focus-visible:outline-none sm:min-h-[84px]"
          placeholder="Ask me anything..."
          aria-label="Enter your prompt"
        />
        <!-- Textarea buttons -->
        <div class="flex items-center justify-between gap-2 p-3">
          <!-- Left buttons -->
          <div class="flex items-center gap-2">
            <UiButton
              variant="outline"
              size="icon"
              class="size-8 rounded-full border-none transition-[box-shadow] hover:bg-background hover:shadow-md"
              @click="open()"
            >
              <Icon
                name="ri:attachment-2"
                class="size-5 text-muted-foreground/70"
                aria-hidden="true"
              />
              <span class="sr-only">Attach</span>
            </UiButton>
            <UiButton
              variant="outline"
              size="icon"
              class="size-8 rounded-full border-none transition-[box-shadow] hover:bg-background hover:shadow-md"
            >
              <Icon name="ri:mic-line" class="size-5 text-muted-foreground/70" aria-hidden="true" />
              <span class="sr-only">Audio</span>
            </UiButton>
            <UiButton
              variant="outline"
              size="icon"
              class="size-8 rounded-full border-none transition-[box-shadow] hover:bg-background hover:shadow-md"
            >
              <Icon
                name="ri:leaf-line"
                class="size-5 text-muted-foreground/70"
                aria-hidden="true"
              />
              <span class="sr-only">Action</span>
            </UiButton>
          </div>
          <!-- Right buttons -->
          <div class="flex items-center gap-2">
            <UiButton
              variant="outline"
              size="icon"
              class="size-8 rounded-full border-none transition-[box-shadow] hover:bg-background hover:shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none">
                <g clipPath="url(#icon-a)">
                  <path
                    fill="url(#icon-b)"
                    d="m8 .333 2.667 5 5 2.667-5 2.667-2.667 5-2.667-5L.333 8l5-2.667L8 .333Z"
                  />
                  <path
                    stroke="#451A03"
                    stroke-opacity=".04"
                    d="m8 1.396 2.225 4.173.072.134.134.071L14.604 8l-4.173 2.226-.134.071-.072.134L8 14.604l-2.226-4.173-.071-.134-.134-.072L1.396 8l4.173-2.226.134-.071.071-.134L8 1.396Z"
                  />
                </g>
                <defs>
                  <linearGradient
                    id="icon-b"
                    x1="8"
                    x2="8"
                    y1=".333"
                    y2="15.667"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stop-color="#FDE68A" />
                    <stop offset="1" stop-color="#F59E0B" />
                  </linearGradient>
                  <clipPath id="icon-a">
                    <path fill="#fff" d="M0 0h16v16H0z" />
                  </clipPath>
                </defs>
              </svg>
              <span class="sr-only">Generate</span>
            </UiButton>
            <UiButton class="h-8 rounded-full">Ask Bart</UiButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  const { open } = useFileDialog({ reset: true });
</script>
