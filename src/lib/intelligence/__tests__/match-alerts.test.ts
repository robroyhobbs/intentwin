import { describe, expect, it } from "vitest";

import { buildMatchAlerts } from "../match-alerts";
import type { OpportunityMatch } from "../types";

const MATCHES: OpportunityMatch[] = [
  {
    opportunity_id: "opp-new",
    score: 86,
    confidence: "high",
    breakdown: {
      naics: 30,
      capabilities: 28,
      geography: 10,
      certifications: 10,
      set_aside: 4,
      deadline: 4,
    },
    reasons: ["Strong NAICS overlap"],
    risks: [],
    opportunity: {
      id: "opp-new",
      source: "socrata:la",
      source_id: "src-1",
      title: "Cloud Modernization",
      description: null,
      agency: "City IT",
      jurisdiction: null,
      city: "Los Angeles",
      state: "CA",
      agency_level: "local",
      naics_code: "541512",
      native_category_code: null,
      native_category_name: null,
      posted_date: "2026-03-10",
      response_deadline: "2026-03-25T00:00:00.000Z",
      estimated_value: 125000,
      set_aside_type: null,
      contact_name: null,
      contact_email: null,
      contact_phone: null,
      portal_url: "https://example.com/new",
      status: "open",
    },
  },
  {
    opportunity_id: "opp-saved",
    score: 78,
    confidence: "high",
    breakdown: {
      naics: 30,
      capabilities: 20,
      geography: 10,
      certifications: 10,
      set_aside: 4,
      deadline: 4,
    },
    reasons: ["Strong service-line overlap"],
    risks: [],
    opportunity: {
      id: "opp-saved",
      source: "socrata:la",
      source_id: "src-2",
      title: "Infrastructure Support",
      description: null,
      agency: "County Operations",
      jurisdiction: null,
      city: "San Diego",
      state: "CA",
      agency_level: "local",
      naics_code: "541512",
      native_category_code: null,
      native_category_name: null,
      posted_date: "2026-03-11",
      response_deadline: "2026-03-18T00:00:00.000Z",
      estimated_value: 98000,
      set_aside_type: null,
      contact_name: null,
      contact_email: null,
      contact_phone: null,
      portal_url: "https://example.com/saved",
      status: "open",
    },
  },
  {
    opportunity_id: "opp-dismissed",
    score: 90,
    confidence: "high",
    breakdown: {
      naics: 30,
      capabilities: 30,
      geography: 10,
      certifications: 10,
      set_aside: 5,
      deadline: 5,
    },
    reasons: ["Very strong fit"],
    risks: [],
    opportunity: {
      id: "opp-dismissed",
      source: "socrata:la",
      source_id: "src-3",
      title: "Network Services",
      description: null,
      agency: "City IT",
      jurisdiction: null,
      city: "Pasadena",
      state: "CA",
      agency_level: "local",
      naics_code: "541512",
      native_category_code: null,
      native_category_name: null,
      posted_date: "2026-03-11",
      response_deadline: "2026-03-28T00:00:00.000Z",
      estimated_value: 88000,
      set_aside_type: null,
      contact_name: null,
      contact_email: null,
      contact_phone: null,
      portal_url: "https://example.com/dismissed",
      status: "open",
    },
  },
];

describe("buildMatchAlerts", () => {
  it("returns unsaved high-signal matches and urgent saved deadlines", () => {
    const result = buildMatchAlerts({
      matches: MATCHES,
      feedbackByOpportunityId: {
        "opp-saved": {
          status: "saved",
          updated_at: "2026-03-14T10:00:00.000Z",
          proposal_id: null,
        },
        "opp-dismissed": {
          status: "dismissed",
          updated_at: "2026-03-14T11:00:00.000Z",
          proposal_id: null,
        },
      },
      now: "2026-03-14T00:00:00.000Z",
    });

    expect(result.summary).toEqual({
      new_high_signal_count: 1,
      urgent_saved_count: 1,
      total_attention_count: 2,
      high_signal_threshold: 80,
      urgent_deadline_days: 10,
    });
    expect(result.new_high_signal_matches).toHaveLength(1);
    expect(result.new_high_signal_matches[0]).toEqual(
      expect.objectContaining({
        opportunity_id: "opp-new",
        title: "Cloud Modernization",
        score: 86,
      }),
    );
    expect(result.urgent_saved_matches).toHaveLength(1);
    expect(result.urgent_saved_matches[0]).toEqual(
      expect.objectContaining({
        opportunity_id: "opp-saved",
        status: "saved",
        days_until_deadline: 4,
      }),
    );
  });

  it("excludes dismissed and low-score opportunities from alerts", () => {
    const result = buildMatchAlerts({
      matches: MATCHES,
      feedbackByOpportunityId: {
        "opp-new": {
          status: "reviewing",
          updated_at: "2026-03-14T10:00:00.000Z",
          proposal_id: null,
        },
        "opp-saved": {
          status: "proposal_started",
          updated_at: "2026-03-14T10:00:00.000Z",
          proposal_id: "proposal-1",
        },
        "opp-dismissed": {
          status: "dismissed",
          updated_at: "2026-03-14T10:00:00.000Z",
          proposal_id: null,
        },
      },
      now: "2026-03-14T00:00:00.000Z",
      highSignalThreshold: 90,
      urgentDeadlineDays: 3,
    });

    expect(result.summary.total_attention_count).toBe(0);
    expect(result.new_high_signal_matches).toEqual([]);
    expect(result.urgent_saved_matches).toEqual([]);
  });
});
