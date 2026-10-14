import { referenceDate } from "#shared/types";

/** The fixed demo "today". Every relative range and "last seen" label resolves against it. */
export const today = referenceDate;

/** A timestamp on the demo day using the visitor's real time of day, so new records sort after seeds. */
export function now() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${referenceDate}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export const newId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

export const toneClasses = {
  up: "text-emerald-700 dark:text-emerald-400",
  down: "text-red-700 dark:text-red-400",
  info: "text-muted-foreground",
} as const;

/** The message to show for a failed request: field errors first, then the server's status text. */
export function errorMessage(cause: unknown) {
  const failure = cause as {
    data?: { data?: { errors?: string[] }; statusMessage?: string };
    message?: string;
  };
  return (
    failure.data?.data?.errors?.join(" ") ||
    failure.data?.statusMessage ||
    "We couldn't complete that action. Check your connection and try again."
  );
}

/** Triggers a browser download of generated text. */
export function downloadFile(name: string, content: string, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

/** A deep copy that is safe for reactive objects and keeps edits from leaking into state. */
export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
