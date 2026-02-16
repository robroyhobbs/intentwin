import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the resend module before imports
const mockSend = vi.fn();
vi.mock("resend", () => {
  // Use a real class so `new Resend(...)` works across module resets
  class MockResend {
    emails = { send: mockSend };
  }
  return { Resend: MockResend };
});

// Store original env so we can restore
const originalEnv = { ...process.env };

describe("review-notifications", () => {
  beforeEach(() => {
    vi.resetModules();
    mockSend.mockReset();
    process.env.RESEND_API_KEY = "re_test_123";
    process.env.NEXT_PUBLIC_APP_URL = "https://test.intentwin.com";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // ============================================================
  // 1. Sends assignment email with correct subject and body
  // ============================================================
  describe("sendReviewerAssignedEmail", () => {
    it("sends assignment email with correct subject and body", async () => {
      mockSend.mockResolvedValue({ error: null });

      const {
        sendReviewerAssignedEmail,
      } = await import("../../email/review-notifications");

      await sendReviewerAssignedEmail({
        reviewerEmail: "alice@example.com",
        reviewerName: "Alice Smith",
        proposalTitle: "Cloud Migration Strategy",
        proposalId: "prop-123",
        stage: "pink",
      });

      expect(mockSend).toHaveBeenCalledOnce();
      const call = mockSend.mock.calls[0][0];
      expect(call.to).toBe("alice@example.com");
      expect(call.subject).toBe(
        "You've been assigned to review: Cloud Migration Strategy (Pink Team)",
      );
      expect(call.text).toContain("Alice Smith");
      expect(call.text).toContain("Cloud Migration Strategy");
      expect(call.text).toContain("Pink Team");
      expect(call.text).toContain(
        "https://test.intentwin.com/proposals/prop-123?tab=review",
      );
      expect(call.from).toContain("IntentWin");
    });
  });

  // ============================================================
  // 2. Sends stage complete email to proposal owner
  // ============================================================
  describe("sendStageCompleteEmail", () => {
    it("sends stage complete email to proposal owner", async () => {
      mockSend.mockResolvedValue({ error: null });

      const {
        sendStageCompleteEmail,
      } = await import("../../email/review-notifications");

      await sendStageCompleteEmail({
        ownerEmail: "bob@example.com",
        ownerName: "Bob Jones",
        proposalTitle: "Digital Transformation",
        proposalId: "prop-456",
        stage: "red",
        avgScore: 8.5,
        sectionsReviewed: 6,
      });

      expect(mockSend).toHaveBeenCalledOnce();
      const call = mockSend.mock.calls[0][0];
      expect(call.to).toBe("bob@example.com");
      expect(call.subject).toBe(
        "Red Team Review Complete — Digital Transformation",
      );
      expect(call.text).toContain("Bob Jones");
      expect(call.text).toContain("8.5");
      expect(call.text).toContain("6");
      expect(call.text).toContain(
        "https://test.intentwin.com/proposals/prop-456?tab=review",
      );
    });
  });

  // ============================================================
  // 3. Sends advanced email to all next-stage reviewers
  // ============================================================
  describe("sendStageAdvancedEmail", () => {
    it("sends advanced email to all next-stage reviewers", async () => {
      mockSend.mockResolvedValue({ error: null });

      const {
        sendStageAdvancedEmail,
      } = await import("../../email/review-notifications");

      await sendStageAdvancedEmail({
        reviewers: [
          { email: "carol@example.com", name: "Carol Davis" },
          { email: "dan@example.com", name: "Dan Lee" },
        ],
        proposalTitle: "ERP Modernization",
        proposalId: "prop-789",
        newStage: "gold",
      });

      expect(mockSend).toHaveBeenCalledTimes(2);

      const firstCall = mockSend.mock.calls[0][0];
      expect(firstCall.to).toBe("carol@example.com");
      expect(firstCall.subject).toBe(
        "Your Gold Team review is ready: ERP Modernization",
      );
      expect(firstCall.text).toContain("Carol Davis");
      expect(firstCall.text).toContain("Gold Team");

      const secondCall = mockSend.mock.calls[1][0];
      expect(secondCall.to).toBe("dan@example.com");
      expect(secondCall.text).toContain("Dan Lee");
    });
  });

  // ============================================================
  // 4. Handles missing email gracefully (no crash)
  // ============================================================
  describe("handles missing email gracefully", () => {
    it("sendReviewerAssignedEmail skips when reviewerEmail is empty", async () => {
      const {
        sendReviewerAssignedEmail,
      } = await import("../../email/review-notifications");

      await expect(
        sendReviewerAssignedEmail({
          reviewerEmail: "",
          reviewerName: "No Email User",
          proposalTitle: "Test Proposal",
          proposalId: "prop-000",
          stage: "pink",
        }),
      ).resolves.toBeUndefined();

      expect(mockSend).not.toHaveBeenCalled();
    });

    it("sendStageCompleteEmail skips when ownerEmail is empty", async () => {
      const {
        sendStageCompleteEmail,
      } = await import("../../email/review-notifications");

      await expect(
        sendStageCompleteEmail({
          ownerEmail: "",
          ownerName: "No Email Owner",
          proposalTitle: "Test Proposal",
          proposalId: "prop-000",
          stage: "red",
          avgScore: 7.0,
          sectionsReviewed: 3,
        }),
      ).resolves.toBeUndefined();

      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // 5. Handles Resend API error gracefully
  // ============================================================
  describe("handles Resend API error gracefully", () => {
    it("sendReviewerAssignedEmail does not throw on API error", async () => {
      mockSend.mockResolvedValue({
        error: { message: "Rate limit exceeded", statusCode: 429 },
      });

      const {
        sendReviewerAssignedEmail,
      } = await import("../../email/review-notifications");

      await expect(
        sendReviewerAssignedEmail({
          reviewerEmail: "test@example.com",
          reviewerName: "Test User",
          proposalTitle: "Test Proposal",
          proposalId: "prop-err",
          stage: "pink",
        }),
      ).resolves.toBeUndefined();
    });

    it("sendStageCompleteEmail does not throw on send exception", async () => {
      mockSend.mockRejectedValue(new Error("Network failure"));

      const {
        sendStageCompleteEmail,
      } = await import("../../email/review-notifications");

      await expect(
        sendStageCompleteEmail({
          ownerEmail: "test@example.com",
          ownerName: "Test User",
          proposalTitle: "Test Proposal",
          proposalId: "prop-err",
          stage: "red",
          avgScore: 5.0,
          sectionsReviewed: 2,
        }),
      ).resolves.toBeUndefined();
    });

    it("sendStageAdvancedEmail does not throw on API error for one reviewer", async () => {
      mockSend
        .mockResolvedValueOnce({
          error: { message: "Invalid email", statusCode: 400 },
        })
        .mockResolvedValueOnce({ error: null });

      const {
        sendStageAdvancedEmail,
      } = await import("../../email/review-notifications");

      await expect(
        sendStageAdvancedEmail({
          reviewers: [
            { email: "bad@example.com", name: "Bad Email" },
            { email: "good@example.com", name: "Good Email" },
          ],
          proposalTitle: "Test Proposal",
          proposalId: "prop-err",
          newStage: "gold",
        }),
      ).resolves.toBeUndefined();

      // Should still attempt the second email despite first failing
      expect(mockSend).toHaveBeenCalledTimes(2);
    });
  });

  // ============================================================
  // 6. Does not send email if RESEND_API_KEY is not set
  // ============================================================
  describe("does not send email if RESEND_API_KEY is not set", () => {
    it("sendReviewerAssignedEmail skips silently without API key", async () => {
      delete process.env.RESEND_API_KEY;
      vi.resetModules();

      const {
        sendReviewerAssignedEmail,
      } = await import("../../email/review-notifications");

      await expect(
        sendReviewerAssignedEmail({
          reviewerEmail: "test@example.com",
          reviewerName: "Test User",
          proposalTitle: "Test",
          proposalId: "prop-nokey",
          stage: "pink",
        }),
      ).resolves.toBeUndefined();

      expect(mockSend).not.toHaveBeenCalled();
    });

    it("sendStageCompleteEmail skips silently without API key", async () => {
      delete process.env.RESEND_API_KEY;
      vi.resetModules();

      const {
        sendStageCompleteEmail,
      } = await import("../../email/review-notifications");

      await expect(
        sendStageCompleteEmail({
          ownerEmail: "test@example.com",
          ownerName: "Test User",
          proposalTitle: "Test",
          proposalId: "prop-nokey",
          stage: "red",
          avgScore: 7.0,
          sectionsReviewed: 4,
        }),
      ).resolves.toBeUndefined();

      expect(mockSend).not.toHaveBeenCalled();
    });

    it("sendStageAdvancedEmail skips silently without API key", async () => {
      delete process.env.RESEND_API_KEY;
      vi.resetModules();

      const {
        sendStageAdvancedEmail,
      } = await import("../../email/review-notifications");

      await expect(
        sendStageAdvancedEmail({
          reviewers: [{ email: "test@example.com", name: "Test" }],
          proposalTitle: "Test",
          proposalId: "prop-nokey",
          newStage: "gold",
        }),
      ).resolves.toBeUndefined();

      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // 7. Handles reviewer with no email in profile
  // ============================================================
  describe("handles reviewer with no email in profile", () => {
    it("sendStageAdvancedEmail skips reviewers with empty email", async () => {
      mockSend.mockResolvedValue({ error: null });

      const {
        sendStageAdvancedEmail,
      } = await import("../../email/review-notifications");

      await sendStageAdvancedEmail({
        reviewers: [
          { email: "", name: "No Email Reviewer" },
          { email: "valid@example.com", name: "Valid Reviewer" },
        ],
        proposalTitle: "Test Proposal",
        proposalId: "prop-noemail",
        newStage: "red",
      });

      // Should only send to the valid reviewer
      expect(mockSend).toHaveBeenCalledOnce();
      expect(mockSend.mock.calls[0][0].to).toBe("valid@example.com");
    });
  });
});
