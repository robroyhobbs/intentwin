import { describe, expect, it } from "vitest";
import { isTransientAiError } from "../retry-policy";

describe("isTransientAiError", () => {
  it("treats rate-limit failures as transient", () => {
    expect(isTransientAiError(new Error("429 rate limit exceeded"))).toBe(true);
  });

  it("treats timeout failures as transient", () => {
    expect(isTransientAiError(new Error("request timed out"))).toBe(true);
  });

  it("treats overload failures as transient", () => {
    expect(isTransientAiError(new Error("model overloaded"))).toBe(true);
  });

  it("treats validation failures as permanent", () => {
    expect(isTransientAiError(new Error("validation error"))).toBe(false);
  });

  it("treats auth failures as permanent", () => {
    expect(isTransientAiError(new Error("invalid api key"))).toBe(false);
  });
});
