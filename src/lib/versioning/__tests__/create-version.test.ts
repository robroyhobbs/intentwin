import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createProposalVersion,
  getDefaultChangeSummary,
  type VersionTriggerEvent,
} from "../create-version";

// ════════════════════════════════════════════════════════════════════════════
// Mocks
// ════════════════════════════════════════════════════════════════════════════

const mockRpc = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    rpc: mockRpc,
  }),
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// ════════════════════════════════════════════════════════════════════════════
// getDefaultChangeSummary — pure function
// ════════════════════════════════════════════════════════════════════════════

describe("getDefaultChangeSummary", () => {
  it("returns correct summary for intent_approved", () => {
    expect(getDefaultChangeSummary("intent_approved")).toBe(
      "Intent and outcome contract approved",
    );
  });

  it("returns correct summary for generation_complete", () => {
    expect(getDefaultChangeSummary("generation_complete")).toBe(
      "AI generation completed for all sections",
    );
  });

  it("returns correct summary for section_edited", () => {
    expect(getDefaultChangeSummary("section_edited")).toBe(
      "Section content edited",
    );
  });

  it("returns correct summary for pre_export", () => {
    expect(getDefaultChangeSummary("pre_export")).toBe(
      "Snapshot before export",
    );
  });

  it("returns correct summary for manual_save", () => {
    expect(getDefaultChangeSummary("manual_save")).toBe("Manual save point");
  });

  it("returns correct summary for pre_restore", () => {
    expect(getDefaultChangeSummary("pre_restore")).toBe(
      "Auto-saved before restore",
    );
  });

  it("returns correct summary for restored", () => {
    expect(getDefaultChangeSummary("restored")).toBe(
      "Restored from previous version",
    );
  });

  it("returns fallback for unknown trigger event", () => {
    // Cast to bypass type check for unknown events
    expect(getDefaultChangeSummary("unknown_event" as VersionTriggerEvent)).toBe(
      "Version saved",
    );
  });
});

// ════════════════════════════════════════════════════════════════════════════
// createProposalVersion — async with Supabase RPC
// ════════════════════════════════════════════════════════════════════════════

describe("createProposalVersion — Happy Path", () => {
  beforeEach(() => {
    mockRpc.mockReset();
  });

  it("calls the RPC with correct parameters", async () => {
    mockRpc.mockResolvedValue({ data: "version-uuid-123", error: null });

    await createProposalVersion({
      proposalId: "proposal-1",
      triggerEvent: "generation_complete",
      changeSummary: "All sections generated",
      label: "v1.0",
      userId: "user-abc",
    });

    expect(mockRpc).toHaveBeenCalledWith("create_proposal_version", {
      p_proposal_id: "proposal-1",
      p_trigger_event: "generation_complete",
      p_change_summary: "All sections generated",
      p_label: "v1.0",
      p_user_id: "user-abc",
    });
  });

  it("returns versionId on success", async () => {
    mockRpc.mockResolvedValue({ data: "version-uuid-456", error: null });

    const result = await createProposalVersion({
      proposalId: "proposal-1",
      triggerEvent: "manual_save",
    });

    expect(result).toEqual({ versionId: "version-uuid-456", error: null });
  });

  it("sends null for optional params when not provided", async () => {
    mockRpc.mockResolvedValue({ data: "version-uuid-789", error: null });

    await createProposalVersion({
      proposalId: "proposal-1",
      triggerEvent: "section_edited",
    });

    expect(mockRpc).toHaveBeenCalledWith("create_proposal_version", {
      p_proposal_id: "proposal-1",
      p_trigger_event: "section_edited",
      p_change_summary: null,
      p_label: null,
      p_user_id: null,
    });
  });
});

describe("createProposalVersion — Error Handling", () => {
  beforeEach(() => {
    mockRpc.mockReset();
  });

  it("returns error when Supabase RPC fails", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "RPC function not found" },
    });

    const result = await createProposalVersion({
      proposalId: "proposal-1",
      triggerEvent: "pre_export",
    });

    expect(result).toEqual({
      versionId: null,
      error: "RPC function not found",
    });
  });

  it("returns error when RPC throws an exception", async () => {
    mockRpc.mockRejectedValue(new Error("Network timeout"));

    const result = await createProposalVersion({
      proposalId: "proposal-1",
      triggerEvent: "intent_approved",
    });

    expect(result).toEqual({
      versionId: null,
      error: "Network timeout",
    });
  });

  it("returns 'Unknown error' for non-Error exceptions", async () => {
    mockRpc.mockRejectedValue("string error");

    const result = await createProposalVersion({
      proposalId: "proposal-1",
      triggerEvent: "restored",
    });

    expect(result).toEqual({
      versionId: null,
      error: "Unknown error",
    });
  });
});
