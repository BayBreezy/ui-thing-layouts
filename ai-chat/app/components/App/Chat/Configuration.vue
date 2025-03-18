<template>
  <div>
    <div class="relative py-5">
      <h3 class="mb-4 text-xs font-medium uppercase text-muted-foreground/80">Configuration</h3>
      <div class="space-y-8">
        <!-- {/* Temperature */} -->
        <AppChatSlider
          :min-value="0"
          :max-value="2"
          :step="0.01"
          :model-value="[1.25]"
          label="Temperature"
        />

        <!-- Maximum length  -->
        <AppChatSlider
          :min-value="1"
          :max-value="16383"
          :step="1"
          :model-value="[2048]"
          label="Maximum length"
        />

        <!-- Top P  -->
        <AppChatSlider
          :model-value="[0.5]"
          :min-value="0"
          :max-value="1"
          :step="0.01"
          label="Top P"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup></script>
