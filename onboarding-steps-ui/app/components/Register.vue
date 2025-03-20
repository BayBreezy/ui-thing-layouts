<template>
  <StepContainer>
    <Heading title="Create a free account" description="Provide your email and choose a password" />
    <form class="mt-8 w-full" @submit="submit">
      <fieldset :disabled="isSubmitting" class="grid grid-cols-1 gap-6">
        <div>
          <UiVeeInput
            label="Email"
            name="email"
            required
            type="email"
            placeholder="Enter your email"
          />
        </div>
        <div>
          <UiVeeInput
            v-model="password"
            label="Password"
            name="password"
            required
            type="password"
            placeholder="Enter your password"
          />
          <div class="mt-4 grid grid-cols-4 gap-2">
            <div
              v-for="item in 4"
              :key="item"
              class="h-1.5 rounded-full transition"
              :class="[strength >= item ? 'bg-green-500' : 'bg-muted']"
            ></div>
          </div>
        </div>
        <div>
          <UiDivider label="OR" />
        </div>

        <div>
          <UiButton class="w-full" variant="outline">
            <Icon name="logos:google-icon" />
            <span>Sign up with Google</span>
          </UiButton>
        </div>
        <div>
          <UiButton class="w-full" variant="outline">
            <Icon name="logos:apple" />
            <span>Sign up with Apple ID</span>
          </UiButton>
        </div>
        <div>
          <UiButton :loading="isSubmitting" type="submit" class="w-full">
            <span>Continue with Email</span>
          </UiButton>
        </div>
      </fieldset>
    </form>
  </StepContainer>
</template>

<script lang="ts" setup>
  import { promiseTimeout } from "@vueuse/core";
  import { object, string } from "yup";

  const { nextStep } = useTimeline();

  const schema = object({
    email: string().email().required().label("Email"),
    password: string().min(8).required().label("Password"),
  });

  const { handleSubmit, isSubmitting } = useForm({
    name: "register-form",
    validationSchema: toTypedSchema(schema),
    initialValues: { email: "pizketor@er.lb" },
  });

  const submit = handleSubmit(async (values) => {
    await promiseTimeout(2000);
    console.log(values);
    useSonner.success("Account Created", {
      description: "Your account has been created successfully.",
    });
    nextStep();
  });
  const password = ref("Fs2boGSJ2y2h!@");
  const strength = computed(() => {
    let score = 0;
    if (!password.value) return score;

    if (password.value.length >= 8) score++; // Length requirement
    if (/[a-z]/.test(password.value) && /[A-Z]/.test(password.value)) score++; // Lowercase & uppercase letter
    if (/\d/.test(password.value)) score++; // Number
    if (/[\W_]/.test(password.value)) score++; // Special character

    return Math.min(score, 4); // Cap the score at 4
  });
</script>
