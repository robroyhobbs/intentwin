import { describe, it, expect } from "vitest";
import {
  createProgressTracker,
  advanceProgress,
  type ProgressTracker,
} from "../task-progress";

describe("ProgressTracker", () => {
  // ── Happy Path ──────────────────────────────────────────────

  describe("Happy Path", () => {
    it("computes correct percentage for 1/4 = 25%", () => {
      const tracker = createProgressTracker(4, "Parsing document");
      const updated = advanceProgress(tracker, "Extracting requirements");

      expect(updated.completed).toBe(1);
      expect(updated.percentage).toBe(25);
      expect(updated.currentStep).toBe("Extracting requirements");
    });

    it("computes correct percentage for 2/4 = 50%", () => {
      let tracker = createProgressTracker(4, "Parsing document");
      tracker = advanceProgress(tracker, "Step 2");
      tracker = advanceProgress(tracker, "Step 3");

      expect(tracker.completed).toBe(2);
      expect(tracker.percentage).toBe(50);
    });

    it("reaches 100% when all sub-tasks complete", () => {
      let tracker = createProgressTracker(4, "Step 1");
      tracker = advanceProgress(tracker, "Step 2");
      tracker = advanceProgress(tracker, "Step 3");
      tracker = advanceProgress(tracker, "Step 4");
      tracker = advanceProgress(tracker, "Complete");

      expect(tracker.completed).toBe(4);
      expect(tracker.percentage).toBe(100);
    });

    it("computes correct percentage for 3 sub-tasks (bid eval)", () => {
      let tracker = createProgressTracker(3, "Scoring opportunity");
      tracker = advanceProgress(tracker, "Evaluating alignment");

      expect(tracker.completed).toBe(1);
      expect(tracker.percentage).toBe(33);
    });

    it("serializes to JSON for metadata storage", () => {
      const tracker = createProgressTracker(4, "Parsing document");
      const json = JSON.parse(JSON.stringify(tracker));

      expect(json).toHaveProperty("total", 4);
      expect(json).toHaveProperty("completed", 0);
      expect(json).toHaveProperty("currentStep", "Parsing document");
      expect(json).toHaveProperty("percentage", 0);
    });

    it("preserves immutability — advanceProgress returns new object", () => {
      const original = createProgressTracker(4, "Step 1");
      const updated = advanceProgress(original, "Step 2");

      expect(original.completed).toBe(0);
      expect(updated.completed).toBe(1);
      expect(original).not.toBe(updated);
    });
  });

  // ── Bad Path ────────────────────────────────────────────────

  describe("Bad Path", () => {
    it("handles total: 0 without division by zero", () => {
      const tracker = createProgressTracker(0, "Empty");

      expect(tracker.percentage).toBe(100);
      expect(tracker.total).toBe(0);
    });

    it("clamps percentage to 100 when completed exceeds total", () => {
      let tracker = createProgressTracker(2, "Step 1");
      tracker = advanceProgress(tracker, "Step 2");
      tracker = advanceProgress(tracker, "Step 3");
      tracker = advanceProgress(tracker, "Extra");

      expect(tracker.percentage).toBe(100);
      expect(tracker.completed).toBe(2); // clamped to total
    });

    it("handles negative total by treating as 0", () => {
      const tracker = createProgressTracker(-1, "Weird");
      expect(tracker.percentage).toBe(100);
    });
  });

  // ── Edge Cases ──────────────────────────────────────────────

  describe("Edge Cases", () => {
    it("handles single sub-task (total: 1)", () => {
      let tracker = createProgressTracker(1, "Only step");
      expect(tracker.percentage).toBe(0);

      tracker = advanceProgress(tracker, "Done");
      expect(tracker.percentage).toBe(100);
    });

    it("handles large number of sub-tasks", () => {
      let tracker = createProgressTracker(100, "Step 1");
      for (let i = 1; i <= 50; i++) {
        tracker = advanceProgress(tracker, `Step ${i + 1}`);
      }

      expect(tracker.completed).toBe(50);
      expect(tracker.percentage).toBe(50);
    });

    it("currentStep updates on each advance", () => {
      let tracker = createProgressTracker(3, "Initial");
      expect(tracker.currentStep).toBe("Initial");

      tracker = advanceProgress(tracker, "Second");
      expect(tracker.currentStep).toBe("Second");

      tracker = advanceProgress(tracker, "Third");
      expect(tracker.currentStep).toBe("Third");
    });
  });

  // ── Security ────────────────────────────────────────────────

  describe("Security", () => {
    it("step labels don't allow arbitrary object injection", () => {
      const tracker = createProgressTracker(4, "Normal step");
      const updated = advanceProgress(tracker, "<script>alert(1)</script>");

      // Step is stored as a plain string, not interpreted
      expect(typeof updated.currentStep).toBe("string");
      expect(updated.currentStep).toBe("<script>alert(1)</script>");
    });
  });

  // ── Data Leak ───────────────────────────────────────────────

  describe("Data Leak", () => {
    it("tracker does not expose internal function names", () => {
      const tracker = createProgressTracker(4, "Parsing document");
      const keys = Object.keys(tracker);

      // Only expected keys
      expect(keys).toEqual(
        expect.arrayContaining([
          "total",
          "completed",
          "currentStep",
          "percentage",
        ]),
      );
      expect(keys.length).toBe(4);
    });
  });

  // ── Data Damage ─────────────────────────────────────────────

  describe("Data Damage", () => {
    it("advance does not mutate original tracker", () => {
      const original = createProgressTracker(4, "Step 1");
      const originalJson = JSON.stringify(original);

      advanceProgress(original, "Step 2");

      expect(JSON.stringify(original)).toBe(originalJson);
    });

    it("percentage is always a safe integer", () => {
      const tracker = createProgressTracker(3, "Step 1");
      const updated = advanceProgress(tracker, "Step 2");

      expect(Number.isInteger(updated.percentage)).toBe(true);
      expect(updated.percentage).toBeGreaterThanOrEqual(0);
      expect(updated.percentage).toBeLessThanOrEqual(100);
    });
  });
});
