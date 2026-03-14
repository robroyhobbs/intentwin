// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SavedMatchesPage from "./page";

const { mockAuthFetch, mockPush } = vi.hoisted(() => ({
  mockAuthFetch: vi.fn(),
  mockPush: vi.fn(),
}));

vi.mock("@/hooks/use-auth-fetch", () => ({
  useAuthFetch: () => mockAuthFetch,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("SavedMatchesPage", () => {
  beforeEach(() => {
    mockAuthFetch.mockReset();
    mockPush.mockReset();
  });

  it("marks a saved match as reviewing and updates the card state", async () => {
    mockAuthFetch
      .mockResolvedValueOnce(
        jsonResponse({
          saved_matches: [
            {
              opportunity_id: "opp-1",
              source: "socrata:la",
              title: "Managed IT Services",
              agency: "City IT",
              portal_url: "https://example.com/opp-1",
              status: "saved",
              updated_at: "2026-03-14T12:00:00.000Z",
              proposal_id: null,
              proposal: null,
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          feedback: {
            opportunity_id: "opp-1",
            status: "reviewing",
            updated_at: "2026-03-14T12:30:00.000Z",
            proposal_id: null,
          },
        }),
      );

    render(<SavedMatchesPage />);

    expect(await screen.findByText("Managed IT Services")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Mark reviewing" }));

    await waitFor(() => {
      expect(mockAuthFetch).toHaveBeenNthCalledWith(2, "/api/intelligence/matches", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          opportunity_id: "opp-1",
          status: "reviewing",
          opportunity: {
            id: "opp-1",
            source: "socrata:la",
            title: "Managed IT Services",
            agency: "City IT",
            portal_url: "https://example.com/opp-1",
          },
        }),
      });
    });

    expect(await screen.findAllByText("Reviewing")).toHaveLength(2);
  });

  it("removes a dismissed match from the inbox", async () => {
    mockAuthFetch
      .mockResolvedValueOnce(
        jsonResponse({
          saved_matches: [
            {
              opportunity_id: "opp-1",
              source: "socrata:la",
              title: "Managed IT Services",
              agency: "City IT",
              portal_url: "https://example.com/opp-1",
              status: "saved",
              updated_at: "2026-03-14T12:00:00.000Z",
              proposal_id: null,
              proposal: null,
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          feedback: {
            opportunity_id: "opp-1",
            status: "dismissed",
            updated_at: "2026-03-14T12:30:00.000Z",
            proposal_id: null,
          },
        }),
      );

    render(<SavedMatchesPage />);

    expect(await screen.findByText("Managed IT Services")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    await waitFor(() => {
      expect(
        screen.getByText("No saved matches yet"),
      ).toBeInTheDocument();
    });
  });
});
