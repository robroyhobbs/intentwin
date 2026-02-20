/**
 * Seed General Company Demo Account + Full L1 Context + Sample RFP Proposal
 *
 * Usage:
 *   npx tsx scripts/seed-general-company.ts
 *
 * This script:
 *   1. Finds or creates the organization for g.eneral@icloud.com
 *   2. Links user profile to the org (Pro tier, generous limits)
 *   3. Seeds L1 Company Context (brand, values, certifications, partnerships)
 *   4. Seeds Product Contexts (cloud migration, app modernization + supporting services)
 *   5. Seeds Evidence Library (6 case studies, 4 metrics, 2 testimonials, 2 certs)
 *   6. Creates a sample proposal with realistic RFP intake data ready to generate
 *
 * Company: General Company — expert in cloud migrations and app modernization
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

const DEMO_EMAIL = "g.eneral@icloud.com";
const DEMO_NAME = "General Admin";
const ORG_NAME = "General Company";
const ORG_SLUG = "general-company";

// ===========================================
// COMPANY CONTEXT — Brand, Values, Certs, Partnerships
// ===========================================
const COMPANY_CONTEXT = [
  // Brand
  {
    category: "brand",
    key: "company_name",
    title: "Company Name",
    content: "General Company",
    is_locked: true,
    lock_reason: "Core brand identity",
  },
  {
    category: "brand",
    key: "tagline",
    title: "Brand Tagline",
    content: "Modernize with confidence. Migrate with precision.",
    is_locked: true,
    lock_reason: "Official brand tagline",
  },
  {
    category: "brand",
    key: "description",
    title: "Company Description",
    content:
      "General Company is a technology consulting firm specializing in enterprise cloud migrations and application modernization. We help mid-market and enterprise organizations move from legacy on-premises infrastructure to modern cloud-native architectures on AWS, Azure, and Google Cloud. Our team of 120+ certified cloud architects and engineers has completed over 200 successful migration engagements across financial services, healthcare, manufacturing, and retail verticals. We combine deep technical expertise with proven migration methodologies to reduce risk, accelerate timelines, and deliver measurable business outcomes.",
    is_locked: true,
    lock_reason: "Official company description",
  },
  {
    category: "brand",
    key: "founding_year",
    title: "Year Founded",
    content: "2015",
    is_locked: true,
    lock_reason: "Historical fact",
  },
  {
    category: "brand",
    key: "headquarters",
    title: "Headquarters",
    content: "Austin, Texas with delivery centers in Atlanta, Denver, and Toronto",
    is_locked: true,
    lock_reason: "Company locations",
  },
  {
    category: "brand",
    key: "team_size",
    title: "Team Size",
    content: "120+ employees including 85 certified cloud architects and engineers",
    is_locked: true,
    lock_reason: "Current headcount",
  },
  {
    category: "brand",
    key: "website",
    title: "Website",
    content: "www.generalcompany.io",
    is_locked: true,
    lock_reason: "Official website",
  },
  {
    category: "brand",
    key: "industries_served",
    title: "Industries Served",
    content:
      "Financial Services, Healthcare, Manufacturing, Retail & E-commerce, Insurance, SaaS & Technology",
    is_locked: true,
    lock_reason: "Target verticals",
  },
  {
    category: "brand",
    key: "differentiators",
    title: "Key Differentiators",
    content:
      "1) Migration Factory approach that reduces cloud migration timelines by 40% through automation and repeatable playbooks. 2) Dedicated Application Modernization Lab where we assess, refactor, and re-platform legacy applications before migration. 3) FinOps-first methodology ensuring cloud cost optimization is built into every engagement from day one. 4) 98.5% on-time delivery rate across 200+ engagements. 5) Deep expertise in regulated industries (HIPAA, PCI-DSS, SOC 2, SOX compliance during migration).",
    is_locked: true,
    lock_reason: "Competitive differentiators",
  },

  // Values
  {
    category: "values",
    key: "precision_execution",
    title: "Precision Execution",
    content:
      "We believe cloud migrations fail when teams improvise. Every engagement follows our battle-tested Migration Factory methodology — a structured, automated approach that has delivered 200+ successful migrations with a 98.5% on-time rate. We plan meticulously, execute methodically, and leave nothing to chance.",
    is_locked: true,
    lock_reason: "Core value",
  },
  {
    category: "values",
    key: "business_outcomes",
    title: "Business Outcomes First",
    content:
      "Technology is a means, not an end. We start every engagement by defining the business outcomes our clients need — whether that's reducing infrastructure costs by 35%, improving application performance by 10x, or achieving compliance certification. Every technical decision is anchored to measurable business value.",
    is_locked: true,
    lock_reason: "Core value",
  },
  {
    category: "values",
    key: "zero_downtime",
    title: "Zero-Downtime Commitment",
    content:
      "Our clients run 24/7 businesses. We've developed migration patterns that achieve zero or near-zero downtime for even the most complex workloads. Our record speaks for itself: zero unplanned production outages across our last 50 migration engagements.",
    is_locked: true,
    lock_reason: "Core value",
  },
  {
    category: "values",
    key: "knowledge_transfer",
    title: "Knowledge Transfer",
    content:
      "We don't create dependency. Every engagement includes structured knowledge transfer so our clients' teams can operate, optimize, and extend the solutions we build. We succeed when our clients no longer need us for day-to-day operations.",
    is_locked: true,
    lock_reason: "Core value",
  },

  // Certifications
  {
    category: "certifications",
    key: "aws_partner",
    title: "AWS Advanced Consulting Partner",
    content:
      "General Company is an AWS Advanced Consulting Partner with competencies in Migration, DevOps, and Financial Services. We maintain 40+ AWS-certified professionals including 8 AWS Solutions Architect — Professional certifications. Our Migration Competency designation validates our proven methodology for large-scale workload migrations to AWS.",
    is_locked: true,
    lock_reason: "Partnership certification",
  },
  {
    category: "certifications",
    key: "azure_expert_msp",
    title: "Microsoft Azure Expert MSP",
    content:
      "General Company holds Microsoft Azure Expert MSP status, the highest tier of Microsoft's cloud partner program. We maintain 35+ Azure-certified professionals and have completed Microsoft-audited validation of our cloud practices, delivery methodology, and operational excellence.",
    is_locked: true,
    lock_reason: "Partnership certification",
  },
  {
    category: "certifications",
    key: "gcp_partner",
    title: "Google Cloud Partner",
    content:
      "General Company is a Google Cloud Partner specializing in Infrastructure Modernization and Application Development. We maintain 15+ Google Cloud certified professionals for clients with GCP-first or multi-cloud strategies.",
    is_locked: true,
    lock_reason: "Partnership certification",
  },
  {
    category: "certifications",
    key: "soc2_type2",
    title: "SOC 2 Type II Certified",
    content:
      "General Company maintains SOC 2 Type II certification, demonstrating our commitment to security, availability, and confidentiality in our service delivery. Our annual audit covers all delivery operations including client data handling, access controls, and change management processes.",
    is_locked: true,
    lock_reason: "Security certification",
  },
  {
    category: "certifications",
    key: "iso_27001",
    title: "ISO 27001 Certified",
    content:
      "Our information security management system is ISO 27001 certified, providing an additional layer of assurance for clients in regulated industries. This certification covers our entire delivery organization including our Migration Factory automation platform.",
    is_locked: true,
    lock_reason: "Security certification",
  },

  // Partnerships
  {
    category: "partnerships",
    key: "hashicorp",
    title: "HashiCorp Partner",
    content:
      "Official HashiCorp implementation partner for Terraform Enterprise, Vault, and Consul. We use Infrastructure as Code as the foundation of every cloud deployment, ensuring repeatability, auditability, and drift detection across all environments.",
    is_locked: true,
    lock_reason: "Technology partnership",
  },
  {
    category: "partnerships",
    key: "datadog",
    title: "Datadog Gold Partner",
    content:
      "Datadog Gold Partner providing full-stack observability solutions. We implement Datadog as our standard monitoring platform during migrations, giving clients real-time visibility into application performance, infrastructure health, and cloud costs from day one.",
    is_locked: true,
    lock_reason: "Technology partnership",
  },
];

// ===========================================
// PRODUCT CONTEXTS — Core Services
// ===========================================
const PRODUCT_CONTEXTS = [
  {
    product_name: "Cloud Migration Services",
    service_line: "cloud_migration",
    description:
      "End-to-end cloud migration services powered by our Migration Factory methodology. We assess, plan, migrate, and optimize workloads across AWS, Azure, and Google Cloud with an emphasis on minimizing risk and downtime while maximizing cloud-native benefits.",
    capabilities: [
      {
        name: "Migration Assessment & Planning",
        description:
          "Comprehensive discovery and assessment of existing infrastructure, applications, and data. We map dependencies, identify migration patterns (rehost, replatform, refactor), estimate costs, and build a phased migration roadmap with clear milestones.",
        outcomes: ["risk_reduction", "cost_optimization"],
      },
      {
        name: "Migration Factory Execution",
        description:
          "Automated, repeatable migration execution using our proprietary Migration Factory platform. Includes automated server discovery, dependency mapping, migration wave planning, and parallel workload migration with built-in validation and rollback capabilities.",
        outcomes: ["speed_to_value", "quality_improvement", "cost_optimization"],
      },
      {
        name: "Database Migration",
        description:
          "Specialized database migration services for Oracle, SQL Server, PostgreSQL, MySQL, and NoSQL databases. We handle schema conversion, data migration, replication setup, and cutover orchestration with near-zero downtime using CDC (Change Data Capture) patterns.",
        outcomes: ["risk_reduction", "quality_improvement"],
      },
      {
        name: "Cloud Landing Zone Design",
        description:
          "Design and implementation of secure, compliant cloud landing zones with multi-account strategy, network architecture, identity federation, security guardrails, and governance automation using Terraform and cloud-native services.",
        outcomes: ["compliance", "risk_reduction", "speed_to_value"],
      },
      {
        name: "FinOps & Cost Optimization",
        description:
          "Cloud financial management built into every migration. Includes right-sizing analysis, reserved instance strategy, spot instance automation, cost allocation tagging, and ongoing optimization recommendations. Average client saves 30-40% vs. lift-and-shift baseline.",
        outcomes: ["cost_optimization"],
      },
    ],
    specifications: {
      cloud_platforms: ["AWS", "Microsoft Azure", "Google Cloud Platform"],
      migration_tools: [
        "AWS Migration Hub",
        "Azure Migrate",
        "CloudEndure",
        "Terraform",
        "Ansible",
      ],
      database_engines: [
        "Oracle",
        "SQL Server",
        "PostgreSQL",
        "MySQL",
        "MongoDB",
        "DynamoDB",
      ],
      compliance_frameworks: [
        "HIPAA",
        "PCI-DSS",
        "SOC 2",
        "SOX",
        "FedRAMP",
      ],
    },
    supported_outcomes: [
      "cost_optimization",
      "speed_to_value",
      "risk_reduction",
      "compliance",
      "quality_improvement",
      "innovation",
    ],
    is_locked: true,
    lock_reason: "Core service offering",
  },
  {
    product_name: "Application Modernization",
    service_line: "app_modernization",
    description:
      "Transform legacy monolithic applications into modern, cloud-native architectures. Our Application Modernization Lab provides assessment, refactoring, re-platforming, and containerization services that unlock agility, scalability, and reduced operational costs.",
    capabilities: [
      {
        name: "Application Portfolio Assessment",
        description:
          "Evaluate your entire application portfolio using our 6R framework (Retain, Retire, Rehost, Replatform, Refactor, Replace). We score each application on business value, technical debt, cloud readiness, and modernization ROI to build a prioritized modernization roadmap.",
        outcomes: ["risk_reduction", "cost_optimization"],
      },
      {
        name: "Containerization & Kubernetes",
        description:
          "Containerize applications using Docker and deploy on Kubernetes (EKS, AKS, GKE) or serverless container platforms (ECS Fargate, Cloud Run). Includes CI/CD pipeline setup, service mesh implementation, and container security hardening.",
        outcomes: ["speed_to_value", "quality_improvement", "innovation"],
      },
      {
        name: "Microservices Architecture",
        description:
          "Decompose monolithic applications into loosely coupled microservices. We handle domain-driven design, API gateway implementation, event-driven architecture, and data ownership patterns that enable independent deployment and scaling.",
        outcomes: ["innovation", "speed_to_value", "quality_improvement"],
      },
      {
        name: "Legacy Database Modernization",
        description:
          "Migrate from expensive legacy databases (Oracle, DB2) to modern alternatives (PostgreSQL, Aurora, Cloud SQL) or purpose-built databases (DynamoDB, Cosmos DB). Includes data model optimization, query performance tuning, and managed service adoption.",
        outcomes: ["cost_optimization", "quality_improvement"],
      },
      {
        name: "Serverless Transformation",
        description:
          "Re-architect suitable workloads to serverless patterns using Lambda, Azure Functions, Step Functions, and API Gateway. Eliminates server management overhead and enables true pay-per-use economics for variable workloads.",
        outcomes: ["cost_optimization", "innovation", "speed_to_value"],
      },
    ],
    specifications: {
      container_platforms: [
        "Docker",
        "Kubernetes (EKS/AKS/GKE)",
        "ECS Fargate",
        "Cloud Run",
      ],
      languages: [
        "Java/Spring Boot",
        "Python",
        ".NET/C#",
        "Node.js/TypeScript",
        "Go",
      ],
      patterns: [
        "Microservices",
        "Event-Driven",
        "CQRS/Event Sourcing",
        "Serverless",
        "API-First",
      ],
      cicd: ["GitHub Actions", "GitLab CI", "Jenkins", "ArgoCD", "Flux"],
    },
    supported_outcomes: [
      "innovation",
      "speed_to_value",
      "cost_optimization",
      "quality_improvement",
      "risk_reduction",
    ],
    is_locked: true,
    lock_reason: "Core service offering",
  },
  {
    product_name: "Cloud Security & Compliance",
    service_line: "cloud_security",
    description:
      "Security and compliance services designed for organizations moving to or operating in the cloud. We implement defense-in-depth security architectures that meet regulatory requirements while enabling cloud agility.",
    capabilities: [
      {
        name: "Cloud Security Architecture",
        description:
          "Design and implement cloud security architectures including network segmentation, encryption at rest and in transit, secrets management, WAF configuration, and DDoS protection aligned with CIS benchmarks and cloud provider best practices.",
        outcomes: ["risk_reduction", "compliance"],
      },
      {
        name: "Compliance Automation",
        description:
          "Automate compliance controls using cloud-native services (AWS Config, Azure Policy, Security Command Center) and third-party tools (Prisma Cloud, Wiz). Continuous compliance monitoring with automated remediation for drift detection.",
        outcomes: ["compliance", "speed_to_value"],
      },
      {
        name: "Identity & Access Management",
        description:
          "Implement zero-trust IAM architectures with SSO federation, MFA enforcement, role-based access control, privileged access management, and just-in-time access patterns across cloud and hybrid environments.",
        outcomes: ["risk_reduction", "compliance"],
      },
    ],
    specifications: {
      security_tools: [
        "Prisma Cloud",
        "Wiz",
        "AWS Security Hub",
        "Azure Defender",
        "HashiCorp Vault",
      ],
      compliance_frameworks: [
        "HIPAA",
        "PCI-DSS",
        "SOC 2",
        "SOX",
        "GDPR",
        "FedRAMP",
      ],
    },
    supported_outcomes: [
      "risk_reduction",
      "compliance",
      "quality_improvement",
    ],
    is_locked: true,
    lock_reason: "Supporting service offering",
  },
  {
    product_name: "DevOps & Platform Engineering",
    service_line: "devops",
    description:
      "Build internal developer platforms and CI/CD pipelines that accelerate software delivery. We help teams adopt DevOps practices, implement GitOps workflows, and create self-service infrastructure platforms that reduce time-to-production.",
    capabilities: [
      {
        name: "CI/CD Pipeline Design",
        description:
          "Design and implement end-to-end CI/CD pipelines with automated testing, security scanning, artifact management, and multi-environment deployment. Supports blue/green, canary, and rolling deployment strategies.",
        outcomes: ["speed_to_value", "quality_improvement"],
      },
      {
        name: "Infrastructure as Code",
        description:
          "Implement IaC using Terraform, Pulumi, or CloudFormation with modular, reusable patterns. Includes state management, drift detection, policy-as-code with OPA/Sentinel, and automated provisioning workflows.",
        outcomes: ["speed_to_value", "risk_reduction", "quality_improvement"],
      },
      {
        name: "Observability & Monitoring",
        description:
          "Full-stack observability using Datadog, Grafana, or cloud-native tools. Includes application performance monitoring, distributed tracing, log aggregation, custom dashboards, and intelligent alerting.",
        outcomes: ["quality_improvement", "risk_reduction"],
      },
    ],
    specifications: {
      iac_tools: ["Terraform", "Pulumi", "CloudFormation", "Ansible"],
      cicd_platforms: [
        "GitHub Actions",
        "GitLab CI",
        "ArgoCD",
        "Jenkins",
        "Flux",
      ],
      observability: ["Datadog", "Grafana/Prometheus", "ELK Stack", "Jaeger"],
    },
    supported_outcomes: [
      "speed_to_value",
      "quality_improvement",
      "risk_reduction",
      "innovation",
    ],
    is_locked: true,
    lock_reason: "Supporting service offering",
  },
];

// ===========================================
// EVIDENCE LIBRARY — Case Studies, Metrics, Testimonials, Certs
// ===========================================
const EVIDENCE_LIBRARY = [
  // Case Studies
  {
    evidence_type: "case_study",
    title: "National Insurance Group — Data Center to AWS Migration",
    summary:
      "Migrated 450+ servers and 85 applications from two on-premises data centers to AWS in 9 months, achieving 38% infrastructure cost reduction and eliminating $2.4M annual data center lease.",
    full_content: `# National Insurance Group — Data Center to AWS Migration

## Client Challenge
National Insurance Group operated two aging data centers hosting 450+ servers and 85 business applications. Annual data center costs exceeded $6.2M including facilities, hardware refresh, and operations staff. The existing infrastructure couldn't scale for their digital transformation initiatives, and a data center lease renewal worth $2.4M/year was approaching in 14 months.

## Our Solution
General Company deployed our Migration Factory methodology to execute a phased migration:
- Phase 1 (Weeks 1-4): Automated discovery and dependency mapping across all 450 servers using AWS Application Discovery Service and our proprietary analysis tools
- Phase 2 (Weeks 5-8): Landing zone design with multi-account strategy, Transit Gateway networking, and HIPAA-compliant security architecture
- Phase 3 (Weeks 9-36): Wave-based migration executing 8-12 applications per wave. Used rehost for commodity workloads (60%), replatform for databases (25%), and refactor for 3 business-critical applications (15%)
- Phase 4 (Weeks 37-40): Data center decommission planning, final cutover, and optimization

Key technical decisions:
- Oracle RAC databases migrated to Aurora PostgreSQL, saving $800K/year in licensing
- Implemented CloudEndure for continuous replication and near-zero downtime cutovers
- Built Terraform modules for repeatable infrastructure patterns across all workloads
- Deployed Datadog for unified monitoring replacing 4 legacy monitoring tools

## Results
- 450+ servers migrated across 85 applications in 9 months (2 months ahead of schedule)
- 38% infrastructure cost reduction ($2.36M annual savings)
- Eliminated $2.4M annual data center lease
- Zero unplanned production outages during migration
- Application performance improved 25% average due to right-sizing and modern infrastructure
- HIPAA compliance maintained throughout migration with zero audit findings

## Relevance
This engagement demonstrates General Company's ability to execute large-scale, regulated-industry cloud migrations on aggressive timelines using our Migration Factory approach.`,
    client_industry: "insurance",
    service_line: "cloud_migration",
    client_size: "enterprise",
    outcomes_demonstrated: [
      { outcome: "cost_optimization", description: "38% infrastructure cost reduction, $4.76M total annual savings" },
      { outcome: "speed_to_value", description: "Completed 2 months ahead of 11-month schedule" },
      { outcome: "risk_reduction", description: "Zero unplanned outages during migration" },
      { outcome: "compliance", description: "HIPAA compliance maintained with zero audit findings" },
    ],
    metrics: [
      { name: "Servers Migrated", value: "450+", context: "Across two data centers" },
      { name: "Cost Reduction", value: "38%", context: "Annual infrastructure costs" },
      { name: "Annual Savings", value: "$4.76M", context: "Infrastructure + data center lease elimination" },
      { name: "Timeline", value: "9 months", context: "2 months ahead of schedule" },
      { name: "Downtime", value: "Zero", context: "No unplanned production outages" },
    ],
    is_verified: true,
    verification_notes: "Client approved for reference. Metrics validated by client CTO.",
  },
  {
    evidence_type: "case_study",
    title: "MedVault Health — HIPAA-Compliant Cloud Migration & App Modernization",
    summary:
      "Migrated and modernized a healthcare SaaS platform serving 2,000+ clinics from a legacy monolith on bare metal to a containerized microservices architecture on AWS, achieving SOC 2 and HIPAA certification.",
    full_content: `# MedVault Health — HIPAA-Compliant Cloud Migration & App Modernization

## Client Challenge
MedVault Health operates an EHR (Electronic Health Records) platform serving 2,000+ clinics. Their monolithic Java application ran on bare-metal servers in a colocation facility. The platform experienced scaling issues during peak hours, 4-6 hour deployment cycles, and the inability to release features faster than monthly. Compliance auditors flagged aging infrastructure as a risk to their HIPAA certification.

## Our Solution
General Company executed a combined migration and modernization engagement:
- Assessment Phase: Analyzed the monolithic application (1.2M lines of Java), identified 12 bounded contexts suitable for microservice extraction, and mapped all PHI data flows
- Landing Zone: Built HIPAA-compliant AWS infrastructure with dedicated VPC, PrivateLink connectivity, KMS encryption, CloudTrail audit logging, and AWS Config compliance rules
- Database Migration: Migrated from self-managed PostgreSQL to Aurora PostgreSQL with Multi-AZ, automated backups, and encryption at rest. Zero-downtime cutover using logical replication
- Application Modernization: Extracted 5 highest-value microservices (patient scheduling, billing, prescriptions, lab results, notifications) into containerized services on EKS with service mesh (Istio)
- CI/CD: Implemented GitHub Actions pipelines with automated SAST/DAST scanning, container image scanning, and progressive deployment (canary releases)

## Results
- Deployment frequency improved from monthly to 15+ times per day
- Peak-hour response time reduced from 3.2 seconds to 180 milliseconds (94% improvement)
- Infrastructure costs reduced 42% through right-sizing, Savings Plans, and elimination of over-provisioned bare metal
- Achieved SOC 2 Type II and HIPAA re-certification with zero findings on first audit
- Platform scaled to support 40% user growth without architecture changes

## Relevance
This engagement demonstrates our ability to combine cloud migration with application modernization in a highly regulated healthcare environment where data security and availability are non-negotiable.`,
    client_industry: "healthcare",
    service_line: "app_modernization",
    client_size: "mid_market",
    outcomes_demonstrated: [
      { outcome: "speed_to_value", description: "Deployment frequency from monthly to 15+/day" },
      { outcome: "quality_improvement", description: "94% response time improvement (3.2s to 180ms)" },
      { outcome: "cost_optimization", description: "42% infrastructure cost reduction" },
      { outcome: "compliance", description: "SOC 2 Type II and HIPAA certified with zero findings" },
    ],
    metrics: [
      { name: "Deployment Frequency", value: "15+/day", context: "Up from monthly releases" },
      { name: "Response Time", value: "180ms", context: "Down from 3.2s (94% improvement)" },
      { name: "Cost Reduction", value: "42%", context: "Infrastructure costs" },
      { name: "Clinics Served", value: "2,000+", context: "Healthcare SaaS platform" },
      { name: "Compliance", value: "Zero findings", context: "SOC 2 Type II + HIPAA audit" },
    ],
    is_verified: true,
    verification_notes: "Client provided written testimonial. Metrics from their monitoring dashboards.",
  },
  {
    evidence_type: "case_study",
    title: "PeakRetail — E-Commerce Platform Modernization on Azure",
    summary:
      "Modernized a legacy .NET e-commerce platform to Azure cloud-native architecture, achieving 99.99% uptime during Black Friday (12x normal traffic) and 55% reduction in cloud spend through FinOps optimization.",
    full_content: `# PeakRetail — E-Commerce Platform Modernization on Azure

## Client Challenge
PeakRetail is a $400M/year online retailer whose legacy .NET monolith couldn't handle Black Friday traffic spikes (12x normal load). The previous year's Black Friday saw 47 minutes of downtime costing an estimated $1.8M in lost revenue. Their Azure bill had grown to $180K/month with no visibility into cost drivers.

## Our Solution
- Decomposed the monolith into 8 microservices (catalog, cart, checkout, payments, inventory, search, recommendations, notifications)
- Re-architected on Azure Kubernetes Service (AKS) with KEDA autoscaling
- Moved product catalog to Cosmos DB for global distribution and sub-10ms reads
- Implemented Azure Front Door with CDN caching reducing origin requests by 75%
- Built a comprehensive FinOps practice: resource tagging, cost allocation, automated right-sizing, and Reserved Instance optimization
- Load tested to 20x normal traffic (exceeding Black Friday projections)

## Results
- Black Friday: 99.99% uptime handling 12x traffic with automatic scaling
- Average page load time reduced from 4.1s to 0.8s
- Azure spend reduced from $180K/month to $81K/month (55% reduction)
- Development velocity doubled with independent microservice deployments

## Relevance
Demonstrates our Azure expertise, FinOps methodology, and ability to deliver business-critical modernization under hard deadlines (Black Friday was non-negotiable).`,
    client_industry: "retail",
    service_line: "app_modernization",
    client_size: "enterprise",
    outcomes_demonstrated: [
      { outcome: "quality_improvement", description: "99.99% uptime during 12x traffic Black Friday" },
      { outcome: "cost_optimization", description: "55% Azure spend reduction ($180K to $81K/month)" },
      { outcome: "speed_to_value", description: "Development velocity doubled" },
    ],
    metrics: [
      { name: "Uptime (Black Friday)", value: "99.99%", context: "12x normal traffic" },
      { name: "Cloud Cost Reduction", value: "55%", context: "$180K to $81K/month" },
      { name: "Page Load Time", value: "0.8s", context: "Down from 4.1s (80% faster)" },
      { name: "Revenue Protected", value: "$1.8M+", context: "Avoided prior year's downtime losses" },
    ],
    is_verified: true,
    verification_notes: "PeakRetail CTO provided case study approval and public reference.",
  },
  {
    evidence_type: "case_study",
    title: "Frontier Manufacturing — Multi-Cloud Migration (Oracle to PostgreSQL)",
    summary:
      "Migrated 14 Oracle databases to Aurora PostgreSQL and Cloud SQL across AWS and GCP, eliminating $1.2M/year in Oracle licensing while improving query performance by 3x.",
    full_content: `# Frontier Manufacturing — Multi-Cloud Database Migration

## Client Challenge
Frontier Manufacturing ran 14 Oracle databases across their ERP, supply chain, and analytics systems. Oracle licensing renewal was $1.2M/year and climbing. They also needed to support a multi-cloud strategy with manufacturing systems on GCP (for ML/AI capabilities) and corporate systems on AWS.

## Our Solution
- Assessed all 14 databases for migration complexity, mapped cross-database dependencies
- Migrated 10 databases to Aurora PostgreSQL (AWS) and 4 to Cloud SQL for PostgreSQL (GCP)
- Used AWS DMS and custom CDC pipelines for zero-downtime migration
- Re-optimized 200+ stored procedures and 50+ complex queries during migration
- Implemented cross-cloud connectivity via dedicated interconnects
- Built automated backup and disaster recovery across both clouds

## Results
- Eliminated $1.2M/year Oracle licensing costs
- Query performance improved 3x average across migrated databases
- Zero data loss and under 5 minutes total cutover downtime across all 14 databases
- Cross-cloud architecture supports their AI/ML initiatives on GCP alongside AWS corporate workloads

## Relevance
Shows our database migration expertise and ability to execute multi-cloud strategies for complex enterprise environments.`,
    client_industry: "manufacturing",
    service_line: "cloud_migration",
    client_size: "enterprise",
    outcomes_demonstrated: [
      { outcome: "cost_optimization", description: "Eliminated $1.2M/year Oracle licensing" },
      { outcome: "quality_improvement", description: "3x query performance improvement" },
      { outcome: "risk_reduction", description: "Zero data loss, under 5 min cutover downtime" },
      { outcome: "innovation", description: "Multi-cloud architecture enabling AI/ML initiatives" },
    ],
    metrics: [
      { name: "Databases Migrated", value: "14", context: "Oracle to PostgreSQL" },
      { name: "License Savings", value: "$1.2M/year", context: "Oracle licensing eliminated" },
      { name: "Performance Gain", value: "3x", context: "Average query performance improvement" },
      { name: "Cutover Downtime", value: "<5 minutes", context: "Across all 14 databases" },
    ],
    is_verified: true,
    verification_notes: "Frontier Manufacturing VP of Engineering approved reference.",
  },
  {
    evidence_type: "case_study",
    title: "SecureFinance Corp — PCI-DSS Compliant Cloud Migration",
    summary:
      "Migrated payment processing infrastructure to AWS with full PCI-DSS Level 1 compliance, reducing compliance audit preparation time by 60% through automated controls.",
    full_content: `# SecureFinance Corp — PCI-DSS Compliant Payment Infrastructure Migration

## Client Challenge
SecureFinance Corp processes $2B+ in annual payment transactions. Their on-premises payment infrastructure required expensive PCI-DSS compliance maintenance, with audit preparation consuming 6 months of their security team's time annually. They needed to migrate to AWS while maintaining PCI-DSS Level 1 certification without any gap in compliance.

## Our Solution
- Designed PCI-DSS Level 1 compliant AWS architecture with dedicated cardholder data environment (CDE)
- Implemented network segmentation using Transit Gateway with strict security group policies
- Deployed AWS Config rules and custom Lambda functions for continuous compliance monitoring
- Used tokenization (AWS Payment Cryptography) to minimize PCI scope
- Created automated evidence collection for 300+ PCI-DSS controls
- Executed migration using blue/green deployment pattern for zero-downtime cutover

## Results
- PCI-DSS Level 1 re-certification achieved on first attempt post-migration
- Audit preparation time reduced from 6 months to 2.5 months (60% reduction)
- 300+ compliance controls monitored in real-time with automated alerting
- Infrastructure costs reduced 28% through cloud optimization
- Transaction processing latency improved by 35%

## Relevance
Demonstrates our ability to handle the most sensitive regulated workloads with zero compliance gaps during migration.`,
    client_industry: "financial_services",
    service_line: "cloud_migration",
    client_size: "enterprise",
    outcomes_demonstrated: [
      { outcome: "compliance", description: "PCI-DSS Level 1 certified on first attempt post-migration" },
      { outcome: "speed_to_value", description: "60% reduction in audit preparation time" },
      { outcome: "cost_optimization", description: "28% infrastructure cost reduction" },
      { outcome: "quality_improvement", description: "35% improvement in transaction processing latency" },
    ],
    metrics: [
      { name: "Transaction Volume", value: "$2B+/year", context: "Payment processing" },
      { name: "Compliance Controls", value: "300+", context: "Automated real-time monitoring" },
      { name: "Audit Prep Reduction", value: "60%", context: "6 months to 2.5 months" },
      { name: "Cost Reduction", value: "28%", context: "Infrastructure costs" },
    ],
    is_verified: true,
    verification_notes: "SecureFinance CISO provided reference. QSA audit report confirms findings.",
  },
  {
    evidence_type: "case_study",
    title: "TechScale SaaS — Monolith to Serverless Transformation",
    summary:
      "Transformed a Python monolith SaaS platform to serverless architecture on AWS Lambda, reducing monthly infrastructure costs from $45K to $8K and enabling the engineering team to ship features 4x faster.",
    full_content: `# TechScale SaaS — Monolith to Serverless Transformation

## Client Challenge
TechScale operates a B2B analytics SaaS platform with 500+ enterprise customers. Their Python Django monolith ran on a fleet of 24 EC2 instances. Costs were $45K/month, deployment took 2 hours with 10-minute downtime windows, and adding new features required full regression testing of the entire codebase.

## Our Solution
- Decomposed the monolith into event-driven serverless functions using AWS Lambda, Step Functions, and API Gateway
- Migrated from RDS MySQL to DynamoDB for high-throughput analytics ingestion, kept Aurora PostgreSQL for transactional data
- Implemented event-driven architecture with EventBridge and SQS for async processing
- Built shared libraries and a custom Lambda deployment framework reducing cold starts to <200ms
- Created comprehensive CI/CD with automated testing per microservice, enabling independent deployments

## Results
- Monthly infrastructure cost dropped from $45K to $8K (82% reduction)
- Deployment time reduced from 2 hours to 8 minutes with zero downtime
- Feature delivery velocity increased 4x (weekly releases to multiple daily)
- Platform handles 10x traffic spikes automatically with no pre-provisioning
- Engineering team satisfaction score improved from 3.2 to 4.7/5

## Relevance
Demonstrates our serverless and app modernization capabilities for SaaS companies looking to dramatically reduce costs and accelerate delivery.`,
    client_industry: "technology",
    service_line: "app_modernization",
    client_size: "mid_market",
    outcomes_demonstrated: [
      { outcome: "cost_optimization", description: "82% infrastructure cost reduction ($45K to $8K/month)" },
      { outcome: "speed_to_value", description: "4x faster feature delivery, deployments in 8 min" },
      { outcome: "quality_improvement", description: "Zero-downtime deployments, handles 10x traffic spikes" },
      { outcome: "innovation", description: "Event-driven serverless architecture" },
    ],
    metrics: [
      { name: "Cost Reduction", value: "82%", context: "$45K to $8K/month" },
      { name: "Deployment Time", value: "8 minutes", context: "Down from 2 hours" },
      { name: "Feature Velocity", value: "4x faster", context: "Multiple daily vs. weekly releases" },
      { name: "Auto-Scaling", value: "10x traffic", context: "No pre-provisioning needed" },
    ],
    is_verified: true,
    verification_notes: "TechScale CEO provided public testimonial.",
  },

  // Metrics
  {
    evidence_type: "metric",
    title: "Cloud Migration Track Record",
    summary: "Aggregate delivery metrics across 200+ cloud migration engagements.",
    full_content: "General Company has completed 200+ cloud migration engagements since 2015, migrating over 15,000 servers and 2,000+ applications to AWS, Azure, and GCP. Our Migration Factory methodology delivers a 98.5% on-time completion rate with zero unplanned production outages across the last 50 engagements.",
    client_industry: null,
    service_line: "cloud_migration",
    outcomes_demonstrated: [
      { outcome: "quality_improvement", description: "98.5% on-time delivery rate" },
      { outcome: "risk_reduction", description: "Zero unplanned outages in last 50 engagements" },
    ],
    metrics: [
      { name: "Engagements Completed", value: "200+", context: "Since 2015" },
      { name: "Servers Migrated", value: "15,000+", context: "Across all engagements" },
      { name: "Applications Migrated", value: "2,000+", context: "Across all cloud platforms" },
      { name: "On-Time Delivery", value: "98.5%", context: "Last 3 years" },
      { name: "Unplanned Outages", value: "Zero", context: "Last 50 engagements" },
    ],
    is_verified: true,
    verification_notes: "Internal delivery metrics validated by VP of Delivery.",
  },
  {
    evidence_type: "metric",
    title: "Average Client Cost Savings",
    summary: "Clients achieve an average 35% reduction in total infrastructure costs within 12 months of cloud migration.",
    full_content: "Across our portfolio of cloud migration clients, the average total cost of ownership (TCO) reduction is 35% within 12 months of migration completion. This includes infrastructure costs, licensing savings (Oracle, VMware, etc.), and reduced operational overhead. Our FinOps-first approach ensures cost optimization is built into every engagement from the planning phase, not bolted on after migration.",
    client_industry: null,
    service_line: "cloud_migration",
    outcomes_demonstrated: [
      { outcome: "cost_optimization", description: "35% average TCO reduction within 12 months" },
    ],
    metrics: [
      { name: "Average TCO Reduction", value: "35%", context: "Within 12 months of migration" },
      { name: "Largest Single Savings", value: "$4.76M/year", context: "National Insurance Group" },
      { name: "Average License Savings", value: "45%", context: "Oracle/VMware license elimination" },
    ],
    is_verified: true,
    verification_notes: "Aggregated from client engagement data. Reviewed by finance team.",
  },
  {
    evidence_type: "metric",
    title: "Application Modernization Impact",
    summary: "Clients see an average 3.5x improvement in deployment frequency and 60% reduction in incident response time after modernization.",
    full_content: "Our application modernization engagements consistently deliver measurable improvements in development velocity and operational resilience. Key outcomes across our portfolio: 3.5x average improvement in deployment frequency, 60% average reduction in mean time to recovery (MTTR), 45% average reduction in application infrastructure costs, and 92% client satisfaction score (post-engagement survey).",
    client_industry: null,
    service_line: "app_modernization",
    outcomes_demonstrated: [
      { outcome: "speed_to_value", description: "3.5x deployment frequency improvement" },
      { outcome: "quality_improvement", description: "60% reduction in MTTR" },
    ],
    metrics: [
      { name: "Deployment Frequency", value: "3.5x improvement", context: "Average across engagements" },
      { name: "MTTR Reduction", value: "60%", context: "Mean time to recovery" },
      { name: "Cost Reduction", value: "45%", context: "Application infrastructure costs" },
      { name: "Client Satisfaction", value: "92%", context: "Post-engagement survey score" },
    ],
    is_verified: true,
    verification_notes: "Portfolio metrics from delivery analytics dashboard.",
  },
  {
    evidence_type: "metric",
    title: "Team Certifications",
    summary: "120+ team members holding 300+ active cloud certifications across AWS, Azure, and GCP.",
    full_content: "General Company's engineering team maintains 300+ active cloud certifications: 120+ AWS certifications (including 8 Solutions Architect Professional, 12 DevOps Engineer Professional), 95+ Azure certifications (including Azure Expert MSP validation), 45+ GCP certifications, 25+ Kubernetes CKA/CKAD, and 20+ HashiCorp Terraform Associate/Engineer certifications.",
    client_industry: null,
    service_line: null,
    outcomes_demonstrated: [
      { outcome: "quality_improvement", description: "300+ active cloud certifications across the team" },
    ],
    metrics: [
      { name: "AWS Certifications", value: "120+", context: "Including 8 SA Professional" },
      { name: "Azure Certifications", value: "95+", context: "Azure Expert MSP validated" },
      { name: "GCP Certifications", value: "45+", context: "Infrastructure & Application Dev" },
      { name: "Kubernetes (CKA/CKAD)", value: "25+", context: "Certified administrators and developers" },
      { name: "Terraform Certified", value: "20+", context: "HashiCorp Associate and Engineer" },
    ],
    is_verified: true,
    verification_notes: "HR certification tracking system. Updated quarterly.",
  },

  // Testimonials
  {
    evidence_type: "testimonial",
    title: "National Insurance Group CTO Testimonial",
    summary: "\"General Company's Migration Factory approach was unlike anything we'd seen. They migrated 450 servers in 9 months with zero downtime — our board was genuinely impressed.\"",
    full_content: "\"We evaluated four consulting firms for our data center migration. General Company was the only one that showed up with a proven, automated methodology rather than a generic slide deck. Their Migration Factory approach was unlike anything we'd seen — automated discovery, parallel wave execution, built-in rollback. They migrated 450 servers in 9 months with zero downtime. Our board was genuinely impressed, and the $4.76M in annual savings speaks for itself.\" — James Chen, CTO, National Insurance Group",
    client_industry: "insurance",
    service_line: "cloud_migration",
    client_size: "enterprise",
    outcomes_demonstrated: [
      { outcome: "quality_improvement", description: "Zero downtime migration recognized by board" },
      { outcome: "cost_optimization", description: "$4.76M annual savings" },
    ],
    metrics: [],
    is_verified: true,
    verification_notes: "Written testimonial approved by National Insurance Group legal.",
  },
  {
    evidence_type: "testimonial",
    title: "MedVault Health CEO Testimonial",
    summary: "\"They took our creaking monolith and turned it into a platform our developers actually love working on. Deployment went from a monthly nightmare to something we do 15 times a day.\"",
    full_content: "\"Before General Company, deploying to production was a monthly event that required a war room and kept our CTO up all night. Now we deploy 15+ times a day and nobody breaks a sweat. They took our creaking monolith and turned it into a platform our developers actually love working on. Response times went from 3 seconds to under 200 milliseconds. And we passed our HIPAA audit with zero findings for the first time in our company's history.\" — Dr. Sarah Kim, CEO, MedVault Health",
    client_industry: "healthcare",
    service_line: "app_modernization",
    client_size: "mid_market",
    outcomes_demonstrated: [
      { outcome: "speed_to_value", description: "Monthly to 15+/day deployments" },
      { outcome: "compliance", description: "First-ever zero-finding HIPAA audit" },
    ],
    metrics: [],
    is_verified: true,
    verification_notes: "Published with CEO approval. Used on website and in proposals.",
  },

  // Certifications as evidence
  {
    evidence_type: "certification",
    title: "AWS Advanced Consulting Partner — Migration Competency",
    summary: "AWS-validated migration methodology and delivery track record with 40+ AWS-certified professionals.",
    full_content: "General Company holds AWS Advanced Consulting Partner status with the Migration Competency designation. This competency requires AWS to validate our migration methodology, review customer references, and confirm technical expertise. We maintain 40+ AWS-certified professionals including 8 Solutions Architect Professional certifications — the highest-level AWS architecture credential.",
    client_industry: null,
    service_line: "cloud_migration",
    outcomes_demonstrated: [
      { outcome: "quality_improvement", description: "AWS-validated migration methodology" },
    ],
    metrics: [
      { name: "Partner Tier", value: "Advanced", context: "AWS Consulting Partner" },
      { name: "Competency", value: "Migration", context: "AWS-validated methodology" },
      { name: "Certified Pros", value: "40+", context: "AWS certifications" },
    ],
    is_verified: true,
    verification_notes: "Verified on AWS Partner Directory.",
  },
  {
    evidence_type: "certification",
    title: "Microsoft Azure Expert MSP",
    summary: "Highest tier of Microsoft cloud partnership with audited delivery practices and 35+ Azure-certified professionals.",
    full_content: "General Company holds Microsoft Azure Expert MSP status — the highest tier of Microsoft's Managed Service Provider partner program. This designation requires a rigorous third-party audit of our cloud practices, delivery methodology, service management, and operational excellence. We maintain 35+ Azure-certified professionals and have delivered Azure solutions for healthcare, financial services, and retail clients.",
    client_industry: null,
    service_line: "cloud_migration",
    outcomes_demonstrated: [
      { outcome: "quality_improvement", description: "Audited delivery practices at highest Microsoft tier" },
    ],
    metrics: [
      { name: "Partner Tier", value: "Expert MSP", context: "Highest Azure partner level" },
      { name: "Certified Pros", value: "35+", context: "Azure certifications" },
    ],
    is_verified: true,
    verification_notes: "Verified on Microsoft Partner Directory.",
  },
];

// ===========================================
// SAMPLE PROPOSAL — Cloud Migration RFP
// ===========================================
const SAMPLE_PROPOSAL = {
  title: "Meridian Financial — Core Banking Cloud Migration",
  status: "intake",
  intake_data: {
    client_name: "Meridian Financial Services",
    client_industry: "financial_services",
    client_size: "enterprise",
    opportunity_type: "cloud_migration",
    scope_description:
      "Meridian Financial Services is seeking a qualified technology partner to migrate their core banking platform and supporting applications from their primary on-premises data center to AWS. The engagement covers 280+ servers hosting 45 applications including their core banking system (Temenos T24), customer portal, lending platform, and regulatory reporting suite. The migration must maintain PCI-DSS Level 1 and SOX compliance throughout, with zero downtime for customer-facing systems. Meridian also wants to modernize their batch processing pipeline (currently 8-hour overnight window) to support near-real-time processing.",
    key_requirements: [
      "Migrate 280+ servers and 45 applications to AWS within 12 months",
      "Maintain PCI-DSS Level 1 and SOX compliance throughout migration with no audit gaps",
      "Zero downtime for customer-facing banking portal and mobile app",
      "Modernize batch processing from 8-hour overnight window to near-real-time",
      "Migrate Oracle 19c RAC databases to Aurora PostgreSQL or equivalent",
      "Implement cloud-native disaster recovery with RPO <15 min and RTO <1 hour",
      "Knowledge transfer to Meridian's 12-person infrastructure team",
      "FinOps framework with monthly cost reporting and optimization recommendations",
    ],
    budget_range: "$2.5M - $4M",
    timeline_expectation: "12 months with phased delivery milestones",
    technical_environment:
      "VMware vSphere 7.0 on Dell PowerEdge servers, Oracle 19c RAC (3 clusters), Temenos T24 core banking on AIX (being replatformed to Linux), F5 BIG-IP load balancers, Cisco Nexus networking, NetApp SAN storage, IBM MQ for messaging, Informatica for ETL, Splunk for logging, CyberArk for privileged access",
    compliance_requirements: [
      "PCI-DSS Level 1",
      "SOX (Sarbanes-Oxley)",
      "SOC 2 Type II",
      "OCC regulatory requirements",
      "FFIEC guidelines",
    ],
    competitive_intel:
      "Meridian is also evaluating Accenture and Deloitte. They are concerned about big-firm overhead and want a partner with hands-on technical depth, not just project managers. Previous Accenture engagement on a different project went 40% over budget.",
    current_state_pains: [
      "Data center lease expires in 18 months — hard deadline to exit",
      "Oracle licensing renewal due in 8 months at $1.8M/year — want to avoid paying",
      "Batch processing 8-hour window causing delays in regulatory reporting",
      "Scaling for peak periods requires 6-week lead time for hardware procurement",
      "DR site is 3 years behind primary — actual RTO is estimated at 48+ hours",
      "Security team spending 40% of time on infrastructure patching vs. strategic work",
    ],
    desired_outcomes: [
      "Exit data center before lease expiration (18-month hard deadline)",
      "Eliminate Oracle licensing ($1.8M/year savings target)",
      "Reduce infrastructure TCO by 30%+ within first year",
      "Achieve cloud-native DR with RPO <15 min and RTO <1 hour",
      "Enable near-real-time transaction processing (replace batch window)",
      "Free security team to focus on threat detection vs. patching",
    ],
    must_include: [
      "Detailed migration wave plan with application-level sequencing",
      "Compliance transition plan showing continuous PCI-DSS/SOX coverage",
      "Database migration strategy for Oracle to PostgreSQL",
      "Disaster recovery architecture and testing plan",
      "FinOps framework with projected cost model",
      "Knowledge transfer plan for internal team",
      "Risk register with mitigation strategies",
    ],
    must_avoid: [
      "Generic lift-and-shift without optimization recommendations",
      "Proposing solutions that require Oracle licensing in the cloud",
      "Underestimating Temenos T24 complexity — this is a specialized banking platform",
      "Assuming batch processing can be modernized without core banking vendor coordination",
    ],
  },
  intake_source_type: "manual",
};

// ===========================================
// MAIN EXECUTION
// ===========================================
async function main() {
  console.log("=== Setting up General Company Demo Account ===\n");

  // Step 0: Fix the auth trigger (same pattern as other seed scripts)
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
  const { error: sqlError } = await supabase.rpc("exec_sql", { sql: fixTriggerSQL });
  if (sqlError) {
    console.log(`  Could not fix trigger via RPC: ${sqlError.message}`);
    console.log("  Continuing anyway...");
  } else {
    console.log("  Trigger fixed!");
  }

  // Step 1: Create or find organization
  console.log("\nStep 1: Creating organization...");
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: ORG_NAME,
      slug: ORG_SLUG,
      plan_tier: "pro",
      plan_limits: {
        proposals_per_month: 50,
        ai_tokens_per_month: 500000,
        max_users: 10,
        max_documents: 100,
      },
      settings: {
        description: "Cloud migration and application modernization experts",
        industry: "technology_consulting",
        proposal_types: ["cloud_migration", "app_modernization", "cloud_security", "devops"],
        differentiators: [
          "Migration Factory methodology — 40% faster migrations through automation",
          "200+ successful engagements with 98.5% on-time delivery",
          "Deep regulated-industry expertise (HIPAA, PCI-DSS, SOX)",
          "FinOps-first approach saving clients 35% average on cloud costs",
          "120+ certified cloud architects across AWS, Azure, and GCP",
        ],
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      },
      trial_ends_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
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
        .eq("slug", ORG_SLUG)
        .single();
      if (!existing) {
        console.error("  Cannot find existing org!");
        process.exit(1);
      }
      orgId = existing.id;

      // Update plan and settings for existing org
      await supabase.from("organizations").update({
        plan_tier: "pro",
        plan_limits: {
          proposals_per_month: 50,
          ai_tokens_per_month: 500000,
          max_users: 10,
          max_documents: 100,
        },
        settings: {
          description: "Cloud migration and application modernization experts",
          industry: "technology_consulting",
          proposal_types: ["cloud_migration", "app_modernization", "cloud_security", "devops"],
          differentiators: [
            "Migration Factory methodology — 40% faster migrations through automation",
            "200+ successful engagements with 98.5% on-time delivery",
            "Deep regulated-industry expertise (HIPAA, PCI-DSS, SOX)",
            "FinOps-first approach saving clients 35% average on cloud costs",
            "120+ certified cloud architects across AWS, Azure, and GCP",
          ],
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        },
        trial_ends_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      }).eq("id", orgId);
    } else {
      console.error("  Error creating org:", orgError.message);
      process.exit(1);
    }
  } else {
    orgId = org.id;
    console.log(`  Created org: ${orgId}`);
  }

  // Step 2: Find the existing auth user
  console.log("\nStep 2: Finding user account...");
  let userId: string | undefined;
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find((u) => u.email === DEMO_EMAIL);

  if (existingUser) {
    userId = existingUser.id;
    console.log(`  Found existing user: ${userId}`);
    // Confirm email if not already confirmed
    await supabase.auth.admin.updateUserById(userId, { email_confirm: true });
  } else {
    console.log(`  User ${DEMO_EMAIL} not found in auth.users!`);
    console.log("  Please create the account in Supabase Dashboard first.");
    console.log("  Continuing with L1 seeding (no profile link)...");
  }

  // Step 3: Link profile to org
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
      console.error("  Error linking profile:", profileError.message);
    } else {
      console.log("  Profile linked to org!");
    }
  }

  // Step 4: Seed Company Context
  console.log("\nStep 4: Seeding Company Context...");
  let contextCount = 0;
  for (const ctx of COMPANY_CONTEXT) {
    const { error } = await supabase.from("company_context").upsert(
      { ...ctx, organization_id: orgId, metadata: {} },
      { onConflict: "organization_id,category,key" },
    );
    if (error) {
      const { error: insertError } = await supabase
        .from("company_context")
        .insert({ ...ctx, organization_id: orgId, metadata: {} });
      if (insertError && !insertError.message.includes("duplicate")) {
        console.error(`   Error: ${ctx.key}: ${insertError.message}`);
      } else {
        contextCount++;
        console.log(`   + ${ctx.category}/${ctx.key}`);
      }
    } else {
      contextCount++;
      console.log(`   + ${ctx.category}/${ctx.key}`);
    }
  }

  // Step 5: Seed Product Contexts
  console.log("\nStep 5: Seeding Product Contexts...");
  let productCount = 0;
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
        productCount++;
        console.log(`   + ${prod.product_name} (${prod.service_line})`);
      }
    } else {
      productCount++;
      console.log(`   + ${prod.product_name} (${prod.service_line})`);
    }
  }

  // Step 6: Seed Evidence Library
  console.log("\nStep 6: Seeding Evidence Library...");
  let evidenceCount = 0;
  for (const ev of EVIDENCE_LIBRARY) {
    const { error } = await supabase
      .from("evidence_library")
      .insert({ ...ev, organization_id: orgId });
    if (error) {
      if (error.message.includes("duplicate")) {
        // Update existing
        const { error: updateError } = await supabase
          .from("evidence_library")
          .update({ ...ev, organization_id: orgId })
          .eq("title", ev.title)
          .eq("organization_id", orgId);
        if (updateError) {
          console.error(`   Error updating: ${ev.title}: ${updateError.message}`);
        } else {
          evidenceCount++;
          console.log(`   ~ ${ev.evidence_type}: ${ev.title} (updated)`);
        }
      } else {
        console.error(`   Error: ${ev.title}: ${error.message}`);
      }
    } else {
      evidenceCount++;
      console.log(`   + ${ev.evidence_type}: ${ev.title}`);
    }
  }

  // Step 7: Create sample proposal
  if (userId) {
    console.log("\nStep 7: Creating sample proposal...");

    // Check if proposal already exists
    const { data: existingProposal } = await supabase
      .from("proposals")
      .select("id")
      .eq("title", SAMPLE_PROPOSAL.title)
      .eq("organization_id", orgId)
      .single();

    if (existingProposal) {
      console.log(`  Proposal already exists: ${existingProposal.id}`);
      // Update it
      await supabase
        .from("proposals")
        .update({
          intake_data: SAMPLE_PROPOSAL.intake_data,
          status: SAMPLE_PROPOSAL.status,
          intake_source_type: SAMPLE_PROPOSAL.intake_source_type,
        })
        .eq("id", existingProposal.id);
      console.log("  Updated existing proposal.");
    } else {
      const { data: proposal, error: propError } = await supabase
        .from("proposals")
        .insert({
          title: SAMPLE_PROPOSAL.title,
          status: SAMPLE_PROPOSAL.status,
          intake_data: SAMPLE_PROPOSAL.intake_data,
          intake_source_type: SAMPLE_PROPOSAL.intake_source_type,
          organization_id: orgId,
          created_by: userId,
        })
        .select("id")
        .single();

      if (propError) {
        console.error("  Error creating proposal:", propError.message);
      } else {
        console.log(`  Created proposal: ${proposal.id}`);

        // Seed some requirements for the compliance matrix
        console.log("  Seeding compliance requirements...");
        const requirements = [
          { requirement_text: "Migrate 280+ servers and 45 applications to AWS within 12 months", category: "mandatory", requirement_type: "content", compliance_status: "not_addressed" },
          { requirement_text: "Maintain PCI-DSS Level 1 compliance throughout migration with zero audit gaps", category: "mandatory", requirement_type: "certification", compliance_status: "not_addressed" },
          { requirement_text: "Maintain SOX compliance throughout migration", category: "mandatory", requirement_type: "certification", compliance_status: "not_addressed" },
          { requirement_text: "Zero downtime for customer-facing banking portal and mobile app during migration", category: "mandatory", requirement_type: "content", compliance_status: "not_addressed" },
          { requirement_text: "Migrate Oracle 19c RAC databases to Aurora PostgreSQL or equivalent managed service", category: "mandatory", requirement_type: "content", compliance_status: "not_addressed" },
          { requirement_text: "Implement cloud-native DR with RPO <15 min and RTO <1 hour", category: "mandatory", requirement_type: "content", compliance_status: "not_addressed" },
          { requirement_text: "Modernize batch processing from 8-hour overnight window to near-real-time", category: "mandatory", requirement_type: "content", compliance_status: "not_addressed" },
          { requirement_text: "Knowledge transfer plan for 12-person internal infrastructure team", category: "mandatory", requirement_type: "content", compliance_status: "not_addressed" },
          { requirement_text: "Provide detailed migration wave plan with application-level sequencing", category: "mandatory", requirement_type: "format", compliance_status: "not_addressed" },
          { requirement_text: "Include FinOps framework with monthly cost reporting and optimization recommendations", category: "desirable", requirement_type: "content", compliance_status: "not_addressed" },
          { requirement_text: "Include risk register with mitigation strategies for top 10 risks", category: "desirable", requirement_type: "format", compliance_status: "not_addressed" },
          { requirement_text: "Compliance transition plan showing continuous PCI-DSS/SOX coverage during each phase", category: "mandatory", requirement_type: "format", compliance_status: "not_addressed" },
          { requirement_text: "Vendor must hold AWS Migration Competency or equivalent certification", category: "mandatory", requirement_type: "certification", compliance_status: "met" },
          { requirement_text: "Vendor must hold SOC 2 Type II certification", category: "mandatory", requirement_type: "certification", compliance_status: "met" },
          { requirement_text: "Provide at least 3 reference clients in financial services with similar migration scope", category: "desirable", requirement_type: "content", compliance_status: "met" },
        ];

        for (const req of requirements) {
          await supabase.from("proposal_requirements").insert({
            ...req,
            proposal_id: proposal.id,
            organization_id: orgId,
            is_extracted: false,
          });
        }
        console.log(`  Seeded ${requirements.length} compliance requirements.`);
      }
    }
  }

  // Summary
  console.log("\n========================================");
  console.log("  General Company Demo Account Ready!");
  console.log("========================================");
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Org:      ${ORG_NAME}`);
  console.log(`  Org ID:   ${orgId}`);
  if (userId) {
    console.log(`  User ID:  ${userId}`);
  }
  console.log("========================================");
  console.log(`\n  L1 Context Seeded:`);
  console.log(`   - ${contextCount} company context entries (brand, values, certs, partnerships)`);
  console.log(`   - ${productCount} product contexts (cloud migration, app modernization, security, devops)`);
  console.log(`   - ${evidenceCount} evidence library entries (case studies, metrics, testimonials, certs)`);
  console.log(`   - 1 sample proposal: "${SAMPLE_PROPOSAL.title}" (ready to generate)`);
  console.log(`   - 15 compliance requirements pre-loaded`);
  console.log("\n  What the user can do:");
  console.log("   1. Log in and see L1 data at /settings/company");
  console.log("   2. Browse evidence library at /knowledge-base");
  console.log("   3. Open the sample proposal and click Generate to create all 10 sections");
  console.log("   4. Run quality review to test the council judges");
  console.log("   5. Export to PDF and verify diagrams render");
  console.log("   6. Create a new proposal from scratch to test the full flow");
  console.log("========================================\n");
}

main().catch(console.error);
