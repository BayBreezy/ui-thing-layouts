<template>
  <UiCard>
    <UiCardContent>
      <UiCardTitle>Recent Appointments</UiCardTitle>
      <UiCardDescription class="mt-1">
        A list of the last 5 appointments made by patients.
      </UiCardDescription>
      <div class="mt-5 grid grid-cols-1">
        <UiDatatable :data :options>
          <template #column-actions="props">
            <div class="flex items-center gap-1">
              <UiButton
                v-tippy.top-end="'Edit appointment'"
                size="icon-xs"
                variant="outline"
                @click="
                  useSonner('Updating appointment', {
                    description: `Updating the appointment for ${props.rowData.patient}`,
                  })
                "
              >
                <span class="sr-only">Update the appointment</span>
                <UiIcon name="solar:pen-bold-duotone" class="text-primary" />
              </UiButton>
              <UiButton
                v-tippy.top-end="'Reschedule appointment'"
                size="icon-xs"
                variant="outline"
                @click="
                  useSonner('Rescheduling appointment', {
                    description: `Reschedule the appointment for ${props.rowData.patient}`,
                  })
                "
              >
                <span class="sr-only">Reschedule the appointment</span>
                <UiIcon name="solar:calendar-bold-duotone" class="text-muted-foreground" />
              </UiButton>
            </div>
          </template>
        </UiDatatable>
      </div>
    </UiCardContent>
  </UiCard>
</template>

<script lang="ts" setup>
  import { faker } from "@faker-js/faker";
  import DT from "datatables.net-dt";
  import dayjs from "dayjs";
  import type { Config } from "datatables.net";

  const options: Config = {
    columns: [
      { data: "id", title: "ID", width: "80px" },
      { data: "patient", title: "Patient", name: "patient", responsivePriority: 0 },
      { data: "doctor", title: "Doctor", name: "doctor" },
      { data: "date", title: "Date", name: "date" },
      { data: "time", title: "Time", name: "time" },
      { data: "status", title: "Status", name: "status" },
      {
        data: null,
        title: "",
        name: "actions",
        orderable: false,
        searchable: false,
        responsivePriority: 1,
      },
    ],
    language: { search: "", searchPlaceholder: "Search..." },
    order: [[3, "desc"]],
    paging: false,
    info: false,
    responsive: {
      details: {
        renderer: DT?.Responsive?.renderer?.listHiddenNodes(),
      },
    },
    dom: "<'flex flex-col lg:flex-row w-full lg:items-start lg:justify-between gap-5 mb-5 lg:pr-1'f><'border rounded-lg grid grid-cols-1 overflow-x-auto't>",
  };

  const { data } = await useAsyncData(async () => {
    const date = dayjs(faker.date.recent());
    return Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      patient: `${faker.person.fullName()}`,
      doctor: `Dr. ${faker.person.fullName()}`,
      date: date.add(i, "day").format("MMM DD, YYYY"),
      time: date.add(i, "hour").format("hh:mm A"),
      status: faker.helpers.arrayElement(["Pending", "Confirmed", "Cancelled"]),
    }));
  });
</script>
