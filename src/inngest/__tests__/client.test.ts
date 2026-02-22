import { describe, it, expect } from "vitest";
import { inngest } from "../client";
import { functions } from "../index";

describe("Inngest Client", () => {
  it("creates an Inngest client with the correct app ID", () => {
    expect(inngest).toBeDefined();
    expect(inngest.id).toBe("intentbid");
  });

  it("exports a functions array for the serve endpoint", () => {
    expect(Array.isArray(functions)).toBe(true);
  });
});
