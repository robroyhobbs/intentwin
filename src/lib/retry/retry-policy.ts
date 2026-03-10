import { RetryableError, isRetryableError } from "./with-retry";

const TRANSIENT_PATTERNS = [
  /\b429\b/,
  /rate limit/i,
  /timed?\s*out/i,
  /timeout/i,
  /overload/i,
  /temporar/i,
  /unavailable/i,
  /econnreset/i,
  /socket hang up/i,
  /network/i,
  /abort/i,
] as const;

const PERMANENT_PATTERNS = [
  /validation/i,
  /invalid api key/i,
  /unauthori[sz]ed/i,
  /forbidden/i,
  /malformed/i,
  /unsupported/i,
  /schema/i,
  /json/i,
] as const;

export function isTransientAiError(error: Error): boolean {
  if (isRetryableError(error)) {
    return true;
  }

  const message = error.message ?? "";

  if (PERMANENT_PATTERNS.some((pattern) => pattern.test(message))) {
    return false;
  }

  if (TRANSIENT_PATTERNS.some((pattern) => pattern.test(message))) {
    return true;
  }

  return error.name === "AbortError" || error.name === "TimeoutError";
}

export function toRetryableError(error: Error): Error {
  return isTransientAiError(error)
    ? new RetryableError(error.message)
    : error;
}
