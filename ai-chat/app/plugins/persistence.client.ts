import { restoreSnapshot, storageKey } from "~/utils/persistence";

export default defineNuxtPlugin(() => {
  const { state, ready, storageWarning } = useDemo();
  let timer: ReturnType<typeof setTimeout> | undefined;
  function persist() {
    if (!ready.value || !state.value) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(state.value));
    } catch {
      storageWarning.value =
        "Browser storage is unavailable. Your changes will last for this visit only.";
    }
  }
  onNuxtReady(() => {
    try {
      const saved = restoreSnapshot(localStorage.getItem(storageKey));
      if (saved) state.value = saved;
    } catch {
      storageWarning.value =
        "We couldn't restore saved data. You're viewing a fresh demo; use Reset demo in Settings to clear the old snapshot.";
    }
    ready.value = true;
    watch(
      state,
      () => {
        clearTimeout(timer);
        timer = setTimeout(persist, 250);
      },
      { deep: true }
    );
    window.addEventListener("pagehide", persist);
  });
});
