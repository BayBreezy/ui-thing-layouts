export function useUnsaved(value: Ref<unknown>) {
  const baseline = ref(JSON.stringify(value.value));
  const dirty = computed(() => JSON.stringify(value.value) !== baseline.value);
  const markSaved = () => {
    baseline.value = JSON.stringify(value.value);
  };
  onBeforeRouteLeave(
    () => !dirty.value || window.confirm("You have unsaved changes. Leave this page?")
  );
  function beforeUnload(event: BeforeUnloadEvent) {
    if (dirty.value) {
      event.preventDefault();
      event.returnValue = "";
    }
  }
  onMounted(() => window.addEventListener("beforeunload", beforeUnload));
  onBeforeUnmount(() => window.removeEventListener("beforeunload", beforeUnload));
  return { dirty, markSaved };
}
