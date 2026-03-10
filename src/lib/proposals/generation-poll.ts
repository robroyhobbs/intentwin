export interface PollConfig {
  minIntervalMs: number;
  maxIntervalMs: number;
  backoffFactor: number;
}

export const DEFAULT_GENERATION_POLL_CONFIG: PollConfig = {
  minIntervalMs: 2000,
  maxIntervalMs: 10000,
  backoffFactor: 1.5,
};

export const DEFAULT_GENERATION_TIMEOUT_MS = 10 * 60 * 1000;

export function calculateGenerationPollDelay(
  attempt: number,
  config: PollConfig = DEFAULT_GENERATION_POLL_CONFIG,
): number {
  return Math.min(
    config.minIntervalMs *
      Math.pow(config.backoffFactor, Math.max(0, attempt)),
    config.maxIntervalMs,
  );
}

export function hasGenerationPollingTimedOut(
  startedAt: number,
  now: number,
  timeoutMs: number = DEFAULT_GENERATION_TIMEOUT_MS,
): boolean {
  return now - startedAt > timeoutMs;
}

export function areAllSectionsTerminal(
  sections: Array<{ generation_status: string }>,
): boolean {
  return sections.every(
    (section) =>
      section.generation_status === "completed" ||
      section.generation_status === "failed",
  );
}
