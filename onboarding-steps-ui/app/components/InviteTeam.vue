<template>
  <StepContainer>
    <Heading title="Invite your team" description="Start collaborating with your team" />
    <form class="mt-2 w-full" @submit="submit">
      <fieldset :disabled="isSubmitting" class="grid grid-cols-1 gap-6">
        <UiScrollArea v-if="fields.length" type="auto" class="max-h-[300px] pr-3">
          <TransitionFade
            appear
            :duration="100"
            tag="div"
            group
            mode="out-in"
            class="grid grid-cols-1 gap-6 p-2"
          >
            <template v-for="(item, idx) in fields" :key="item.key">
              <div class="flex items-start gap-2">
                <UiVeeInput :name="`teamMembers[${idx}]`" placeholder="Enter your email" />
                <UiButton
                  size="icon"
                  variant="outline"
                  class="shrink-0 text-muted-foreground/80 hover:text-foreground"
                  @click="remove(idx)"
                >
                  <Icon name="i:trash-03" class="size-5" />
                </UiButton>
              </div>
            </template>
          </TransitionFade>
        </UiScrollArea>
        <div v-if="fields.length < 4" class="px-2">
          <UiButton class="w-full" variant="secondary" @click="prepend('')">
            <Icon name="i:plus" class="size-5 text-muted-foreground/80" />
            <span>Add another member</span>
          </UiButton>
        </div>

        <div class="px-2">
          <UiButton :loading="isSubmitting" type="submit" class="w-full">
            <span>Continue</span>
          </UiButton>
        </div>
      </fieldset>
    </form>
  </StepContainer>
</template>

<script lang="ts" setup>
  import { promiseTimeout } from "@vueuse/core";
  import { array, object, string } from "yup";

  const { nextStep } = useTimeline();

  const schema = object({
    teamMembers: array().of(string().email().required().label("Email")).label("Team Members"),
  });

  const { handleSubmit, isSubmitting } = useForm({
    name: "verify-form",
    validationSchema: toTypedSchema(schema),
    initialValues: {
      teamMembers: [""],
    },
  });
  const { remove, fields, prepend } = useFieldArray("teamMembers");

  const submit = handleSubmit(async (values) => {
    if (values.teamMembers?.length) {
      await promiseTimeout(2000);
      console.log(values);
      useSonner.success("Members Invited", {
        description: "Your team members have been invited",
      });
    } else {
      useSonner.info("No team members", {
        description: "You can always add team members later",
      });
    }
    nextStep();
  });
</script>
