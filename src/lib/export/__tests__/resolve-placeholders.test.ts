import { describe, it, expect } from "vitest";
import { resolvePlaceholders } from "../resolve-placeholders";
import type { PlaceholderValues, L1Sources } from "../resolve-placeholders";

const BASE_VALUES: PlaceholderValues = {
  date: "March 2, 2026",
  client_name: "ACME Corp",
  signatory_name: "Jane Smith",
  signatory_title: "Director of Solutions",
};

const MOCK_EVIDENCE = [
  {
    id: "ev-1",
    evidence_type: "case_study" as const,
    title: "Cloud Migration for Federal Agency",
    summary: "Migrated 200 applications to AWS GovCloud.",
    full_content: "",
    client_industry: "federal_government",
    service_line: "cloud",
    metrics: [{ name: "Apps Migrated", value: "200", context: "18 months" }],
    outcomes_demonstrated: [],
    is_verified: true,
  },
  {
    id: "ev-2",
    evidence_type: "case_study" as const,
    title: "Healthcare IT Modernization",
    summary: "Modernized EHR systems across 12 hospitals.",
    full_content: "",
    client_industry: "healthcare",
    service_line: "modernization",
    metrics: [{ name: "Hospitals", value: "12", context: "" }],
    outcomes_demonstrated: [],
    is_verified: true,
  },
];

const MOCK_MEMBERS = [
  {
    id: "tm-1",
    name: "Alice Johnson",
    role: "Cloud Architect",
    title: "Senior Cloud Architect",
    skills: ["AWS", "Azure", "Kubernetes"],
    certifications: ["AWS Solutions Architect Pro"],
    years_experience: 15,
    project_history: [],
    is_verified: true,
  },
  {
    id: "tm-2",
    name: "Bob Williams",
    role: "Project Manager",
    title: "Program Manager",
    skills: ["PMP", "Agile", "SAFe"],
    certifications: ["PMP", "SAFe Agilist"],
    years_experience: 10,
    project_history: [],
    is_verified: true,
  },
];

const MOCK_L1: L1Sources = {
  teamMembers: MOCK_MEMBERS,
  evidenceLibrary: MOCK_EVIDENCE,
};

describe("resolvePlaceholders", () => {
  it("substitutes all merge fields", () => {
    const input =
      "Date: {date}\nTo: {client_name}\nFrom: {signatory_name}, {signatory_title}";
    const result = resolvePlaceholders(input, BASE_VALUES);
    expect(result).toBe(
      "Date: March 2, 2026\nTo: ACME Corp\nFrom: Jane Smith, Director of Solutions",
    );
  });

  it("strips signatory_title comma when title is empty", () => {
    const input = "From: {signatory_name}, {signatory_title}";
    const values = { ...BASE_VALUES, signatory_title: "" };
    const result = resolvePlaceholders(input, values);
    expect(result).toBe("From: Jane Smith");
  });

  it("fills [CASE STUDY NEEDED] from evidence library", () => {
    const input =
      "Our experience includes [CASE STUDY NEEDED: federal_government, cloud migration].";
    const result = resolvePlaceholders(input, BASE_VALUES, MOCK_L1);
    expect(result).toContain("Cloud Migration for Federal Agency");
    expect(result).toContain("Apps Migrated: 200");
    expect(result).not.toContain("CASE STUDY NEEDED");
  });

  it("matches evidence by industry keyword", () => {
    const input = "[CASE STUDY NEEDED: healthcare, IT modernization]";
    const result = resolvePlaceholders(input, BASE_VALUES, MOCK_L1);
    expect(result).toContain("Healthcare IT Modernization");
  });

  it("fills [TEAM MEMBER NEEDED] from team members", () => {
    const input =
      "The lead will be [TEAM MEMBER NEEDED: Senior Cloud Architect].";
    const result = resolvePlaceholders(input, BASE_VALUES, MOCK_L1);
    expect(result).toContain("Alice Johnson");
    expect(result).toContain("Senior Cloud Architect");
    expect(result).not.toContain("TEAM MEMBER NEEDED");
  });

  it("matches team members by role keywords", () => {
    const input = "[TEAM MEMBER NEEDED: Project Manager]";
    const result = resolvePlaceholders(input, BASE_VALUES, MOCK_L1);
    expect(result).toContain("Bob Williams");
    expect(result).toContain("Program Manager");
  });

  it("avoids reusing the same evidence entry", () => {
    const input =
      "[CASE STUDY NEEDED: cloud] and also [CASE STUDY NEEDED: cloud]";
    const result = resolvePlaceholders(input, BASE_VALUES, MOCK_L1);
    // First match gets ev-1 (cloud), second should get ev-2 (different entry)
    expect(result).toContain("Cloud Migration");
    expect(result).toContain("Healthcare IT");
  });

  it("avoids reusing the same team member", () => {
    const input =
      "[TEAM MEMBER NEEDED: architect] and [TEAM MEMBER NEEDED: architect]";
    const result = resolvePlaceholders(input, BASE_VALUES, MOCK_L1);
    expect(result).toContain("Alice Johnson");
    expect(result).toContain("Bob Williams");
  });

  it("strips markers when no L1 data is available", () => {
    const input =
      "See [CASE STUDY NEEDED: test] and [TEAM MEMBER NEEDED: role].";
    const result = resolvePlaceholders(input, BASE_VALUES);
    expect(result).toBe("See  and .");
  });

  it("strips $TBD and [PRODUCT NEEDED] markers", () => {
    const input = "Budget: $TBD\nProduct: [PRODUCT NEEDED: widget]";
    const result = resolvePlaceholders(input, BASE_VALUES);
    expect(result).toBe("Budget: \nProduct: ");
  });

  it("cleans up triple-newlines from stripped markers", () => {
    const input = "Before\n\n\n[CASE STUDY NEEDED: test]\n\n\nAfter";
    const result = resolvePlaceholders(input, BASE_VALUES);
    expect(result).toBe("Before\n\nAfter");
  });

  it("handles empty L1 sources gracefully", () => {
    const emptyL1: L1Sources = { teamMembers: [], evidenceLibrary: [] };
    const input = "[CASE STUDY NEEDED: x] [TEAM MEMBER NEEDED: y]";
    const result = resolvePlaceholders(input, BASE_VALUES, emptyL1);
    expect(result).not.toContain("CASE STUDY");
    expect(result).not.toContain("TEAM MEMBER");
  });
});
