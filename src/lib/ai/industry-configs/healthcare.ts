import type { IndustryConfig } from "./index";

export const healthcareConfig: IndustryConfig = {
  key: "healthcare",
  displayName: "Healthcare & Life Sciences",

  painPoints: [
    "HIPAA compliance burden across cloud workloads and data sharing workflows",
    "Legacy EHR system interoperability challenges blocking care coordination",
    "Clinical workflow inefficiency driving burnout and reducing patient throughput",
    "Patient data fragmentation across disparate systems and care settings",
    "Rising cybersecurity threats targeting protected health information (PHI)",
  ],

  keywords: [
    "patient outcomes",
    "clinical workflows",
    "EHR",
    "HIPAA",
    "care delivery",
    "population health",
    "value-based care",
    "interoperability",
    "telehealth",
    "clinical decision support",
    "care coordination",
    "health information exchange",
  ],

  priorities: [
    "Regulatory compliance (HIPAA, HITECH, FDA 21 CFR Part 11)",
    "Patient data security and privacy protection",
    "Interoperability and system integration across care continuum",
    "Care quality improvement without increasing provider burden",
    "Cost reduction while maintaining or improving patient outcomes",
  ],

  winThemes: [
    "Healthcare data security leadership with HIPAA-first architecture",
    "Clinical workflow transformation that reduces provider burden and improves outcomes",
    "Proven EHR integration and interoperability track record",
  ],

  sectionGuidance: {
    executive_summary:
      "Lead with patient outcomes and compliance posture. Frame technology as enabling better care delivery, not as an end in itself.",
    understanding:
      "Demonstrate understanding of the clinical environment — provider workflows, patient journeys, payer relationships. Reference specific healthcare challenges like interoperability or value-based care transitions.",
    approach:
      "Emphasize HIPAA-compliant architecture from day one. Use healthcare-specific terms like 'care delivery transformation' rather than generic 'digital transformation.'",
    case_studies:
      "Prioritize case studies from hospitals, health systems, payers, or life sciences. Include patient outcome metrics and compliance achievements.",
    risk_mitigation:
      "Address PHI data handling, HIPAA breach risk, clinical workflow disruption during transition, and FDA compliance where applicable.",
    why_us:
      "Highlight healthcare-specific certifications (HITRUST, SOC 2 for healthcare), partnerships with EHR vendors, and dedicated health practice.",
    pricing:
      "Frame investment in terms of improved patient outcomes, reduced readmission rates, and operational efficiency. Avoid framing healthcare as purely a cost-reduction exercise.",
    methodology:
      "Reference healthcare-specific methodologies and standards (HL7 FHIR, HITRUST CSF). Include clinical validation checkpoints.",
    team:
      "Highlight team members with healthcare domain expertise, clinical advisory capabilities, and relevant certifications.",
    timeline:
      "Account for HIPAA compliance reviews, clinical validation periods, and go-live support during care transitions.",
  },
};
