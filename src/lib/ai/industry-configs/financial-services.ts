import type { IndustryConfig } from "./index";

export const financialServicesConfig: IndustryConfig = {
  key: "financial_services",
  displayName: "Financial Services",

  painPoints: [
    "Regulatory compliance burden across SOX, PCI-DSS, Basel III, and evolving frameworks",
    "Legacy core banking and payment systems limiting agility and time-to-market",
    "Fraud detection and prevention at scale across real-time transaction streams",
    "Data silos between retail banking, wealth management, and insurance divisions",
    "Cybersecurity threats targeting customer financial data and transaction integrity",
  ],

  keywords: [
    "risk management",
    "regulatory compliance",
    "fintech",
    "open banking",
    "AML/KYC",
    "digital banking",
    "core banking modernization",
    "real-time payments",
    "fraud detection",
    "customer onboarding",
    "portfolio management",
    "wealth management",
  ],

  priorities: [
    "Regulatory compliance and audit readiness (SOX, PCI-DSS, Basel III)",
    "Security posture and customer data protection",
    "Real-time transaction processing and fraud prevention",
    "Cost optimization through legacy modernization",
    "Customer experience and digital channel adoption",
  ],

  winThemes: [
    "Deep financial regulatory expertise with proven compliance track record",
    "Proven core banking modernization without service disruption",
    "Real-time fraud detection and transaction monitoring at scale",
  ],

  sectionGuidance: {
    executive_summary:
      "Lead with regulatory compliance posture and risk reduction. Reference specific financial regulations by name. Emphasize trust and stability.",
    understanding:
      "Demonstrate deep understanding of the client's regulatory environment, competitive pressures from fintechs, and legacy system constraints.",
    approach:
      "Emphasize phased migration approaches that maintain regulatory compliance throughout. Highlight zero-downtime strategies for core banking systems.",
    case_studies:
      "Prioritize case studies from banking, insurance, or wealth management. Include specific compliance outcomes (audit pass rates, regulatory findings reduced).",
    risk_mitigation:
      "Address regulatory risk, data migration risk, and business continuity. Reference specific financial industry disaster recovery standards.",
    why_us:
      "Highlight financial services partnerships, certifications, and dedicated practice areas. Reference specific regulatory expertise.",
    pricing:
      "Frame investment in terms of regulatory penalty avoidance, fraud loss reduction, and operational efficiency gains.",
    methodology:
      "Reference financial industry frameworks (TOGAF for banking, ITIL for operations). Emphasize governance and compliance checkpoints.",
    team:
      "Highlight team members with financial services certifications (CFA, FRM, CAMS) and regulatory experience.",
    timeline:
      "Account for regulatory review cycles, audit windows, and banking change freeze periods.",
  },
};
