import { assertRelationships } from "#shared/demo";
import { demoStateSchema } from "#shared/schemas";
import type { DemoState } from "#shared/types";
export const storageKey = "launchpad-demo-v1";
export function restoreSnapshot(raw: string | null): DemoState | null {
  if (!raw) return null;
  const state = demoStateSchema.validateSync(JSON.parse(raw), { strict: true }) as DemoState;
  assertRelationships(state);
  return state;
}
