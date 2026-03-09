// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CopilotNotificationsPage } from "./copilot-notifications-page";

const { mockAuthFetch } = vi.hoisted(() => ({
  mockAuthFetch: vi.fn(),
}));

vi.mock("@/hooks/use-auth-fetch", () => ({
  useAuthFetch: () => mockAuthFetch,
}));

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("CopilotNotificationsPage", () => {
  beforeEach(() => {
    mockAuthFetch.mockReset();
  });

  it("loads notifications and renders the feed", async () => {
    mockAuthFetch.mockResolvedValueOnce(
      jsonResponse({
        notifications: [
          {
            id: "intervention-1",
            title: "Proposal issue detected",
            message: "We queued a safe recovery step.",
            status: "open",
            assignedAgent: "reliability-overseer",
            actionMode: "automatic",
            createdAt: "2026-03-09T05:03:07.775Z",
            href: "/proposals/proposal-1",
            hrefLabel: "View proposal",
            requiresApproval: false,
          },
        ],
        activeCount: 1,
        canManageInterventions: true,
      }),
    );

    render(<CopilotNotificationsPage />);

    await waitFor(() => {
      expect(mockAuthFetch).toHaveBeenCalledWith("/api/copilot/notifications?limit=20");
    });

    expect(screen.getByText("Proposal issue detected")).toBeInTheDocument();
    expect(screen.getByText("We queued a safe recovery step.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View proposal" })).toHaveAttribute(
      "href",
      "/proposals/proposal-1",
    );
    expect(screen.getByRole("link", { name: "Manage in console" })).toHaveAttribute(
      "href",
      "/copilot-console",
    );
  });

  it("re-fetches when the status filter changes", async () => {
    mockAuthFetch
      .mockResolvedValueOnce(
        jsonResponse({
          notifications: [],
          activeCount: 0,
          canManageInterventions: false,
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          notifications: [],
          activeCount: 0,
          canManageInterventions: false,
        }),
      );

    render(<CopilotNotificationsPage />);

    await waitFor(() => {
      expect(mockAuthFetch).toHaveBeenCalledWith("/api/copilot/notifications?limit=20");
    });

    fireEvent.change(screen.getByLabelText("Notification status"), {
      target: { value: "awaiting_approval" },
    });

    await waitFor(() => {
      expect(mockAuthFetch).toHaveBeenLastCalledWith(
        "/api/copilot/notifications?status=awaiting_approval&limit=20",
      );
    });
  });
});
