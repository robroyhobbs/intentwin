import { describe, expect, it } from "vitest";
import {
  buildOpportunityMatchProfile,
  type OpportunityMatchProfileSource,
} from "../opportunity-match-profile";

describe("buildOpportunityMatchProfile", () => {
  it("builds a deduplicated profile from products, certifications, and filters", () => {
    const source: OpportunityMatchProfileSource = {
      companyContext: [
        {
          category: "certifications",
          key: "iso-27001",
          title: "ISO 27001",
          content: "Certified information security management system",
        },
        {
          category: "certifications",
          key: "8a",
          title: "8(a) Certified",
          content: "Small disadvantaged business",
        },
      ],
      products: [
        {
          id: "prod-1",
          product_name: "Cloud Modernization",
          service_line: "Managed IT",
          description: "Cloud operations and modernization",
          capabilities: [
            { name: "Cloud Migration", description: "Move workloads", outcomes: [] },
            { name: "Help Desk", description: "Support desk", outcomes: [] },
          ],
        },
        {
          id: "prod-2",
          product_name: "Managed Services",
          service_line: "Managed IT",
          description: "Ongoing service desk operations",
          capabilities: [
            { name: "Help Desk", description: "Tier 1 support", outcomes: [] },
          ],
        },
      ],
      filters: {
        naicsCodes: ["541512", "541512"],
        state: "ca",
        city: "Los Angeles",
        setAsideType: "small business",
      },
    };

    const result = buildOpportunityMatchProfile(source);

    expect(result.profile).toEqual({
      naics_codes: ["541512"],
      service_lines: ["Managed IT"],
      capability_keywords: [
        "Cloud Modernization",
        "Cloud Migration",
        "Help Desk",
        "Managed Services",
      ],
      certifications: ["ISO 27001", "8(a) Certified"],
      preferred_states: ["CA"],
      preferred_cities: ["Los Angeles"],
      eligible_set_asides: ["small business"],
    });
    expect(result.summary).toEqual({
      productCount: 2,
      serviceLineCount: 1,
      capabilityCount: 4,
      certificationCount: 2,
      naicsCount: 1,
    });
  });

  it("ignores blank values and does not mutate inputs", () => {
    const source: OpportunityMatchProfileSource = {
      companyContext: [
        {
          category: "brand",
          key: "company-name",
          title: " ",
          content: "ignored",
        },
      ],
      products: [
        {
          id: "prod-1",
          product_name: "  ",
          service_line: "",
          description: "",
          capabilities: [{ name: "  ", description: "", outcomes: [] }],
        },
      ],
      filters: {
        naicsCodes: ["", "  "],
        state: " ",
        city: "",
        setAsideType: "",
      },
    };
    const before = JSON.stringify(source);

    const result = buildOpportunityMatchProfile(source);

    expect(result.profile).toEqual({
      naics_codes: [],
      service_lines: [],
      capability_keywords: [],
      certifications: [],
      preferred_states: [],
      preferred_cities: [],
      eligible_set_asides: [],
    });
    expect(JSON.stringify(source)).toBe(before);
  });
});
