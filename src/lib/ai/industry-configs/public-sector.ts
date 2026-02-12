import type { IndustryConfig } from "./index";

export const publicSectorConfig: IndustryConfig = {
  key: "public_sector",
  displayName: "Public Sector & Government",

  painPoints: [
    "FedRAMP authorization burden delaying cloud adoption timelines",
    "Citizen experience gaps compared to private sector digital services",
    "Legacy system modernization mandates with constrained budgets and timelines",
    "Cybersecurity threats to critical infrastructure and citizen data",
    "Workforce challenges in recruiting and retaining technical talent",
  ],

  keywords: [
    "citizen services",
    "mission-critical",
    "FedRAMP",
    "FISMA",
    "authority to operate",
    "ATO",
    "zero trust",
    "NIST",
    "agency modernization",
    "continuous ATO",
    "IL4/IL5",
    "GovCloud",
  ],

  priorities: [
    "Security compliance (FedRAMP, FISMA, NIST 800-53, CMMC)",
    "Mission delivery and operational continuity",
    "Citizen experience and digital service accessibility (Section 508)",
    "Cost efficiency and responsible use of taxpayer resources",
    "Transparency, accountability, and auditability",
  ],

  winThemes: [
    "Federal compliance expertise with proven FedRAMP and ATO track record",
    "Mission-critical system modernization without operational disruption",
    "Citizen experience transformation with accessibility-first design",
  ],

  sectionGuidance: {
    executive_summary:
      "Lead with mission alignment and compliance posture. Frame everything in terms of mission outcomes and citizen impact, not business metrics.",
    understanding:
      "Demonstrate understanding of the agency's mission, authorizing environment, and procurement constraints. Reference specific mandates (EO 14028, FITARA, etc.).",
    approach:
      "Emphasize FedRAMP-authorized and NIST-compliant architecture. Use government terminology (ATO, IL levels, continuous monitoring). Address Section 508 accessibility.",
    case_studies:
      "Prioritize federal, state, or local government case studies. Include mission outcome metrics and compliance milestones (ATO achieved, FedRAMP authorized).",
    risk_mitigation:
      "Address security clearance requirements, compliance risks, continuity of operations (COOP), and data sovereignty. Reference NIST Risk Management Framework.",
    why_us:
      "Highlight government-specific certifications, clearances held, past performance on similar contracts, and understanding of FAR/DFARS procurement.",
    pricing:
      "Frame investment in terms of mission ROI, operational savings, and compliance cost avoidance. Reference relevant contract vehicles (GSA Schedule, BPAs).",
    methodology:
      "Reference government frameworks (NIST, FedRAMP, RMF). Include security assessment and authorization milestones. Emphasize agile within government context.",
    team:
      "Highlight team members with security clearances, government experience, and relevant certifications (CISSP, PMP, ITIL).",
    timeline:
      "Account for ATO timelines, procurement cycles, fiscal year boundaries, and government change management processes.",
  },
};
