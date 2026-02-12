import type { IndustryConfig } from "./index";

export const manufacturingConfig: IndustryConfig = {
  key: "manufacturing",
  displayName: "Manufacturing & Industrial",

  painPoints: [
    "Supply chain visibility gaps making demand forecasting unreliable",
    "OT/IT convergence challenges creating security and integration risks",
    "Predictive maintenance adoption blocked by legacy equipment and data silos",
    "Industry 4.0 readiness gaps between vision and shop floor reality",
    "Quality control inconsistency across multiple production sites and shifts",
  ],

  keywords: [
    "smart factory",
    "digital twin",
    "predictive maintenance",
    "supply chain resilience",
    "OT/IT convergence",
    "Industry 4.0",
    "manufacturing execution system",
    "MES",
    "SCADA",
    "IoT",
    "production optimization",
    "lean manufacturing",
  ],

  priorities: [
    "Operational efficiency and production throughput optimization",
    "Supply chain resilience and end-to-end visibility",
    "Quality control and defect reduction across production lines",
    "Worker safety and compliance with OSHA and industry standards",
    "Sustainability and energy efficiency in manufacturing operations",
  ],

  winThemes: [
    "Smart manufacturing transformation connecting shop floor to top floor",
    "Supply chain digitization with real-time visibility and predictive analytics",
    "OT/IT convergence expertise that bridges legacy equipment with modern platforms",
  ],

  sectionGuidance: {
    executive_summary:
      "Lead with operational efficiency gains and production metrics. Frame technology in terms of throughput, yield, and cost-per-unit impact.",
    understanding:
      "Demonstrate understanding of the client's production environment — plant layout, equipment age, shift patterns, supply chain complexity. Reference specific manufacturing challenges.",
    approach:
      "Emphasize phased rollout starting with pilot lines before scaling. Address OT network security and integration with existing SCADA/MES systems.",
    case_studies:
      "Prioritize case studies from similar manufacturing verticals (discrete, process, hybrid). Include production metrics (OEE improvement, defect reduction, downtime reduction).",
    risk_mitigation:
      "Address production continuity during implementation, OT network security, integration with legacy equipment, and worker adoption challenges.",
    why_us:
      "Highlight manufacturing-specific partnerships (Siemens, Rockwell, PTC), OT security expertise, and shop floor implementation experience.",
    pricing:
      "Frame investment in terms of OEE improvement, reduced unplanned downtime, scrap reduction, and energy savings. Use manufacturing-relevant ROI metrics.",
    methodology:
      "Reference manufacturing frameworks (ISA-95, lean/six sigma integration). Include pilot-to-scale methodology with production validation gates.",
    team:
      "Highlight team members with manufacturing domain expertise, OT security certifications, and experience with industrial control systems.",
    timeline:
      "Account for production schedules, planned maintenance windows, seasonal demand cycles, and phased plant-by-plant rollout.",
  },
};
