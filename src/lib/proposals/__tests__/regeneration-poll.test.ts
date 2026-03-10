import { describe, expect, it } from "vitest";
import { GenerationStatus } from "@/lib/constants/statuses";
import {
  calculateRegenerationPollDelay,
  hasRegenerationTimedOut,
  isRegenerationTerminal,
  markSectionGenerating,
} from "../regeneration-poll";

describe("regeneration poll helpers", () => {
  it("backs off and caps the regeneration poll delay", () => {
    expect(calculateRegenerationPollDelay(0)).toBe(3000);
    expect(calculateRegenerationPollDelay(1)).toBe(4500);
    expect(calculateRegenerationPollDelay(2)).toBe(6750);
    expect(calculateRegenerationPollDelay(3)).toBe(10000);
    expect(calculateRegenerationPollDelay(10)).toBe(10000);
  });

  it("detects regeneration timeout after 3 minutes", () => {
    const start = Date.now();
    expect(hasRegenerationTimedOut(start, start + 179_999)).toBe(false);
    expect(hasRegenerationTimedOut(start, start + 180_001)).toBe(true);
  });

  it("treats completed and failed as terminal statuses", () => {
    expect(isRegenerationTerminal(GenerationStatus.COMPLETED)).toBe(true);
    expect(isRegenerationTerminal(GenerationStatus.FAILED)).toBe(true);
    expect(isRegenerationTerminal(GenerationStatus.GENERATING)).toBe(false);
  });

  it("marks the requested section as generating", () => {
    const result = markSectionGenerating(
      [
        { id: "a", generation_status: GenerationStatus.PENDING },
        { id: "b", generation_status: GenerationStatus.FAILED },
      ],
      "b",
    );

    expect(result).toEqual([
      { id: "a", generation_status: GenerationStatus.PENDING },
      { id: "b", generation_status: GenerationStatus.GENERATING },
    ]);
  });
});
