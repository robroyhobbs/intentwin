// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CopilotConsolePage } from "./copilot-console-page";

const { mockAuthFetch, mockToastError, mockToastSuccess } = vi.hoisted(() => ({
  mockAuthFetch: vi.fn(),
  mockToastError: vi.fn(),
  mockToastSuccess: vi.fn(),
}));

vi.mock("@/hooks/use-auth-fetch", () => ({
  useAuthFetch: () => mockAuthFetch,
}));

vi.mock("sonner", () => ({
  toast: {
    error: mockToastError,
    success: mockToastSuccess,
  },
}));

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("CopilotConsolePage", () => {
  beforeEach(() => {
    mockAuthFetch.mockReset();
    mockToastError.mockReset();
    mockToastSuccess.mockReset();
  });

  it("loads interventions and renders the console list", async () => {
    mockAuthFetch.mockResolvedValueOnce(
      jsonResponse({
        interventions: [
          {
            id: "intervention-1",
            assignedAgent: "reliability-overseer",
            actionMode: "automatic",
            status: "open",
            userSafeTitle: "Proposal generation failed",
            userSafeMessage: "Retry the proposal generation flow.",
            internalReason: "generation timeout",
            proposalId: "proposal-1",
            opportunityId: null,
            createdAt: "2026-03-09T17:00:00.000Z",
            updatedAt: "2026-03-09T17:01:00.000Z",
          },
        ],
      }),
    );

    render(<CopilotConsolePage />);

    expect(screen.getByText("Loading interventions…")).toBeInTheDocument();

    await waitFor(() => {
      expect(mockAuthFetch).toHaveBeenCalledWith("/api/copilot/interventions?limit=25");
    });

    expect(screen.getByText("Proposal generation failed")).toBeInTheDocument();
    expect(screen.getByText("Retry the proposal generation flow.")).toBeInTheDocument();
    expect(screen.getByText("reliability overseer")).toBeInTheDocument();
    expect(screen.getByText("automatic")).toBeInTheDocument();
  });

  it("re-fetches when the status filter changes", async () => {
    mockAuthFetch
      .mockResolvedValueOnce(jsonResponse({ interventions: [] }))
      .mockResolvedValueOnce(jsonResponse({ interventions: [] }));

    render(<CopilotConsolePage />);

    await waitFor(() => {
      expect(mockAuthFetch).toHaveBeenCalledWith("/api/copilot/interventions?limit=25");
    });

    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "awaiting_approval" },
    });

    await waitFor(() => {
      expect(mockAuthFetch).toHaveBeenLastCalledWith(
        "/api/copilot/interventions?status=awaiting_approval&limit=25",
      );
    });
  });

  it("approves an intervention and refreshes the list", async () => {
    mockAuthFetch
      .mockResolvedValueOnce(
        jsonResponse({
          interventions: [
            {
              id: "intervention-2",
              assignedAgent: "compliance-guardian",
              actionMode: "approval_required",
              status: "awaiting_approval",
              userSafeTitle: "Compliance gap needs approval",
              userSafeMessage: "Approve the recommended compliance fix.",
              internalReason: "critical compliance gap",
              proposalId: "proposal-2",
              opportunityId: null,
              createdAt: "2026-03-09T17:00:00.000Z",
              updatedAt: "2026-03-09T17:01:00.000Z",
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          intervention: {
            id: "intervention-2",
            assignedAgent: "compliance-guardian",
            actionMode: "approval_required",
            status: "resolved",
            userSafeTitle: "Compliance gap needs approval",
            userSafeMessage: "Approve the recommended compliance fix.",
            internalReason: "critical compliance gap",
            proposalId: "proposal-2",
            opportunityId: null,
            resolutionDecision: "approve",
            resolutionNotes: null,
            resolvedBy: "user-1",
            resolvedAt: "2026-03-09T17:02:00.000Z",
            createdAt: "2026-03-09T17:00:00.000Z",
            updatedAt: "2026-03-09T17:02:00.000Z",
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          interventions: [
            {
              id: "intervention-2",
              assignedAgent: "compliance-guardian",
              actionMode: "approval_required",
              status: "resolved",
              userSafeTitle: "Compliance gap needs approval",
              userSafeMessage: "Approve the recommended compliance fix.",
              internalReason: "critical compliance gap",
              proposalId: "proposal-2",
              opportunityId: null,
              createdAt: "2026-03-09T17:00:00.000Z",
              updatedAt: "2026-03-09T17:02:00.000Z",
            },
          ],
        }),
      );

    render(<CopilotConsolePage />);

    const approveButton = await screen.findByRole("button", { name: "Approve" });
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(mockAuthFetch).toHaveBeenNthCalledWith(2, "/api/copilot/interventions/intervention-2/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "approve" }),
      });
    });

    await waitFor(() => {
      expect(mockAuthFetch).toHaveBeenLastCalledWith("/api/copilot/interventions?limit=25");
    });

    expect(mockToastSuccess).toHaveBeenCalledWith("Intervention approved");
  });
});
