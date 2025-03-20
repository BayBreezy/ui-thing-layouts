/**
 * Global state of the current timeline step
 */
export const useCurrentTimelineStep = () => useState("current-timeline-step", () => 1);

/**
 * Composable used to manage the timeline steps
 */
export const useTimeline = () => {
  /**
   * Timeline steps
   */
  const steps = [
    {
      id: 1,
      title: "Your details",
      description: "Provide your email and password",
      icon: "i:user-01",
    },
    {
      id: 2,
      title: "Verify your email",
      description: "Enter your verification code",
      icon: "i:mail-01",
    },
    {
      id: 3,
      title: "Invite your team",
      description: "Start collaborating with your team",
      icon: "i:users-01",
    },
    {
      id: 4,
      title: "Welcome to UI Thing!",
      description: "You're all set up and ready to go",
      icon: "i:rocket-02",
    },
  ];
  /** Value of the current step */
  const currentStep = useCurrentTimelineStep();
  /**
   * Method used to navigate to the next step
   */
  const nextStep = () => {
    if (currentStep.value === steps.length) return;
    currentStep.value++;
  };
  /**
   * Method used to navigate to the previous step
   */
  const prevStep = () => {
    if (currentStep.value === 1) return;
    currentStep.value--;
  };
  return { steps, currentStep, nextStep, prevStep };
};
