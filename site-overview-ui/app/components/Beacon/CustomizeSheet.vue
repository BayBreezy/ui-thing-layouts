<script setup lang="ts">
  import { defaultPreferences } from "#shared/demo";
  import type { WidgetId } from "#shared/types";

  const open = defineModel<boolean>("open", { default: false });
  const { state } = useDemo();
  const labels: Record<WidgetId, string> = {
    trend: "Traffic trend",
    pages: "Top pages",
    sources: "Top sources",
    countries: "Countries",
    devices: "Devices",
  };
  const widgets = computed(() => state.value?.preferences.widgets ?? []);
  function move(index: number, by: -1 | 1) {
    const list = state.value?.preferences.widgets;
    const target = index + by;
    if (!list || target < 0 || target >= list.length) return;
    const [item] = list.splice(index, 1);
    list.splice(target, 0, item!);
  }
  function reset() {
    if (!state.value) return;
    state.value.preferences.widgets = defaultPreferences("", []).widgets;
  }
</script>
<template>
  <UiSheet v-model:open="open">
    <UiSheetContent side="right" class="sm:max-w-sm">
      <UiSheetHeader>
        <UiSheetTitle>Customize overview</UiSheetTitle>
        <UiSheetDescription>
          Choose which sections appear and the order they appear in. Your layout is saved in this
          browser.
        </UiSheetDescription>
      </UiSheetHeader>
      <ul class="space-y-2 px-4" aria-label="Overview sections">
        <li
          v-for="(widget, index) in widgets"
          :key="widget.id"
          class="flex items-center gap-2 rounded-lg border p-2"
        >
          <UiSwitch
            :id="`widget-${widget.id}`"
            v-model="widget.visible"
            :aria-label="`Show ${labels[widget.id]}`"
          />
          <UiLabel :for="`widget-${widget.id}`" class="flex-1 font-normal">
            {{ labels[widget.id] }}
          </UiLabel>
          <UiButton
            variant="ghost"
            size="icon-sm"
            :disabled="index === 0"
            :aria-label="`Move ${labels[widget.id]} up`"
            @click="move(index, -1)"
          >
            <Icon name="lucide:arrow-up" />
          </UiButton>
          <UiButton
            variant="ghost"
            size="icon-sm"
            :disabled="index === widgets.length - 1"
            :aria-label="`Move ${labels[widget.id]} down`"
            @click="move(index, 1)"
          >
            <Icon name="lucide:arrow-down" />
          </UiButton>
        </li>
      </ul>
      <UiSheetFooter>
        <UiButton variant="outline" @click="reset">Restore default layout</UiButton>
      </UiSheetFooter>
    </UiSheetContent>
  </UiSheet>
</template>
