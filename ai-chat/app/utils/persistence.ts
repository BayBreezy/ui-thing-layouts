import { demoStateSchema } from "#shared/schemas";
import type { DemoState } from "#shared/types";

export const storageKey = "orbit-demo-v1";
export function restoreSnapshot(raw: string | null): DemoState | null {
  if (!raw) return null;
  const snapshot = demoStateSchema.validateSync(JSON.parse(raw), { strict: true });
  if (!snapshot.workspaces.some((workspace) => workspace.id === snapshot.activeWorkspaceId))
    throw new Error("Unknown workspace");
  return snapshot as DemoState;
}
