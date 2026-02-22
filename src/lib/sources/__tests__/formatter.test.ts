import { describe, it, expect } from "vitest";
import { formatSourcesAsL1Context, formatSourcesForSection } from "../formatter";
import type { LoadedSources, LoadedSource, ExtractedMetric } from "../loader";
import type { ParsedSourceDocument } from "../parser";

// ── Helpers ────────────────────────────────────────────────────────────────

function makeParsedDoc(overrides: Partial<ParsedSourceDocument> = {}): ParsedSourceDocument {
  return {
    title: "Test Document",
    metadata: {},
    content: "",
    rawContent: "",
    sections: [],
    ...overrides,
  };
}

function makeLoadedSource(overrides: Partial<LoadedSource> = {}): LoadedSource {
  return {
    filePath: "/sources/test/test-file.md",
    fileName: "test-file",
    category: "company-context",
    document: makeParsedDoc(),
    ...overrides,
  };
}

function makeEmptySources(): LoadedSources {
  return {
    companyContext: [],
    methodologies: [],
    caseStudies: [],
    serviceCatalog: [],
    evidenceLibrary: [],
    proposalExamples: [],
    all: [],
  };
}

// ════════════════════════════════════════════════════════════════════════════
// formatSourcesAsL1Context
// ════════════════════════════════════════════════════════════════════════════

describe("formatSourcesAsL1Context — Happy Path", () => {
  it("wraps output in STATIC SOURCES markers", () => {
    const sources: LoadedSources = {
      ...makeEmptySources(),
      companyContext: [
        makeLoadedSource({
          document: makeParsedDoc({
            sections: [
              {
                heading: "Company Profile",
                level: 2,
                content: "- Founded in 2000\n- Global presence",
              },
            ],
          }),
        }),
      ],
    };

    const result = formatSourcesAsL1Context(sources);

    expect(result).toContain("=== STATIC SOURCES (L1 - Verified Content) ===");
    expect(result).toContain("=== END STATIC SOURCES ===");
  });

  it("formats company profile section with bullet points", () => {
    const sources: LoadedSources = {
      ...makeEmptySources(),
      companyContext: [
        makeLoadedSource({
          document: makeParsedDoc({
            sections: [
              {
                heading: "Company Profile",
                level: 2,
                content: "- Global IT services leader\n- 350,000+ employees",
              },
            ],
          }),
        }),
      ],
    };

    const result = formatSourcesAsL1Context(sources);

    expect(result).toContain("## Company Profile");
    expect(result).toContain("- Global IT services leader");
    expect(result).toContain("- 350,000+ employees");
  });

  it("formats service lines from company context", () => {
    const sources: LoadedSources = {
      ...makeEmptySources(),
      companyContext: [
        makeLoadedSource({
          document: makeParsedDoc({
            sections: [
              {
                heading: "Service Lines",
                level: 2,
                content: "- Cloud\n- Data\n- AI",
              },
            ],
          }),
        }),
      ],
    };

    const result = formatSourcesAsL1Context(sources);
    expect(result).toContain("**Service Lines**: Cloud, Data, AI");
  });

  it("formats core values section", () => {
    const sources: LoadedSources = {
      ...makeEmptySources(),
      companyContext: [
        makeLoadedSource({
          document: makeParsedDoc({
            sections: [
              {
                heading: "Company Profile",
                level: 2,
                content: "- A company",
              },
              {
                heading: "Core Values",
                level: 2,
                content: "- Innovation\n- Integrity\n- Excellence",
              },
            ],
          }),
        }),
      ],
    };

    const result = formatSourcesAsL1Context(sources);
    expect(result).toContain("### Core Values");
    expect(result).toContain("Innovation, Integrity, Excellence");
  });

  it("formats market position/recognition section (limited to 5)", () => {
    const sources: LoadedSources = {
      ...makeEmptySources(),
      companyContext: [
        makeLoadedSource({
          document: makeParsedDoc({
            sections: [
              {
                heading: "Company Profile",
                level: 2,
                content: "- A company",
              },
              {
                heading: "Market Position",
                level: 2,
                content:
                  "- Award 1\n- Award 2\n- Award 3\n- Award 4\n- Award 5\n- Award 6\n- Award 7",
              },
            ],
          }),
        }),
      ],
    };

    const result = formatSourcesAsL1Context(sources);
    expect(result).toContain("### Industry Recognition");
    expect(result).toContain("- Award 5");
    // Award 6 and 7 should be truncated (only top 5)
    expect(result).not.toContain("- Award 6");
  });

  it("formats certifications from evidence library", () => {
    const sources: LoadedSources = {
      ...makeEmptySources(),
      evidenceLibrary: [
        makeLoadedSource({
          fileName: "certifications-partnerships",
          category: "evidence-library",
          document: makeParsedDoc({
            content: "",
            sections: [
              {
                heading: "Cloud Partnerships",
                level: 2,
                content: "- AWS Advanced Partner\n- Azure Gold Partner",
              },
              {
                heading: "Certifications",
                level: 2,
                content: "- ISO 27001\n- SOC 2 Type II",
              },
            ],
          }),
        }),
      ],
    };

    const result = formatSourcesAsL1Context(sources);
    expect(result).toContain("## Certifications & Partnerships");
    expect(result).toContain("- AWS Advanced Partner");
    expect(result).toContain("- ISO 27001");
  });

  it("formats certifications table from evidence library", () => {
    const sources: LoadedSources = {
      ...makeEmptySources(),
      evidenceLibrary: [
        makeLoadedSource({
          fileName: "certification-list",
          category: "evidence-library",
          document: makeParsedDoc({
            content: `| Certification | Status |
| --- | --- |
| FedRAMP High | Active |
| ISO 27001 | Active |`,
            sections: [],
          }),
        }),
      ],
    };

    const result = formatSourcesAsL1Context(sources);
    expect(result).toContain("- **FedRAMP High**: Active");
    expect(result).toContain("- **ISO 27001**: Active");
  });

  it("formats methodologies with phases and deliverables", () => {
    const sources: LoadedSources = {
      ...makeEmptySources(),
      methodologies: [
        makeLoadedSource({
          fileName: "cloud-migration",
          category: "methodologies",
          document: makeParsedDoc({
            title: "Cloud Migration Framework",
            sections: [
              {
                heading: "Overview",
                level: 2,
                content: "A proven cloud migration approach.",
              },
              {
                heading: "Phase 1: Discovery (2 weeks)",
                level: 2,
                content: "Assess current infrastructure.",
              },
              {
                heading: "Phase 2: Planning (4 weeks)",
                level: 2,
                content: "Create migration plan.",
              },
              {
                heading: "Deliverables",
                level: 2,
                content: "- Migration plan\n- Risk register\n- Timeline",
              },
            ],
          }),
        }),
      ],
    };

    const result = formatSourcesAsL1Context(sources);
    expect(result).toContain("## Methodologies");
    expect(result).toContain("### Cloud Migration Framework");
    expect(result).toContain("A proven cloud migration approach.");
    expect(result).toContain("**Phase 1: Discovery**");
    expect(result).toContain("(2 weeks)");
    expect(result).toContain("**Key Deliverables:**");
    expect(result).toContain("- Migration plan");
  });

  it("filters methodologies by opportunity type", () => {
    const sources: LoadedSources = {
      ...makeEmptySources(),
      methodologies: [
        makeLoadedSource({
          fileName: "cloud-migration",
          category: "methodologies",
          document: makeParsedDoc({
            title: "Cloud Migration Framework",
            sections: [
              { heading: "Overview", level: 2, content: "Cloud approach." },
            ],
          }),
        }),
        makeLoadedSource({
          fileName: "data-analytics",
          category: "methodologies",
          document: makeParsedDoc({
            title: "Data Analytics Approach",
            sections: [
              { heading: "Overview", level: 2, content: "Data approach." },
            ],
          }),
        }),
      ],
    };

    const result = formatSourcesAsL1Context(sources, {
      opportunityType: "cloud_migration",
    });

    expect(result).toContain("Cloud Migration Framework");
    expect(result).not.toContain("Data Analytics Approach");
  });

  it("falls back to all methodologies if none match opportunity type", () => {
    const sources: LoadedSources = {
      ...makeEmptySources(),
      methodologies: [
        makeLoadedSource({
          fileName: "generic-method",
          category: "methodologies",
          document: makeParsedDoc({
            title: "Generic Method",
            sections: [
              { heading: "Overview", level: 2, content: "Generic." },
            ],
          }),
        }),
      ],
    };

    const result = formatSourcesAsL1Context(sources, {
      opportunityType: "nonexistent_type",
    });

    expect(result).toContain("Generic Method");
  });

  it("formats case studies with client, challenge, solution, and metrics", () => {
    const sources: LoadedSources = {
      ...makeEmptySources(),
      caseStudies: [
        makeLoadedSource({
          fileName: "dod-migration",
          category: "case-studies",
          document: makeParsedDoc({
            title: "DoD Cloud Migration",
            sections: [
              {
                heading: "Client Profile",
                level: 2,
                content: `| Field | Value |
| --- | --- |
| Company | Department of Defense |
| Industry | Government |`,
              },
              {
                heading: "Challenge",
                level: 2,
                content: "Legacy systems needed modernization. They were outdated.",
              },
              {
                heading: "Solution",
                level: 2,
                content: "Phased cloud migration strategy. Executed over 12 months.",
              },
              {
                heading: "Key Metrics",
                level: 2,
                content: "- ROI: 200%\n- Savings: $5M",
              },
            ],
          }),
        }),
      ],
    };

    const result = formatSourcesAsL1Context(sources);

    expect(result).toContain("## Relevant Case Studies");
    expect(result).toContain("### DoD Cloud Migration [Government]");
    expect(result).toContain("**Client**: Department of Defense");
    expect(result).toContain("**Challenge**: Legacy systems needed modernization");
    expect(result).toContain("**Approach**: Phased cloud migration strategy");
    expect(result).toContain("**Key Metrics**:");
  });

  it("limits case studies to top 3", () => {
    const sources: LoadedSources = {
      ...makeEmptySources(),
      caseStudies: Array.from({ length: 5 }, (_, i) =>
        makeLoadedSource({
          fileName: `case-${i}`,
          category: "case-studies",
          document: makeParsedDoc({
            title: `Case Study ${i + 1}`,
            sections: [
              {
                heading: "Challenge",
                level: 2,
                content: `Challenge for case ${i + 1}.`,
              },
            ],
          }),
        })
      ),
    };

    const result = formatSourcesAsL1Context(sources);

    // Should include first 3 but not 4th and 5th
    expect(result).toContain("Case Study 1");
    expect(result).toContain("Case Study 2");
    expect(result).toContain("Case Study 3");
    expect(result).not.toContain("Case Study 4");
    expect(result).not.toContain("Case Study 5");
  });

  it("formats success metrics tables", () => {
    const sources: LoadedSources = {
      ...makeEmptySources(),
      evidenceLibrary: [
        makeLoadedSource({
          fileName: "success-metrics",
          category: "evidence-library",
          document: makeParsedDoc({
            content: `| Metric | Typical Result |
| --- | --- |
| ROI | 150-200% |
| Cost Savings | 30-40% |`,
            metadata: {},
            sections: [],
          }),
        }),
      ],
    };

    const result = formatSourcesAsL1Context(sources);
    expect(result).toContain("## Success Metrics (Verified)");
    expect(result).toContain("| ROI | 150-200% |");
  });

  it("formats success metrics from verified evidence with extractMetrics fallback", () => {
    const sources: LoadedSources = {
      ...makeEmptySources(),
      evidenceLibrary: [
        makeLoadedSource({
          fileName: "verified-evidence",
          category: "evidence-library",
          document: makeParsedDoc({
            content: `| Metric | Value |
| --- | --- |
| Uptime | 99.9% |`,
            metadata: { status: "VERIFIED" },
            sections: [],
          }),
        }),
      ],
    };

    const result = formatSourcesAsL1Context(sources);
    expect(result).toContain("## Success Metrics (Verified)");
  });

  it("formats service offerings with overview and pricing", () => {
    const sources: LoadedSources = {
      ...makeEmptySources(),
      serviceCatalog: [
        makeLoadedSource({
          fileName: "managed-cloud",
          category: "service-catalog",
          document: makeParsedDoc({
            title: "Managed Cloud Services",
            content: `## Overview

Full-stack cloud management.

Additional details here.

## Pricing

- Fixed monthly fee
- Per-resource pricing
- Enterprise custom plans
- Volume discount

| Service | Package | Price |
| --- | --- | --- |
| Basic | Starter | $5K/mo |
| Pro | Growth | $15K/mo |`,
            sections: [
              {
                heading: "Overview",
                level: 2,
                content:
                  "Full-stack cloud management.\n\nAdditional details here.",
              },
              {
                heading: "Pricing",
                level: 2,
                content:
                  "- Fixed monthly fee\n- Per-resource pricing\n- Enterprise custom plans\n- Volume discount",
              },
            ],
          }),
        }),
      ],
    };

    const result = formatSourcesAsL1Context(sources);
    expect(result).toContain("## Service Offerings");
    expect(result).toContain("### Managed Cloud Services");
    expect(result).toContain("Full-stack cloud management.");
    expect(result).toContain("**Pricing Models:**");
    // Pricing is limited to 4 bullets
    expect(result).toContain("- Fixed monthly fee");
  });

  it("formats service catalog tables with service/offering headers", () => {
    const sources: LoadedSources = {
      ...makeEmptySources(),
      serviceCatalog: [
        makeLoadedSource({
          fileName: "packages",
          category: "service-catalog",
          document: makeParsedDoc({
            title: "Service Packages",
            content: `| Service | Description | Price |
| --- | --- | --- |
| Basic | Entry-level | $5K |
| Pro | Advanced | $15K |`,
            sections: [
              {
                heading: "Overview",
                level: 2,
                content: "Available service packages.",
              },
            ],
          }),
        }),
      ],
    };

    const result = formatSourcesAsL1Context(sources);
    expect(result).toContain("- **Basic**: Entry-level - $5K");
  });
});

describe("formatSourcesAsL1Context — Edge Cases", () => {
  it("returns empty string when all sources are empty", () => {
    const sources = makeEmptySources();
    const result = formatSourcesAsL1Context(sources);
    expect(result).toBe("");
  });

  it("returns empty string when sources have no extractable content", () => {
    const sources: LoadedSources = {
      ...makeEmptySources(),
      companyContext: [
        makeLoadedSource({
          document: makeParsedDoc({ sections: [] }),
        }),
      ],
    };

    const result = formatSourcesAsL1Context(sources);
    expect(result).toBe("");
  });

  it("handles company context with key facts section (alias for company profile)", () => {
    const sources: LoadedSources = {
      ...makeEmptySources(),
      companyContext: [
        makeLoadedSource({
          document: makeParsedDoc({
            sections: [
              {
                heading: "Key Facts",
                level: 2,
                content: "- Founded 2000\n- 300K employees",
              },
            ],
          }),
        }),
      ],
    };

    const result = formatSourcesAsL1Context(sources);
    expect(result).toContain("- Founded 2000");
  });

  it("handles recognition section (alias for market position)", () => {
    const sources: LoadedSources = {
      ...makeEmptySources(),
      companyContext: [
        makeLoadedSource({
          document: makeParsedDoc({
            sections: [
              {
                heading: "Company Profile",
                level: 2,
                content: "- A company",
              },
              {
                heading: "Industry Recognition",
                level: 2,
                content: "- Gartner Magic Quadrant Leader",
              },
            ],
          }),
        }),
      ],
    };

    const result = formatSourcesAsL1Context(sources);
    expect(result).toContain("### Industry Recognition");
    expect(result).toContain("- Gartner Magic Quadrant Leader");
  });

  it("deduplicates certifications found in both evidence and company context", () => {
    const sources: LoadedSources = {
      ...makeEmptySources(),
      evidenceLibrary: [
        makeLoadedSource({
          fileName: "certification-list",
          category: "evidence-library",
          document: makeParsedDoc({
            sections: [
              {
                heading: "Certifications",
                level: 2,
                content: "- ISO 27001\n- SOC 2",
              },
            ],
          }),
        }),
      ],
      companyContext: [
        makeLoadedSource({
          document: makeParsedDoc({
            sections: [
              {
                heading: "Certification Summary",
                level: 2,
                content: "- ISO 27001\n- FedRAMP",
              },
            ],
          }),
        }),
      ],
    };

    const result = formatSourcesAsL1Context(sources);
    // ISO 27001 should appear only once (deduplicated)
    const isoMatches = result.match(/- ISO 27001/g);
    expect(isoMatches).toHaveLength(1);
    // FedRAMP should be present
    expect(result).toContain("- FedRAMP");
  });

  it("limits deliverables to 5 in methodologies", () => {
    const sources: LoadedSources = {
      ...makeEmptySources(),
      methodologies: [
        makeLoadedSource({
          fileName: "big-method",
          category: "methodologies",
          document: makeParsedDoc({
            title: "Big Method",
            sections: [
              { heading: "Overview", level: 2, content: "Method overview." },
              {
                heading: "Deliverables",
                level: 2,
                content:
                  "- D1\n- D2\n- D3\n- D4\n- D5\n- D6\n- D7",
              },
            ],
          }),
        }),
      ],
    };

    const result = formatSourcesAsL1Context(sources);
    expect(result).toContain("- D5");
    expect(result).not.toContain("- D6");
  });

  it("limits metrics table rows to 10", () => {
    const rows = Array.from({ length: 15 }, (_, i) => `| Metric ${i + 1} | Value ${i + 1} |`).join(
      "\n"
    );
    const sources: LoadedSources = {
      ...makeEmptySources(),
      evidenceLibrary: [
        makeLoadedSource({
          fileName: "success-metrics",
          category: "evidence-library",
          document: makeParsedDoc({
            content: `| Metric | Typical Result |
| --- | --- |
${rows}`,
            sections: [],
          }),
        }),
      ],
    };

    const result = formatSourcesAsL1Context(sources);
    expect(result).toContain("Metric 10");
    expect(result).not.toContain("Metric 11");
  });

  it("truncates case study challenge and solution to first sentence", () => {
    const sources: LoadedSources = {
      ...makeEmptySources(),
      caseStudies: [
        makeLoadedSource({
          fileName: "truncation-test",
          category: "case-studies",
          document: makeParsedDoc({
            title: "Truncation Test",
            sections: [
              {
                heading: "Challenge",
                level: 2,
                content:
                  "First sentence of challenge. Second sentence. Third sentence.",
              },
              {
                heading: "Solution",
                level: 2,
                content:
                  "First sentence of solution! Second sentence.",
              },
            ],
          }),
        }),
      ],
    };

    const result = formatSourcesAsL1Context(sources);
    expect(result).toContain("**Challenge**: First sentence of challenge");
    expect(result).not.toContain("Second sentence");
    expect(result).toContain("**Approach**: First sentence of solution");
  });
});

// ════════════════════════════════════════════════════════════════════════════
// formatSourcesForSection
// ════════════════════════════════════════════════════════════════════════════

describe("formatSourcesForSection — Happy Path", () => {
  const sourcesWithContent: LoadedSources = {
    ...makeEmptySources(),
    companyContext: [
      makeLoadedSource({
        document: makeParsedDoc({
          sections: [
            {
              heading: "Company Profile",
              level: 2,
              content: "- Top IT firm\n- 350K employees",
            },
          ],
        }),
      }),
    ],
    evidenceLibrary: [
      makeLoadedSource({
        fileName: "certification-data",
        category: "evidence-library",
        document: makeParsedDoc({
          sections: [
            {
              heading: "Certifications",
              level: 2,
              content: "- ISO 27001",
            },
          ],
        }),
      }),
    ],
    methodologies: [
      makeLoadedSource({
        fileName: "agile-method",
        category: "methodologies",
        document: makeParsedDoc({
          title: "Agile Methodology",
          sections: [
            { heading: "Overview", level: 2, content: "Agile approach." },
          ],
        }),
      }),
    ],
    caseStudies: [
      makeLoadedSource({
        fileName: "case-1",
        category: "case-studies",
        document: makeParsedDoc({
          title: "Gov Case",
          sections: [
            {
              heading: "Challenge",
              level: 2,
              content: "Modernize systems.",
            },
          ],
        }),
      }),
    ],
    serviceCatalog: [],
    proposalExamples: [],
    all: [],
  };

  it("formats executive_summary with company profile and certifications", () => {
    const result = formatSourcesForSection(sourcesWithContent, "executive_summary");

    expect(result).toContain("=== REFERENCE MATERIAL ===");
    expect(result).toContain("=== END REFERENCE MATERIAL ===");
    expect(result).toContain("## Company Profile");
  });

  it("formats methodology section type", () => {
    const result = formatSourcesForSection(sourcesWithContent, "methodology");

    expect(result).toContain("## Methodologies");
    expect(result).toContain("Agile Methodology");
  });

  it("formats proposed_approach section type (same as methodology)", () => {
    const result = formatSourcesForSection(sourcesWithContent, "proposed_approach");

    expect(result).toContain("## Methodologies");
  });

  it("formats case_studies section type", () => {
    const result = formatSourcesForSection(sourcesWithContent, "case_studies");

    expect(result).toContain("## Relevant Case Studies");
    expect(result).toContain("Gov Case");
  });

  it("formats relevant_experience section type (same as case_studies)", () => {
    const result = formatSourcesForSection(sourcesWithContent, "relevant_experience");

    expect(result).toContain("## Relevant Case Studies");
  });

  it("formats why_us with full L1 context", () => {
    const result = formatSourcesForSection(sourcesWithContent, "why_us");

    expect(result).toContain("=== STATIC SOURCES (L1 - Verified Content) ===");
  });

  it("formats why_intentbid with full L1 context", () => {
    const result = formatSourcesForSection(sourcesWithContent, "why_intentbid");

    expect(result).toContain("=== STATIC SOURCES (L1 - Verified Content) ===");
  });

  it("formats why_capgemini (legacy alias) with full L1 context", () => {
    const result = formatSourcesForSection(sourcesWithContent, "why_capgemini");

    expect(result).toContain("=== STATIC SOURCES (L1 - Verified Content) ===");
  });

  it("uses full L1 context for unknown section types (default case)", () => {
    const result = formatSourcesForSection(sourcesWithContent, "unknown_section");

    expect(result).toContain("=== STATIC SOURCES (L1 - Verified Content) ===");
  });

  it("passes opportunityType option through to methodology formatting", () => {
    const sources: LoadedSources = {
      ...makeEmptySources(),
      methodologies: [
        makeLoadedSource({
          fileName: "cloud-migration",
          category: "methodologies",
          document: makeParsedDoc({
            title: "Cloud Migration",
            sections: [
              { heading: "Overview", level: 2, content: "Cloud approach." },
            ],
          }),
        }),
        makeLoadedSource({
          fileName: "data-analytics",
          category: "methodologies",
          document: makeParsedDoc({
            title: "Data Analytics",
            sections: [
              { heading: "Overview", level: 2, content: "Data approach." },
            ],
          }),
        }),
      ],
    };

    const result = formatSourcesForSection(sources, "methodology", {
      opportunityType: "cloud",
    });

    expect(result).toContain("Cloud Migration");
    expect(result).not.toContain("Data Analytics");
  });

  it("passes industry option through to case study filtering", () => {
    const sources: LoadedSources = {
      ...makeEmptySources(),
      caseStudies: [
        makeLoadedSource({
          fileName: "gov-case",
          category: "case-studies",
          document: makeParsedDoc({
            title: "Government Case",
            sections: [
              {
                heading: "Client Profile",
                level: 2,
                content: `| Field | Value |
| --- | --- |
| Industry | Government |`,
              },
              {
                heading: "Challenge",
                level: 2,
                content: "Government challenge.",
              },
            ],
          }),
        }),
        makeLoadedSource({
          fileName: "finance-case",
          category: "case-studies",
          document: makeParsedDoc({
            title: "Finance Case",
            sections: [
              {
                heading: "Client Profile",
                level: 2,
                content: `| Field | Value |
| --- | --- |
| Industry | Financial Services |`,
              },
              {
                heading: "Challenge",
                level: 2,
                content: "Finance challenge.",
              },
            ],
          }),
        }),
      ],
    };

    const result = formatSourcesForSection(sources, "case_studies", {
      industry: "Government",
    });

    expect(result).toContain("Government Case");
    // Only government cases should appear since the filter found matches
    expect(result).not.toContain("Finance Case");
  });
});

describe("formatSourcesForSection — Edge Cases", () => {
  it("returns empty string when no relevant content exists for section type", () => {
    const sources = makeEmptySources();

    const result = formatSourcesForSection(sources, "executive_summary");
    expect(result).toBe("");
  });

  it("returns empty string for methodology section with empty methodologies", () => {
    const sources = makeEmptySources();
    const result = formatSourcesForSection(sources, "methodology");
    expect(result).toBe("");
  });

  it("returns empty string for case_studies section with empty case studies", () => {
    const sources = makeEmptySources();
    const result = formatSourcesForSection(sources, "case_studies");
    expect(result).toBe("");
  });
});
