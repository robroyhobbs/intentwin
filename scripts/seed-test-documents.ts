/**
 * Seed 5 test documents into the knowledge base.
 *
 * Usage:
 *   npx tsx scripts/seed-test-documents.ts <user-email> <user-password>
 *
 * This script:
 *  1. Signs in as the given user
 *  2. Creates 5 sample DOCX files with realistic proposal content
 *  3. Uploads each via the /api/documents/upload endpoint
 *  4. The backend pipeline will parse, chunk, and embed them automatically
 */

import { createClient } from "@supabase/supabase-js";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

interface TestDoc {
  title: string;
  documentType: string;
  industry: string;
  serviceLine: string;
  clientName: string;
  winStatus: string;
  content: string;
}

const TEST_DOCUMENTS: TestDoc[] = [
  {
    title: "Global Bank Cloud Migration Proposal",
    documentType: "proposal",
    industry: "financial_services",
    serviceLine: "cloud_migration",
    clientName: "Global Bank Corp",
    winStatus: "won",
    content: `EXECUTIVE SUMMARY

Acme Corp is pleased to present this proposal for Global Bank Corp's enterprise cloud migration initiative. Our approach leverages our proven Cloud Migration methodology to migrate 200+ applications to AWS over an 18-month engagement.

UNDERSTANDING YOUR NEEDS

Global Bank Corp seeks to modernize its technology infrastructure by migrating from on-premises data centers to a cloud-native architecture on AWS. Key drivers include reducing infrastructure costs by 40%, improving application resilience, meeting regulatory compliance (SOC 2, PCI-DSS), and enabling faster time-to-market for new digital banking products.

The current environment includes 200+ applications spanning core banking, payments processing, risk management, and customer-facing digital channels. Many applications run on legacy middleware that requires modernization as part of the migration.

OUR APPROACH

Phase 1 - Discovery & Planning (Months 1-3)
We will conduct a comprehensive application portfolio assessment using our Cloud Readiness Assessment tool. Each application will be categorized using the 7Rs framework (Rehost, Replatform, Refactor, Repurchase, Retire, Retain, Relocate).

Phase 2 - Foundation & Landing Zone (Months 2-4)
Our certified AWS architects will design and implement a secure, compliant landing zone following AWS Well-Architected Framework principles. This includes network architecture, identity management, security controls, and governance guardrails.

Phase 3 - Migration Waves (Months 4-16)
Applications will be migrated in 8 waves, organized by business domain and dependency mapping. Each wave follows our standardized migration runbook with automated testing and rollback procedures.

Phase 4 - Optimization & Handover (Months 15-18)
Post-migration optimization including cost management, performance tuning, and knowledge transfer to Global Bank's internal teams.

METHODOLOGY

Our Cloud Migration methodology is a battle-tested approach that has successfully delivered 100+ cloud migrations. Key differentiators include automated discovery tools, standardized migration runbooks, parallel execution capabilities, and built-in compliance controls for regulated industries.

TEAM STRUCTURE

The engagement will be led by a team of 45 professionals including a Program Director, Solution Architect, Migration Lead, Security Lead, and domain-specific technical leads. All key personnel hold AWS Professional certifications.

CASE STUDIES

Similar engagement: We migrated 350 applications to Azure for a Tier-1 European bank, achieving 35% cost reduction and 99.99% uptime during migration. The project was completed 2 months ahead of schedule.

TIMELINE AND INVESTMENT

Total engagement: 18 months
Team size: 45 FTEs (peak)
Investment: $12.5M - $15M
Expected ROI: 40% infrastructure cost reduction within Year 1 post-migration

WHY ACME CORP

With 500+ team members, Acme Corp is a leading provider of cloud transformation and technology consulting services. Our cloud practice includes 200+ cloud professionals and holds advanced partnership status with AWS, Azure, and GCP.`,
  },
  {
    title: "RetailMax Application Modernization Proposal",
    documentType: "proposal",
    industry: "retail",
    serviceLine: "app_modernization",
    clientName: "RetailMax Inc",
    winStatus: "won",
    content: `EXECUTIVE SUMMARY

Acme Corp proposes a comprehensive application modernization program for RetailMax Inc, transforming legacy monolithic applications into cloud-native microservices architecture. This initiative will enable RetailMax to achieve faster release cycles, improved scalability during peak seasons, and reduced operational costs.

UNDERSTANDING YOUR NEEDS

RetailMax operates a large-scale e-commerce platform serving 15 million customers. The current monolithic Java application struggles with peak traffic during holiday seasons, requires 6-week release cycles, and has accumulated significant technical debt over 12 years of development.

Key challenges include:
- 4-6 week deployment cycles limiting business agility
- System outages during Black Friday/Cyber Monday peaks
- Difficulty attracting modern engineering talent
- Rising infrastructure costs with diminishing returns
- Inability to rapidly test and deploy new customer features

OUR APPROACH

We recommend a strangler fig pattern approach to incrementally modernize the monolith while maintaining business continuity:

Stream 1 - Domain-Driven Decomposition
Our architects will work with RetailMax business stakeholders to identify bounded contexts and define a target microservices architecture. We recommend starting with the Product Catalog and Inventory Management domains.

Stream 2 - Platform Engineering
Build a modern cloud-native platform on Kubernetes (EKS) with CI/CD pipelines, observability stack (Datadog), and service mesh (Istio) to support microservices deployment.

Stream 3 - Incremental Migration
Systematically extract services from the monolith, beginning with highest-value, lowest-risk domains. Each service will be built using Spring Boot, containerized with Docker, and deployed to EKS.

Stream 4 - Data Modernization
Decompose the shared Oracle database into domain-specific data stores. Implement event-driven architecture using Apache Kafka for inter-service communication.

METHODOLOGY

Our Application Modernization methodology is based on 15+ years of experience transforming legacy systems. We employ Agile delivery with 2-week sprints, continuous integration/deployment, and automated testing to ensure quality and velocity.

TEAM STRUCTURE

A cross-functional team of 30 engineers including Solution Architects, Backend Engineers, DevOps Engineers, QA Automation Engineers, and an Agile Coach. All team members have hands-on microservices experience.

TIMELINE AND INVESTMENT

Phase 1 (Foundation): 3 months - $2.1M
Phase 2 (Core Services): 6 months - $4.8M
Phase 3 (Advanced Services): 6 months - $4.2M
Phase 4 (Optimization): 3 months - $1.4M
Total: 18 months, $12.5M

WHY ACME CORP

Acme Corp has delivered 50+ application modernization programs. Our retail practice serves multiple top global retailers, bringing deep domain expertise alongside technical excellence.`,
  },
  {
    title: "MedTech Health Cloud Migration Case Study",
    documentType: "case_study",
    industry: "healthcare",
    serviceLine: "cloud_migration",
    clientName: "MedTech Health Systems",
    winStatus: "won",
    content: `CASE STUDY: MEDTECH HEALTH SYSTEMS - HIPAA-COMPLIANT CLOUD MIGRATION

CLIENT PROFILE
MedTech Health Systems is a leading healthcare technology provider serving 500+ hospitals and 50,000+ physicians across North America. Their platform processes 2 million patient records daily.

CHALLENGE
MedTech's on-premises infrastructure was reaching end-of-life, requiring significant capital investment to refresh. At the same time, their customers demanded improved interoperability via FHIR APIs, faster feature delivery, and guaranteed 99.99% uptime. All of this needed to happen while maintaining strict HIPAA compliance and SOC 2 Type II certification.

Key constraints:
- Zero tolerance for data breaches or PHI exposure
- Cannot interrupt 24/7 clinical workflows
- Must maintain HIPAA compliance throughout migration
- 500+ database instances to migrate
- Complex HL7/FHIR integration requirements

SOLUTION
Acme Corp designed and executed a phased migration to AWS GovCloud, incorporating healthcare-specific security controls and compliance automation:

1. Compliance-First Architecture: Built a HIPAA-compliant landing zone with encryption at rest and in transit, VPC segmentation, CloudTrail auditing, and AWS Config rules for continuous compliance monitoring.

2. Database Migration: Used AWS Database Migration Service (DMS) with custom transformations to migrate 500+ PostgreSQL and Oracle databases with zero data loss. Blue-green deployment approach ensured rollback capability.

3. Application Re-platforming: Containerized 85 applications using Amazon ECS Fargate, eliminating server management overhead while maintaining isolation requirements.

4. Integration Modernization: Replaced legacy HL7 interfaces with FHIR R4 APIs running on Amazon API Gateway, improving interoperability with 200+ third-party health systems.

RESULTS
- 45% reduction in infrastructure costs ($8M annual savings)
- 99.995% uptime achieved (exceeded 99.99% target)
- Deployment frequency improved from monthly to daily
- Passed HIPAA audit with zero findings
- SOC 2 Type II recertification achieved in 3 months post-migration
- Customer NPS improved from 42 to 67

ENGAGEMENT DETAILS
Duration: 14 months
Team Size: 35 FTEs (peak)
Investment: $9.2M
Technologies: AWS GovCloud, ECS Fargate, RDS, DMS, API Gateway, CloudWatch, Config, CloudTrail`,
  },
  {
    title: "Cloud Migration Methodology Overview",
    documentType: "methodology",
    industry: "",
    serviceLine: "cloud_migration",
    clientName: "",
    winStatus: "unknown",
    content: `CLOUD MIGRATION METHODOLOGY OVERVIEW

1. INTRODUCTION

Our Cloud Migration methodology is an industrialized approach to enterprise cloud migration. Developed over 10 years and refined through 100+ engagements, it provides a repeatable, scalable framework for migrating complex IT estates to public cloud platforms.

2. CORE PRINCIPLES

- Business-Value Driven: Prioritize migrations based on business impact
- Risk-Managed: Comprehensive risk assessment and mitigation at every stage
- Automated: Maximum automation of assessment, migration, and testing
- Compliant: Built-in compliance controls for regulated industries
- Cloud-Agnostic: Supports AWS, Azure, and GCP

3. PHASES

PHASE 1: DISCOVER
- Application portfolio discovery using automated scanning tools
- Infrastructure dependency mapping
- Cloud readiness assessment (CRA) scoring
- Total cost of ownership (TCO) analysis
- Business case development

PHASE 2: DESIGN
- Target architecture design per application
- 7R disposition analysis (Rehost, Replatform, Refactor, Repurchase, Retire, Retain, Relocate)
- Landing zone architecture
- Security and compliance framework
- Migration wave planning

PHASE 3: MIGRATE
- Landing zone deployment and validation
- Wave-based migration execution
- Automated testing (functional, performance, security)
- Cutover planning and execution
- Hypercare support

PHASE 4: OPTIMIZE
- Cost optimization (right-sizing, reserved instances, spot)
- Performance tuning
- Operational readiness assessment
- Knowledge transfer and training
- Continuous improvement framework

4. TOOLS & ACCELERATORS

- Cloud Readiness Assessment (CRA) Tool: Automated application analysis
- Migration Runbook Generator: Template-based runbooks per 7R pattern
- Compliance Control Library: Pre-built controls for SOC2, HIPAA, PCI-DSS, GDPR
- Cost Optimization Engine: Continuous cost monitoring and recommendations
- Wave Orchestrator: Automated migration wave scheduling and tracking

5. QUALITY GATES

Each phase concludes with a quality gate review:
- Gate 1: Discovery Complete - Validated inventory and business case
- Gate 2: Design Approved - Architecture and wave plan signed off
- Gate 3: Migration Validated - All applications migrated and tested
- Gate 4: Optimization Complete - Cost and performance targets met

6. SUCCESS METRICS

Average client outcomes:
- 35-45% infrastructure cost reduction
- 60% improvement in deployment frequency
- 99.9%+ uptime during migration
- 40% reduction in security incidents post-migration`,
  },
  {
    title: "EnergyFirst Digital Transformation Proposal",
    documentType: "proposal",
    industry: "energy",
    serviceLine: "cloud_migration",
    clientName: "EnergyFirst Corp",
    winStatus: "won",
    content: `EXECUTIVE SUMMARY

Acme Corp is excited to present our proposal for EnergyFirst Corp's Digital Transformation program, encompassing cloud migration, IoT platform modernization, and data analytics capabilities. This transformative engagement will position EnergyFirst as a digital leader in the energy and utilities sector.

UNDERSTANDING YOUR NEEDS

EnergyFirst Corp operates a network of 150 power generation facilities, 50,000 miles of transmission infrastructure, and serves 8 million residential and commercial customers. The organization faces increasing pressure from renewable energy mandates, grid modernization requirements, and customer expectations for digital self-service.

Current challenges:
- Aging SCADA systems running on legacy infrastructure
- Siloed data across generation, transmission, and distribution
- Limited real-time analytics for grid optimization
- Manual processes for outage management and field services
- Customer portal limited to basic account management

PROPOSED SOLUTION

Stream 1 - Cloud Foundation (Months 1-6)
Migrate core IT infrastructure from on-premises data centers to Azure, establishing a secure, scalable foundation for digital services. This includes hybrid connectivity to OT networks, disaster recovery, and compliance controls for NERC CIP.

Stream 2 - IoT Platform (Months 3-12)
Deploy Azure IoT Hub to ingest data from 2 million smart meters and 10,000 grid sensors. Build real-time processing pipelines using Azure Stream Analytics for predictive maintenance and grid optimization.

Stream 3 - Data & Analytics (Months 4-15)
Create a unified data platform on Azure Synapse Analytics, integrating data from SCADA, GIS, AMI, OMS, and CIS systems. Deploy machine learning models for demand forecasting, asset health prediction, and outage prediction.

Stream 4 - Digital Customer Experience (Months 8-18)
Build a modern customer portal and mobile app with real-time usage insights, outage notifications, EV charging integration, and self-service capabilities. Powered by APIs from the cloud platform.

APPROACH AND METHODOLOGY

We will leverage our Intelligent Industry framework, specifically designed for energy and utilities clients. Our approach combines cloud migration expertise with deep energy domain knowledge, ensuring that operational technology (OT) and information technology (IT) converge safely.

Delivery follows SAFe Agile methodology with quarterly Program Increment planning, enabling alignment between the four parallel streams.

TEAM STRUCTURE

Total team: 60 professionals
- Program Director (energy sector veteran, 20+ years)
- Cloud Architect (Azure Solutions Architect Expert)
- IoT Solution Architect (certified in Azure IoT)
- Data & AI Lead (energy analytics specialist)
- Security Lead (NERC CIP certified)
- 8 Scrum teams across 4 streams

INVESTMENT AND TIMELINE

24-month engagement
Total investment: $22M - $26M
Expected benefits:
- $15M annual operational savings from automation
- 30% reduction in unplanned outages
- 25% improvement in customer satisfaction
- Regulatory compliance for upcoming grid modernization mandates

WHY ACME CORP

Acme Corp serves leading energy companies across North America. Our energy practice combines deep sector knowledge with cutting-edge cloud, IoT, and AI capabilities. We have delivered 20+ digital transformation programs for utilities.`,
  },
];

function createMinimalDocx(content: string): Buffer {
  // Create a minimal DOCX using docxtemplater
  // DOCX is just a ZIP of XML files
  const zip = new PizZip();

  // Minimal content types
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );

  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  // Convert content to DOCX paragraphs
  const paragraphs = content
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      // Check if it looks like a heading (ALL CAPS or short uppercase line)
      const isHeading =
        trimmed === trimmed.toUpperCase() && trimmed.length < 80 && trimmed.length > 2;
      if (isHeading) {
        return `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${escapeXml(trimmed)}</w:t></w:r></w:p>`;
      }
      return `<w:p><w:r><w:t xml:space="preserve">${escapeXml(trimmed)}</w:t></w:r></w:p>`;
    })
    .filter(Boolean)
    .join("");

  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${paragraphs}</w:body>
</w:document>`
  );

  return Buffer.from(zip.generate({ type: "nodebuffer" }));
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error("Usage: npx tsx scripts/seed-test-documents.ts <email> <password>");
    process.exit(1);
  }

  console.log("Signing in...");
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.session) {
    console.error("Auth failed:", authError?.message);
    process.exit(1);
  }

  const token = authData.session.access_token;
  console.log(`Signed in as ${email}\n`);

  for (let i = 0; i < TEST_DOCUMENTS.length; i++) {
    const doc = TEST_DOCUMENTS[i];
    console.log(`[${i + 1}/5] Uploading: ${doc.title}`);

    // Create DOCX buffer
    const docxBuffer = createMinimalDocx(doc.content);
    const fileName = `${doc.title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_")}.docx`;

    // Build FormData
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([new Uint8Array(docxBuffer)], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
      fileName
    );
    formData.append("title", doc.title);
    formData.append("document_type", doc.documentType);
    if (doc.industry) formData.append("industry", doc.industry);
    if (doc.serviceLine) formData.append("service_line", doc.serviceLine);
    if (doc.clientName) formData.append("client_name", doc.clientName);
    formData.append("win_status", doc.winStatus);

    try {
      const response = await fetch(`${BASE_URL}/api/documents/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        console.error(`   FAILED: ${err.error}`);
      } else {
        const result = await response.json();
        console.log(`   OK -- Document ID: ${result.documentId} (processing started)`);
      }
    } catch (err) {
      console.error(`   ERROR:`, err);
    }
  }

  console.log("\nDone! Documents are processing in the background.");
  console.log("Check the Knowledge Base page to monitor processing status.");
}

main().catch(console.error);
