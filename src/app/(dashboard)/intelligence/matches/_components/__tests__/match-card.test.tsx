// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MatchCard } from "../match-card";

const MATCH = {
  opportunity_id: "opp-1",
  score: 82,
  confidence: "high" as const,
  breakdown: {
    naics: 30,
    capabilities: 28,
    geography: 10,
    certifications: 8,
    set_aside: 4,
    deadline: 2,
  },
  reasons: ["Strong NAICS overlap", "Cloud migration capability fit"],
  risks: ["Deadline is less than 10 business days"],
  opportunity: {
    id: "opp-1",
    source: "socrata:la",
    source_id: "src-1",
    title: "Managed IT Services",
    description: "Cloud migration support",
    agency: "City IT",
    jurisdiction: null,
    city: "Los Angeles",
    state: "CA",
    agency_level: "local" as const,
    naics_code: "541512",
    native_category_code: null,
    native_category_name: null,
    posted_date: "2026-03-01",
    response_deadline: "2026-03-28T00:00:00.000Z",
    estimated_value: 125000,
    set_aside_type: "small business",
    contact_name: null,
    contact_email: null,
    contact_phone: null,
    portal_url: "https://example.com/opp-1",
    status: "open" as const,
  },
};

describe("MatchCard", () => {
  it("renders save and dismiss actions for unsaved matches", () => {
    render(
      <MatchCard
        match={MATCH}
        feedbackStatus={null}
        feedbackPending={false}
        onViewDetails={vi.fn()}
        onStartProposal={vi.fn()}
        onSave={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Save match" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeTruthy();
  });

  it("shows the saved state and fires callbacks", () => {
    const onSave = vi.fn();
    const onDismiss = vi.fn();

    render(
      <MatchCard
        match={MATCH}
        feedbackStatus="saved"
        feedbackPending={false}
        onViewDetails={vi.fn()}
        onStartProposal={vi.fn()}
        onSave={onSave}
        onDismiss={onDismiss}
      />,
    );

    expect(screen.getByRole("button", { name: "Saved" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Saved" }));
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("disables feedback actions while a feedback mutation is in flight", () => {
    render(
      <MatchCard
        match={MATCH}
        feedbackStatus={null}
        feedbackPending
        onViewDetails={vi.fn()}
        onStartProposal={vi.fn()}
        onSave={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Saving..." }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "Dismiss" }).hasAttribute("disabled")).toBe(true);
  });
});
