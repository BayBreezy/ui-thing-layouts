import { restoreSnapshot, storageKey } from "~/utils/persistence";
export default defineNuxtPlugin(() => {
  const { state, ready, storageWarning } = useDemo();
  const colorMode = useColorMode();
  let timer: ReturnType<typeof setTimeout> | undefined;
  function persist() {
    if (!ready.value || !state.value) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(state.value));
    } catch {
      storageWarning.value = "Browser storage is unavailable. Changes last for this visit only.";
    }
  }
  onNuxtReady(() => {
    try {
      const saved = restoreSnapshot(localStorage.getItem(storageKey));
      if (saved) state.value = saved;
    } catch {
      storageWarning.value =
        "Saved data couldn't be restored. You're viewing a fresh demo. Reset the demo in Settings to replace the old snapshot.";
    }
    ready.value = true;
    watch(
      () => state.value?.preferences.appearance,
      (appearance) => {
        if (appearance) colorMode.preference = appearance;
      },
      { immediate: true }
    );
    watch(
      state,
      () => {
        clearTimeout(timer);
        timer = setTimeout(persist, 200);
      },
      { deep: true }
    );
    window.addEventListener("pagehide", persist);
  });
});
