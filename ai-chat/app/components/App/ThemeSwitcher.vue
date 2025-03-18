<template>
  <UiDropdownMenu>
    <ClientOnly>
      <UiDropdownMenuTrigger as-child>
        <UiButton
          class="size-9 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
          variant="ghost"
          size="icon-sm"
        >
          <ClientOnly>
            <template #fallback>
              <Icon name="ri:sun-line" class="h-[18px] w-[18px]" />
            </template>
            <Icon v-if="currentIcon" :name="currentIcon" class="h-[18px] w-[18px]" />
          </ClientOnly>
        </UiButton>
      </UiDropdownMenuTrigger>
    </ClientOnly>
    <UiDropdownMenuContent align="end" :side-offset="5">
      <UiDropdownMenuItem
        v-for="(m, i) in modes"
        :key="i"
        class="cursor-pointer"
        :icon="m.icon"
        :title="m.title"
        @click="setTheme(m.value)"
      />
    </UiDropdownMenuContent>
  </UiDropdownMenu>
</template>

<script lang="ts" setup>
  const modes = [
    { icon: "ri:sun-line", title: "Light", value: "light" },
    { icon: "ri:moon-clear-line", title: "Dark", value: "dark" },
    { icon: "ri:computer-line", title: "System", value: "system" },
  ];

  const colorMode = useColorMode();
  const setTheme = (val: string) => {
    colorMode.preference = val;
  };

  const currentIcon = computed(() => {
    return modes.find((m) => m.value === colorMode?.preference)?.icon;
  });
</script>
