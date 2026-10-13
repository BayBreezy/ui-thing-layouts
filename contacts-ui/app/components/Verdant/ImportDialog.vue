<script setup lang="ts">
  import { displayName } from "#shared/contacts";
  import { exportColumns } from "#shared/csv";
  import type { ImportResult } from "#shared/types";
  import { downloadFile } from "~/utils/demo";
  const open = defineModel<boolean>("open", { default: false });
  const uid = useId();
  const { previewImport, commitImport } = useDemo();
  const { pending, error, run } = useAction();
  const csv = ref("");
  const result = ref<ImportResult | null>(null);
  const skipDuplicates = ref(true);
  const fileName = ref("");

  const sample =
    exportColumns.join(",") +
    "\r\nMaya,Okafor,,Fernway Foods,Operations Lead,maya.okafor@fernway.example,+1 555 555 0111,Portland,OR,United States,,1988-04-12,Friends; Clients,Referral source,friend,yes,Met at the spring meetup.";
  watch(open, (value) => {
    if (!value) reset();
  });
  function reset() {
    csv.value = "";
    result.value = null;
    fileName.value = "";
    error.value = "";
  }
  async function onFile(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    fileName.value = file.name;
    csv.value = await file.text();
    result.value = null;
  }
  async function preview() {
    const value = await run(() => previewImport(csv.value));
    if (value) result.value = value;
  }
  const importable = computed(
    () => result.value?.rows.filter((row) => !(skipDuplicates.value && row.duplicateOf)) ?? []
  );
  const duplicateCount = computed(
    () => result.value?.rows.filter((row) => row.duplicateOf).length ?? 0
  );
  function confirm() {
    const added = commitImport(importable.value);
    useSonner.success(`Imported ${added.length} ${added.length === 1 ? "contact" : "contacts"}`);
    open.value = false;
  }
</script>
<template>
  <UiDialog v-model:open="open">
    <UiDialogContent class="sm:max-w-2xl">
      <UiDialogHeader>
        <UiDialogTitle>Import contacts</UiDialogTitle>
        <UiDialogDescription>
          Upload a CSV file or paste rows. Columns such as first_name, last_name, company and email
          are matched automatically.
        </UiDialogDescription>
      </UiDialogHeader>
      <div class="space-y-4">
        <div class="space-y-2">
          <UiLabel :for="`${uid}-file`">CSV file</UiLabel>
          <UiInput :id="`${uid}-file`" type="file" accept=".csv,text/csv,.txt" @change="onFile" />
          <p v-if="fileName" class="text-xs text-muted-foreground">Loaded {{ fileName }}</p>
        </div>
        <div class="space-y-2">
          <UiLabel :for="`${uid}-csv`">Or paste CSV</UiLabel>
          <UiTextarea
            :id="`${uid}-csv`"
            v-model="csv"
            :rows="6"
            class="font-mono text-xs"
            placeholder="first_name,last_name,company,email"
            @input="result = null"
          />
          <UiButton
            variant="link"
            size="xs"
            class="h-auto p-0"
            @click="downloadFile('verdant-import-sample.csv', sample, 'text/csv')"
          >
            Download a sample file
          </UiButton>
        </div>
        <VerdantError :message="error" />
        <div v-if="result" class="space-y-3" role="status" aria-live="polite">
          <UiAlert
            :icon="result.rows.length ? 'lucide:circle-check' : 'lucide:circle-alert'"
            :icon-class="result.rows.length ? 'text-primary' : 'text-destructive'"
            :title="`${result.rows.length} of ${result.total} rows are ready`"
            :description="
              result.errors.length
                ? `${result.errors.length} ${result.errors.length === 1 ? 'row needs' : 'rows need'} attention and will be skipped.`
                : 'Everything looks good.'
            "
          />
          <ul
            v-if="result.errors.length"
            class="max-h-32 space-y-1 overflow-y-auto rounded-md border p-3 text-sm"
            aria-label="Rows that need attention"
          >
            <li v-for="item in result.errors" :key="item.line">
              <span class="font-medium">Row {{ item.line }}:</span> {{ item.message }}
            </li>
          </ul>
          <ul
            v-if="result.rows.length"
            class="max-h-40 space-y-1 overflow-y-auto rounded-md border p-3 text-sm"
            aria-label="Contacts to import"
          >
            <li v-for="row in result.rows.slice(0, 50)" :key="row.line" class="flex gap-2">
              <span class="truncate">{{ displayName(row.contact) }}</span>
              <UiBadge v-if="row.duplicateOf" variant="outline" class="ml-auto">
                Already exists
              </UiBadge>
            </li>
          </ul>
          <label v-if="duplicateCount" class="flex items-center gap-2 text-sm">
            <UiCheckbox v-model="skipDuplicates" />
            Skip {{ duplicateCount }} {{ duplicateCount === 1 ? "contact" : "contacts" }} that
            already {{ duplicateCount === 1 ? "exists" : "exist" }}
          </label>
        </div>
      </div>
      <UiDialogFooter>
        <UiButton variant="outline" @click="open = false">Cancel</UiButton>
        <UiButton v-if="!result" :loading="pending" :disabled="!csv.trim()" @click="preview">
          Preview import
        </UiButton>
        <UiButton v-else :disabled="!importable.length" @click="confirm">
          Import {{ importable.length }} {{ importable.length === 1 ? "contact" : "contacts" }}
        </UiButton>
      </UiDialogFooter>
    </UiDialogContent>
  </UiDialog>
</template>
