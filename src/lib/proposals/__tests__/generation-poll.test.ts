import { describe, expect, it } from "vitest";
import {
  areAllSectionsTerminal,
  calculateGenerationPollDelay,
  hasGenerationPollingTimedOut,
} from "../generation-poll";

describe("generation poll helpers", () => {
  it("uses exponential backoff and caps at the max interval", () => {
    expect(calculateGenerationPollDelay(0)).toBe(2000);
    expect(calculateGenerationPollDelay(1)).toBe(3000);
    expect(calculateGenerationPollDelay(2)).toBe(4500);
    expect(calculateGenerationPollDelay(4)).toBe(10000);
  });

  it("supports custom polling configs", () => {
    expect(
      calculateGenerationPollDelay(2, {
        minIntervalMs: 1000,
        maxIntervalMs: 5000,
        backoffFactor: 2,
      }),
    ).toBe(4000);
  });

  it("detects timeout after the configured duration", () => {
    const start = Date.now();
    expect(hasGenerationPollingTimedOut(start, start + 1000)).toBe(false);
    expect(
      hasGenerationPollingTimedOut(start, start + 61_000, 60_000),
    ).toBe(true);
  });

  it("detects when all sections are terminal", () => {
    expect(
      areAllSectionsTerminal([
        { generation_status: "completed" },
        { generation_status: "failed" },
      ]),
    ).toBe(true);
    expect(
      areAllSectionsTerminal([
        { generation_status: "completed" },
        { generation_status: "generating" },
      ]),
    ).toBe(false);
  });
});
