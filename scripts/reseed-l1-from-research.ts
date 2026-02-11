/**
 * Reseed L1 Context from Research Documents
 *
 * Wipes existing L1 placeholder data and replaces with content
 * extracted from the uploaded COM Systems research documents.
 *
 * Usage: npx tsx scripts/reseed-l1-from-research.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(import.meta.dirname || __dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  },
);

const ORG_ID = "e0c3a510-8350-43cd-b0f6-3fa34c55b88e";

// ============================================================
// COMPANY CONTEXT — from L1 Research Full Profile + Company Background
// ============================================================

const COMPANY_CONTEXT = [
  // ── Brand ──
  {
    category: "brand",
    key: "company_overview",
    title: "Company Overview",
    content:
      "COM Systems Inc is a Service-Disabled Veteran-Owned Small Business (SDVOSB) headquartered in the Washington, D.C. metropolitan area. Founded with a mission to deliver secure, scalable, and high-performing IT solutions, COM Systems serves both public and private sector clients across the full technology lifecycle — from cloud to edge, and from infrastructure to SaaS-based applications.",
  },
  {
    category: "brand",
    key: "tagline",
    title: "Brand Tagline",
    content: "Everything about IT IS IN OUR DNA.",
  },
  {
    category: "brand",
    key: "business_type",
    title: "Business Classification",
    content:
      "Service-Disabled Veteran-Owned Small Business (SDVOSB). SBA-verified, CVE (Center for Verification and Evaluation) verified. Eligible for veteran set-aside contracts and sole-source awards under FAR 19.1405.",
  },
  {
    category: "brand",
    key: "contact",
    title: "Contact Information",
    content:
      "Email: som@thecomsystems.com | Phone: 703-946-9150 | Website: www.thecomsystems.com | Area: Northern Virginia / DC Metro (703 area code)",
  },
  {
    category: "brand",
    key: "registration",
    title: "Federal Registration",
    content:
      "DUNS: 117050016 | CAGE Code: 8BL97 | Primary NAICS: 518210 (Computing Infrastructure), 541511 (Custom Programming), 541512 (Computer Systems Design), 541513 (Facilities Management), 541519 (Other Computer Services), 541618 (Management Consulting)",
  },
  {
    category: "brand",
    key: "company_size",
    title: "Company Size & Profile",
    content:
      "Small Business, estimated 10-50 employees. Founded approximately 2016. Headquartered in Northern Virginia/DC Metro area. Veteran-led organization with military service experience embedded in leadership approach.",
  },
  // ── Mission & Values ──
  {
    category: "values",
    key: "mission",
    title: "Mission Statement",
    content:
      "To deliver advanced IT Networking, Cloud Architecture, Systems Engineering, and Security Services that enable our clients to operate securely and efficiently in an increasingly complex threat landscape. We believe that security is not an afterthought — it is foundational to every technology decision.",
  },
  {
    category: "values",
    key: "veteran_led",
    title: "Veteran-Led, Mission-Focused",
    content:
      "Our leadership team brings military service experience directly into our approach to IT service delivery. We understand chain-of-command clarity, mission-critical reliability, and the non-negotiable nature of security in sensitive environments. This isn't a marketing tagline — it shapes how we approach problem-solving: chain of command clarity, mission-critical mindset (we treat every system as if lives depend on it), and security as instinct.",
  },
  {
    category: "values",
    key: "security_first",
    title: "Security-First by Design",
    content:
      "Every engagement begins with security as a core design principle, not a compliance checkbox. We architect solutions that are CMMC-compliant, NIST-aligned, and Zero Trust-ready from day one. Other firms design first and secure later; COM Systems makes security requirements drive architecture. Other firms treat compliance as a checkbox; we treat it as a design constraint.",
  },
  {
    category: "values",
    key: "technical_excellence",
    title: "Elite Technical Talent",
    content:
      "Our engineering team holds Cisco CCIE Data Center certifications — the industry's most rigorous networking credential with a pass rate below 3%. This 8-hour practical lab exam demonstrates hands-on mastery, not just theoretical knowledge. Our team maintains current certifications through ongoing education. This expertise means COM Systems engineers can diagnose and resolve complex network issues that would require escalation at most other firms.",
  },
  {
    category: "values",
    key: "end_to_end",
    title: "End-to-End Accountability",
    content:
      "From initial assessment through ongoing managed services, COM Systems provides a single point of accountability. Our 24/7 Network Operations Center ensures that the solutions we build are the solutions we maintain — eliminating the gaps that occur when design, implementation, and operations are handled by different vendors. Design → Build → Operate → Optimize, all from one team.",
  },
  {
    category: "values",
    key: "agility",
    title: "Right-Sized for Agility",
    content:
      "As a small business, COM Systems delivers what large primes cannot: senior engineers engaged within days (vs 30-60 day staffing ramp), direct access to technical leads (vs account manager intermediary), adaptive approach tailored to client needs (vs rigid methodology), competitive rates with lower overhead (vs 150%+ overhead rates), and direct delivery by COM Systems personnel (vs subcontractor dependency).",
  },
  // ── Certifications ──
  {
    category: "certifications",
    key: "sdvosb",
    title: "SDVOSB Certification",
    content:
      "Service-Disabled Veteran-Owned Small Business — SBA verified, CVE (Center for Verification and Evaluation) verified. Eligible for veteran set-aside contracts and sole-source awards under FAR 19.1405. SDVOSB sole-source threshold: $5M for services. Recent precedent: CACI-held cyber contract (USCG, $20M) was pulled into SDVOSB set-aside. Government-wide goal of 3% of prime contract dollars to SDVOSBs.",
  },
  {
    category: "certifications",
    key: "ccie",
    title: "Cisco CCIE Data Center",
    content:
      "Elite-level Cisco certification — the most rigorous networking credential in the industry. Pass rate below 3%. Requires 8-hour practical lab exam demonstrating hands-on mastery. Continuous recertification through ongoing education. Represents the top tier of networking expertise globally.",
  },
  {
    category: "certifications",
    key: "cmmc",
    title: "CMMC Compliance Capability",
    content:
      "COM Systems maintains CMMC compliance capability covering Level 1 and Level 2 requirements. They can help clients achieve CMMC certification (assessment prep, gap analysis, remediation), maintain their own CMMC compliance (prerequisite for DoD subcontracting), and deliver CMMC-aligned managed services (ongoing monitoring, incident response, documentation).",
  },
  {
    category: "certifications",
    key: "nist_alignment",
    title: "NIST Framework Alignment",
    content:
      "Full alignment across multiple NIST frameworks: SP 800-171 (CUI protection, all 17 control families), SP 800-207 (Zero Trust Architecture), SP 800-53 (Federal security controls), CSF 2.0 (all 6 functions: Govern, Identify, Protect, Detect, Respond, Recover), and CIS Benchmarks for systems hardening.",
  },
  {
    category: "certifications",
    key: "fedramp",
    title: "FedRAMP Alignment",
    content:
      "Cloud migration and compliance support for federal workloads aligned with FedRAMP requirements. FedRAMP 20x (announced March 2025) is streamlining authorization pathways, and COM Systems' Azure/AWS capabilities are well-positioned to help agencies accelerate cloud adoption.",
  },
  // ── Differentiators ──
  {
    category: "differentiators",
    key: "diff_sdvosb",
    title: "SDVOSB Procurement Advantage",
    content:
      "Eligible for veteran set-aside contracts and sole-source awards. Provides agencies with streamlined procurement paths while meeting socioeconomic goals. SDVOSB sole-source threshold: $5M for services.",
  },
  {
    category: "differentiators",
    key: "diff_technical",
    title: "CCIE-Level First-Call Resolution",
    content:
      "CCIE Data Center certification (pass rate <3%) means our engineers resolve complex network issues at first contact that would require escalation at most other firms.",
  },
  {
    category: "differentiators",
    key: "diff_lifecycle",
    title: "Full Lifecycle Single-Vendor",
    content:
      "Design → Build → Operate → Optimize from a single accountable team. No knowledge loss between project phases. Faster incident resolution because operators know the architecture intimately.",
  },
  {
    category: "differentiators",
    key: "diff_security",
    title: "Multi-Framework Security Coverage",
    content:
      "Simultaneous coverage across CMMC + NIST 800-171 + NIST CSF 2.0 + FedRAMP + CIS Benchmarks + Zero Trust (SP 800-207). Most competitors only address one or two frameworks.",
  },
  {
    category: "differentiators",
    key: "diff_federal",
    title: "Proven Federal Delivery",
    content:
      "Past performance with U.S. Department of State (enterprise Wi-Fi in diplomatic facilities), DEA (network optimization for law enforcement), and secure telecommunications remote monitoring. These engagements required cleared personnel, agency-specific security policies beyond baseline NIST, zero-downtime deployment, and inter-agency coordination.",
  },
  {
    category: "differentiators",
    key: "diff_agility",
    title: "Small Business Speed & Directness",
    content:
      "Senior engineers engaged within days (vs 30-60 day ramp). Direct access to technical leads. Adaptive delivery. Competitive rates with lower overhead. Direct delivery by COM Systems personnel, not subcontractors.",
  },
  // ── Technology Partnerships ──
  {
    category: "partnerships",
    key: "vendor_ecosystem",
    title: "Technology & Vendor Ecosystem",
    content:
      "Cisco (Networking, SD-WAN, Switching, Routing, Wireless — CCIE level), Microsoft (Azure, M365, Windows Server, Active Directory), AWS (Cloud deployments, hybrid cloud), VMware (Virtualization, HCI), Citrix (Virtual desktop infrastructure), Proofpoint (Email security), Mimecast (Email security), Various EDR/XDR platforms (CrowdStrike, SentinelOne, or similar for endpoint protection).",
  },
  // ── Methodology ──
  {
    category: "methodology",
    key: "delivery_framework",
    title: "Service Delivery Framework",
    content:
      "COM Systems employs a structured, security-first methodology across all engagements with 6 phases: Phase 1 Discovery & Assessment (requirements gathering, infrastructure assessment, security posture assessment, compliance mapping), Phase 2 Architecture & Design (solution architecture, Zero Trust design, compliance mapping to design), Phase 3 Implementation & Deployment (phased deployment, configuration hardening per CIS Benchmarks, integration testing), Phase 4 Security Hardening & Compliance Validation (NIST 800-171 controls validation, CMMC readiness review, vulnerability scanning), Phase 5 Managed Operations & Continuous Monitoring (24/7 NOC, Tier 1-3 support, proactive threat monitoring, patch management), Phase 6 Optimization & Evolution (performance trend analysis, technology refresh planning, security maturity assessment).",
  },
  {
    category: "methodology",
    key: "qa_approach",
    title: "Quality Assurance Approach",
    content:
      "Documentation First (every design decision documented before implementation), Peer Review (all configurations reviewed by a second engineer), Test Before Deploy (staged testing environments mirror production), Rollback Ready (every deployment includes a tested rollback procedure), Compliance by Design (security and compliance controls embedded from Phase 1), Lessons Learned (post-engagement reviews feed into continuous improvement).",
  },
  // ── Market Context ──
  {
    category: "market",
    key: "federal_landscape",
    title: "Federal IT Market Context 2026",
    content:
      "Five key trends shaping demand: (1) CMMC 2.0 enforcement now active since Nov 2025, 300K+ contractors need certification; (2) Zero Trust is a federal mandate per EO 14028, $13B+ annual cybersecurity spend; (3) Cloud migration accelerating via FedRAMP 20x; (4) AI moving from pilots to production, requiring infrastructure modernization; (5) SDVOSB set-asides expanding with recent precedent of $20M USCG cyber contract pulled into SDVOSB set-aside.",
  },
  {
    category: "market",
    key: "addressable_market",
    title: "Addressable Market",
    content:
      "Federal Cybersecurity: $13B+ (direct core competency). Cloud Migration & Modernization: $8B+ (Azure, AWS, hybrid). Network Infrastructure & Optimization: $5B+ (CCIE-level expertise). CMMC Compliance Services: $2B+ emerging market. Managed IT Services Federal: $10B+ (24/7 NOC, Tier 1-3).",
  },
  {
    category: "market",
    key: "competitive_position",
    title: "Competitive Positioning",
    content:
      "vs Large Primes (Leidos, SAIC, Booz Allen): Agility, lower overhead, SDVOSB eligibility. vs Mid-Tier (GDIT, Perspecta): Technical depth (CCIE), veteran culture, direct delivery. vs Other SDVOSBs: CCIE certification, federal past performance (DoS, DEA). vs Large MSPs (Accenture Federal, CGI): End-to-end lifecycle, security-first approach.",
  },
];

// ============================================================
// PRODUCT CONTEXTS — from Capabilities Matrix document
// ============================================================

const PRODUCT_CONTEXTS = [
  {
    product_name: "Network Engineering",
    service_line: "network_engineering",
    description:
      "COM Systems delivers enterprise-grade network infrastructure designed for performance, security, and scalability. Our CCIE-certified engineers specialize in complex multi-site deployments for mission-critical environments.",
    capabilities: [
      {
        name: "Enterprise Network Design & Deployment",
        description: "Cisco (CCIE expertise), multi-vendor environments",
        outcomes: ["quality_improvement", "speed_to_value"],
      },
      {
        name: "Network Security & Segmentation",
        description:
          "CMMC-compliant, NIST SP 800-171 aligned network segmentation",
        outcomes: ["compliance", "risk_reduction"],
      },
      {
        name: "SD-WAN & VPN",
        description:
          "Software-defined WAN, encrypted tunneling for distributed environments",
        outcomes: ["cost_optimization", "quality_improvement"],
      },
      {
        name: "Zero Trust Architecture",
        description:
          "NIST SP 800-207 compliant, microsegmentation implementation",
        outcomes: ["risk_reduction", "compliance"],
      },
      {
        name: "Firewalls & Access Control",
        description: "Next-gen firewall deployment and management",
        outcomes: ["risk_reduction"],
      },
      {
        name: "Advanced Routing, Switching, Wireless",
        description: "Enterprise Wi-Fi, campus networks, data center fabrics",
        outcomes: ["quality_improvement", "innovation"],
      },
    ],
  },
  {
    product_name: "Cloud & SaaS Architecture",
    service_line: "cloud_saas",
    description:
      "COM Systems enables secure cloud adoption and migration, supporting federal compliance requirements including FedRAMP and CMMC for cloud-hosted workloads.",
    capabilities: [
      {
        name: "Cloud Deployments",
        description:
          "Microsoft Azure, AWS, hybrid cloud architecture and migration",
        outcomes: ["innovation", "cost_optimization"],
      },
      {
        name: "Microsoft 365 Migration & Administration",
        description:
          "Exchange Online, SharePoint, Teams, Intune migration and ongoing management",
        outcomes: ["speed_to_value", "quality_improvement"],
      },
      {
        name: "SaaS Integrations",
        description: "MFA, email security, cloud backup solutions integration",
        outcomes: ["risk_reduction", "quality_improvement"],
      },
      {
        name: "Cloud Security & Compliance",
        description: "FedRAMP aligned, CMMC cloud requirements implementation",
        outcomes: ["compliance", "risk_reduction"],
      },
    ],
  },
  {
    product_name: "Systems Engineering",
    service_line: "systems_engineering",
    description:
      "COM Systems architects and manages the core systems infrastructure that underpins enterprise operations, with deep expertise in virtualization, identity management, and systems hardening.",
    capabilities: [
      {
        name: "Server Architecture",
        description:
          "VMware, Windows Server, and Citrix architecture design and deployment",
        outcomes: ["quality_improvement", "cost_optimization"],
      },
      {
        name: "Hyperconverged Infrastructure",
        description:
          "HCI design and deployment for simplified data center operations",
        outcomes: ["cost_optimization", "innovation"],
      },
      {
        name: "Identity Management",
        description:
          "Active Directory, Group Policy, PKI design and administration",
        outcomes: ["risk_reduction", "compliance"],
      },
      {
        name: "Systems Hardening",
        description:
          "NIST SP 800-171 and CIS Benchmarks configuration management",
        outcomes: ["compliance", "risk_reduction"],
      },
    ],
  },
  {
    product_name: "Data Center & Hardware Services",
    service_line: "data_center",
    description:
      "COM Systems provides physical infrastructure services from design through deployment, including structured cabling, rack/stack, and hardware integration.",
    capabilities: [
      {
        name: "Data Center Buildouts",
        description: "Complete rack/stack/cabling design and deployment",
        outcomes: ["quality_improvement", "speed_to_value"],
      },
      {
        name: "Hardware Deployment",
        description:
          "Traditional and hyperconverged platform deployment and configuration",
        outcomes: ["speed_to_value"],
      },
      {
        name: "Structured Cabling",
        description: "Fiber, copper, and power management infrastructure",
        outcomes: ["quality_improvement"],
      },
      {
        name: "Storage & Backup Integration",
        description: "SAN, NAS, backup/recovery system design and deployment",
        outcomes: ["risk_reduction", "quality_improvement"],
      },
    ],
  },
  {
    product_name: "Cybersecurity & SaaS Security",
    service_line: "cybersecurity",
    description:
      "COM Systems takes a defense-in-depth approach to cybersecurity, implementing layered protections across identity, endpoint, email, and network surfaces.",
    capabilities: [
      {
        name: "Multi-Factor Authentication & Zero Trust",
        description:
          "MFA, SSO, conditional access policies, NIST SP 800-207 identity-centric access",
        outcomes: ["risk_reduction", "compliance"],
      },
      {
        name: "Email Security",
        description:
          "Proofpoint, Mimecast, phishing protection for enterprise email",
        outcomes: ["risk_reduction"],
      },
      {
        name: "Microsoft 365 Security",
        description: "Security & Compliance Center, DLP, ATP configuration",
        outcomes: ["compliance", "risk_reduction"],
      },
      {
        name: "Dark Web Monitoring",
        description: "Credential exposure monitoring and alerting",
        outcomes: ["risk_reduction"],
      },
      {
        name: "Endpoint Protection",
        description:
          "EDR, XDR, MDR solutions for comprehensive endpoint security",
        outcomes: ["risk_reduction", "compliance"],
      },
    ],
  },
  {
    product_name: "Managed Services & Maintenance",
    service_line: "managed_services",
    description:
      "COM Systems provides ongoing operational support through our 24/7 Network Operations Center, delivering proactive monitoring, tiered support, and incident response.",
    capabilities: [
      {
        name: "Proactive Monitoring",
        description: "24/7 NOC, automated alerting, performance baselines",
        outcomes: ["quality_improvement", "risk_reduction"],
      },
      {
        name: "IT Support",
        description: "Remote and onsite Tier 1 through Tier 3 support",
        outcomes: ["speed_to_value", "quality_improvement"],
      },
      {
        name: "Managed Cloud & SaaS",
        description: "Ongoing cloud administration and optimization",
        outcomes: ["cost_optimization", "quality_improvement"],
      },
      {
        name: "Incident Response",
        description:
          "Detection, containment, remediation, and post-incident review",
        outcomes: ["risk_reduction"],
      },
    ],
  },
];

// ============================================================
// EVIDENCE LIBRARY — from Case Studies + L1 Research documents
// ============================================================

const EVIDENCE_LIBRARY = [
  // ── Case Studies ──
  {
    evidence_type: "case_study",
    title: "U.S. Department of State — Enterprise Wi-Fi Deployment",
    summary:
      "Designed and deployed enterprise-grade Wi-Fi solution for the U.S. Department of State addressing both performance and security requirements in a high-security diplomatic environment.",
    full_content:
      "Challenge: The U.S. Department of State required a modernized enterprise wireless infrastructure to support secure communications across diplomatic facilities. Federal wireless deployments demand compliance with stringent security requirements, including NIST SP 800-53 controls, FISMA authorization, and departmental security policies governing classified and sensitive-but-unclassified network segments.\n\nSolution: COM Systems designed and deployed an enterprise-grade Wi-Fi solution including: Cisco-based wireless infrastructure with centralized management, network segmentation separating guest/corporate/sensitive traffic, 802.1X authentication with certificate-based device validation, RF site surveys and heat mapping for full coverage, NIST SP 800-53 compliance, and seamless integration with existing wired infrastructure and identity management systems.\n\nRelevance: Demonstrates COM Systems' ability to deliver enterprise wireless infrastructure in a high-security federal environment with stringent compliance requirements, complex physical environments, and zero tolerance for security gaps.",
    client_industry: "Federal Government",
    service_line: "network_engineering",
    outcomes_demonstrated: [
      {
        outcome: "compliance",
        description: "Met NIST SP 800-53 and FISMA requirements",
      },
      {
        outcome: "quality_improvement",
        description:
          "Enterprise-grade wireless coverage across diplomatic facilities",
      },
      {
        outcome: "risk_reduction",
        description:
          "Secure segmentation of classified and unclassified network traffic",
      },
    ],
    metrics: [
      {
        name: "Client Agency",
        value: "U.S. Department of State",
        context: "Cabinet-level federal agency",
      },
      {
        name: "Security Classification",
        value: "High-security diplomatic environment",
        context: "Classified/SBU network segments",
      },
      {
        name: "Compliance Frameworks",
        value: "NIST SP 800-53, FISMA",
        context: "Federal security mandates",
      },
    ],
  },
  {
    evidence_type: "case_study",
    title: "Drug Enforcement Administration (DEA) — Network Optimization",
    summary:
      "Conducted comprehensive network optimization for the DEA, improving performance and reliability for mission-critical law enforcement applications where latency and downtime directly impact operational effectiveness.",
    full_content:
      "Challenge: The Drug Enforcement Administration required network optimization to improve performance and reliability across its operational network. As a law enforcement agency, the DEA's network supports mission-critical applications including case management systems, communications platforms, and database access where latency and downtime directly impact operational effectiveness.\n\nSolution: COM Systems conducted a comprehensive network optimization engagement: thorough network analysis including traffic flow mapping and utilization monitoring, evaluation of routing protocols, QoS policies, and network segmentation against best practices, routing protocol tuning, QoS implementation, and bandwidth management, all changes validated against NIST SP 800-171 and law enforcement security requirements, complete network documentation and updated configuration baselines.\n\nRelevance: Demonstrates COM Systems' CCIE-level network expertise applied in a mission-critical law enforcement environment where performance, reliability, and security are non-negotiable. The DEA's stringent security requirements validate COM Systems' ability to operate in highly sensitive federal contexts.",
    client_industry: "Federal Law Enforcement",
    service_line: "network_engineering",
    outcomes_demonstrated: [
      {
        outcome: "quality_improvement",
        description:
          "Improved network throughput and reduced latency for critical applications",
      },
      {
        outcome: "compliance",
        description: "All optimizations validated against NIST SP 800-171",
      },
      {
        outcome: "risk_reduction",
        description:
          "Hardened configuration baselines and comprehensive documentation",
      },
    ],
    metrics: [
      {
        name: "Client Agency",
        value: "U.S. Drug Enforcement Administration",
        context: "Federal law enforcement",
      },
      {
        name: "Expertise Level",
        value: "CCIE-certified engineers",
        context: "Top 3% networking credential",
      },
      {
        name: "Security Standard",
        value: "NIST SP 800-171 validated",
        context: "Law enforcement security requirements",
      },
    ],
  },
  {
    evidence_type: "case_study",
    title: "Secure Telecommunications — Operating Remote Monitoring",
    summary:
      "Implemented comprehensive secure telecommunications and remote monitoring solution providing 24/7 continuous visibility across network endpoints and communications infrastructure.",
    full_content:
      "Challenge: Client organization required a secure telecommunications platform with remote monitoring capabilities to maintain visibility and control over distributed infrastructure. The existing monitoring approach was reactive and fragmented, creating gaps in operational awareness and increasing response time to incidents.\n\nSolution: COM Systems implemented a comprehensive secure telecommunications and remote monitoring solution: 24/7 continuous visibility across all network endpoints and communications infrastructure, encrypted communications channels with secure management plane access and role-based access controls, automated threshold-based alerting with escalation procedures aligned to incident response plans, secure remote administration enabling rapid response without physical presence, dashboard-based operational reporting with trend analysis and capacity planning data.\n\nRelevance: Demonstrates COM Systems' managed services capabilities including 24/7 NOC operations, proactive monitoring methodology, and ability to deliver secure remote management solutions.",
    client_industry: "Federal Government",
    service_line: "managed_services",
    outcomes_demonstrated: [
      {
        outcome: "quality_improvement",
        description: "Proactive identification of issues before user impact",
      },
      {
        outcome: "risk_reduction",
        description:
          "Secure remote management reducing onsite response requirements",
      },
      {
        outcome: "speed_to_value",
        description:
          "Reduced mean time to detect and respond to network events",
      },
    ],
    metrics: [
      {
        name: "Monitoring Coverage",
        value: "24/7 continuous",
        context: "All network endpoints and communications",
      },
      {
        name: "Security Architecture",
        value: "Encrypted channels + RBAC",
        context: "Secure management plane",
      },
      {
        name: "Operational Impact",
        value: "Proactive vs reactive",
        context: "Issue identification before user impact",
      },
    ],
  },
  // ── Metrics ──
  {
    evidence_type: "metric",
    title: "Federal IT Addressable Market",
    summary:
      "COM Systems operates in addressable federal IT markets totaling $38B+ annually across cybersecurity, cloud, networking, CMMC, and managed services segments.",
    full_content:
      "Federal Cybersecurity: $13B+ annually (direct core competency). Cloud Migration & Modernization: $8B+ annually (Azure, AWS, hybrid capabilities). Network Infrastructure & Optimization: $5B+ annually (CCIE-level expertise). CMMC Compliance Services: $2B+ emerging market (300K+ contractors need certification). Managed IT Services Federal: $10B+ annually (24/7 NOC, Tier 1-3 support). Total addressable market exceeds $38B annually.",
    client_industry: "Federal Government",
    service_line: "all",
    outcomes_demonstrated: [],
    metrics: [
      {
        name: "Total Addressable Market",
        value: "$38B+",
        context: "Annual federal IT spend across COM Systems' capability areas",
      },
      {
        name: "Cybersecurity Market",
        value: "$13B+",
        context: "Federal cybersecurity annual spend",
      },
      {
        name: "CMMC Market",
        value: "$2B+ emerging",
        context: "300K+ contractors need certification",
      },
    ],
  },
  {
    evidence_type: "metric",
    title: "CCIE Certification Elite Status",
    summary:
      "Cisco CCIE Data Center certification has a pass rate below 3%, representing the top tier of networking expertise globally. COM Systems engineers hold this elite credential.",
    full_content:
      "The Cisco CCIE Data Center certification requires an 8-hour practical lab exam demonstrating hands-on mastery. With a pass rate below 3%, it represents the most rigorous networking credential in the industry. COM Systems' CCIE-certified engineers can diagnose and resolve complex network issues at first contact that would require escalation at most other firms.",
    client_industry: null,
    service_line: "network_engineering",
    outcomes_demonstrated: [
      {
        outcome: "quality_improvement",
        description: "Top 3% networking expertise for first-call resolution",
      },
    ],
    metrics: [
      {
        name: "CCIE Pass Rate",
        value: "<3%",
        context: "Most rigorous networking credential globally",
      },
      {
        name: "Lab Exam Duration",
        value: "8 hours",
        context: "Hands-on practical mastery demonstration",
      },
    ],
  },
  // ── Certifications ──
  {
    evidence_type: "certification",
    title: "SDVOSB — Service-Disabled Veteran-Owned Small Business",
    summary:
      "SBA-verified SDVOSB status providing eligibility for veteran set-aside contracts and sole-source awards under FAR 19.1405, with sole-source threshold of $5M for services.",
    full_content:
      "COM Systems holds verified SDVOSB certification from both SBA and CVE (Center for Verification and Evaluation). This provides eligibility for veteran set-aside contracts and sole-source awards under FAR 19.1405. SDVOSB sole-source threshold is $5M for services. Recent precedent: A CACI-held cyber contract (USCG, $20M) was pulled into SDVOSB set-aside, demonstrating expanding opportunities. Government-wide goal is 3% of prime contract dollars to SDVOSBs.",
    client_industry: null,
    service_line: "all",
    outcomes_demonstrated: [],
    metrics: [
      {
        name: "Sole-Source Threshold",
        value: "$5M for services",
        context: "FAR 19.1405",
      },
      {
        name: "Government Goal",
        value: "3% of prime contract dollars",
        context: "Government-wide SDVOSB target",
      },
    ],
  },
  {
    evidence_type: "certification",
    title: "Compliance Framework Coverage",
    summary:
      "COM Systems maintains alignment across 7 major compliance frameworks: CMMC 2.0, NIST SP 800-171, NIST CSF 2.0, NIST SP 800-207 (Zero Trust), NIST SP 800-53, FedRAMP, and CIS Benchmarks.",
    full_content:
      "CMMC 2.0 (Level 1-2): Implementation, assessment prep, ongoing compliance. NIST SP 800-171: Full coverage across all 17 control families (97 requirements in Rev 3) for CUI protection. NIST CSF 2.0: Aligned across all 6 functions (Govern, Identify, Protect, Detect, Respond, Recover). NIST SP 800-207: Zero Trust Architecture design and implementation. NIST SP 800-53: Security controls for federal information systems. FedRAMP: Cloud migration and compliance for federal workloads. CIS Benchmarks: Systems hardening and configuration management. FISMA: Federal information security compliance support.",
    client_industry: null,
    service_line: "cybersecurity",
    outcomes_demonstrated: [
      {
        outcome: "compliance",
        description: "7+ framework coverage across federal security standards",
      },
    ],
    metrics: [
      {
        name: "Frameworks Covered",
        value: "7+",
        context:
          "CMMC, NIST 800-171, CSF 2.0, SP 800-207, SP 800-53, FedRAMP, CIS",
      },
      {
        name: "NIST 800-171 Control Families",
        value: "17 of 17",
        context: "Complete coverage",
      },
      {
        name: "CSF 2.0 Functions",
        value: "6 of 6",
        context: "Govern through Recover",
      },
    ],
  },
];

// ============================================================
// MAIN — Wipe and Reseed
// ============================================================

async function main() {
  console.log("=== Reseed L1 Context from Research Documents ===\n");

  // Step 1: Delete existing L1 context
  console.log("Step 1: Wiping existing L1 context...");

  const { error: delCtx } = await supabase
    .from("company_context")
    .delete()
    .eq("organization_id", ORG_ID);
  if (delCtx)
    console.error("  Error deleting company_context:", delCtx.message);
  else console.log("  ✓ company_context cleared");

  const { error: delProd } = await supabase
    .from("product_contexts")
    .delete()
    .eq("organization_id", ORG_ID);
  if (delProd)
    console.error("  Error deleting product_contexts:", delProd.message);
  else console.log("  ✓ product_contexts cleared");

  const { error: delEvid } = await supabase
    .from("evidence_library")
    .delete()
    .eq("organization_id", ORG_ID);
  if (delEvid)
    console.error("  Error deleting evidence_library:", delEvid.message);
  else console.log("  ✓ evidence_library cleared");

  // Step 2: Insert company context
  console.log("\nStep 2: Seeding company context...");
  const contextRows = COMPANY_CONTEXT.map((c) => ({
    organization_id: ORG_ID,
    category: c.category,
    key: c.key,
    title: c.title,
    content: c.content,
    is_locked: false,
    metadata: {},
  }));

  const { error: insCtx } = await supabase
    .from("company_context")
    .upsert(contextRows, { onConflict: "category,key" });
  if (insCtx) console.error("  Error:", insCtx.message);
  else
    console.log(`  ✓ ${contextRows.length} company context entries upserted`);

  // Step 3: Insert product contexts
  console.log("\nStep 3: Seeding product contexts...");
  const productRows = PRODUCT_CONTEXTS.map((p) => ({
    organization_id: ORG_ID,
    product_name: p.product_name,
    service_line: p.service_line,
    description: p.description,
    capabilities: p.capabilities,
    is_locked: false,
  }));

  const { error: insProd } = await supabase
    .from("product_contexts")
    .insert(productRows);
  if (insProd) console.error("  Error:", insProd.message);
  else console.log(`  ✓ ${productRows.length} product contexts inserted`);

  // Step 4: Insert evidence library
  console.log("\nStep 4: Seeding evidence library...");
  const evidenceRows = EVIDENCE_LIBRARY.map((e) => ({
    organization_id: ORG_ID,
    evidence_type: e.evidence_type,
    title: e.title,
    summary: e.summary,
    full_content: e.full_content,
    client_industry: e.client_industry,
    service_line: e.service_line,
    outcomes_demonstrated: e.outcomes_demonstrated,
    metrics: e.metrics,
    is_verified: true,
    verified_at: new Date().toISOString(),
    verification_notes: "Verified from L1 research documents (Feb 2026)",
  }));

  const { error: insEvid } = await supabase
    .from("evidence_library")
    .insert(evidenceRows);
  if (insEvid) console.error("  Error:", insEvid.message);
  else
    console.log(`  ✓ ${evidenceRows.length} evidence library entries inserted`);

  // Step 5: Verify
  console.log("\n=== Verification ===");
  const { data: ctxCount } = await supabase
    .from("company_context")
    .select("id", { count: "exact" })
    .eq("organization_id", ORG_ID);
  console.log(`Company context: ${ctxCount?.length} entries`);

  const { data: prodCount } = await supabase
    .from("product_contexts")
    .select("id", { count: "exact" })
    .eq("organization_id", ORG_ID);
  console.log(`Product contexts: ${prodCount?.length} entries`);

  const { data: evidCount } = await supabase
    .from("evidence_library")
    .select("id", { count: "exact" })
    .eq("organization_id", ORG_ID);
  console.log(`Evidence library: ${evidCount?.length} entries`);

  console.log("\n✓ L1 context reseeded from research documents!");
}

main().catch((e) => console.error("Fatal:", e.message));
