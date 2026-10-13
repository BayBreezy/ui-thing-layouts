export function useAction() {
  const pending = ref(false);
  const error = ref("");
  async function run<T>(action: () => Promise<T>): Promise<T | undefined> {
    if (pending.value) return;
    pending.value = true;
    error.value = "";
    try {
      return await action();
    } catch (cause) {
      const failure = cause as {
        data?: { data?: { errors?: string[] }; statusMessage?: string };
        message?: string;
      };
      error.value =
        failure.data?.data?.errors?.join(". ") ||
        failure.data?.statusMessage ||
        "We couldn't complete that action. Check your connection and try again.";
      return undefined;
    } finally {
      pending.value = false;
    }
  }
  return { pending, error, run };
}
