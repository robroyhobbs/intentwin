/**
 * Generic retry wrapper with exponential backoff.
 * Retries only RetryableError instances; all other errors propagate immediately.
 */

const RETRYABLE_SYMBOL = Symbol("retryable");

export class RetryableError extends Error {
  readonly [RETRYABLE_SYMBOL] = true;
  attempts?: number;
  retryable = true;

  constructor(message: string) {
    super(message);
    this.name = "RetryableError";
  }
}

export function isRetryableError(err: unknown): err is RetryableError {
  if (err === null || err === undefined) return false;
  return (
    typeof err === "object" &&
    RETRYABLE_SYMBOL in err &&
    (err as Record<symbol, unknown>)[RETRYABLE_SYMBOL] === true
  );
}

export interface RetryOptions {
  /** Maximum number of retries (default: 2, so 3 total attempts) */
  maxRetries?: number;
  /** Base delay in ms before first retry (default: 2000) */
  baseDelay?: number;
  /** Multiplier for delay on each subsequent retry (default: 2) */
  backoffFactor?: number;
  /** Called before each retry with attempt number and the error */
  onRetry?: (attempt: number, error: Error) => void;
  /**
   * Custom predicate to determine if an error is retryable.
   * When provided, this is used INSTEAD of the RetryableError check.
   * Return true to retry, false to propagate immediately.
   */
  shouldRetry?: (error: Error) => boolean;
}

function validateOptions(options: RetryOptions): void {
  if (options.maxRetries !== undefined && options.maxRetries < 0) {
    throw new Error("maxRetries must be >= 0");
  }
  if (options.baseDelay !== undefined && options.baseDelay <= 0) {
    throw new Error("baseDelay must be > 0");
  }
  if (options.backoffFactor !== undefined && options.backoffFactor <= 0) {
    throw new Error("backoffFactor must be > 0");
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  validateOptions(options);

  const maxRetries = options.maxRetries ?? 2;
  const baseDelay = options.baseDelay ?? 2000;
  const backoffFactor = options.backoffFactor ?? 2;

  let lastError: Error | undefined;
  const totalAttempts = maxRetries + 1;

  for (let attempt = 0; attempt < totalAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      // Determine if error is retryable
      const retryable = options.shouldRetry
        ? options.shouldRetry(error)
        : isRetryableError(error);

      if (!retryable) {
        throw error;
      }

      lastError = error;

      // If this was the last attempt, break to throw
      if (attempt >= maxRetries) {
        break;
      }

      // Call onRetry callback (swallow errors to protect retry loop)
      if (options.onRetry) {
        try {
          options.onRetry(attempt + 1, error);
        } catch {
          // Swallow callback errors
        }
      }

      // Wait with exponential backoff
      const waitMs = baseDelay * Math.pow(backoffFactor, attempt);
      await delay(waitMs);
    }
  }

  // Attach metadata to the final error
  const finalError = new RetryableError(lastError?.message ?? "Unknown error");
  finalError.attempts = totalAttempts;
  finalError.retryable = true;
  throw finalError;
}
