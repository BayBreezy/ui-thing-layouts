import { openDB } from "idb";

const memoryFiles = new Map<string, Blob>();
async function database() {
  return openDB("orbit-media", 1, {
    upgrade(db) {
      db.createObjectStore("files");
    },
  });
}
export async function saveBlob(id: string, blob: Blob) {
  memoryFiles.set(id, blob);
  const db = await database();
  try {
    await db.put("files", blob, id);
  } finally {
    db.close();
  }
}
export async function loadBlob(id: string): Promise<Blob | undefined> {
  if (memoryFiles.has(id)) return memoryFiles.get(id);
  const db = await database();
  try {
    return await db.get("files", id);
  } finally {
    db.close();
  }
}
export async function removeBlob(id: string) {
  memoryFiles.delete(id);
  const db = await database();
  try {
    await db.delete("files", id);
  } finally {
    db.close();
  }
}
export async function clearBlobs() {
  memoryFiles.clear();
  const db = await database();
  try {
    await db.clear("files");
  } finally {
    db.close();
  }
}
export function downloadText(name: string, text: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    useSonner.success("Copied to clipboard");
  } catch {
    useSonner.error("Clipboard access is unavailable. Use the download action instead.");
  }
}
export function apiError(error: unknown): string {
  const data = error as {
    data?: { data?: { errors?: string[] }; statusMessage?: string };
    message?: string;
  };
  return (
    (error instanceof Error && error.name === "ValidationError" ? error.message : undefined) ??
    data.data?.data?.errors?.[0] ??
    data.data?.statusMessage ??
    "Something went wrong. Please try again."
  );
}
export function shortDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
export function conversationText(conversation: import("#shared/types").Conversation) {
  return `# ${conversation.title}\n\n${conversation.messages.map((message) => `## ${message.role === "user" ? "You" : "Orbit"}\n\n${message.content}`).join("\n\n")}`;
}
export const money = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
