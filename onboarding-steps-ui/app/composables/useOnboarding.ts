import { clampStep, steps } from "#shared/onboarding";

/** What the person has done so far. It lives in memory only, so a reload starts over. */
interface Progress {
  email: string;
  /** The furthest step the person is allowed to open. */
  reached: number;
  invited: string[];
}

/**
 * The current step lives in the URL (`?step=3`) so the browser's back button works and a step can
 * be linked, but it can never run ahead of what has been completed.
 */
export function useOnboarding() {
  const route = useRoute();
  const router = useRouter();
  const progress = useState<Progress>("waypoint-progress", () => ({
    email: "",
    reached: 1,
    invited: [],
  }));

  const currentStep = computed(() => clampStep(route.query.step, progress.value.reached));
  const current = computed(() => steps[currentStep.value - 1]!);

  function goTo(step: number, replace = false) {
    const target = clampStep(step, progress.value.reached);
    const query = { ...route.query, step: target === 1 ? undefined : String(target) };
    return replace ? router.replace({ query }) : router.push({ query });
  }
  /** Marks the current step done and moves to the next one. */
  function complete(patch: Partial<Omit<Progress, "reached">> = {}) {
    Object.assign(progress.value, patch);
    progress.value.reached = Math.max(progress.value.reached, currentStep.value + 1);
    return goTo(currentStep.value + 1);
  }
  const back = () => goTo(currentStep.value - 1);
  function restart() {
    progress.value = { email: "", reached: 1, invited: [] };
    return goTo(1);
  }

  return { steps, progress, currentStep, current, goTo, complete, back, restart };
}
