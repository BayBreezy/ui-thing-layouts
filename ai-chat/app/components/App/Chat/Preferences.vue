<template>
  <div>
    <header class="flex h-14 items-center gap-3 border-b dark:border-white/20">
      <Icon name="ri:quill-pen-ai-line" class="size-5 text-muted-foreground/70" />
      <h2 class="text-sm font-medium">My preferences</h2>
    </header>
    <div class="relative py-5">
      <h3 class="mb-4 text-xs font-medium uppercase text-muted-foreground/80">Chat presets</h3>
      <div class="space-y-3">
        <!-- Model  -->
        <div class="flex items-center justify-between gap-2">
          <UiLabel :for="`${chatPresetId}-model`" class="font-normal"> Model </UiLabel>
          <UiSelect default-value="1">
            <UiSelectTrigger
              :id="`${chatPresetId}-model`"
              class="h-7 w-auto max-w-full gap-1 border-none bg-background px-2 py-1 [&_svg]:-me-1"
            >
              <UiSelectValue placeholder="Select model" />
            </UiSelectTrigger>
            <UiSelectContent
              class="[&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2"
              align="end"
            >
              <UiSelectItem value="1">Chat 4.0</UiSelectItem>
              <UiSelectItem value="2">Chat 3.5</UiSelectItem>
              <UiSelectItem value="3">Chat 3.0</UiSelectItem>
              <UiSelectItem value="4">Chat 2.5</UiSelectItem>
              <UiSelectItem value="5">Chat 2.0</UiSelectItem>
              <UiSelectItem value="6">Chat 1.5</UiSelectItem>
              <UiSelectItem value="7">Chat 1.0</UiSelectItem>
            </UiSelectContent>
          </UiSelect>
        </div>

        <!-- Response format  -->
        <div class="flex items-center justify-between gap-2">
          <UiLabel :for="`${chatPresetId}-response-format`" class="font-normal">
            Response format
          </UiLabel>
          <UiSelect default-value="1">
            <UiSelectTrigger
              :id="`${chatPresetId}-response-format`"
              class="h-7 w-auto max-w-full gap-1 border-none bg-background px-2 py-1 [&_svg]:-me-1"
            >
              <UiSelectValue placeholder="Select response format" />
            </UiSelectTrigger>
            <UiSelectContent
              class="[&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2"
              align="end"
            >
              <UiSelectItem value="1">text</UiSelectItem>
              <UiSelectItem value="2">json_object</UiSelectItem>
              <UiSelectItem value="3">json_schema</UiSelectItem>
            </UiSelectContent>
          </UiSelect>
        </div>

        <!-- Writing style  -->
        <div class="flex items-center justify-between gap-2">
          <UiLabel :for="`${chatPresetId}-writing-style`" class="font-normal">
            Writing style
          </UiLabel>
          <UiSelect default-value="1">
            <UiSelectTrigger
              :id="`${chatPresetId}-writing-style`"
              class="h-7 w-auto max-w-full gap-1 border-none bg-background px-2 py-1 [&_svg]:-me-1"
            >
              <UiSelectValue placeholder="Select writing style" />
            </UiSelectTrigger>
            <UiSelectContent
              class="[&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2"
              align="end"
            >
              <UiSelectItem value="1">Concise</UiSelectItem>
              <UiSelectItem value="2">Formal</UiSelectItem>
              <UiSelectItem value="3">Technical</UiSelectItem>
              <UiSelectItem value="4">Creative</UiSelectItem>
              <UiSelectItem value="5">Scientific</UiSelectItem>
            </UiSelectContent>
          </UiSelect>
        </div>

        <!-- Mode -->
        <div class="flex items-center justify-between gap-2">
          <UiLabel :for="`${chatPresetId}-mode`" class="font-normal"> Mode </UiLabel>
          <UiSelect default-value="1">
            <UiSelectTrigger
              :id="`${chatPresetId}-mode`"
              class="h-7 w-auto max-w-full gap-1 border-none bg-background px-2 py-1 [&_svg]:-me-1"
            >
              <UiSelectValue placeholder="Select mode" />
            </UiSelectTrigger>
            <UiSelectContent
              class="[&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2"
              align="end"
            >
              <UiSelectItem value="1">Chatbot</UiSelectItem>
              <UiSelectItem value="2">Code</UiSelectItem>
              <UiSelectItem value="3">Translate</UiSelectItem>
              <UiSelectItem value="4">Summarize</UiSelectItem>
            </UiSelectContent>
          </UiSelect>
        </div>
      </div>
    </div>
    <AppChatConfiguration class="border-t dark:border-white/20" />
  </div>
</template>

<script lang="ts" setup>
  const chatPresetId = useId();
</script>
