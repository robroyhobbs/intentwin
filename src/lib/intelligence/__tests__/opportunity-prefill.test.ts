import { describe, expect, it } from "vitest";

import { buildOpportunityProposalPrefill } from "../opportunity-prefill";

describe("buildOpportunityProposalPrefill", () => {
  it("maps opportunity fields into the proposal intake prefill shape", () => {
    expect(
      buildOpportunityProposalPrefill({
        id: "opp-1",
        source: "socrata:la",
        source_id: "src-1",
        title: "Managed IT Services",
        description: "Cloud migration support",
        agency: "City IT",
        jurisdiction: null,
        city: "Los Angeles",
        state: "CA",
        agency_level: "local",
        naics_code: "541512",
        native_category_code: null,
        native_category_name: null,
        posted_date: "2026-03-01",
        response_deadline: "2026-03-28T00:00:00.000Z",
        estimated_value: 100000,
        set_aside_type: "small business",
        contact_name: null,
        contact_email: null,
        contact_phone: null,
        portal_url: "https://example.com/opp-1",
        status: "open",
      }),
    ).toEqual({
      client_name: "City IT",
      scope_description: "Cloud migration support",
      solicitation_type: "RFP",
      timeline_expectation: "2026-03-28T00:00:00.000Z",
      opportunity_source: {
        id: "opp-1",
        title: "Managed IT Services",
        portal_url: "https://example.com/opp-1",
      },
    });
  });

  it("falls back to title when the description is missing", () => {
    expect(
      buildOpportunityProposalPrefill({
        id: "opp-2",
        source: "socrata:nyc",
        source_id: "src-2",
        title: "ERP Support",
        description: null,
        agency: "Finance Dept",
        jurisdiction: null,
        city: null,
        state: "NY",
        agency_level: "local",
        naics_code: null,
        native_category_code: null,
        native_category_name: null,
        posted_date: null,
        response_deadline: null,
        estimated_value: null,
        set_aside_type: null,
        contact_name: null,
        contact_email: null,
        contact_phone: null,
        portal_url: null,
        status: "open",
      }).scope_description,
    ).toBe("ERP Support");
  });

  it("preserves linked opportunity metadata for later proposal linkage", () => {
    expect(
      buildOpportunityProposalPrefill({
        id: "opp-3",
        source: "socrata:chi",
        source_id: "src-3",
        title: "Network Upgrade",
        description: "Modernize municipal switching",
        agency: "City Infrastructure",
        jurisdiction: null,
        city: "Chicago",
        state: "IL",
        agency_level: "local",
        naics_code: "541512",
        native_category_code: null,
        native_category_name: null,
        posted_date: null,
        response_deadline: null,
        estimated_value: null,
        set_aside_type: null,
        contact_name: null,
        contact_email: null,
        contact_phone: null,
        portal_url: "https://example.com/opp-3",
        status: "open",
      }).opportunity_source,
    ).toEqual({
      id: "opp-3",
      title: "Network Upgrade",
      portal_url: "https://example.com/opp-3",
    });
  });
});
