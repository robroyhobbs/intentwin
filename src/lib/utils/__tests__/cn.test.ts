import { describe, it, expect } from "vitest";
import { cn } from "../cn";

describe("cn", () => {
  it("merges multiple class strings", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes (undefined and false filtered out)", () => {
    expect(cn("base", undefined, false && "hidden", "active")).toBe(
      "base active",
    );
  });

  it("resolves Tailwind conflicts by keeping the last value", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
