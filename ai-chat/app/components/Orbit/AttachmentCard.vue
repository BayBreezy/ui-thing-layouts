<script setup lang="ts">
  import type { Attachment } from "#shared/types";
  const props = defineProps<{ attachment: Attachment; removable?: boolean }>();
  defineEmits<{ remove: [] }>();
  const preview = ref(false);
  const previewUrl = ref("");
  const busy = ref(false);
  let disposed = false;
  async function open() {
    if (!props.attachment.blobId) return;
    busy.value = true;
    try {
      const blob = await loadBlob(props.attachment.blobId);
      if (disposed) return;
      if (!blob) {
        useSonner.error("This file is no longer available on this device.");
        return;
      }
      if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
      previewUrl.value = URL.createObjectURL(blob);
      preview.value = true;
    } catch {
      useSonner.error("This file couldn't be opened. Browser storage may be unavailable.");
    } finally {
      busy.value = false;
    }
  }
  watch(preview, (value) => {
    if (!value && previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value);
      previewUrl.value = "";
    }
  });
  onBeforeUnmount(() => {
    disposed = true;
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  });
</script>
<template>
  <UiAttachment size="sm" class="max-w-72 rounded-lg bg-background">
    <UiAttachmentMedia
      ><Icon
        :name="
          attachment.type.startsWith('image/') ? 'lucide:image' : 'lucide:file-text'
        " /></UiAttachmentMedia
    ><UiAttachmentContent
      ><UiAttachmentTitle>{{ attachment.name }}</UiAttachmentTitle
      ><UiAttachmentDescription
        >{{ Math.max(1, Math.round(attachment.size / 1024)) }} KB · on this
        device</UiAttachmentDescription
      ></UiAttachmentContent
    ><UiAttachmentActions
      ><UiAttachmentAction :disabled="busy" :aria-label="`Open ${attachment.name}`" @click="open"
        ><Icon name="lucide:arrow-up-right" /></UiAttachmentAction
      ><UiAttachmentAction
        v-if="removable"
        :aria-label="`Remove ${attachment.name}`"
        @click="$emit('remove')"
        ><Icon name="lucide:x" /></UiAttachmentAction
    ></UiAttachmentActions>
  </UiAttachment>
  <UiDialog v-model:open="preview"
    ><UiDialogContent
      ><UiDialogHeader
        ><UiDialogTitle>{{ attachment.name }}</UiDialogTitle
        ><UiDialogDescription>This file stays on your device.</UiDialogDescription></UiDialogHeader
      ><img
        v-if="attachment.type.startsWith('image/')"
        :src="previewUrl"
        :alt="attachment.name"
        class="max-h-96 rounded-lg object-contain"
      /><UiButton :href="previewUrl" :download="attachment.name" variant="outline"
        ><Icon name="lucide:download" />Download file</UiButton
      ></UiDialogContent
    ></UiDialog
  >
</template>
