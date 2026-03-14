// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SavedMatchCard } from "./saved-match-card";

const ITEM = {
  opportunity_id: "opp-1",
  title: "Managed IT Services",
  agency: "City IT",
  source: "socrata:la",
  portal_url: "https://example.com/opp-1",
  status: "saved" as const,
  updated_at: "2026-03-14T12:00:00.000Z",
  proposal: null,
};

describe("SavedMatchCard", () => {
  it("renders inbox lifecycle actions for saved matches without a proposal", () => {
    render(
      <SavedMatchCard
        item={ITEM}
        pending={false}
        error={null}
        onOpenProposal={vi.fn()}
        onOpenMatches={vi.fn()}
        onMarkReviewing={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Mark reviewing" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continue review" })).toBeTruthy();
  });

  it("fires reviewing and dismiss callbacks", () => {
    const onMarkReviewing = vi.fn();
    const onDismiss = vi.fn();

    render(
      <SavedMatchCard
        item={ITEM}
        pending={false}
        error={null}
        onOpenProposal={vi.fn()}
        onOpenMatches={vi.fn()}
        onMarkReviewing={onMarkReviewing}
        onDismiss={onDismiss}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Mark reviewing" }));
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(onMarkReviewing).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("shows per-card errors and disables actions while a mutation is in flight", () => {
    render(
      <SavedMatchCard
        item={ITEM}
        pending
        error="Failed to update saved match"
        onOpenProposal={vi.fn()}
        onOpenMatches={vi.fn()}
        onMarkReviewing={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByText("Failed to update saved match")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Updating..." }).hasAttribute("disabled")).toBe(
      true,
    );
    expect(screen.getByRole("button", { name: "Dismiss" }).hasAttribute("disabled")).toBe(true);
  });
});
