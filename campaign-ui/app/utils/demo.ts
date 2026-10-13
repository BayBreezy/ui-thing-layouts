import type { Brief, Campaign, Lead, Ticket } from "#shared/types";
export const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
export const dateLabel = (value: string) =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(value))
    : "Unscheduled";
export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
export const now = () => new Date().toISOString();
export function newCampaign(ownerId = "member-1"): Campaign {
  return {
    id: crypto.randomUUID(),
    name: "",
    objective: "",
    description: "",
    channel: "Email",
    ownerId,
    memberIds: [ownerId],
    budget: 0,
    startDate: "",
    endDate: "",
    status: "Draft",
    archived: false,
    checklist: [
      "Define the audience",
      "Approve the creative",
      "Review tracking",
      "Share the results",
    ].map((title) => ({ id: crypto.randomUUID(), title, done: false })),
    createdAt: now(),
    updatedAt: now(),
  };
}
export function newLead(): Lead {
  return {
    id: crypto.randomUUID(),
    name: "",
    email: "",
    company: "",
    value: 0,
    stage: "New",
    ownerId: "member-1",
    campaignId: "",
    notes: "",
    updatedAt: now(),
  };
}
export function newBrief(): Brief {
  return {
    id: crypto.randomUUID(),
    title: "",
    content: "",
    campaignId: "",
    favorite: false,
    updatedAt: now(),
  };
}
export function newTicket(): Ticket {
  return {
    id: crypto.randomUUID(),
    subject: "",
    category: "Campaigns",
    description: "",
    status: "Open",
    response: "",
    createdAt: now(),
  };
}
export function downloadFile(filename: string, content: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function csv(rows: (string | number)[][]) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          // Keep user-entered values from becoming spreadsheet formulas.
          const value = String(cell).replace(/^[=+@\-\t\r]/, "'$&");
          return '"' + value.replaceAll('"', '""') + '"';
        })
        .join(",")
    )
    .join("\r\n");
}
