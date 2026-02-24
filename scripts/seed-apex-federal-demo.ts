/**
 * Seed Apex Federal Solutions Demo Account
 *
 * Usage:
 *   npx tsx scripts/seed-apex-federal-demo.ts
 *
 * Creates a fully-loaded demo account for demo@intentbid.com with:
 *   - Organization: Apex Federal Solutions (Pro tier)
 *   - 30 L1 company context entries
 *   - 5 product/service line contexts
 *   - 12 evidence library entries (case studies, metrics, testimonials, certifications)
 *   - 5 team members
 *   - 3 proposals (1 completed/won, 1 in review, 1 in intake)
 *   - Full proposal sections for the completed proposal
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Load env from .env.local if available, otherwise fall back to process.env
// (supports both local dev and CI/GitHub Actions)
const env: Record<string, string> = {};
const envPath = resolve(import.meta.dirname || __dirname, "../.env.local");
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const raw = trimmed.slice(eqIdx + 1);
    env[trimmed.slice(0, eqIdx)] = raw.replace(/^["']|["']$/g, "");
  }
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  console.error("Set them in .env.local or as environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_EMAIL = "demo@intentbid.com";
const DEMO_PASSWORD = "Cool551!pass";
const DEMO_NAME = "Alex Rivera";
const ORG_NAME = "Apex Federal Solutions";
const ORG_SLUG = "apex-federal-solutions";

// =============================================================================
// L1 COMPANY CONTEXT
// =============================================================================
const COMPANY_CONTEXT = [
  // ── Brand ──
  {
    category: "brand",
    key: "company_name",
    title: "Company Name",
    content: "Apex Federal Solutions",
    is_locked: true,
    lock_reason: "Core brand identity",
  },
  {
    category: "brand",
    key: "tagline",
    title: "Brand Tagline",
    content: "Mission-Ready IT. Zero Excuses.",
    is_locked: true,
    lock_reason: "Official brand tagline",
  },
  {
    category: "brand",
    key: "description",
    title: "Company Description",
    content:
      "Apex Federal Solutions is a Service-Disabled Veteran-Owned Small Business (SDVOSB) delivering cloud migration, cybersecurity, managed IT services, data analytics, and systems engineering to federal, state, and local government agencies. Founded in 2017 by former DoD IT leaders, Apex combines deep public-sector domain expertise with commercial-grade engineering discipline to modernize government technology stacks without disrupting mission operations. We have delivered 140+ engagements across 38 agencies with a 97.2% on-time delivery rate.",
    is_locked: true,
    lock_reason: "Official company description",
  },
  {
    category: "brand",
    key: "mission",
    title: "Mission Statement",
    content:
      "To accelerate government IT modernization by delivering secure, outcome-driven technology solutions that strengthen agency missions and protect taxpayer investment.",
    is_locked: true,
    lock_reason: "Official mission statement",
  },
  {
    category: "brand",
    key: "value_proposition",
    title: "Value Proposition",
    content:
      "Apex brings three things most IT contractors can't: cleared personnel who understand classified environments, a migration methodology (ApexLift) proven across 90+ cloud transitions with zero data loss, and fixed-price delivery backed by outcome guarantees. We don't sell hours — we sell results.",
    is_locked: true,
    lock_reason: "Core value proposition",
  },
  {
    category: "brand",
    key: "founding_year",
    title: "Year Founded",
    content: "2017",
    is_locked: true,
    lock_reason: "Historical fact",
  },
  {
    category: "brand",
    key: "headquarters",
    title: "Headquarters",
    content: "1775 Tysons Blvd, Suite 400, Tysons, VA 22102",
    is_locked: true,
    lock_reason: "Official address",
  },
  {
    category: "brand",
    key: "business_type",
    title: "Business Classification",
    content: "Service-Disabled Veteran-Owned Small Business (SDVOSB), SBA 8(a) certified",
    is_locked: true,
    lock_reason: "Federal certifications",
  },
  {
    category: "brand",
    key: "team_size",
    title: "Team Size",
    content: "85 full-time employees, 40+ cleared personnel (Secret/TS-SCI), 65 active technical certifications",
    is_locked: true,
    lock_reason: "Current headcount",
  },
  {
    category: "brand",
    key: "naics_codes",
    title: "NAICS Codes",
    content: "541512 (Computer Systems Design), 541519 (Other Computer Related Services), 518210 (Data Processing & Hosting), 541513 (Computer Facilities Management), 541611 (Administrative Management Consulting)",
    is_locked: true,
    lock_reason: "Federal registration codes",
  },
  {
    category: "brand",
    key: "cage_duns",
    title: "CAGE & DUNS",
    content: "CAGE: 8X4K7, DUNS: 08-174-6293, UEI: JK7MTXR4V2N8",
    is_locked: true,
    lock_reason: "Federal identifiers",
  },
  {
    category: "brand",
    key: "differentiators",
    title: "Key Differentiators",
    content:
      "1) ApexLift Migration Methodology — 90+ cloud transitions, zero data loss, 35% faster than industry average\n2) 40+ cleared personnel (Secret through TS-SCI) ready to deploy within 2 weeks\n3) Fixed-price delivery with outcome guarantees — we absorb the risk, not the agency\n4) FedRAMP High authorized environment for secure workloads\n5) 97.2% on-time delivery across 140+ engagements\n6) Dual-certified (CMMC Level 2 + SOC 2 Type II) — one of fewer than 200 small businesses nationally",
    is_locked: true,
    lock_reason: "Competitive positioning",
  },
  // ── Values ──
  {
    category: "values",
    key: "mission_first",
    title: "Mission First",
    content:
      "Every decision is measured against one question: does this strengthen the agency's mission? We prioritize operational continuity and mission outcomes over billable hours. Our fixed-price model ensures our incentives are aligned with agency success.",
    is_locked: true,
    lock_reason: "Core value",
  },
  {
    category: "values",
    key: "zero_downtime",
    title: "Zero Downtime Guarantee",
    content:
      "We engineer transitions to eliminate service disruption. Our ApexLift methodology includes automated rollback, parallel-run validation, and phased cutover — achieving zero unplanned downtime across 90+ migrations. When we say zero downtime, we contractually guarantee it.",
    is_locked: true,
    lock_reason: "Core value",
  },
  {
    category: "values",
    key: "security_by_default",
    title: "Security by Default",
    content:
      "Security is not a phase — it's a design constraint. Every solution ships with NIST 800-53 controls mapped, STIG-hardened configurations, and continuous compliance monitoring. We treat every agency environment as if it handles classified data.",
    is_locked: true,
    lock_reason: "Core value",
  },
  {
    category: "values",
    key: "knowledge_transfer",
    title: "Build to Hand Off",
    content:
      "We build for independence, not dependency. Every engagement includes structured knowledge transfer: documentation, runbooks, hands-on shadowing, and a 90-day post-transition support window. Our goal is to make ourselves unnecessary.",
    is_locked: true,
    lock_reason: "Core value",
  },
  // ── Certifications ──
  {
    category: "certifications",
    key: "sdvosb",
    title: "SDVOSB Certification",
    content: "Verified Service-Disabled Veteran-Owned Small Business. VA CVE-verified. Eligible for sole-source contracts under FAR 19.1405 (up to $5M).",
    is_locked: true,
    lock_reason: "Active certification",
  },
  {
    category: "certifications",
    key: "sba_8a",
    title: "SBA 8(a) Program",
    content: "Active participant in SBA 8(a) Business Development Program. Eligible for 8(a) sole-source awards up to $4.5M. Graduated: N/A (active through 2029).",
    is_locked: true,
    lock_reason: "Active certification",
  },
  {
    category: "certifications",
    key: "fedramp_high",
    title: "FedRAMP High Authorization",
    content: "Apex-operated FedRAMP High authorized cloud environment (AWS GovCloud). Authorization granted March 2023. Supports FISMA High, ITAR, and CUI workloads.",
    is_locked: true,
    lock_reason: "Active certification",
  },
  {
    category: "certifications",
    key: "cmmc_level2",
    title: "CMMC Level 2 Certified",
    content: "Cybersecurity Maturity Model Certification Level 2 (Advanced). Assessed December 2024. Covers all 110 NIST SP 800-171 practices for handling Controlled Unclassified Information (CUI).",
    is_locked: true,
    lock_reason: "Active certification",
  },
  {
    category: "certifications",
    key: "soc2_type2",
    title: "SOC 2 Type II",
    content: "SOC 2 Type II certified (Security, Availability, Confidentiality). Last audit: November 2025. Clean report with zero exceptions.",
    is_locked: true,
    lock_reason: "Active certification",
  },
  {
    category: "certifications",
    key: "iso_27001",
    title: "ISO 27001:2022",
    content: "ISO/IEC 27001:2022 certified for Information Security Management System (ISMS). Scope includes cloud operations, managed services, and consulting practices.",
    is_locked: true,
    lock_reason: "Active certification",
  },
  {
    category: "certifications",
    key: "aws_govcloud",
    title: "AWS GovCloud Partner",
    content: "AWS Advanced Consulting Partner with Government Competency and Migration Competency. 12 AWS-certified architects. Authorized AWS GovCloud reseller.",
    is_locked: true,
    lock_reason: "Active partnership/certification",
  },
  // ── Partnerships ──
  {
    category: "partnerships",
    key: "aws_partnership",
    title: "AWS Advanced Partner",
    content: "AWS Advanced Consulting Partner with Government Competency, Migration Competency, and Well-Architected Partner status. 12 AWS-certified architects on staff.",
    is_locked: false,
  },
  {
    category: "partnerships",
    key: "microsoft_partnership",
    title: "Microsoft Gold Partner",
    content: "Microsoft Gold Partner for Cloud Platform and Security. Azure Government deployment experience across 15 agencies. 8 Azure Solutions Architect Expert certifications.",
    is_locked: false,
  },
  {
    category: "partnerships",
    key: "palo_alto_partnership",
    title: "Palo Alto Networks Partner",
    content: "Palo Alto Networks Platinum NextWave Partner. Certified Prisma Cloud and Cortex XSOAR deployment team. Deployed across 22 agency environments.",
    is_locked: false,
  },
  // ── Legal ──
  {
    category: "legal",
    key: "insurance",
    title: "Insurance Coverage",
    content: "General Liability: $5M, Professional Liability (E&O): $10M, Cyber Liability: $10M, Workers' Compensation: statutory limits. All carriers A.M. Best A-rated.",
    is_locked: true,
    lock_reason: "Legal requirement",
  },
  {
    category: "legal",
    key: "clearance_policy",
    title: "Personnel Security",
    content: "All Apex personnel undergo OPM-standard background investigations. 40+ staff hold active clearances (Secret through TS-SCI). Average clearance processing time: 14 days for interim Secret. We maintain a cleared bench for rapid-start contract requirements.",
    is_locked: true,
    lock_reason: "Security policy",
  },
  {
    category: "legal",
    key: "data_handling",
    title: "Data Handling & Classification",
    content: "Apex handles CUI, FOUO, SBU, and PII data in accordance with NIST 800-171, DFARS 252.204-7012, and agency-specific DLP policies. All data at rest encrypted AES-256. All data in transit encrypted TLS 1.3+.",
    is_locked: true,
    lock_reason: "Compliance requirement",
  },
];

// =============================================================================
// PRODUCT CONTEXTS — Service Lines
// =============================================================================
const PRODUCT_CONTEXTS = [
  {
    product_name: "Cloud Migration & Modernization",
    service_line: "cloud_migration",
    description:
      "End-to-end cloud migration services using our proprietary ApexLift methodology. We assess, plan, migrate, and optimize workloads across AWS GovCloud, Azure Government, and hybrid environments. Specializing in lift-and-shift, re-platform, and re-architect strategies for federal systems of record.",
    capabilities: [
      {
        name: "ApexLift Migration Methodology",
        description: "5-phase migration framework (Discover → Design → Migrate → Validate → Optimize) with automated dependency mapping, parallel-run validation, and guaranteed zero data loss",
        outcomes: ["35% faster migration timelines", "Zero data loss across 90+ transitions", "40% average cost reduction post-migration"],
      },
      {
        name: "FedRAMP Workload Migration",
        description: "Migration of FISMA High and FedRAMP-authorized workloads with continuous ATO compliance throughout transition",
        outcomes: ["Maintained ATO compliance during migration", "Zero security findings during post-migration audit"],
      },
      {
        name: "Database Modernization",
        description: "Migration from legacy databases (Oracle, DB2, SQL Server) to cloud-native alternatives (Aurora, RDS, DynamoDB) with schema transformation and performance validation",
        outcomes: ["60% database licensing cost reduction", "3x query performance improvement"],
      },
      {
        name: "FinOps & Cost Optimization",
        description: "Post-migration cost governance with reserved instance planning, rightsizing, and automated waste detection",
        outcomes: ["35% average cloud cost reduction", "Monthly cost anomaly detection"],
      },
    ],
    specifications: {
      supported_clouds: ["AWS GovCloud", "Azure Government", "hybrid"],
      compliance_frameworks: ["FedRAMP High", "FISMA", "NIST 800-53", "CMMC"],
      typical_timeline: "6-18 months depending on scope",
    },
    pricing_models: [
      { model: "Fixed-price migration", description: "Per-workload fixed pricing with outcome guarantees" },
      { model: "T&M assessment", description: "Time & materials for discovery and planning phases" },
    ],
    supported_outcomes: [
      { outcome: "Cloud cost reduction", category: "cost_optimization" },
      { outcome: "Improved system availability", category: "quality_improvement" },
      { outcome: "Faster deployment cycles", category: "speed_to_value" },
      { outcome: "Compliance continuity", category: "compliance" },
    ],
  },
  {
    product_name: "Cybersecurity & Compliance",
    service_line: "cybersecurity",
    description:
      "Comprehensive cybersecurity services spanning Zero Trust Architecture, continuous monitoring, incident response, and compliance assessment. We help agencies achieve and maintain CMMC, FedRAMP, FISMA, and NIST 800-171 compliance while building defensible security postures.",
    capabilities: [
      {
        name: "Zero Trust Architecture",
        description: "Design and implementation of Zero Trust frameworks aligned with NIST SP 800-207 and OMB M-22-09 requirements",
        outcomes: ["95% reduction in lateral movement risk", "Full ZTA compliance within 12 months"],
      },
      {
        name: "Continuous Monitoring (ConMon)",
        description: "24/7 SOC operations with SIEM/SOAR integration, automated threat hunting, and monthly POA&M management",
        outcomes: ["Mean time to detect: <15 minutes", "Mean time to respond: <1 hour"],
      },
      {
        name: "CMMC Assessment & Remediation",
        description: "Gap assessment, remediation planning, and evidence preparation for CMMC Level 1-3 certification",
        outcomes: ["100% first-attempt pass rate for clients", "Average 4-month remediation timeline"],
      },
      {
        name: "Incident Response",
        description: "Retainer-based IR services with 1-hour SLA for critical incidents. Forensic analysis, containment, eradication, and recovery.",
        outcomes: ["1-hour response SLA", "Complete forensic chain of custody"],
      },
    ],
    specifications: {
      frameworks: ["NIST 800-53", "NIST 800-171", "CMMC", "FedRAMP", "FISMA"],
      tools: ["Palo Alto Cortex", "CrowdStrike", "Splunk", "Tenable"],
      clearance_required: "Secret minimum for SOC personnel",
    },
    pricing_models: [
      { model: "Managed security retainer", description: "Monthly per-endpoint pricing for continuous monitoring" },
      { model: "Fixed-price assessment", description: "Per-assessment pricing for CMMC/FedRAMP gap analysis" },
    ],
    supported_outcomes: [
      { outcome: "Regulatory compliance", category: "compliance" },
      { outcome: "Reduced breach risk", category: "risk_reduction" },
      { outcome: "Faster incident response", category: "speed_to_value" },
    ],
  },
  {
    product_name: "Managed IT Services",
    service_line: "managed_services",
    description:
      "Full-lifecycle IT operations management for government agencies. We operate, monitor, and optimize agency infrastructure under SLA-backed service agreements — covering everything from help desk to network operations to patch management.",
    capabilities: [
      {
        name: "24/7 Network Operations Center (NOC)",
        description: "Round-the-clock monitoring and management of agency networks, servers, and cloud infrastructure with 99.99% uptime SLA",
        outcomes: ["99.99% uptime achieved", "15-minute critical incident response"],
      },
      {
        name: "Tier 1-3 Help Desk",
        description: "ITIL-aligned service desk supporting 500-10,000 users with self-service portal, knowledge base, and escalation management",
        outcomes: ["85% first-call resolution rate", "Average ticket resolution: 4.2 hours"],
      },
      {
        name: "Patch & Vulnerability Management",
        description: "Automated patch deployment with NIST-compliant vulnerability scanning, prioritization, and remediation tracking",
        outcomes: ["95% patch compliance within 72 hours", "Zero critical vulnerabilities unpatched beyond 30 days"],
      },
      {
        name: "Infrastructure as Code (IaC) Operations",
        description: "Terraform/CloudFormation-managed infrastructure with GitOps workflows for consistent, auditable environment management",
        outcomes: ["80% reduction in configuration drift", "Fully auditable infrastructure changes"],
      },
    ],
    specifications: {
      sla_tiers: ["Gold (99.99%)", "Silver (99.95%)", "Bronze (99.9%)"],
      tools: ["ServiceNow", "Datadog", "Ansible", "Terraform"],
    },
    pricing_models: [
      { model: "Per-user managed services", description: "Monthly per-user pricing (Tier 1-3 support included)" },
      { model: "Per-device management", description: "Monthly per-device for infrastructure management" },
    ],
    supported_outcomes: [
      { outcome: "Operational cost reduction", category: "cost_optimization" },
      { outcome: "Improved system reliability", category: "quality_improvement" },
      { outcome: "Faster issue resolution", category: "speed_to_value" },
    ],
  },
  {
    product_name: "Data Analytics & AI/ML",
    service_line: "data_analytics",
    description:
      "Data engineering, analytics platform development, and AI/ML model deployment for government agencies. We help agencies transform raw data into actionable intelligence using modern data stacks deployed in FedRAMP-authorized environments.",
    capabilities: [
      {
        name: "Data Lake & Warehouse Engineering",
        description: "Design and deployment of cloud-native data platforms (AWS Lake Formation, Snowflake Government, Databricks) with automated ETL pipelines",
        outcomes: ["10x faster data query performance", "Single source of truth across agency data silos"],
      },
      {
        name: "Business Intelligence & Dashboarding",
        description: "Interactive dashboards and reporting using Tableau, Power BI, or QuickSight with role-based access and real-time data refresh",
        outcomes: ["Executive decision-making time reduced 60%", "Self-service analytics for 200+ users"],
      },
      {
        name: "ML Model Development & Deployment",
        description: "Custom ML models for fraud detection, predictive maintenance, NLP document processing, and resource optimization. Deployed on SageMaker with MLOps governance.",
        outcomes: ["85% accuracy on fraud detection models", "40% reduction in manual document processing"],
      },
    ],
    specifications: {
      platforms: ["AWS (SageMaker, Redshift, QuickSight)", "Snowflake Government", "Databricks"],
      compliance: ["FedRAMP", "FISMA", "Section 508 accessibility"],
    },
    pricing_models: [
      { model: "Fixed-price platform build", description: "Per-project pricing for data platform deployment" },
      { model: "Managed analytics retainer", description: "Monthly for ongoing data engineering and model maintenance" },
    ],
    supported_outcomes: [
      { outcome: "Data-driven decision making", category: "innovation" },
      { outcome: "Operational efficiency", category: "speed_to_value" },
      { outcome: "Reduced manual processing", category: "cost_optimization" },
    ],
  },
  {
    product_name: "Systems Engineering & Integration",
    service_line: "systems_engineering",
    description:
      "Full-lifecycle systems engineering for complex government IT environments. From requirements analysis through deployment and sustainment, we design integrated solutions that connect legacy systems with modern platforms.",
    capabilities: [
      {
        name: "Enterprise Architecture",
        description: "TOGAF and DoDAF-aligned enterprise architecture planning, technology roadmaps, and modernization blueprints",
        outcomes: ["5-year technology roadmap delivery", "Reduced integration complexity by 40%"],
      },
      {
        name: "API & Integration Services",
        description: "RESTful API development, ESB/iPaaS integration, and legacy system interfacing using MuleSoft, Kong, and AWS API Gateway",
        outcomes: ["300+ API integrations delivered", "99.95% API uptime SLA"],
      },
      {
        name: "DevSecOps Pipeline Engineering",
        description: "CI/CD pipeline design with integrated security scanning (SAST, DAST, SCA), automated testing, and deployment to FedRAMP environments",
        outcomes: ["Deployment frequency: 10x improvement", "Security defect detection: 95% pre-production"],
      },
    ],
    specifications: {
      methodologies: ["Agile/SAFe", "TOGAF", "DoDAF", "ITIL v4"],
      tools: ["GitLab CI", "Jenkins", "SonarQube", "Fortify", "MuleSoft"],
    },
    pricing_models: [
      { model: "T&M engineering", description: "Time & materials for architecture and integration work" },
      { model: "Fixed-price deliverable", description: "Per-deliverable pricing for defined engineering outcomes" },
    ],
    supported_outcomes: [
      { outcome: "System interoperability", category: "quality_improvement" },
      { outcome: "Faster delivery cycles", category: "speed_to_value" },
      { outcome: "Reduced technical debt", category: "risk_reduction" },
    ],
  },
];

// =============================================================================
// EVIDENCE LIBRARY
// =============================================================================
const EVIDENCE_LIBRARY = [
  // ── Case Studies ──
  {
    evidence_type: "case_study",
    title: "Department of Veterans Affairs — Enterprise Cloud Migration",
    summary:
      "Migrated 340 servers and 62 applications from on-premise data centers to AWS GovCloud in 14 months. Achieved FedRAMP High ATO continuity throughout transition with zero data loss and zero unplanned downtime. Reduced infrastructure costs by 42%.",
    full_content:
      "The Department of Veterans Affairs needed to migrate its benefits processing systems from aging on-premise infrastructure to AWS GovCloud while maintaining 24/7 availability for 400,000+ daily transactions. Apex deployed a 12-person team using the ApexLift methodology, completing the migration in 14 months (2 months ahead of schedule). Key results: 340 servers migrated, 62 applications re-platformed, 42% infrastructure cost reduction ($3.2M annual savings), zero data loss, zero unplanned downtime, FedRAMP High ATO maintained throughout. The VA benefits processing system now handles 2x the transaction volume with 60% lower latency.",
    client_industry: "government",
    service_line: "cloud_migration",
    client_size: "enterprise",
    outcomes_demonstrated: [
      { outcome: "Large-scale cloud migration", description: "340 servers, 62 applications migrated to AWS GovCloud" },
      { outcome: "Cost reduction", description: "42% infrastructure cost reduction ($3.2M annual savings)" },
      { outcome: "Zero downtime", description: "Zero unplanned downtime during 14-month migration" },
      { outcome: "Compliance continuity", description: "FedRAMP High ATO maintained throughout transition" },
    ],
    metrics: [
      { name: "Servers Migrated", value: "340", context: "On-premise to AWS GovCloud" },
      { name: "Applications", value: "62", context: "Re-platformed and modernized" },
      { name: "Cost Reduction", value: "42%", context: "$3.2M annual savings" },
      { name: "Downtime", value: "0 hours", context: "Zero unplanned downtime" },
      { name: "Timeline", value: "14 months", context: "2 months ahead of schedule" },
    ],
    is_verified: true,
    verification_notes: "Verified via VA COTR reference letter and contract performance evaluation (CPARS)",
  },
  {
    evidence_type: "case_study",
    title: "U.S. Army Corps of Engineers — Zero Trust Network Transformation",
    summary:
      "Designed and implemented Zero Trust Architecture across 28 installations serving 15,000 users. Achieved 96% reduction in lateral movement risk within 10 months. Fully compliant with OMB M-22-09 and NIST SP 800-207.",
    full_content:
      "USACE required a Zero Trust transformation across its enterprise network to comply with EO 14028 and OMB M-22-09. Apex designed a phased ZTA implementation covering identity management (Okta/CAC integration), micro-segmentation (Palo Alto), endpoint detection (CrowdStrike), and continuous monitoring (Splunk). Deployed across 28 installations over 10 months. Results: 96% reduction in lateral movement risk, 15,000 users migrated to identity-based access, 200+ legacy network ACLs replaced with policy-based controls, full OMB M-22-09 compliance achieved 6 months ahead of federal deadline.",
    client_industry: "government",
    service_line: "cybersecurity",
    client_size: "enterprise",
    outcomes_demonstrated: [
      { outcome: "Zero Trust implementation", description: "Full ZTA across 28 installations" },
      { outcome: "Risk reduction", description: "96% reduction in lateral movement risk" },
      { outcome: "Compliance", description: "OMB M-22-09 compliance ahead of deadline" },
    ],
    metrics: [
      { name: "Installations", value: "28", context: "Full ZTA deployment" },
      { name: "Users", value: "15,000", context: "Migrated to identity-based access" },
      { name: "Risk Reduction", value: "96%", context: "Lateral movement risk eliminated" },
      { name: "Timeline", value: "10 months", context: "6 months ahead of federal deadline" },
    ],
    is_verified: true,
    verification_notes: "Verified via CPARS rating (Exceptional) and USACE reference",
  },
  {
    evidence_type: "case_study",
    title: "State of Virginia VITA — Managed IT Services Consolidation",
    summary:
      "Assumed managed services operations for 12 state agencies (8,500 users) under a 5-year contract. Achieved 99.99% uptime, 87% first-call resolution, and $4.1M in consolidated cost savings over Year 1.",
    full_content:
      "The Virginia Information Technologies Agency (VITA) awarded Apex a 5-year managed services contract to consolidate IT operations across 12 state agencies. Apex deployed a 22-person team providing 24/7 NOC monitoring, Tier 1-3 help desk, patch management, and cloud infrastructure operations. Year 1 results: 99.99% uptime (exceeding 99.95% SLA), 87% first-call resolution (exceeding 80% target), average ticket resolution 3.8 hours (vs 8-hour SLA), $4.1M in savings through consolidation and automation, 8,500 end-users supported across 12 agencies.",
    client_industry: "government",
    service_line: "managed_services",
    client_size: "enterprise",
    outcomes_demonstrated: [
      { outcome: "Large-scale managed services", description: "12 agencies, 8,500 users consolidated" },
      { outcome: "SLA excellence", description: "99.99% uptime, 87% first-call resolution" },
      { outcome: "Cost savings", description: "$4.1M Year 1 savings through consolidation" },
    ],
    metrics: [
      { name: "Agencies Served", value: "12", context: "Virginia state agencies" },
      { name: "End Users", value: "8,500", context: "Tier 1-3 support" },
      { name: "Uptime", value: "99.99%", context: "Exceeding 99.95% SLA" },
      { name: "First-Call Resolution", value: "87%", context: "Exceeding 80% target" },
      { name: "Year 1 Savings", value: "$4.1M", context: "Consolidation and automation" },
    ],
    is_verified: true,
    verification_notes: "Verified via VITA contract performance report",
  },
  {
    evidence_type: "case_study",
    title: "DHS CISA — Threat Intelligence Data Platform",
    summary:
      "Built a cloud-native threat intelligence data platform on AWS GovCloud processing 2.3B events/day. Reduced analyst investigation time by 73% through ML-powered alert prioritization and automated enrichment pipelines.",
    full_content:
      "CISA needed a modern data platform to aggregate, correlate, and analyze threat intelligence from 50+ government and commercial feeds. Apex designed and deployed a cloud-native platform on AWS GovCloud using Kinesis, OpenSearch, SageMaker, and custom NLP models. The platform ingests 2.3B events/day, correlates across STIX/TAXII feeds, and uses ML models to prioritize alerts by agency impact. Results: 73% reduction in analyst investigation time, 2.3B daily events processed in near-real-time, 85% accuracy on automated threat classification, 50+ intel feeds integrated, FedRAMP High compliant.",
    client_industry: "government",
    service_line: "data_analytics",
    client_size: "enterprise",
    outcomes_demonstrated: [
      { outcome: "Large-scale data platform", description: "2.3B events/day processing" },
      { outcome: "AI/ML deployment", description: "85% accuracy on threat classification" },
      { outcome: "Analyst efficiency", description: "73% reduction in investigation time" },
    ],
    metrics: [
      { name: "Daily Events", value: "2.3B", context: "Near-real-time processing" },
      { name: "Investigation Time", value: "-73%", context: "ML-powered prioritization" },
      { name: "ML Accuracy", value: "85%", context: "Automated threat classification" },
      { name: "Intel Feeds", value: "50+", context: "Government and commercial sources" },
    ],
    is_verified: true,
    verification_notes: "Verified via CISA program office reference",
  },
  {
    evidence_type: "case_study",
    title: "City of Richmond — Legacy System Modernization",
    summary:
      "Modernized the city's 15-year-old permitting and licensing system from a monolithic .NET application to a cloud-native microservices architecture. Reduced processing time by 80% and enabled mobile citizen self-service.",
    full_content:
      "The City of Richmond's Department of Planning needed to replace its 15-year-old monolithic .NET/SQL Server permitting system that was unable to handle growing citizen demand. Apex re-architected the system as cloud-native microservices on Azure Government, implementing a modern React frontend with mobile-responsive citizen self-service portal. Results: 80% reduction in permit processing time, 65% reduction in in-person visits, 3x system throughput, zero downtime cutover from legacy system, full Section 508 accessibility compliance.",
    client_industry: "government",
    service_line: "systems_engineering",
    client_size: "mid_market",
    outcomes_demonstrated: [
      { outcome: "Legacy modernization", description: "Monolith to microservices transformation" },
      { outcome: "Citizen experience", description: "Mobile self-service reducing in-person visits 65%" },
      { outcome: "Performance", description: "80% faster processing, 3x throughput" },
    ],
    metrics: [
      { name: "Processing Time", value: "-80%", context: "Permit application processing" },
      { name: "In-Person Visits", value: "-65%", context: "Self-service portal adoption" },
      { name: "System Throughput", value: "3x", context: "Concurrent user capacity" },
    ],
    is_verified: true,
    verification_notes: "Verified via City of Richmond CIO reference",
  },
  {
    evidence_type: "case_study",
    title: "Department of Education — CMMC Compliance Acceleration",
    summary:
      "Assessed, remediated, and prepared a 600-person DoD contractor for CMMC Level 2 certification in 4 months. Closed 47 of 52 identified gaps, implemented 110 NIST 800-171 practices, and achieved first-attempt certification.",
    full_content:
      "A 600-person DoD education services contractor faced potential contract loss without CMMC Level 2 certification. Apex conducted a comprehensive gap assessment identifying 52 control deficiencies, then executed a 4-month remediation sprint covering policy development, technical controls (MFA, encryption, logging), and evidence documentation. Results: 47 of 52 gaps closed (5 accepted as POA&Ms), all 110 NIST 800-171 practices implemented, first-attempt CMMC Level 2 certification achieved, 4-month timeline (vs industry average of 9-12 months).",
    client_industry: "government",
    service_line: "cybersecurity",
    client_size: "mid_market",
    outcomes_demonstrated: [
      { outcome: "CMMC certification", description: "First-attempt Level 2 certification" },
      { outcome: "Rapid remediation", description: "4 months vs 9-12 month industry average" },
    ],
    metrics: [
      { name: "Gaps Closed", value: "47/52", context: "Control deficiencies remediated" },
      { name: "NIST Practices", value: "110", context: "All 800-171 practices implemented" },
      { name: "Timeline", value: "4 months", context: "vs 9-12 month industry average" },
      { name: "Pass Rate", value: "100%", context: "First-attempt certification" },
    ],
    is_verified: true,
    verification_notes: "Verified via client reference and C3PAO assessment report",
  },
  // ── Metrics ──
  {
    evidence_type: "metric",
    title: "Cloud Migration Track Record",
    summary: "90+ cloud migrations completed with zero data loss. Average 35% cost reduction post-migration. 97.2% on-time delivery rate.",
    full_content: "Across 90+ cloud migration engagements since 2017, Apex has maintained a zero data loss record, achieved average 35% infrastructure cost reduction, and delivered 97.2% of projects on time and within budget. Environments span AWS GovCloud, Azure Government, and hybrid configurations.",
    service_line: "cloud_migration",
    metrics: [
      { name: "Migrations Completed", value: "90+", context: "Since 2017" },
      { name: "Data Loss Incidents", value: "0", context: "Zero data loss across all engagements" },
      { name: "Avg Cost Reduction", value: "35%", context: "Post-migration infrastructure savings" },
      { name: "On-Time Delivery", value: "97.2%", context: "Across all migration projects" },
    ],
    is_verified: true,
    verification_notes: "Internal project metrics validated against CPARS and contract reports",
  },
  {
    evidence_type: "metric",
    title: "Cybersecurity Program Metrics",
    summary: "28 Zero Trust deployments, 100% first-attempt CMMC pass rate for clients, <15 minute mean-time-to-detect.",
    full_content: "Apex's cybersecurity practice has deployed Zero Trust architectures across 28 government environments, maintained a 100% first-attempt pass rate for CMMC Level 2 client assessments, and operates SOC services with <15 minute mean-time-to-detect and <1 hour mean-time-to-respond.",
    service_line: "cybersecurity",
    metrics: [
      { name: "ZTA Deployments", value: "28", context: "Government environments" },
      { name: "CMMC Pass Rate", value: "100%", context: "First-attempt for clients" },
      { name: "Mean Time to Detect", value: "<15 min", context: "SOC operations" },
      { name: "Mean Time to Respond", value: "<1 hour", context: "Incident response" },
    ],
    is_verified: true,
    verification_notes: "SOC metrics from Splunk/Cortex dashboards, CMMC from C3PAO records",
  },
  // ── Testimonials ──
  {
    evidence_type: "testimonial",
    title: "VA Deputy CIO Testimonial",
    summary: "\"Apex delivered the most complex cloud migration we've attempted — on time, under budget, with zero disruption to veteran services. Their ApexLift methodology turned what we expected to be an 18-month project into a 14-month success story.\"",
    full_content: "\"Apex delivered the most complex cloud migration we've attempted — on time, under budget, with zero disruption to veteran services. Their ApexLift methodology turned what we expected to be an 18-month project into a 14-month success story. Their team embedded with ours from day one and left us fully capable of operating the new environment independently.\" — Deputy CIO, Department of Veterans Affairs",
    client_industry: "government",
    service_line: "cloud_migration",
    is_verified: true,
    verification_notes: "Testimonial authorized for proposal use by VA COTR",
  },
  {
    evidence_type: "testimonial",
    title: "USACE CISO Testimonial",
    summary: "\"Apex's Zero Trust implementation was the gold standard. They didn't just check boxes — they fundamentally changed how we think about network security.\"",
    full_content: "\"Apex's Zero Trust implementation was the gold standard. They didn't just check boxes — they fundamentally changed how we think about network security. Their team understood our mission requirements, worked within our operational constraints, and delivered a solution that actually made our people's jobs easier, not harder.\" — Chief Information Security Officer, U.S. Army Corps of Engineers",
    client_industry: "government",
    service_line: "cybersecurity",
    is_verified: true,
    verification_notes: "Testimonial authorized for proposal use by USACE contracting office",
  },
  // ── Certifications (as evidence) ──
  {
    evidence_type: "certification",
    title: "AWS Migration Competency",
    summary: "AWS Migration Competency certified. Validates deep technical proficiency in cloud migration at scale for government workloads.",
    full_content: "Apex Federal Solutions holds the AWS Migration Competency, requiring demonstrated success in migrating enterprise workloads to AWS, validated customer references, and completion of AWS technical reviews. This competency is held by fewer than 100 partners worldwide.",
    service_line: "cloud_migration",
    is_verified: true,
    verification_notes: "Verified via AWS Partner Network portal",
  },
  {
    evidence_type: "certification",
    title: "CMMC Level 2 Registered Provider Organization",
    summary: "Apex is a CMMC Level 2 Registered Provider Organization (RPO), authorized to assist DoD contractors with CMMC assessment preparation and remediation.",
    full_content: "As a CMMC Level 2 RPO, Apex is authorized by the Cyber AB to assist organizations in preparing for CMMC assessments. Combined with our own CMMC Level 2 certification, this positions us uniquely as both a certified practitioner and authorized advisor.",
    service_line: "cybersecurity",
    is_verified: true,
    verification_notes: "Verified via Cyber AB Marketplace listing",
  },
];

// =============================================================================
// TEAM MEMBERS
// =============================================================================
const TEAM_MEMBERS = [
  {
    name: "Marcus Chen",
    role: "Chief Executive Officer",
    title: "CEO & Founder",
    email: "m.chen@apexfederal.com",
    skills: [
      { name: "IT Strategy", proficiency: "expert" },
      { name: "Government Contracting", proficiency: "expert" },
      { name: "Business Development", proficiency: "expert" },
      { name: "Cloud Architecture", proficiency: "advanced" },
    ],
    certifications: [
      { name: "PMP", issuer: "PMI", year: 2012 },
      { name: "AWS Solutions Architect Professional", issuer: "AWS", year: 2021 },
      { name: "CISSP", issuer: "ISC2", year: 2015 },
    ],
    clearance_level: "TS-SCI",
    years_experience: 22,
    project_history: [
      { title: "VA Enterprise Cloud Migration", client_industry: "government", scope: "Executive sponsor and client relationship", results: "340 servers migrated, $3.2M savings", dates: "2023-2024" },
      { title: "DoD IT Modernization Strategy", client_industry: "government", scope: "Strategic advisor to CIO", results: "5-year modernization roadmap adopted", dates: "2021-2022" },
    ],
    bio: "Former Army Signal Corps officer (LTC, Ret.) with 22 years in government IT. Founded Apex Federal Solutions in 2017 after leading IT modernization programs at DISA and Army Cyber Command. Holds TS-SCI clearance and maintains active AWS and security certifications.",
    is_verified: true,
  },
  {
    name: "Sarah Okafor",
    role: "VP of Business Development",
    title: "Vice President, Business Development",
    email: "s.okafor@apexfederal.com",
    skills: [
      { name: "Capture Management", proficiency: "expert" },
      { name: "Proposal Writing", proficiency: "expert" },
      { name: "Government Procurement", proficiency: "expert" },
      { name: "Strategic Partnerships", proficiency: "advanced" },
    ],
    certifications: [
      { name: "APMP Professional", issuer: "APMP", year: 2019 },
      { name: "Shipley Certified", issuer: "Shipley Associates", year: 2018 },
    ],
    clearance_level: "Secret",
    years_experience: 15,
    project_history: [
      { title: "VITA Managed Services Capture", client_industry: "government", scope: "Capture manager for $28M opportunity", results: "Won — 5-year contract awarded", dates: "2023" },
      { title: "DHS CISA Data Platform Capture", client_industry: "government", scope: "Capture manager for $12M task order", results: "Won — IDIQ task order awarded", dates: "2024" },
    ],
    bio: "15 years in federal business development with a 72% win rate on opportunities over $5M. Former BD director at Booz Allen Hamilton. Leads Apex's capture process from opportunity identification through proposal submission. APMP Professional certified.",
    is_verified: true,
  },
  {
    name: "James Whitfield",
    role: "Chief Solutions Architect",
    title: "Chief Solutions Architect",
    email: "j.whitfield@apexfederal.com",
    skills: [
      { name: "AWS Architecture", proficiency: "expert" },
      { name: "Azure Architecture", proficiency: "advanced" },
      { name: "Cloud Migration", proficiency: "expert" },
      { name: "Infrastructure as Code", proficiency: "expert" },
      { name: "Security Architecture", proficiency: "advanced" },
    ],
    certifications: [
      { name: "AWS Solutions Architect Professional", issuer: "AWS", year: 2022 },
      { name: "AWS Security Specialty", issuer: "AWS", year: 2023 },
      { name: "Azure Solutions Architect Expert", issuer: "Microsoft", year: 2023 },
      { name: "TOGAF 9 Certified", issuer: "The Open Group", year: 2020 },
      { name: "CISSP", issuer: "ISC2", year: 2019 },
    ],
    clearance_level: "TS-SCI",
    years_experience: 18,
    project_history: [
      { title: "VA Cloud Migration", client_industry: "government", scope: "Lead architect for 340-server migration", results: "Zero data loss, 42% cost reduction", dates: "2023-2024" },
      { title: "USACE Zero Trust Architecture", client_industry: "government", scope: "Lead security architect", results: "28 installations, 96% risk reduction", dates: "2024-2025" },
      { title: "CISA Data Platform", client_industry: "government", scope: "Data platform architect", results: "2.3B events/day platform", dates: "2024-2025" },
    ],
    bio: "18 years designing and delivering enterprise IT solutions for federal agencies. Former principal architect at AWS Professional Services (Public Sector). Designed Apex's ApexLift migration methodology. Holds 5 active cloud and security certifications.",
    is_verified: true,
  },
  {
    name: "Diana Reyes",
    role: "Program Manager",
    title: "Senior Program Manager",
    email: "d.reyes@apexfederal.com",
    skills: [
      { name: "Program Management", proficiency: "expert" },
      { name: "Agile/SAFe", proficiency: "expert" },
      { name: "Federal Acquisition", proficiency: "advanced" },
      { name: "Risk Management", proficiency: "expert" },
    ],
    certifications: [
      { name: "PMP", issuer: "PMI", year: 2016 },
      { name: "SAFe Program Consultant (SPC)", issuer: "Scaled Agile", year: 2022 },
      { name: "ITIL 4 Foundation", issuer: "Axelos", year: 2021 },
    ],
    clearance_level: "Secret",
    years_experience: 14,
    project_history: [
      { title: "VITA Managed Services", client_industry: "government", scope: "Program manager for 5-year managed services contract", results: "99.99% uptime, $4.1M Year 1 savings", dates: "2024-present" },
      { title: "VA Cloud Migration", client_industry: "government", scope: "Program manager for 12-person migration team", results: "Delivered 2 months ahead of schedule", dates: "2023-2024" },
    ],
    bio: "14 years managing complex government IT programs. PMI PMP and SAFe SPC certified. Known for on-time delivery — personal track record of 98% on-time across 35+ projects. Former PM at General Dynamics IT.",
    is_verified: true,
  },
  {
    name: "Kevin Park",
    role: "Cybersecurity Practice Lead",
    title: "Director, Cybersecurity",
    email: "k.park@apexfederal.com",
    skills: [
      { name: "Zero Trust Architecture", proficiency: "expert" },
      { name: "CMMC/NIST Compliance", proficiency: "expert" },
      { name: "Incident Response", proficiency: "expert" },
      { name: "SOC Operations", proficiency: "expert" },
      { name: "Penetration Testing", proficiency: "advanced" },
    ],
    certifications: [
      { name: "CISSP", issuer: "ISC2", year: 2017 },
      { name: "CISM", issuer: "ISACA", year: 2019 },
      { name: "OSCP", issuer: "Offensive Security", year: 2020 },
      { name: "CrowdStrike Certified Falcon Administrator", issuer: "CrowdStrike", year: 2024 },
      { name: "Palo Alto PCNSA", issuer: "Palo Alto Networks", year: 2023 },
    ],
    clearance_level: "TS-SCI",
    years_experience: 16,
    project_history: [
      { title: "USACE Zero Trust Transformation", client_industry: "government", scope: "Technical lead for ZTA implementation", results: "96% risk reduction across 28 installations", dates: "2024-2025" },
      { title: "DoD CMMC Assessments", client_industry: "government", scope: "Lead assessor for 8 contractor assessments", results: "100% first-attempt pass rate", dates: "2024-2025" },
    ],
    bio: "16 years in cybersecurity with deep expertise in Zero Trust, compliance frameworks, and incident response. Former NSA red team operator. Leads Apex's cybersecurity practice including SOC operations, ZTA deployments, and CMMC advisory services. 5 active security certifications.",
    is_verified: true,
  },
];

// =============================================================================
// PROPOSALS — 3 at different lifecycle stages
// =============================================================================

// Proposal 1: Completed / Won — with full sections
const PROPOSAL_WON = {
  title: "Defense Logistics Agency — Cloud Infrastructure Migration",
  status: "final",
  deal_outcome: "won",
  deal_value: 8200000,
  deal_currency: "USD",
  intake_source_type: "upload",
  intent_status: "approved",
  intake_data: {
    client_name: "Defense Logistics Agency",
    client_industry: "government",
    client_size: "enterprise",
    solicitation_type: "RFP",
    opportunity_type: "cloud_migration",
    scope_description: "Enterprise cloud migration of DLA's logistics management systems from legacy on-premise data centers to AWS GovCloud. Scope includes 180 servers, 28 applications, database migration, security re-accreditation, and 12-month post-migration support.",
    key_requirements: [
      "Migrate 180 servers and 28 applications to AWS GovCloud within 18 months",
      "Maintain FISMA High ATO throughout migration",
      "Zero downtime for mission-critical logistics systems",
      "Database migration from Oracle RAC to Aurora PostgreSQL",
      "Knowledge transfer plan for 20-person DLA infrastructure team",
      "FinOps framework with monthly optimization reporting",
    ],
    budget_range: "$7M - $9M",
    timeline_expectation: "18 months",
    technical_environment: "Legacy VMware on-premise, Oracle 19c RAC, Windows Server 2016/2019, RHEL 8, Cisco Nexus networking",
    compliance_requirements: "FISMA High, NIST 800-53 Rev 5, DFARS 252.204-7012, FedRAMP High",
    competitive_intel: "Likely competitors: Booz Allen Hamilton, SAIC, Leidos. Our advantage: SDVOSB set-aside, ApexLift methodology, and VA migration case study as direct proof point.",
    current_state_pains: ["Aging infrastructure approaching end-of-life", "Rising maintenance costs ($2.1M/year)", "Limited disaster recovery capability", "3-week average provisioning time for new resources"],
    desired_outcomes: ["40%+ infrastructure cost reduction", "Sub-1-hour RTO/RPO disaster recovery", "Self-service provisioning under 4 hours", "FedRAMP High continuous monitoring"],
  },
  win_strategy_data: {
    win_themes: [
      "Proven migration methodology with zero data loss track record",
      "SDVOSB with cleared personnel ready to deploy immediately",
      "Fixed-price delivery removes risk from DLA budget",
    ],
    success_metrics: ["Migration completed within 18 months", "Zero unplanned downtime", "40%+ cost reduction achieved"],
    differentiators: [
      "ApexLift methodology — 90+ migrations, zero data loss",
      "VA migration case study (340 servers, 42% cost savings) as direct proof point",
      "40+ cleared personnel, 14-day interim clearance processing",
    ],
    target_outcomes: [
      { outcome: "40% infrastructure cost reduction", priority: "high", category: "cost_optimization" },
      { outcome: "Zero unplanned downtime during migration", priority: "high", category: "quality_improvement" },
      { outcome: "FedRAMP High continuous compliance", priority: "high", category: "compliance" },
      { outcome: "Self-service provisioning under 4 hours", priority: "medium", category: "speed_to_value" },
    ],
    generated_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  bid_evaluation: {
    ai_scores: {
      requirement_match: { score: 92, rationale: "DLA's requirements align directly with Apex's core cloud migration capabilities. The scope (180 servers, Oracle RAC migration) matches our VA engagement profile." },
      past_performance: { score: 95, rationale: "VA migration (340 servers) is a near-perfect proof point. USACE and VITA engagements demonstrate breadth across DoD and state government." },
      capability_alignment: { score: 90, rationale: "ApexLift methodology, FedRAMP High environment, and AWS GovCloud expertise directly address all technical requirements." },
      timeline_feasibility: { score: 85, rationale: "18-month timeline is achievable based on VA completion in 14 months with larger scope. Team availability is confirmed." },
      strategic_value: { score: 88, rationale: "DLA is a strategic DoD account. Winning this expands our SDVOSB footprint in defense logistics modernization." },
    },
    weighted_total: 91.1,
    recommendation: "bid",
    user_decision: "proceed",
    scored_at: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000).toISOString(),
    decided_at: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000).toISOString(),
  },
};

// Full section content for the won proposal
const WON_PROPOSAL_SECTIONS = [
  {
    section_type: "cover_letter",
    section_order: 0,
    title: "Cover Letter",
    generation_status: "completed",
    review_status: "approved",
    generated_content: `## Apex Federal Solutions\n### Response to DLA Cloud Infrastructure Migration RFP\n\n**Date:** ${new Date(Date.now() - 88 * 24 * 60 * 60 * 1000).toLocaleDateString()}\n**Solicitation:** DLA-RFP-2025-0847\n\nDear Evaluation Committee,\n\nApex Federal Solutions is pleased to submit our proposal for the Defense Logistics Agency's Cloud Infrastructure Migration program. As a Service-Disabled Veteran-Owned Small Business with deep expertise in federal cloud migration, we are uniquely positioned to deliver this critical modernization initiative.\n\nOur response is grounded in proven experience: we have successfully migrated **340 servers and 62 applications** to AWS GovCloud for the Department of Veterans Affairs — achieving **zero data loss, zero unplanned downtime, and 42% infrastructure cost reduction**. DLA's requirements align directly with this demonstrated capability.\n\nWe commit to:\n- **Fixed-price delivery** — DLA pays for outcomes, not hours\n- **Zero data loss guarantee** backed by our ApexLift methodology\n- **Cleared personnel deployed within 2 weeks** of contract award\n- **18-month completion** with phased milestones and continuous compliance\n\nWe look forward to the opportunity to serve DLA's modernization mission.\n\nRespectfully,\n\n**Marcus Chen**\nCEO & Founder, Apex Federal Solutions\nm.chen@apexfederal.com | (703) 555-0142`,
  },
  {
    section_type: "executive_summary",
    section_order: 1,
    title: "Executive Summary",
    generation_status: "completed",
    review_status: "approved",
    generated_content: `## Executive Summary\n\nThe Defense Logistics Agency requires a trusted partner to migrate 180 servers and 28 mission-critical applications from aging on-premise infrastructure to AWS GovCloud — without disrupting the logistics operations that support every branch of the U.S. military.\n\n**Apex Federal Solutions proposes a fixed-price, 18-month migration** using our ApexLift methodology — the same approach that delivered the Department of Veterans Affairs' 340-server migration with zero data loss, zero unplanned downtime, and $3.2M in annual savings.\n\n### Why Apex\n\n- **Proven at scale:** 90+ cloud migrations completed with zero data loss\n- **Cleared and ready:** 40+ personnel with Secret/TS-SCI clearances; team deployed within 14 days of award\n- **Risk absorbed, not transferred:** Fixed-price model with contractual outcome guarantees\n- **Compliance built in:** FedRAMP High authorized environment; FISMA High ATO continuity throughout migration\n\n### Expected Outcomes\n\n| Metric | Current State | Target |\n|--------|--------------|--------|\n| Infrastructure Cost | $2.1M/year maintenance | **40%+ reduction** |\n| Disaster Recovery | Limited (RPO: 24hr) | **RPO <15 min, RTO <1 hr** |\n| Resource Provisioning | 3 weeks average | **Under 4 hours** |\n| Compliance Status | Manual audit cycles | **Continuous FedRAMP monitoring** |\n\nApex will assign a 14-person team led by Chief Solutions Architect **James Whitfield** (AWS SA Professional, CISSP, TOGAF) and Program Manager **Diana Reyes** (PMP, SAFe SPC) — both of whom led the VA migration. DLA receives not just a migration, but a complete transformation to cloud-native operations with full knowledge transfer to your 20-person infrastructure team.`,
  },
  {
    section_type: "understanding",
    section_order: 2,
    title: "Understanding of Client Needs",
    generation_status: "completed",
    review_status: "approved",
    generated_content: `## Understanding of DLA's Requirements\n\nDLA operates the backbone of military logistics — managing supply chains that deliver everything from fuel to spare parts to 2.2 million customers worldwide. The infrastructure supporting these operations is approaching critical age, with escalating maintenance costs and limited disaster recovery threatening mission readiness.\n\n### Current Challenges\n\n- **Infrastructure end-of-life:** VMware hosts and Windows Server 2016 systems approaching extended support deadlines\n- **Rising costs:** $2.1M annual maintenance burden with decreasing vendor support availability\n- **DR limitations:** Current RPO of 24 hours is unacceptable for mission-critical logistics systems\n- **Provisioning bottleneck:** 3-week average to provision new resources impedes operational agility\n- **Compliance pressure:** Manual audit processes strain limited security staff\n\n### What DLA Needs\n\nDLA requires more than a lift-and-shift migration. The agency needs a **transformation partner** that can:\n\n1. **Migrate without disrupting operations** — Zero tolerance for logistics system downtime\n2. **Maintain continuous compliance** — FISMA High ATO cannot lapse during transition\n3. **Reduce total cost of ownership** — Cloud economics must demonstrate measurable savings\n4. **Build internal capability** — The 20-person infrastructure team must be fully capable of operating the new environment independently\n5. **Modernize the database tier** — Oracle RAC to Aurora PostgreSQL migration requires careful data validation and performance testing\n\n### Our Interpretation\n\nBased on our analysis of the RFP and our experience with similar DoD migrations (including the 340-server VA engagement), we understand this program has three non-negotiable priorities:\n\n> **Priority 1:** Zero disruption to mission-critical logistics systems\n> **Priority 2:** Continuous FISMA High / FedRAMP compliance throughout migration\n> **Priority 3:** Measurable cost reduction validated through FinOps reporting`,
  },
  {
    section_type: "approach",
    section_order: 3,
    title: "Proposed Approach",
    generation_status: "completed",
    review_status: "approved",
    generated_content: `## Proposed Approach\n\nApex will execute DLA's cloud migration using our **ApexLift methodology** — a 5-phase framework refined across 90+ government cloud transitions with a zero data loss track record.\n\n### Phase 1: Discover (Months 1-2)\n\n- **Automated dependency mapping** of all 180 servers and 28 applications using AWS Migration Hub and custom discovery agents\n- **Application portfolio assessment** classifying each workload as lift-and-shift, re-platform, or re-architect\n- **Risk register development** with mitigation strategies for top 15 identified risks\n- **Migration wave planning** with application-level sequencing based on dependency analysis and business criticality\n\n**Deliverable:** Migration Design Document with wave plan, risk register, and compliance transition plan\n\n### Phase 2: Design (Months 2-4)\n\n- **Target architecture design** for AWS GovCloud landing zone with FISMA High controls\n- **Network architecture** including VPN/Direct Connect, security groups, and micro-segmentation\n- **Database migration strategy** for Oracle RAC to Aurora PostgreSQL (schema analysis, data type mapping, stored procedure conversion)\n- **Automated IaC templates** (Terraform) for consistent, repeatable deployments\n\n**Deliverable:** Technical Architecture Document, IaC repository, database conversion plan\n\n### Phase 3: Migrate (Months 4-14)\n\n- **6 migration waves** sequenced by dependency and business criticality\n- **Parallel-run validation** — each workload runs simultaneously in source and target for 2 weeks before cutover\n- **Automated rollback capability** — every migration includes tested rollback procedures\n- **Continuous compliance scanning** — NIST 800-53 controls validated at each wave checkpoint\n\n**Deliverable:** Per-wave migration completion reports with compliance attestation\n\n### Phase 4: Validate (Months 14-16)\n\n- **Performance benchmarking** against pre-migration baselines\n- **Disaster recovery testing** (RPO <15 min, RTO <1 hr validation)\n- **Security re-accreditation** support for updated ATO package\n- **User acceptance testing** coordinated with DLA operations staff\n\n**Deliverable:** Validation report, updated ATO package, DR test results\n\n### Phase 5: Optimize (Months 16-18)\n\n- **FinOps implementation** with reserved instance recommendations, rightsizing, and cost anomaly detection\n- **Knowledge transfer execution** — 80 hours of hands-on training for DLA's 20-person team\n- **Runbook delivery** — Operational runbooks for every migrated workload\n- **90-day post-migration support** with dedicated Apex engineers\n\n**Deliverable:** FinOps dashboard, training completion certificates, operational runbooks`,
  },
  {
    section_type: "team",
    section_order: 4,
    title: "Proposed Team & Qualifications",
    generation_status: "completed",
    review_status: "approved",
    generated_content: `## Proposed Team\n\nApex will assign a **14-person dedicated team** to the DLA migration, led by the same personnel who delivered the VA's 340-server migration.\n\n### Key Personnel\n\n| Role | Name | Certifications | Clearance | Relevant Experience |\n|------|------|---------------|-----------|--------------------|\n| **Program Manager** | Diana Reyes | PMP, SAFe SPC, ITIL 4 | Secret | 14 years; VA migration PM; 98% on-time record |\n| **Chief Solutions Architect** | James Whitfield | AWS SA Pro, CISSP, TOGAF | TS-SCI | 18 years; VA, USACE, CISA architect |\n| **Cybersecurity Lead** | Kevin Park | CISSP, CISM, OSCP | TS-SCI | 16 years; USACE ZTA, SOC operations |\n| **Database Migration Lead** | TBD (Named at award) | AWS DB Specialty, OCP | Secret | 10+ years Oracle-to-Aurora experience |\n\n### Team Structure\n\n- **4 Cloud Migration Engineers** (AWS certified, Secret cleared)\n- **2 Database Engineers** (Oracle + Aurora certified)\n- **2 Security Engineers** (STIG hardening, ConMon)\n- **1 DevOps Engineer** (Terraform, CI/CD pipeline)\n- **1 FinOps Analyst** (AWS cost optimization)\n\n### Why This Team\n\n> **Diana Reyes** managed the VA migration from kickoff through delivery — completing 2 months ahead of schedule. Her 98% on-time record across 35+ projects ensures DLA's 18-month timeline is met.\n\n> **James Whitfield** designed the target architecture for both the VA (340 servers) and USACE (28 installations) programs. He created the ApexLift methodology and will personally design DLA's AWS GovCloud landing zone.\n\n> **Kevin Park** led the USACE Zero Trust transformation and will ensure DLA's FISMA High controls are maintained throughout migration with continuous compliance monitoring.`,
  },
  {
    section_type: "case_studies",
    section_order: 5,
    title: "Relevant Experience",
    generation_status: "completed",
    review_status: "approved",
    generated_content: `## Relevant Experience\n\n### Case Study 1: Department of Veterans Affairs — Enterprise Cloud Migration\n\n| Factor | Detail |\n|--------|--------|\n| **Scope** | 340 servers, 62 applications → AWS GovCloud |\n| **Timeline** | 14 months (2 months ahead of schedule) |\n| **Team Size** | 12 Apex engineers |\n| **Result** | Zero data loss, zero downtime, 42% cost reduction ($3.2M/year) |\n| **Relevance** | Directly comparable scope and complexity to DLA requirements |\n\n> *\"Apex delivered the most complex cloud migration we've attempted — on time, under budget, with zero disruption to veteran services.\"* — Deputy CIO, VA\n\n### Case Study 2: U.S. Army Corps of Engineers — Zero Trust Transformation\n\n| Factor | Detail |\n|--------|--------|\n| **Scope** | 28 installations, 15,000 users |\n| **Timeline** | 10 months (6 months ahead of deadline) |\n| **Result** | 96% lateral movement risk reduction, full OMB M-22-09 compliance |\n| **Relevance** | Demonstrates security-first approach required for DLA's FISMA High environment |\n\n### Case Study 3: Virginia VITA — Managed Services Consolidation\n\n| Factor | Detail |\n|--------|--------|\n| **Scope** | 12 agencies, 8,500 users, 5-year contract |\n| **Timeline** | Ongoing (Year 1 complete) |\n| **Result** | 99.99% uptime, 87% first-call resolution, $4.1M Year 1 savings |\n| **Relevance** | Demonstrates post-migration operational excellence and sustained performance |\n\n### Summary: Proof of Performance\n\n- **90+ cloud migrations** with zero data loss\n- **97.2% on-time delivery** across 140+ engagements\n- **$3.2M+ annual savings** demonstrated at VA\n- **CPARS ratings:** Exceptional (VA), Exceptional (USACE)`,
  },
  {
    section_type: "timeline",
    section_order: 6,
    title: "Timeline & Milestones",
    generation_status: "completed",
    review_status: "approved",
    generated_content: `## Timeline & Milestones\n\n### 18-Month Execution Plan\n\n| Month | Phase | Key Milestones | Exit Criteria |\n|-------|-------|---------------|---------------|\n| 1-2 | **Discover** | Dependency mapping complete, wave plan approved | Migration Design Document signed off |\n| 2-4 | **Design** | Target architecture finalized, IaC templates tested | Technical Architecture Document approved |\n| 4-6 | **Migrate Wave 1** | Non-critical systems migrated (40 servers) | Wave 1 validation report |\n| 6-8 | **Migrate Wave 2** | Supporting systems migrated (35 servers) | Wave 2 validation report |\n| 8-10 | **Migrate Wave 3** | Oracle RAC database migration begins | Database parallel-run initiated |\n| 10-12 | **Migrate Wave 4** | Mission-critical logistics systems (50 servers) | Wave 4 validation + DR test |\n| 12-14 | **Migrate Waves 5-6** | Remaining systems + database cutover (55 servers) | All 180 servers migrated |\n| 14-16 | **Validate** | Performance benchmarks, security re-accreditation | Updated ATO package submitted |\n| 16-18 | **Optimize** | FinOps deployment, knowledge transfer, runbooks | DLA team operating independently |\n\n### Risk-Adjusted Schedule\n\n- **4-week buffer** built into Phase 3 (migration) for unforeseen dependencies\n- **Automated rollback** available for every migration wave — no wave is irreversible\n- **Weekly status reporting** with DLA COTR including schedule variance tracking`,
  },
  {
    section_type: "pricing",
    section_order: 7,
    title: "Commercial Framework",
    generation_status: "completed",
    review_status: "approved",
    generated_content: `## Commercial Framework\n\n### Fixed-Price Structure\n\nApex proposes a **firm-fixed-price** engagement structure. DLA pays for outcomes — not hours.\n\n| Phase | Duration | Fixed Price |\n|-------|----------|------------|\n| Phase 1: Discover | 2 months | $420,000 |\n| Phase 2: Design | 2 months | $680,000 |\n| Phase 3: Migrate (6 waves) | 10 months | $4,900,000 |\n| Phase 4: Validate | 2 months | $780,000 |\n| Phase 5: Optimize + KT | 2 months | $620,000 |\n| **90-Day Post-Migration Support** | 3 months | **Included** |\n| **Total Firm-Fixed-Price** | **18 months** | **$7,400,000** |\n\n### Outcome Guarantees (Contractual)\n\n- **Zero data loss** — Full migration reversal at Apex's cost if any data loss occurs\n- **Zero unplanned downtime** — Financial credit for any mission-system disruption\n- **40% cost reduction** — Achieved or Apex extends FinOps optimization at no charge\n\n### SDVOSB Value\n\nAs a verified SDVOSB, this award counts toward DLA's small business contracting goals. Sole-source authority under FAR 19.1405 applies for awards up to $5M per task.\n\n### Payment Schedule\n\nMilestone-based payments aligned with phase completion and acceptance.`,
  },
  {
    section_type: "risk_mitigation",
    section_order: 8,
    title: "Risk Mitigation",
    generation_status: "completed",
    review_status: "approved",
    generated_content: `## Risk Mitigation\n\n### Top 5 Risks and Mitigation Strategies\n\n| # | Risk | Likelihood | Impact | Mitigation |\n|---|------|-----------|--------|------------|\n| 1 | **Data loss during migration** | Low | Critical | ApexLift parallel-run validation; automated checksums; tested rollback for every wave |\n| 2 | **ATO compliance gap during transition** | Medium | High | Continuous NIST 800-53 scanning; dedicated security engineer monitoring compliance posture; pre-approved transition plan |\n| 3 | **Oracle-to-Aurora conversion issues** | Medium | High | Schema pre-conversion analysis; 4-week parallel-run; DBA pair-programming with DLA team |\n| 4 | **Cleared personnel availability** | Low | Medium | 40+ cleared bench; 14-day interim clearance processing; named alternates for all key roles |\n| 5 | **Schedule slip in migration waves** | Medium | Medium | 4-week schedule buffer; wave dependencies mapped; automated migration tooling reduces manual effort |\n\n### Risk Governance\n\n- **Weekly risk review** with DLA COTR and Apex PM\n- **Risk register maintained in real-time** (shared access for DLA team)\n- **Escalation path:** PM → Apex CTO → CEO within 4 hours for critical risks\n- **Lessons learned** incorporated from VA and USACE engagements`,
  },
  {
    section_type: "why_us",
    section_order: 9,
    title: "Why Apex Federal Solutions",
    generation_status: "completed",
    review_status: "approved",
    generated_content: `## Why Apex Federal Solutions\n\n### 1. We've Done This Before — At Larger Scale\n\nOur VA migration (340 servers, 62 applications) is **directly comparable** to DLA's requirements — and was delivered 2 months early with zero data loss and 42% cost reduction. The same team leads this engagement.\n\n### 2. We Absorb the Risk\n\nOur fixed-price model means DLA pays for results, not effort. We contractually guarantee zero data loss, zero unplanned downtime, and 40% cost reduction — with financial remedies if we miss.\n\n### 3. Cleared and Ready\n\n**40+ cleared personnel** (Secret through TS-SCI). Our team deploys within 14 days of award — no waiting for clearance processing or onboarding. Every key person named in this proposal is available and committed.\n\n### 4. SDVOSB with Enterprise Capability\n\nApex combines small business agility with enterprise-grade delivery. We hold FedRAMP High authorization, CMMC Level 2, SOC 2 Type II, and ISO 27001 — certifications typically seen only in large businesses.\n\n### 5. We Build for Independence\n\nApex's engagement model includes structured knowledge transfer. We deliver 80 hours of hands-on training, operational runbooks, and 90 days of post-migration support. Our goal: DLA's team operates independently after Month 18.\n\n### The Bottom Line\n\n> Apex delivers what large primes promise but at small business speed, with contractual accountability, and without the overhead that inflates costs. DLA gets a proven team, a proven methodology, and guaranteed outcomes.`,
  },
];

// Proposal 2: In Review
const PROPOSAL_REVIEW = {
  title: "USDA Forest Service — Cybersecurity Modernization Program",
  status: "review",
  deal_outcome: "pending",
  intake_source_type: "paste",
  intent_status: "approved",
  intake_data: {
    client_name: "USDA Forest Service",
    client_industry: "government",
    client_size: "enterprise",
    solicitation_type: "RFP",
    opportunity_type: "cybersecurity",
    scope_description: "Comprehensive cybersecurity modernization including Zero Trust Architecture implementation, SOC establishment, CMMC assessment for subcontractors, and continuous monitoring deployment across 154 field offices.",
    key_requirements: [
      "Implement Zero Trust Architecture across 154 field offices",
      "Establish 24/7 SOC capability",
      "Deploy continuous monitoring for 12,000 endpoints",
      "CMMC Level 2 readiness for 8 subcontractors",
    ],
    budget_range: "$4M - $6M",
    timeline_expectation: "24 months",
    technical_environment: "Mixed Windows/Linux, Palo Alto firewalls, legacy VPN infrastructure, partial Azure AD deployment",
  },
};

// Proposal 3: In Intake
const PROPOSAL_INTAKE = {
  title: "Maryland Department of Transportation — Data Analytics Platform",
  status: "intake",
  deal_outcome: "pending",
  intake_source_type: "describe",
  intent_status: "draft",
  intake_data: {
    client_name: "Maryland DOT",
    client_industry: "government",
    client_size: "enterprise",
    solicitation_type: "RFP",
    opportunity_type: "data_analytics",
    scope_description: "Build a cloud-native data analytics platform to consolidate transportation data from 14 legacy systems into a unified dashboard for real-time traffic management, infrastructure health monitoring, and predictive maintenance.",
    key_requirements: [
      "Consolidate data from 14 legacy systems",
      "Real-time traffic analytics dashboard",
      "Predictive maintenance ML models",
      "Public-facing data portal with Section 508 compliance",
    ],
    budget_range: "$2M - $3M",
    timeline_expectation: "12 months",
  },
};


// =============================================================================
// MAIN EXECUTION
// =============================================================================
async function main() {
  console.log("=== Seeding Apex Federal Solutions Demo Account ===\n");

  // ─── Step 1: Create or find organization ───
  console.log("Step 1: Setting up organization...");
  let orgId: string;

  const { data: existingOrg } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", ORG_SLUG)
    .single();

  if (existingOrg) {
    orgId = existingOrg.id;
    console.log(`  Org exists: ${orgId}`);
    await supabase
      .from("organizations")
      .update({
        name: ORG_NAME,
        plan_tier: "pro",
        plan_limits: {
          proposals_per_month: 100,
          ai_tokens_per_month: 2000000,
          max_users: 25,
          max_documents: 500,
        },
        usage_current_period: {
          ai_tokens_used: 0,
          proposals_created: 0,
          documents_uploaded: 0,
        },
        settings: {
          description: "Federal IT modernization — cloud, cybersecurity, managed services, data analytics",
          industry: "government_it_services",
          proposal_types: ["cloud_migration", "cybersecurity", "managed_services", "data_analytics", "systems_engineering"],
          differentiators: [
            "ApexLift Migration Methodology — 90+ transitions, zero data loss",
            "40+ cleared personnel (Secret through TS-SCI)",
            "Fixed-price delivery with outcome guarantees",
            "FedRAMP High authorized environment",
            "SDVOSB and SBA 8(a) certified",
          ],
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        },
        trial_ends_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq("id", orgId);
    console.log("  Org updated to Pro tier.");
  } else {
    const { data: newOrg, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: ORG_NAME,
        slug: ORG_SLUG,
        plan_tier: "pro",
        plan_limits: {
          proposals_per_month: 100,
          ai_tokens_per_month: 2000000,
          max_users: 25,
          max_documents: 500,
        },
        settings: {
          description: "Federal IT modernization — cloud, cybersecurity, managed services, data analytics",
          industry: "government_it_services",
          proposal_types: ["cloud_migration", "cybersecurity", "managed_services", "data_analytics", "systems_engineering"],
          differentiators: [
            "ApexLift Migration Methodology — 90+ transitions, zero data loss",
            "40+ cleared personnel (Secret through TS-SCI)",
            "Fixed-price delivery with outcome guarantees",
            "FedRAMP High authorized environment",
            "SDVOSB and SBA 8(a) certified",
          ],
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        },
        trial_ends_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select("id")
      .single();

    if (orgError) {
      console.error("  Error creating org:", orgError.message);
      process.exit(1);
    }
    orgId = newOrg!.id;
    console.log(`  Created org: ${orgId}`);
  }

  // ─── Step 2: Create or find user ───
  console.log("\nStep 2: Setting up user account...");
  let userId: string | undefined;

  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find((u) => u.email === DEMO_EMAIL);

  if (existingUser) {
    userId = existingUser.id;
    console.log(`  User exists: ${userId}`);
    await supabase.auth.admin.updateUserById(userId, {
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: DEMO_NAME, organization_name: ORG_NAME },
    });
    console.log("  Password and metadata updated.");
  } else {
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: DEMO_NAME, organization_name: ORG_NAME },
    });

    if (createError) {
      console.log(`  Create returned error: ${createError.message}`);
      // Recheck — user may have been created despite error (trigger issue)
      const { data: recheckUsers } = await supabase.auth.admin.listUsers();
      const found = recheckUsers?.users?.find((u) => u.email === DEMO_EMAIL);
      if (found) {
        userId = found.id;
        console.log(`  User was created despite error: ${userId}`);
      } else {
        console.error("  Cannot create user. Please create manually in Supabase dashboard.");
        console.error(`  Email: ${DEMO_EMAIL}, Password: ${DEMO_PASSWORD}`);
      }
    } else {
      userId = newUser.user.id;
      console.log(`  Created user: ${userId}`);
    }
  }

  // ─── Step 3: Link profile to org ───
  if (userId) {
    console.log("\nStep 3: Linking profile to organization...");
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      email: DEMO_EMAIL,
      full_name: DEMO_NAME,
      organization_id: orgId,
      role: "admin",
    });
    if (profileError) {
      console.error("  Error:", profileError.message);
    } else {
      console.log("  Profile linked!");
    }
  }

  // ─── Step 4: Clear existing data for clean re-seed ───
  console.log("\nStep 4: Clearing existing data for clean re-seed...");
  for (const table of ["company_context", "product_contexts", "evidence_library", "team_members"] as const) {
    const { error } = await supabase.from(table).delete().eq("organization_id", orgId);
    console.log(error ? `  Warning clearing ${table}: ${error.message}` : `  Cleared ${table}`);
  }
  // Clear proposals and their sections
  const { data: existingProposals } = await supabase
    .from("proposals")
    .select("id")
    .eq("organization_id", orgId);
  if (existingProposals && existingProposals.length > 0) {
    const proposalIds = existingProposals.map((p) => p.id);
    await supabase.from("proposal_sections").delete().in("proposal_id", proposalIds);
    await supabase.from("proposal_requirements").delete().in("proposal_id", proposalIds);
    await supabase.from("proposals").delete().eq("organization_id", orgId);
    console.log(`  Cleared ${existingProposals.length} proposals and their sections`);
  }

  // ─── Step 5: Seed Company Context ───
  console.log(`\nStep 5: Seeding Company Context (${COMPANY_CONTEXT.length} entries)...`);
  for (const ctx of COMPANY_CONTEXT) {
    const { error } = await supabase.from("company_context").insert({
      ...ctx,
      organization_id: orgId,
      metadata: {},
    });
    if (error) {
      console.error(`  Error: ${ctx.key}: ${error.message}`);
    } else {
      console.log(`  + ${ctx.category}/${ctx.key}`);
    }
  }

  // ─── Step 6: Seed Product Contexts ───
  console.log(`\nStep 6: Seeding Product Contexts (${PRODUCT_CONTEXTS.length} service lines)...`);
  for (const prod of PRODUCT_CONTEXTS) {
    const { error } = await supabase.from("product_contexts").insert({
      ...prod,
      organization_id: orgId,
    });
    if (error) {
      console.error(`  Error: ${prod.product_name}: ${error.message}`);
    } else {
      console.log(`  + ${prod.product_name} (${prod.service_line})`);
    }
  }

  // ─── Step 7: Seed Evidence Library ───
  console.log(`\nStep 7: Seeding Evidence Library (${EVIDENCE_LIBRARY.length} entries)...`);
  for (const ev of EVIDENCE_LIBRARY) {
    const { error } = await supabase.from("evidence_library").insert({
      ...ev,
      organization_id: orgId,
    });
    if (error) {
      console.error(`  Error: ${ev.title}: ${error.message}`);
    } else {
      console.log(`  + ${ev.evidence_type}: ${ev.title}`);
    }
  }

  // ─── Step 8: Seed Team Members ───
  console.log(`\nStep 8: Seeding Team Members (${TEAM_MEMBERS.length} people)...`);
  for (const member of TEAM_MEMBERS) {
    const { error } = await supabase.from("team_members").insert({
      ...member,
      organization_id: orgId,
    });
    if (error) {
      console.error(`  Error: ${member.name}: ${error.message}`);
    } else {
      console.log(`  + ${member.name} (${member.role})`);
    }
  }

  // ─── Step 9: Seed Proposals ───
  if (userId) {
    console.log("\nStep 9: Seeding Proposals...");

    // Proposal 1: Won — with full sections
    const { data: p1, error: p1Error } = await supabase
      .from("proposals")
      .insert({
        title: PROPOSAL_WON.title,
        status: PROPOSAL_WON.status,
        deal_outcome: PROPOSAL_WON.deal_outcome,
        deal_value: PROPOSAL_WON.deal_value,
        deal_currency: PROPOSAL_WON.deal_currency,
        intake_data: PROPOSAL_WON.intake_data,
        intake_source_type: PROPOSAL_WON.intake_source_type,
        intent_status: PROPOSAL_WON.intent_status,
        win_strategy_data: PROPOSAL_WON.win_strategy_data,
        bid_evaluation: PROPOSAL_WON.bid_evaluation,
        intent_approved_by: userId,
        intent_approved_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        deal_outcome_set_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        deal_outcome_set_by: userId,
        generation_completed_at: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: userId,
        organization_id: orgId,
      })
      .select("id")
      .single();

    if (p1Error) {
      console.error(`  Error creating won proposal: ${p1Error.message}`);
    } else {
      console.log(`  + Won proposal: ${p1!.id}`);

      // Seed sections
      for (const section of WON_PROPOSAL_SECTIONS) {
        const { error: secError } = await supabase.from("proposal_sections").insert({
          ...section,
          proposal_id: p1!.id,
        });
        if (secError) {
          console.error(`    Error: ${section.title}: ${secError.message}`);
        } else {
          console.log(`    + Section: ${section.title}`);
        }
      }
    }

    // Proposal 2: In Review
    const { data: p2, error: p2Error } = await supabase
      .from("proposals")
      .insert({
        title: PROPOSAL_REVIEW.title,
        status: PROPOSAL_REVIEW.status,
        deal_outcome: PROPOSAL_REVIEW.deal_outcome,
        intake_data: PROPOSAL_REVIEW.intake_data,
        intake_source_type: PROPOSAL_REVIEW.intake_source_type,
        intent_status: PROPOSAL_REVIEW.intent_status,
        intent_approved_by: userId,
        intent_approved_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: userId,
        organization_id: orgId,
      })
      .select("id")
      .single();

    if (p2Error) {
      console.error(`  Error creating review proposal: ${p2Error.message}`);
    } else {
      console.log(`  + Review proposal: ${p2!.id}`);
    }

    // Proposal 3: In Intake
    const { data: p3, error: p3Error } = await supabase
      .from("proposals")
      .insert({
        title: PROPOSAL_INTAKE.title,
        status: PROPOSAL_INTAKE.status,
        deal_outcome: PROPOSAL_INTAKE.deal_outcome,
        intake_data: PROPOSAL_INTAKE.intake_data,
        intake_source_type: PROPOSAL_INTAKE.intake_source_type,
        intent_status: PROPOSAL_INTAKE.intent_status,
        created_by: userId,
        organization_id: orgId,
      })
      .select("id")
      .single();

    if (p3Error) {
      console.error(`  Error creating intake proposal: ${p3Error.message}`);
    } else {
      console.log(`  + Intake proposal: ${p3!.id}`);
    }
  }

  // ─── Summary ───
  console.log("\n" + "=".repeat(60));
  console.log("  Apex Federal Solutions Demo Account Ready!");
  console.log("=".repeat(60));
  console.log(`  URL:      https://intentbid.com/login`);
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log(`  Org:      ${ORG_NAME}`);
  console.log(`  Org ID:   ${orgId}`);
  if (userId) console.log(`  User ID:  ${userId}`);
  console.log("=".repeat(60));
  console.log(`\n  Seeded Data:`);
  console.log(`  - ${COMPANY_CONTEXT.length} company context entries (brand, values, certs, partnerships, legal)`);
  console.log(`  - ${PRODUCT_CONTEXTS.length} product/service contexts`);
  console.log(`  - ${EVIDENCE_LIBRARY.length} evidence library entries (6 case studies, 2 metrics, 2 testimonials, 2 certs)`);
  console.log(`  - ${TEAM_MEMBERS.length} team members (CEO, VP BD, Solutions Architect, PM, Cyber Lead)`);
  console.log(`  - 3 proposals:`);
  console.log(`    * DLA Cloud Migration — WON ($8.2M) with 10 full sections`);
  console.log(`    * USDA Forest Service Cybersecurity — IN REVIEW`);
  console.log(`    * Maryland DOT Data Analytics — IN INTAKE`);
  console.log(`\n  Demo Walkthrough:`);
  console.log(`  1. Log in → See 3 proposals on dashboard`);
  console.log(`  2. Open DLA proposal → Full sections, bid evaluation, win strategy`);
  console.log(`  3. Visit /settings/company → Rich L1 context`);
  console.log(`  4. Visit /evidence-library → 12 evidence items with metrics`);
  console.log(`  5. Create a new proposal → AI uses all seeded context`);
  console.log(`  6. Open USDA proposal → Generate sections with cybersecurity L1`);
  console.log("=".repeat(60) + "\n");
}

main().catch(console.error);
