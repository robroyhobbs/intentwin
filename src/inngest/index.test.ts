import { describe, expect, it } from "vitest";

import { functions } from "./index";

describe("Inngest function registry", () => {
  it("only registers the active background functions", () => {
    expect(functions).toHaveLength(4);
  });
});
