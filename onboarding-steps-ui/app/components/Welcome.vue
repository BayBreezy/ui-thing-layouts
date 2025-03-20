<template>
  <StepContainer class="@[800px]/main:w-[500px]">
    <Heading title="Welcome to UI Thing!" description="Get up & running in no time" />
    <div class="w-full overflow-hidden rounded-lg shadow-lg">
      <iframe
        width="100%"
        height="400"
        src="https://www.youtube.com/embed/fWZc2xWDu0g?si=9g9L6PqwvXnC3niD"
        title="Create a Nuxt 4 project & add UI Thing"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen
      ></iframe>
    </div>
    <UiButton class="w-full">
      <span>Continue</span>
    </UiButton>
  </StepContainer>
</template>

<script lang="ts" setup></script>
