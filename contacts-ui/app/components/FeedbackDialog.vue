<template>
  <UiDialog v-model:open="open">
    <UiDialogTrigger as-child>
      <slot>
        <UiButton variant="outline" size="sm" class-name="text-sm"> Feedback </UiButton>
      </slot>
    </UiDialogTrigger>
    <UiDialogContent class="md:max-w-md">
      <UiDialogHeader>
        <UiDialogTitle>Send us feedback</UiDialogTitle>
        <UiDialogDescription>
          Watch
          <a className="text-foreground hover:underline" href="#"> tutorials </a>
          , read UI Thing's
          <a className="text-foreground hover:underline" href="#"> documentation </a>
          , or join our
          <a className="text-foreground hover:underline" href="#"> Discord </a> for community help.
        </UiDialogDescription>
      </UiDialogHeader>
      <form className="space-y-5">
        <UiTextarea
          id="feedback"
          placeholder="How can we improve UI Thing?"
          aria-label="Send feedback"
        />
        <div className="flex flex-col sm:flex-row sm:justify-end">
          <UiButton type="button">Send feedback</UiButton>
        </div>
      </form>
    </UiDialogContent>
  </UiDialog>
</template>

<script lang="ts" setup>
  const open = defineModel<boolean>();
</script>
