import {
  calculateGenerationPollDelay,
  hasGenerationPollingTimedOut,
} from "@/lib/proposals/generation-poll";
import {
  fetchProposalGenerationSnapshot,
  summarizeProposalGeneration,
  type ProposalGenerationSectionSnapshot,
  type ProposalGenerationSnapshot,
  type ProposalGenerationSummary,
} from "@/lib/proposals/proposal-generation-status";

type FetchFn = (url: string, options?: RequestInit) => Promise<Response>;

export interface ProposalGenerationPollHandle {
  cancel: () => void;
  isCancelled: () => boolean;
  promise: Promise<void>;
}

interface ProposalGenerationPollOptions<
  TSection extends ProposalGenerationSectionSnapshot,
> {
  proposalId: string;
  fetchFn: FetchFn;
  startedAt?: number;
  timeoutMs?: number;
  now?: () => number;
  shouldContinue?: () => boolean;
  onError?: (error: unknown) => Promise<void> | void;
  onSnapshot?: (
    snapshot: ProposalGenerationSnapshot<TSection>,
    summary: ProposalGenerationSummary,
  ) => Promise<void> | void;
  onTerminal?: (
    snapshot: ProposalGenerationSnapshot<TSection>,
    summary: ProposalGenerationSummary,
  ) => Promise<void> | void;
  onTimeout?: () => Promise<void> | void;
}

export function startProposalGenerationPoll<
  TSection extends ProposalGenerationSectionSnapshot,
>(
  options: ProposalGenerationPollOptions<TSection>,
): ProposalGenerationPollHandle {
  const {
    proposalId,
    fetchFn,
    startedAt = Date.now(),
    timeoutMs,
    now = Date.now,
    shouldContinue = () => true,
    onError,
    onSnapshot,
    onTerminal,
    onTimeout,
  } = options;

  let cancelled = false;
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  let resolveSleep: (() => void) | null = null;

  const cancel = () => {
    cancelled = true;
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
      timeoutHandle = null;
    }
    resolveSleep?.();
    resolveSleep = null;
  };

  const waitForNextAttempt = (attempt: number) =>
    new Promise<void>((resolve) => {
      const delayMs = calculateGenerationPollDelay(attempt);
      resolveSleep = () => {
        resolveSleep = null;
        resolve();
      };
      timeoutHandle = setTimeout(() => {
        timeoutHandle = null;
        resolveSleep = null;
        resolve();
      }, delayMs);
    });

  const promise = (async () => {
    for (let attempt = 0; ; attempt++) {
      if (cancelled || !shouldContinue()) return;

      if (attempt > 0) {
        await waitForNextAttempt(attempt - 1);
        if (cancelled || !shouldContinue()) return;
      }

      if (hasGenerationPollingTimedOut(startedAt, now(), timeoutMs)) {
        await onTimeout?.();
        return;
      }

      try {
        const snapshot =
          await fetchProposalGenerationSnapshot<TSection>(proposalId, fetchFn);
        if (cancelled || !shouldContinue()) return;
        if (!snapshot) continue;

        const summary = summarizeProposalGeneration(snapshot);
        await onSnapshot?.(snapshot, summary);
        if (cancelled || !shouldContinue()) return;

        if (summary.phase !== "generating") {
          await onTerminal?.(snapshot, summary);
          return;
        }
      } catch (error) {
        if (cancelled || !shouldContinue()) return;
        await onError?.(error);
      }
    }
  })();

  return {
    cancel,
    isCancelled: () => cancelled,
    promise,
  };
}
