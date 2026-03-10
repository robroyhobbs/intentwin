import { GenerationStatus } from "@/lib/constants/statuses";

const REGEN_POLL_MIN_INTERVAL = 3000;
const REGEN_POLL_MAX_INTERVAL = 10000;
const REGEN_POLL_BACKOFF_FACTOR = 1.5;
const REGEN_POLL_TIMEOUT_MS = 3 * 60 * 1000;

export function calculateRegenerationPollDelay(attempt: number): number {
  return Math.min(
    REGEN_POLL_MIN_INTERVAL *
      Math.pow(REGEN_POLL_BACKOFF_FACTOR, Math.max(0, attempt)),
    REGEN_POLL_MAX_INTERVAL,
  );
}

export function hasRegenerationTimedOut(
  startedAt: number,
  now: number,
): boolean {
  return now - startedAt > REGEN_POLL_TIMEOUT_MS;
}

export function isRegenerationTerminal(status: string | null | undefined): boolean {
  return (
    status === GenerationStatus.COMPLETED ||
    status === GenerationStatus.FAILED
  );
}

export function markSectionGenerating<
  T extends { id: string; generation_status: string }
>(sections: T[], sectionId: string): T[] {
  return sections.map((section) =>
    section.id === sectionId
      ? { ...section, generation_status: GenerationStatus.GENERATING }
      : section,
  );
}
