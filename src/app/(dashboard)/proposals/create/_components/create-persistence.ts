import type { CreateFlowState, CreatePhase } from "./create-types";
import { initialState } from "./create-reducer";
import { logger } from "@/lib/utils/logger";

const STORAGE_KEY = "intentwin:create-flow";

/** JSON-safe shape — Set replaced with array, File[] dropped */
interface SerializedState extends Omit<
  CreateFlowState,
  "completedPhases" | "files"
> {
  completedPhases: CreatePhase[];
  files: never[];
}

export function saveState(state: CreateFlowState): void {
  try {
    const serialized: SerializedState = {
      ...state,
      completedPhases: Array.from(state.completedPhases),
      files: [],
      // Reset transient flags so a refresh doesn't get stuck
      isExtracting: false,
      extractionStep: null,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  } catch {
    // sessionStorage may be full or unavailable — silently skip
  }
}

export function loadState(): CreateFlowState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as SerializedState;

    // Rehydrate Set from array
    const restored: CreateFlowState = {
      ...initialState,
      ...parsed,
      completedPhases: new Set(parsed.completedPhases ?? []),
      files: [],
      // Never resume mid-extraction — let user retry
      isExtracting: false,
      extractionStep: null,
      // Never resume mid-generation — polling won't auto-restart.
      // Show "failed" so the user sees the retry button instead of a stuck spinner.
      generationStatus:
        parsed.generationStatus === "generating"
          ? "failed"
          : parsed.generationStatus,
    };

    return restored;
  } catch (err) {
    logger.warn("Failed to restore create flow state", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export function clearState(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently skip
  }
}
