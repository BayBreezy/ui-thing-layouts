import type { Appointment, AppointmentStatus } from "#shared/types";
import { errorMessage, statusMeta } from "~/utils/demo";

/** The next step in a visit's day, shown as the primary button on a row. */
export const nextStep: Partial<
  Record<AppointmentStatus, { to: AppointmentStatus; label: string; icon: string }>
> = {
  scheduled: { to: "checked-in", label: "Check in", icon: "lucide:door-open" },
  confirmed: { to: "checked-in", label: "Check in", icon: "lucide:door-open" },
  "checked-in": { to: "in-progress", label: "Start visit", icon: "lucide:play" },
  "in-progress": { to: "completed", label: "Complete", icon: "lucide:check" },
};

/** Status changes with toasts, a busy flag and waitlist hints, shared by every place that has them. */
export function useVisitActions() {
  const { setStatus, patientName } = useDemo();
  const busy = ref("");
  async function change(record: Appointment, status: AppointmentStatus) {
    if (busy.value) return false;
    busy.value = record.id;
    try {
      const { matches } = await setStatus(record, status);
      useSonner.success(
        `${patientName(record.patientId)}: ${statusMeta[status].label.toLowerCase()}`
      );
      if (matches.length)
        useSonner(
          `${matches.length} waitlisted ${matches.length === 1 ? "patient" : "patients"} could take this opening`,
          { action: { label: "View waitlist", onClick: () => navigateTo("/waitlist") } }
        );
      return true;
    } catch (cause) {
      useSonner.error(errorMessage(cause));
      return false;
    } finally {
      busy.value = "";
    }
  }
  return { busy, change };
}
