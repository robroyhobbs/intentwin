/**
 * Task-based progress tracker for long-running operations.
 * Immutable — each advance returns a new tracker.
 * Serializable to JSON for storage in metadata columns.
 */

export interface ProgressTracker {
  total: number;
  completed: number;
  currentStep: string;
  percentage: number;
}

export function createProgressTracker(
  total: number,
  initialStep: string,
): ProgressTracker {
  const safeTotal = Math.max(0, total);
  return {
    total: safeTotal,
    completed: 0,
    currentStep: initialStep,
    percentage: safeTotal === 0 ? 100 : 0,
  };
}

export function advanceProgress(
  tracker: ProgressTracker,
  nextStep: string,
): ProgressTracker {
  const completed = Math.min(tracker.completed + 1, tracker.total);
  const percentage =
    tracker.total <= 0 ? 100 : Math.round((completed / tracker.total) * 100);

  return {
    total: tracker.total,
    completed,
    currentStep: nextStep,
    percentage: Math.min(percentage, 100),
  };
}
