/**
 * Seed COM Systems Inc Demo Account + L1 Company Context
 *
 * Usage:
 *   npx tsx scripts/seed-com-systems-demo.ts
 *
 * This script:
 *   1. Creates the COM Systems Inc organization (Pro tier)
 *   2. Creates a demo user account
 *   3. Seeds L1 Company Context (brand, values, certifications, legal)
 *   4. Seeds Product Contexts (6 service pillars)
 *   5. Seeds Evidence Library (case studies, metrics, certifications)
 *
 * Source: L1 research from COM Systems capability statement + web research
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

const DEMO_EMAIL = "demo@thecomsystems.com";
const DEMO_PASSWORD = "COMSystems2026!";
const DEMO_NAME = "COM Systems Demo";
const ORG_NAME = "COM Systems Inc";

// ===========================================
// COMPANY CONTEXT - Brand, Values, Certs, Legal
// ===========================================
const COMPANY_CONTEXT = [
  // Brand
  {
    category: "brand",
    key: "company_name",
    title: "Company Name",
    content: "COM Systems Inc",
    is_locked: true,
    lock_reason: "Core brand identity",
  },
  {
    category: "brand",
    key: "tagline",
    title: "Brand Tagline",
    content: "Everything about IT IS IN OUR DNA",
    is_locked: true,
    lock_reason: "Official brand tagline",
  },
  {
    category: "brand",
    key: "description",
    title: "Company Description",
    content:
      "COM Systems Inc is a Service-Disabled Veteran-Owned Small Business (SDVOSB) delivering advanced IT Networking, Cloud Architecture, Systems Engineering, and Security Services to public and private clients. Our mission-driven team of certified experts delivers secure, scalable, and high-performing IT solutions designed for today's evolving technology needs from cloud to edge, and from infrastructure to SaaS-based applications.",
    is_locked: true,
    lock_reason: "Official company description from capability statement",
  },
  {
    category: "brand",
    key: "founding_year",
    title: "Year Founded",
    content: "2016",
    is_locked: true,
    lock_reason: "Historical fact",
  },
  {
    category: "brand",
    key: "headquarters",
    title: "Headquarters",
    content: "Washington, D.C. Metropolitan Area (Northern Virginia)",
    is_locked: true,
    lock_reason: "Company location — 703 area code",
  },
  {
    category: "brand",
    key: "business_type",
    title: "Business Classification",
    content: "Service-Disabled Veteran-Owned Small Business (SDVOSB)",
    is_locked: true,
    lock_reason: "Federal certification",
  },
  {
    category: "brand",
    key: "contact_email",
    title: "Contact Email",
    content: "som@thecomsystems.com",
    is_locked: true,
    lock_reason: "Official contact",
  },
  {
    category: "brand",
    key: "contact_phone",
    title: "Contact Phone",
    content: "703-946-9150",
    is_locked: true,
    lock_reason: "Official contact",
  },
  {
    category: "brand",
    key: "website",
    title: "Website",
    content: "www.thecomsystems.com",
    is_locked: true,
    lock_reason: "Official website",
  },
  {
    category: "brand",
    key: "duns",
    title: "DUNS Number",
    content: "117050016",
    is_locked: true,
    lock_reason: "Federal registration",
  },
  {
    category: "brand",
    key: "cage_code",
    title: "CAGE Code",
    content: "8BL97",
    is_locked: true,
    lock_reason: "Federal registration",
  },
  {
    category: "brand",
    key: "naics_codes",
    title: "NAICS Codes",
    content:
      "518210 (Computing Infrastructure/Data Processing/Hosting), 541511 (Custom Computer Programming), 541512 (Computer Systems Design), 541513 (Computer Facilities Management), 541519 (Other Computer Related Services), 541618 (Other Management Consulting)",
    is_locked: true,
    lock_reason: "Federal registration codes",
  },

  // Values
  {
    category: "values",
    key: "mission_focused",
    title: "Mission-Focused",
    content:
      "Veteran-led and mission-focused, understanding federal environments' unique demands. We approach every engagement with the urgency, discipline, and accountability that comes from military service.",
    is_locked: true,
    lock_reason: "Core value",
  },
  {
    category: "values",
    key: "security_first",
    title: "Security-First",
    content:
      "Security is not an afterthought — it is foundational to every technology decision. We embed security at the design phase, not the compliance phase. Every solution is built with CMMC, NIST, and Zero Trust principles from day one.",
    is_locked: true,
    lock_reason: "Core value",
  },
  {
    category: "values",
    key: "technical_excellence",
    title: "Technical Excellence",
    content:
      "We hold ourselves to the highest standard of technical competence. Our CCIE-certified engineers represent the top tier of networking expertise, ensuring our clients receive solutions designed and implemented by elite professionals.",
    is_locked: true,
    lock_reason: "Core value",
  },
  {
    category: "values",
    key: "end_to_end",
    title: "End-to-End Accountability",
    content:
      "From initial assessment through ongoing managed services, COM Systems provides a single point of accountability. The team that designs your solution is the team that operates it — eliminating handoff gaps.",
    is_locked: true,
    lock_reason: "Core value",
  },
  {
    category: "values",
    key: "proactive",
    title: "Proactive Protection",
    content:
      "We don't wait for problems — we prevent them. Our 24/7 Network Operations Center provides continuous monitoring and threat detection, identifying and resolving issues before they impact operations.",
    is_locked: true,
    lock_reason: "Core value",
  },

  // Certifications
  {
    category: "certifications",
    key: "sdvosb",
    title: "SDVOSB Certification",
    content:
      "COM Systems Inc is a certified Service-Disabled Veteran-Owned Small Business (SDVOSB), verified through the SBA and the Center for Verification and Evaluation (CVE). Eligible for veteran set-aside contracts and sole-source awards under FAR 19.1405.",
    is_locked: true,
    lock_reason: "Federal certification",
  },
  {
    category: "certifications",
    key: "ccie",
    title: "Cisco CCIE Data Center",
    content:
      "COM Systems engineering team holds Cisco CCIE Data Center certifications — the industry's most rigorous networking credential with a pass rate below 3%. This demonstrates hands-on mastery of complex data center networking including NX-OS, ACI, UCS, MDS, and network programmability.",
    is_locked: true,
    lock_reason: "Technical certification",
  },
  {
    category: "certifications",
    key: "cmmc_compliance",
    title: "CMMC Compliance",
    content:
      "COM Systems operates in compliance with CMMC 2.0 requirements and assists clients in achieving CMMC Level 1 and Level 2 certification. Our security practices align with the 110 controls of NIST SP 800-171.",
    is_locked: true,
    lock_reason: "Compliance capability",
  },
  {
    category: "certifications",
    key: "nist_alignment",
    title: "NIST Framework Alignment",
    content:
      "COM Systems aligns service delivery with NIST Cybersecurity Framework (CSF) 2.0, NIST SP 800-171 (CUI protection), NIST SP 800-207 (Zero Trust Architecture), and NIST SP 800-53 (Security Controls). CIS Benchmarks are used for all systems hardening.",
    is_locked: true,
    lock_reason: "Compliance alignment",
  },
  {
    category: "certifications",
    key: "fedramp",
    title: "FedRAMP Cloud Compliance",
    content:
      "COM Systems designs and deploys cloud solutions aligned with FedRAMP requirements, supporting federal agencies in achieving authorized cloud deployments on Microsoft Azure, AWS, and hybrid environments.",
    is_locked: true,
    lock_reason: "Cloud compliance capability",
  },

  // Legal constraints
  {
    category: "legal",
    key: "classification_handling",
    title: "Classification Handling Policy",
    content:
      "COM Systems works with Federal Contract Information (FCI) and Controlled Unclassified Information (CUI). All proposals must accurately represent classification handling capabilities. Do not claim Top Secret or SCI clearance capabilities unless specifically authorized.",
    is_locked: true,
    lock_reason: "Security policy",
  },
  {
    category: "legal",
    key: "past_performance_disclosure",
    title: "Past Performance Disclosure Policy",
    content:
      "Reference Department of State and DEA engagements by agency name only. Do not disclose specific system details, network architectures, or security configurations from past federal engagements without written approval.",
    is_locked: true,
    lock_reason: "OPSEC policy",
  },
  {
    category: "legal",
    key: "pricing_commitments",
    title: "Pricing Commitment Policy",
    content:
      "All pricing in proposals is indicative and subject to final scoping. Include disclaimer: 'Pricing is subject to final requirements validation and may be adjusted during contract negotiations.'",
    is_locked: true,
    lock_reason: "Legal policy",
  },
];

// ===========================================
// PRODUCT CONTEXTS - 6 Service Pillars
// ===========================================
const PRODUCT_CONTEXTS = [
  {
    product_name: "Network Engineering",
    service_line: "network_engineering",
    description:
      "Enterprise-grade network infrastructure designed for performance, security, and scalability. Our CCIE-certified engineers specialize in complex multi-site deployments for mission-critical federal and commercial environments.",
    capabilities: [
      {
        name: "Enterprise Network Design & Deployment",
        description:
          "Full lifecycle network architecture from design through deployment, leveraging CCIE-level expertise for complex multi-site, multi-vendor environments.",
        outcomes: ["quality_improvement", "risk_reduction"],
      },
      {
        name: "Network Security & Segmentation",
        description:
          "Microsegmentation, VLAN architecture, and network access control designed to meet CMMC and NIST SP 800-171 requirements.",
        outcomes: ["risk_reduction", "compliance"],
      },
      {
        name: "SD-WAN & VPN Solutions",
        description:
          "Software-defined WAN deployments with encrypted tunneling for secure site-to-site and remote access connectivity.",
        outcomes: ["cost_optimization", "speed_to_value"],
      },
      {
        name: "Zero Trust Network Architecture",
        description:
          "NIST SP 800-207 aligned Zero Trust implementation including microsegmentation, identity-based access, and continuous verification.",
        outcomes: ["risk_reduction", "compliance"],
      },
      {
        name: "Enterprise Wireless",
        description:
          "Large-scale Wi-Fi design, RF site surveys, heat mapping, and deployment for secure campus and facility environments. Proven in federal diplomatic facilities.",
        outcomes: ["quality_improvement", "speed_to_value"],
      },
    ],
    specifications: {
      primary_vendor: "Cisco (CCIE expertise)",
      technologies: [
        "Cisco Catalyst/Nexus",
        "SD-WAN (Cisco Viptela/Meraki)",
        "Next-Gen Firewalls",
        "802.1X/NAC",
        "Enterprise Wireless (Wi-Fi 6/6E)",
      ],
      compliance_frameworks: [
        "CMMC 2.0",
        "NIST SP 800-171",
        "NIST SP 800-207",
        "CIS Benchmarks",
      ],
    },
    supported_outcomes: [
      "quality_improvement",
      "risk_reduction",
      "compliance",
      "cost_optimization",
      "speed_to_value",
    ],
    is_locked: true,
    lock_reason: "Core service offering — capability statement verified",
  },
  {
    product_name: "Cloud & SaaS Architecture",
    service_line: "cloud_saas",
    description:
      "Secure cloud adoption and migration services supporting federal compliance requirements including FedRAMP and CMMC for cloud-hosted workloads. Expertise across Microsoft Azure, AWS, and hybrid deployments.",
    capabilities: [
      {
        name: "Cloud Migration & Deployment",
        description:
          "Microsoft Azure, AWS, and hybrid cloud deployments with security and compliance built into the architecture from day one.",
        outcomes: ["cost_optimization", "speed_to_value", "innovation"],
      },
      {
        name: "Microsoft 365 Migration & Administration",
        description:
          "Full Microsoft 365 environment migrations including Exchange Online, SharePoint, Teams, and Intune MDM with security configuration.",
        outcomes: ["speed_to_value", "cost_optimization"],
      },
      {
        name: "SaaS Application Integration",
        description:
          "Integration of MFA, email security, cloud backup, and other SaaS applications into the enterprise environment with SSO and identity federation.",
        outcomes: ["risk_reduction", "quality_improvement"],
      },
      {
        name: "Cloud Security & Compliance",
        description:
          "FedRAMP-aligned cloud deployments with CMMC-compliant security controls, data loss prevention, and cloud access security broker (CASB) configuration.",
        outcomes: ["compliance", "risk_reduction"],
      },
    ],
    specifications: {
      cloud_platforms: ["Microsoft Azure", "AWS", "Hybrid Cloud"],
      saas_platforms: [
        "Microsoft 365",
        "Exchange Online",
        "SharePoint",
        "Teams",
        "Intune",
      ],
      compliance_frameworks: ["FedRAMP", "CMMC 2.0", "FISMA"],
    },
    supported_outcomes: [
      "cost_optimization",
      "speed_to_value",
      "compliance",
      "risk_reduction",
      "innovation",
    ],
    is_locked: true,
    lock_reason: "Core service offering — capability statement verified",
  },
  {
    product_name: "Systems Engineering",
    service_line: "systems_engineering",
    description:
      "Core systems infrastructure architecture and management with deep expertise in virtualization, identity management, hyperconverged infrastructure, and systems hardening to NIST and CIS standards.",
    capabilities: [
      {
        name: "Server & Virtualization Architecture",
        description:
          "VMware, Windows Server, and Citrix architecture design, deployment, and optimization for enterprise workloads.",
        outcomes: ["quality_improvement", "cost_optimization"],
      },
      {
        name: "Hyperconverged Infrastructure (HCI)",
        description:
          "Design and deployment of HCI solutions that consolidate compute, storage, and networking into a single platform for simplified management.",
        outcomes: ["cost_optimization", "speed_to_value"],
      },
      {
        name: "Identity & Access Management",
        description:
          "Active Directory, Group Policy, PKI, and identity management solutions providing secure authentication and authorization across the enterprise.",
        outcomes: ["risk_reduction", "compliance"],
      },
      {
        name: "Systems Hardening & Optimization",
        description:
          "Systems hardening to NIST SP 800-171 and CIS Benchmark standards, including configuration baselining, patch management, and vulnerability remediation.",
        outcomes: ["risk_reduction", "compliance", "quality_improvement"],
      },
    ],
    specifications: {
      platforms: ["VMware vSphere/vSAN", "Windows Server", "Citrix", "Hyper-V"],
      identity: [
        "Active Directory",
        "Azure AD",
        "Group Policy",
        "PKI/Certificate Services",
      ],
      hardening_standards: ["NIST SP 800-171", "CIS Benchmarks", "DISA STIGs"],
    },
    supported_outcomes: [
      "quality_improvement",
      "cost_optimization",
      "risk_reduction",
      "compliance",
      "speed_to_value",
    ],
    is_locked: true,
    lock_reason: "Core service offering — capability statement verified",
  },
  {
    product_name: "Data Center & Hardware Services",
    service_line: "data_center",
    description:
      "Physical infrastructure services from design through deployment, including structured cabling, rack/stack, data center buildouts, and hardware integration for both traditional and hyperconverged environments.",
    capabilities: [
      {
        name: "Data Center Buildouts",
        description:
          "Complete rack, stack, and cabling design and deployment for new and existing data center environments, including power management and environmental controls.",
        outcomes: ["quality_improvement", "risk_reduction"],
      },
      {
        name: "Hardware Deployment",
        description:
          "Traditional and hyperconverged hardware platform deployment, configuration, and integration with existing infrastructure.",
        outcomes: ["speed_to_value", "quality_improvement"],
      },
      {
        name: "Structured Cabling",
        description:
          "Fiber optic, copper, and structured cabling design and installation meeting TIA/EIA standards with full documentation and testing.",
        outcomes: ["quality_improvement", "risk_reduction"],
      },
      {
        name: "Storage & Backup Integration",
        description:
          "SAN, NAS, and backup/recovery system integration providing data protection and business continuity capabilities.",
        outcomes: ["risk_reduction", "compliance"],
      },
    ],
    specifications: {
      cabling_types: [
        "Single-mode Fiber",
        "Multi-mode Fiber",
        "Cat6/6A Copper",
        "Power/PDU",
      ],
      hardware_vendors: ["Cisco UCS", "Dell/EMC", "HPE", "Nutanix"],
      standards: ["TIA/EIA-568", "TIA-942 (Data Centers)", "BICSI"],
    },
    supported_outcomes: [
      "quality_improvement",
      "risk_reduction",
      "speed_to_value",
      "compliance",
    ],
    is_locked: true,
    lock_reason: "Core service offering — capability statement verified",
  },
  {
    product_name: "Cybersecurity & SaaS Security",
    service_line: "cybersecurity",
    description:
      "Defense-in-depth cybersecurity services implementing layered protections across identity, endpoint, email, and network attack surfaces. Aligned with federal Zero Trust mandate and CMMC requirements.",
    capabilities: [
      {
        name: "Multi-Factor Authentication & Zero Trust",
        description:
          "MFA, SSO, conditional access policies, and Zero Trust implementation aligned with NIST SP 800-207 and federal EO 14028 requirements.",
        outcomes: ["risk_reduction", "compliance"],
      },
      {
        name: "Email Security & Phishing Protection",
        description:
          "Enterprise email security using platforms like Proofpoint and Mimecast, including anti-phishing, DMARC/DKIM/SPF configuration, and user awareness training.",
        outcomes: ["risk_reduction", "quality_improvement"],
      },
      {
        name: "Microsoft 365 Security Configuration",
        description:
          "Security & Compliance Center configuration, Data Loss Prevention (DLP), Advanced Threat Protection (ATP), and audit/retention policies.",
        outcomes: ["compliance", "risk_reduction"],
      },
      {
        name: "Dark Web Monitoring & Identity Protection",
        description:
          "Continuous monitoring of dark web sources for credential exposure, with automated alerting and remediation workflows.",
        outcomes: ["risk_reduction"],
      },
      {
        name: "Endpoint Protection (EDR/XDR/MDR)",
        description:
          "Advanced endpoint detection and response solutions providing real-time threat detection, automated response, and managed threat hunting.",
        outcomes: ["risk_reduction", "quality_improvement"],
      },
    ],
    specifications: {
      email_security: [
        "Proofpoint",
        "Mimecast",
        "Microsoft Defender for Office 365",
      ],
      endpoint: ["EDR", "XDR", "MDR platforms"],
      identity: [
        "MFA",
        "SSO",
        "Conditional Access",
        "Privileged Access Management",
      ],
      compliance_frameworks: [
        "CMMC 2.0",
        "NIST SP 800-171",
        "NIST SP 800-207",
        "NIST CSF 2.0",
      ],
    },
    supported_outcomes: ["risk_reduction", "compliance", "quality_improvement"],
    is_locked: true,
    lock_reason: "Core service offering — capability statement verified",
  },
  {
    product_name: "Managed Services & Maintenance",
    service_line: "managed_services",
    description:
      "Ongoing operational support through our 24/7 Network Operations Center, delivering proactive monitoring, tiered technical support, managed cloud solutions, and incident response and remediation.",
    capabilities: [
      {
        name: "24/7 Proactive Monitoring (NOC)",
        description:
          "Continuous network and system monitoring from our Network Operations Center with automated alerting, performance baselining, and proactive issue identification.",
        outcomes: ["quality_improvement", "risk_reduction"],
      },
      {
        name: "Tiered IT Support (Tier 1-3)",
        description:
          "Remote and onsite IT support across three tiers — from help desk and user support through expert-level engineering for complex issues.",
        outcomes: ["quality_improvement", "speed_to_value"],
      },
      {
        name: "Managed Cloud & SaaS",
        description:
          "Ongoing administration, optimization, and security management of cloud and SaaS environments including Azure, AWS, and Microsoft 365.",
        outcomes: ["cost_optimization", "quality_improvement"],
      },
      {
        name: "Incident Response & Remediation",
        description:
          "Structured incident response including detection, containment, eradication, recovery, and post-incident review aligned with NIST CSF 2.0 Respond and Recover functions.",
        outcomes: ["risk_reduction", "compliance"],
      },
    ],
    specifications: {
      support_model: "24/7/365 NOC with Tier 1, Tier 2, and Tier 3 escalation",
      response_times: {
        critical: "15 minutes",
        high: "1 hour",
        medium: "4 hours",
        low: "Next business day",
      },
      delivery: ["Remote support", "Onsite support", "Hybrid model"],
    },
    supported_outcomes: [
      "quality_improvement",
      "risk_reduction",
      "cost_optimization",
      "compliance",
      "speed_to_value",
    ],
    is_locked: true,
    lock_reason: "Core service offering — capability statement verified",
  },
];

// ===========================================
// EVIDENCE LIBRARY - Case Studies & Metrics
// ===========================================
const EVIDENCE_LIBRARY = [
  {
    evidence_type: "case_study",
    title: "U.S. Department of State — Enterprise Wi-Fi Deployment",
    summary:
      "Designed and deployed enterprise-grade wireless infrastructure for the Department of State in a high-security diplomatic environment.",
    full_content: `
# U.S. Department of State — Enterprise Wi-Fi Deployment

## Client Challenge
The U.S. Department of State required a modernized enterprise wireless infrastructure to support secure communications across diplomatic facilities. The existing wireless environment faced coverage gaps and security compliance challenges that impacted operational effectiveness in a high-security environment.

Federal wireless deployments demand compliance with stringent security requirements, including NIST SP 800-53 controls, FISMA authorization, and the department's own security policies governing classified and sensitive-but-unclassified network segments.

## Our Solution
COM Systems designed and deployed an enterprise-grade Wi-Fi solution that addressed both performance and security requirements:
- CCIE-designed wireless architecture with centralized management
- Network segmentation separating guest, corporate, and sensitive traffic
- 802.1X authentication with certificate-based device validation
- RF site surveys and heat mapping for complete coverage
- Seamless integration with existing wired infrastructure and identity management
- Solution designed to meet NIST SP 800-53 and departmental security requirements

## Results
- Successful deployment across diplomatic facilities
- Secure wireless access with full network segmentation
- Compliance with federal security mandates including FISMA
- Seamless user experience with certificate-based authentication

## Relevance
This engagement demonstrates COM Systems' ability to deliver enterprise wireless infrastructure in a high-security federal environment with stringent compliance requirements, complex physical environments, and zero tolerance for security gaps.
    `,
    client_industry: "federal_government",
    service_line: "network_engineering",
    client_size: "enterprise",
    outcomes_demonstrated: [
      {
        outcome: "compliance",
        description: "Met NIST SP 800-53 and FISMA requirements",
      },
      {
        outcome: "quality_improvement",
        description: "Full coverage across diplomatic facilities",
      },
      {
        outcome: "risk_reduction",
        description: "Secure network segmentation for sensitive traffic",
      },
    ],
    metrics: [
      {
        name: "Environment",
        value: "High-security diplomatic",
        context: "Department of State facilities",
      },
      {
        name: "Compliance",
        value: "NIST/FISMA",
        context: "Full federal compliance achieved",
      },
    ],
    is_verified: true,
    verification_notes:
      "Referenced in COM Systems capability statement. Agency name approved for use. Specific metrics under NDA.",
  },
  {
    evidence_type: "case_study",
    title: "Drug Enforcement Administration (DEA) — Network Optimization",
    summary:
      "Conducted comprehensive network optimization for the DEA, improving performance and reliability across mission-critical law enforcement operations.",
    full_content: `
# Drug Enforcement Administration (DEA) — Network Optimization

## Client Challenge
The Drug Enforcement Administration required network optimization to improve performance and reliability across its operational network. As a law enforcement agency, the DEA's network supports mission-critical applications where latency and downtime directly impact operational effectiveness.

The existing network experienced performance bottlenecks and capacity constraints requiring expert analysis and remediation from CCIE-level network engineers.

## Our Solution
COM Systems conducted a comprehensive network optimization engagement:
- Thorough network analysis including traffic flow mapping, utilization monitoring, and bottleneck identification
- Evaluation of routing protocols, QoS policies, and network segmentation against best practices
- Routing protocol tuning, QoS implementation, and bandwidth management optimization
- All changes validated against NIST SP 800-171 and law enforcement security requirements
- Complete network documentation and updated configuration baselines

## Results
- Measurable improvement in network throughput and reduced latency for critical applications
- Improved reliability and uptime for mission-critical law enforcement systems
- Updated network documentation and hardened configuration baselines
- Full compliance with NIST SP 800-171 security requirements maintained

## Relevance
This engagement demonstrates COM Systems' CCIE-level network expertise applied in a mission-critical law enforcement environment where performance, reliability, and security are non-negotiable.
    `,
    client_industry: "federal_government",
    service_line: "network_engineering",
    client_size: "enterprise",
    outcomes_demonstrated: [
      {
        outcome: "quality_improvement",
        description: "Improved network performance and reduced latency",
      },
      {
        outcome: "compliance",
        description: "NIST SP 800-171 compliance maintained",
      },
      {
        outcome: "risk_reduction",
        description: "Hardened configurations and updated baselines",
      },
    ],
    metrics: [
      {
        name: "Environment",
        value: "Mission-critical law enforcement",
        context: "Drug Enforcement Administration",
      },
      {
        name: "Expertise Level",
        value: "CCIE",
        context: "Elite-level network engineering",
      },
    ],
    is_verified: true,
    verification_notes:
      "Referenced in COM Systems capability statement. Agency name approved for use. Specific metrics under NDA.",
  },
  {
    evidence_type: "case_study",
    title: "Secure Telecommunications — Operating Remote Monitoring",
    summary:
      "Implemented secure telecommunications platform with remote monitoring capabilities providing 24/7 visibility across distributed infrastructure.",
    full_content: `
# Secure Telecommunications — Operating Remote Monitoring

## Client Challenge
A federal client required a secure telecommunications platform with remote monitoring capabilities to maintain visibility and control over distributed infrastructure. The existing monitoring approach was reactive and fragmented, creating gaps in operational awareness and increasing response time to incidents.

## Our Solution
COM Systems implemented a comprehensive secure telecommunications and remote monitoring solution:
- 24/7 continuous monitoring platform across all network endpoints and communications infrastructure
- Encrypted communications channels with secure management plane access
- Role-based access controls for monitoring and administration
- Automated threshold-based alerting with escalation procedures
- Secure remote administration enabling rapid response without physical presence
- Dashboard-based operational reporting with trend analysis

## Results
- Significant reduction in mean time to detect (MTTD) and mean time to respond (MTTR)
- Proactive identification of issues before user impact
- Secure remote management reducing onsite response requirements
- Continuous operational awareness across distributed infrastructure

## Relevance
This engagement demonstrates COM Systems' managed services capabilities, including 24/7 NOC operations, proactive monitoring methodology, and ability to deliver secure remote management solutions for sensitive environments.
    `,
    client_industry: "federal_government",
    service_line: "managed_services",
    client_size: "enterprise",
    outcomes_demonstrated: [
      {
        outcome: "quality_improvement",
        description: "Reduced MTTD and MTTR for incidents",
      },
      {
        outcome: "risk_reduction",
        description: "Proactive issue identification before user impact",
      },
      {
        outcome: "cost_optimization",
        description:
          "Reduced onsite response requirements through remote management",
      },
    ],
    metrics: [
      {
        name: "Monitoring",
        value: "24/7",
        context: "Continuous remote monitoring",
      },
      {
        name: "Coverage",
        value: "Distributed infrastructure",
        context: "Multi-site telecommunications",
      },
    ],
    is_verified: true,
    verification_notes:
      "Referenced in COM Systems capability statement. Client details under NDA.",
  },
  {
    evidence_type: "metric",
    title: "Federal IT Service Track Record",
    summary:
      "Aggregate capabilities from COM Systems' federal and commercial IT practice.",
    full_content:
      "COM Systems maintains CCIE Data Center certified engineers, 24/7 NOC operations, and proven delivery across Department of State, DEA, and commercial clients. The team brings military service experience directly into service delivery, with compliance expertise spanning CMMC, NIST 800-171, FedRAMP, and Zero Trust Architecture.",
    client_industry: null,
    service_line: null,
    outcomes_demonstrated: [
      {
        outcome: "quality_improvement",
        description:
          "CCIE-level engineering expertise (top 3% of networking professionals)",
      },
      {
        outcome: "compliance",
        description:
          "Multi-framework compliance coverage (CMMC, NIST, FedRAMP, CIS)",
      },
    ],
    metrics: [
      {
        name: "Engineering Certification",
        value: "CCIE Data Center",
        context: "Top 3% pass rate — elite networking credential",
      },
      {
        name: "NOC Operations",
        value: "24/7/365",
        context: "Proactive monitoring and incident response",
      },
      {
        name: "Federal Agencies Served",
        value: "3+",
        context: "DoS, DEA, and additional federal clients",
      },
      {
        name: "Compliance Frameworks",
        value: "6+",
        context: "CMMC, NIST 800-171, NIST CSF, 800-207, FedRAMP, CIS",
      },
    ],
    is_verified: true,
    verification_notes:
      "Derived from capability statement and public information.",
  },
  {
    evidence_type: "certification",
    title: "SDVOSB — Service-Disabled Veteran-Owned Small Business",
    summary:
      "SBA-verified SDVOSB status enabling access to veteran set-aside contracts and sole-source awards up to $5M for services.",
    full_content:
      "COM Systems Inc is a certified Service-Disabled Veteran-Owned Small Business (SDVOSB), verified through the U.S. Small Business Administration and the Center for Verification and Evaluation (CVE). This certification enables COM Systems to compete for veteran set-aside contracts and receive sole-source awards up to $5 million for services under FAR 19.1405. The SDVOSB program supports the federal government's goal of awarding at least 3% of prime contract dollars to service-disabled veteran-owned firms.",
    client_industry: null,
    service_line: null,
    outcomes_demonstrated: [
      {
        outcome: "compliance",
        description: "Meets federal socioeconomic contracting goals",
      },
    ],
    metrics: [
      {
        name: "Sole-Source Threshold",
        value: "$5M",
        context: "Maximum for SDVOSB sole-source services contracts",
      },
      {
        name: "Federal Goal",
        value: "3%",
        context: "Government-wide SDVOSB prime contract target",
      },
    ],
    is_verified: true,
    verification_notes: "SBA and CVE verified. CAGE Code 8BL97.",
  },
];

// ===========================================
// MAIN EXECUTION
// ===========================================
async function main() {
  console.log("=== Setting up COM Systems Inc Demo Account ===\n");

  // Step 0: Fix the auth trigger (known issue — same fix as seed-demo-account.ts)
  console.log("Step 0: Fixing auth trigger...");
  const fixTriggerSQL = `
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger AS $$
    DECLARE
      new_org_id uuid;
      org_name text;
      org_slug text;
      base_slug text;
      counter int := 0;
    BEGIN
      org_name := COALESCE(
        new.raw_user_meta_data->>'organization_name',
        split_part(new.email, '@', 1) || '''s Organization'
      );
      base_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9\\s]', '', 'g'));
      base_slug := regexp_replace(base_slug, '\\s+', '-', 'g');
      base_slug := substring(base_slug from 1 for 50);
      org_slug := base_slug;
      WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = org_slug) LOOP
        counter := counter + 1;
        org_slug := base_slug || '-' || counter::text;
      END LOOP;
      INSERT INTO public.organizations (name, slug)
      VALUES (org_name, org_slug)
      RETURNING id INTO new_org_id;
      INSERT INTO public.profiles (id, email, full_name, organization_id, role)
      VALUES (
        new.id, new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', ''),
        new_org_id, 'admin'
      );
      RETURN new;
    EXCEPTION WHEN OTHERS THEN
      BEGIN
        INSERT INTO public.profiles (id, email, full_name, role)
        VALUES (
          new.id, new.email,
          COALESCE(new.raw_user_meta_data->>'full_name', ''), 'admin'
        );
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
      RETURN new;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  const { error: sqlError } = await supabase.rpc("exec_sql", {
    sql: fixTriggerSQL,
  });
  if (sqlError) {
    console.log(`  Could not fix trigger via RPC: ${sqlError.message}`);
    console.log("  Will attempt user creation anyway...");
  } else {
    console.log("  Trigger fixed!");
  }

  // Step 1: Create organization
  console.log("\nStep 1: Creating organization...");
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: ORG_NAME,
      slug: "com-systems-inc",
      plan_tier: "pro",
      plan_limits: {
        proposals_per_month: 100,
        ai_tokens_per_month: 1000000,
        max_users: 10,
        max_documents: 100,
      },
      trial_ends_at: new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    })
    .select()
    .single();

  let orgId: string;

  if (orgError) {
    if (orgError.message.includes("duplicate")) {
      console.log("  Organization already exists, fetching...");
      const { data: existing } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", "com-systems-inc")
        .single();
      orgId = existing!.id;
    } else {
      console.error("  Error creating org:", orgError.message);
      process.exit(1);
    }
  } else {
    orgId = org.id;
    console.log(`  Created org: ${orgId}`);
  }

  // Step 2: Create user
  console.log("\nStep 2: Creating demo user...");

  // First check if user already exists
  let userId: string | undefined;
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(
    (u) => u.email === DEMO_EMAIL,
  );

  if (existingUser) {
    userId = existingUser.id;
    console.log(`  User already exists: ${userId}`);
    await supabase.auth.admin.updateUserById(userId, {
      password: DEMO_PASSWORD,
      email_confirm: true,
    });
    console.log("  Password updated.");
  } else {
    // Try creating — trigger may fail but user might still be created
    const { data: newUser, error: createError } =
      await supabase.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: DEMO_NAME,
          organization_name: ORG_NAME,
        },
      });

    if (createError) {
      console.log(`  Create returned error: ${createError.message}`);
      // Check if user was created despite error (trigger failure)
      const { data: recheckUsers } = await supabase.auth.admin.listUsers();
      const found = recheckUsers?.users?.find((u) => u.email === DEMO_EMAIL);
      if (found) {
        userId = found.id;
        console.log(`  User was created despite error: ${userId}`);
      } else {
        // Try bare-minimum creation without metadata
        console.log("  Trying without metadata...");
        const { data: bareUser, error: bareError } =
          await supabase.auth.admin.createUser({
            email: DEMO_EMAIL,
            password: DEMO_PASSWORD,
            email_confirm: true,
          });
        if (bareError) {
          const { data: finalCheck } = await supabase.auth.admin.listUsers();
          const lastFound = finalCheck?.users?.find(
            (u) => u.email === DEMO_EMAIL,
          );
          if (lastFound) {
            userId = lastFound.id;
            console.log(`  Found user on final check: ${userId}`);
          } else {
            console.error(
              "  Cannot create user. Create manually in Supabase dashboard:",
            );
            console.error(`  Email: ${DEMO_EMAIL}, Password: ${DEMO_PASSWORD}`);
            console.log(
              "  Continuing with L1 context seeding (no user link)...",
            );
          }
        } else {
          userId = bareUser.user.id;
          console.log(`  Created bare user: ${userId}`);
        }
      }
    } else {
      userId = newUser.user.id;
      console.log(`  Created user: ${userId}`);
    }
  }

  // Step 3: Link profile to org
  console.log("\nStep 3: Linking profile to organization...");
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    email: DEMO_EMAIL,
    full_name: DEMO_NAME,
    organization_id: orgId,
    role: "admin",
  });

  if (profileError) {
    console.error("  Error linking profile:", profileError.message);
  } else {
    console.log("  Profile linked!");
  }

  // Step 4: Seed Company Context
  console.log("\nStep 4: Seeding Company Context...");
  for (const ctx of COMPANY_CONTEXT) {
    const { error } = await supabase.from("company_context").upsert(
      {
        ...ctx,
        organization_id: orgId,
        metadata: (ctx as any).metadata || {},
      },
      { onConflict: "organization_id,category,key" },
    );
    if (error) {
      // Try without onConflict if column combo doesn't exist
      const { error: insertError } = await supabase
        .from("company_context")
        .insert({
          ...ctx,
          organization_id: orgId,
          metadata: (ctx as any).metadata || {},
        });
      if (insertError && !insertError.message.includes("duplicate")) {
        console.error(`   Error: ${ctx.key}: ${insertError.message}`);
      } else {
        console.log(`   + ${ctx.category}/${ctx.key}`);
      }
    } else {
      console.log(`   + ${ctx.category}/${ctx.key}`);
    }
  }

  // Step 5: Seed Product Contexts
  console.log("\nStep 5: Seeding Product Contexts (6 service pillars)...");
  for (const prod of PRODUCT_CONTEXTS) {
    const { error } = await supabase
      .from("product_contexts")
      .upsert(
        { ...prod, organization_id: orgId },
        { onConflict: "organization_id,product_name,service_line" },
      );
    if (error) {
      const { error: insertError } = await supabase
        .from("product_contexts")
        .insert({ ...prod, organization_id: orgId });
      if (insertError && !insertError.message.includes("duplicate")) {
        console.error(`   Error: ${prod.product_name}: ${insertError.message}`);
      } else {
        console.log(`   + ${prod.product_name} (${prod.service_line})`);
      }
    } else {
      console.log(`   + ${prod.product_name} (${prod.service_line})`);
    }
  }

  // Step 6: Seed Evidence Library
  console.log("\nStep 6: Seeding Evidence Library...");
  for (const ev of EVIDENCE_LIBRARY) {
    const { error } = await supabase
      .from("evidence_library")
      .insert({ ...ev, organization_id: orgId });
    if (error && !error.message.includes("duplicate")) {
      console.error(`   Error: ${ev.title}: ${error.message}`);
    } else {
      console.log(`   + ${ev.evidence_type}: ${ev.title}`);
    }
  }

  // Summary
  console.log("\n========================================");
  console.log("  COM Systems Demo Account Ready!");
  console.log("========================================");
  console.log(`  URL:      https://intentwin.vercel.app/login`);
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log(`  Org:      ${ORG_NAME}`);
  console.log(`  Org ID:   ${orgId}`);
  console.log("========================================");
  console.log(`\n  L1 Context Seeded:`);
  console.log(
    `   - ${COMPANY_CONTEXT.length} company context entries (brand, values, certs, legal)`,
  );
  console.log(
    `   - ${PRODUCT_CONTEXTS.length} product contexts (service pillars)`,
  );
  console.log(
    `   - ${EVIDENCE_LIBRARY.length} evidence library entries (case studies, metrics, certs)`,
  );
  console.log("\n  Next steps:");
  console.log("   1. Log in and verify L1 data at /settings/company");
  console.log("   2. Check evidence at /evidence-library");
  console.log(
    "   3. Upload the capability statement PDF at /knowledge-base/upload",
  );
  console.log("   4. Create a test proposal to verify AI uses L1 context");
  console.log("========================================\n");
}

main().catch(console.error);
