import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  canUseKimi,
  getKimiCircuitState,
  recordKimiFailure,
  recordKimiSuccess,
  resetKimiCircuitStateForTests,
} from "../kimi";

const originalEnv = {
  KIMI_API_KEY: process.env.KIMI_API_KEY,
  KIMI_CIRCUIT_FAILURE_THRESHOLD: process.env.KIMI_CIRCUIT_FAILURE_THRESHOLD,
  KIMI_CIRCUIT_COOLDOWN_MS: process.env.KIMI_CIRCUIT_COOLDOWN_MS,
  KIMI_PERMANENT_CIRCUIT_COOLDOWN_MS:
    process.env.KIMI_PERMANENT_CIRCUIT_COOLDOWN_MS,
};

describe("Kimi circuit breaker", () => {
  beforeEach(() => {
    resetKimiCircuitStateForTests();
    process.env.KIMI_API_KEY = "test-key";
    delete process.env.KIMI_CIRCUIT_FAILURE_THRESHOLD;
    delete process.env.KIMI_CIRCUIT_COOLDOWN_MS;
    delete process.env.KIMI_PERMANENT_CIRCUIT_COOLDOWN_MS;
  });

  afterEach(() => {
    process.env.KIMI_API_KEY = originalEnv.KIMI_API_KEY;
    process.env.KIMI_CIRCUIT_FAILURE_THRESHOLD =
      originalEnv.KIMI_CIRCUIT_FAILURE_THRESHOLD;
    process.env.KIMI_CIRCUIT_COOLDOWN_MS = originalEnv.KIMI_CIRCUIT_COOLDOWN_MS;
    process.env.KIMI_PERMANENT_CIRCUIT_COOLDOWN_MS =
      originalEnv.KIMI_PERMANENT_CIRCUIT_COOLDOWN_MS;
    resetKimiCircuitStateForTests();
  });

  it("opens circuit immediately for permanent provider errors", () => {
    const now = 1_000;
    const failure = recordKimiFailure(
      new Error("KIMI_HTTP_401: unauthorized"),
      now,
    );

    expect(failure.opened).toBe(true);
    expect(failure.permanent).toBe(true);
    expect(canUseKimi(now + 1)).toBe(false);
    expect(getKimiCircuitState(now + 1).isOpen).toBe(true);
  });

  it("opens circuit after repeated transient failures", () => {
    process.env.KIMI_CIRCUIT_FAILURE_THRESHOLD = "2";
    process.env.KIMI_CIRCUIT_COOLDOWN_MS = "1000";
    const now = 10_000;

    const firstFailure = recordKimiFailure(new Error("KIMI_HTTP_429: retry"), now);
    expect(firstFailure.opened).toBe(false);
    expect(canUseKimi(now + 1)).toBe(true);

    const secondFailure = recordKimiFailure(
      new Error("KIMI_HTTP_503: unavailable"),
      now + 10,
    );
    expect(secondFailure.opened).toBe(true);
    expect(secondFailure.permanent).toBe(false);
    expect(canUseKimi(now + 20)).toBe(false);
  });

  it("closes circuit after successful request", () => {
    const now = 50_000;
    process.env.KIMI_CIRCUIT_FAILURE_THRESHOLD = "1";
    recordKimiFailure(new Error("KIMI_HTTP_429: retry"), now);
    expect(getKimiCircuitState(now + 1).isOpen).toBe(true);

    recordKimiSuccess();

    const state = getKimiCircuitState(now + 1);
    expect(state.isOpen).toBe(false);
    expect(state.consecutiveFailures).toBe(0);
    expect(canUseKimi(now + 1)).toBe(true);
  });
});
