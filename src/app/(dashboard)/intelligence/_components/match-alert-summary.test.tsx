// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MatchAlertSummary } from "./match-alert-summary";

describe("MatchAlertSummary", () => {
  it("renders counts, urgency copy, and actions", () => {
    const onOpenMatches = vi.fn();
    const onOpenSavedMatches = vi.fn();

    render(
      <MatchAlertSummary
        response={{
          summary: {
            new_high_signal_count: 2,
            urgent_saved_count: 1,
            total_attention_count: 3,
            high_signal_threshold: 80,
            urgent_deadline_days: 10,
          },
          new_high_signal_matches: [],
          urgent_saved_matches: [
            {
              opportunity_id: "opp-1",
              title: "Managed IT Services",
              agency: "City IT",
              portal_url: "https://example.com/opp-1",
              response_deadline: "2026-03-20T00:00:00.000Z",
              score: 77,
              status: "saved",
              days_until_deadline: 3,
            },
          ],
        }}
        onOpenMatches={onOpenMatches}
        onOpenSavedMatches={onOpenSavedMatches}
      />,
    );

    expect(screen.getByText("3 opportunities need attention")).toBeTruthy();
    expect(screen.getByText(/2 new high-signal matches scored 80\+/)).toBeTruthy();
    expect(screen.getByText("Managed IT Services")).toBeTruthy();
    expect(screen.getByText("Due in 3 days")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Review matches" }));
    fireEvent.click(screen.getByRole("button", { name: "Open saved matches" }));

    expect(onOpenMatches).toHaveBeenCalledTimes(1);
    expect(onOpenSavedMatches).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when there is no attention needed", () => {
    const { container } = render(
      <MatchAlertSummary
        response={{
          summary: {
            new_high_signal_count: 0,
            urgent_saved_count: 0,
            total_attention_count: 0,
            high_signal_threshold: 80,
            urgent_deadline_days: 10,
          },
          new_high_signal_matches: [],
          urgent_saved_matches: [],
        }}
        onOpenMatches={vi.fn()}
        onOpenSavedMatches={vi.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });
});
