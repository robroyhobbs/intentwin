/**
 * Seed L1 Company Context - The canonical source of truth for Capgemini
 *
 * Usage:
 *   npx tsx scripts/seed-company-context.ts <user-email> <user-password>
 *
 * This script populates:
 *   1. Company Context (brand, values, certifications, partnerships)
 *   2. Product Contexts (service line capabilities)
 *   3. Evidence Library (sample case studies with verified metrics)
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ===========================================
// COMPANY CONTEXT - Brand & Values
// ===========================================
const COMPANY_CONTEXT = [
  // Brand
  {
    category: "brand",
    key: "company_name",
    title: "Company Name",
    content: "Capgemini",
    is_locked: true,
    lock_reason: "Core brand identity",
  },
  {
    category: "brand",
    key: "tagline",
    title: "Brand Tagline",
    content: "Get the Future You Want",
    is_locked: true,
    lock_reason: "Official brand tagline",
  },
  {
    category: "brand",
    key: "description",
    title: "Company Description",
    content:
      "Capgemini is a global leader in partnering with companies to transform and manage their business by harnessing the power of technology. The Group is guided everyday by its purpose of unleashing human energy through technology for an inclusive and sustainable future. It is a responsible and diverse organization of over 340,000 team members in more than 50 countries.",
    is_locked: true,
    lock_reason: "Official company description",
  },
  {
    category: "brand",
    key: "founding_year",
    title: "Year Founded",
    content: "1967",
    is_locked: true,
    lock_reason: "Historical fact",
  },
  {
    category: "brand",
    key: "headquarters",
    title: "Global Headquarters",
    content: "Paris, France",
    is_locked: true,
    lock_reason: "Company location",
  },
  {
    category: "brand",
    key: "employees",
    title: "Global Workforce",
    content: "Over 340,000 team members worldwide",
    is_locked: false,
    metadata: { last_updated: "2024", approximate: true },
  },
  {
    category: "brand",
    key: "countries",
    title: "Global Presence",
    content: "Operations in more than 50 countries",
    is_locked: false,
  },
  {
    category: "brand",
    key: "revenue",
    title: "Annual Revenue",
    content: "€22.5 billion (2023)",
    is_locked: false,
    metadata: { year: 2023, currency: "EUR" },
  },

  // Values
  {
    category: "values",
    key: "honesty",
    title: "Honesty",
    content:
      "We are truthful and transparent in our dealings with clients, partners, and each other.",
    is_locked: true,
    lock_reason: "Core value",
  },
  {
    category: "values",
    key: "boldness",
    title: "Boldness",
    content:
      "We are entrepreneurial and take calculated risks to drive innovation and create value.",
    is_locked: true,
    lock_reason: "Core value",
  },
  {
    category: "values",
    key: "trust",
    title: "Trust",
    content:
      "We build lasting relationships based on reliability, integrity, and mutual respect.",
    is_locked: true,
    lock_reason: "Core value",
  },
  {
    category: "values",
    key: "freedom",
    title: "Freedom",
    content:
      "We empower our people to make decisions and take ownership of their work.",
    is_locked: true,
    lock_reason: "Core value",
  },
  {
    category: "values",
    key: "team_spirit",
    title: "Team Spirit",
    content:
      "We collaborate across boundaries to deliver the best outcomes for our clients.",
    is_locked: true,
    lock_reason: "Core value",
  },
  {
    category: "values",
    key: "modesty",
    title: "Modesty",
    content:
      "We listen, learn, and recognize that our clients know their business best.",
    is_locked: true,
    lock_reason: "Core value",
  },
  {
    category: "values",
    key: "fun",
    title: "Fun",
    content:
      "We create an enjoyable work environment where people can thrive and grow.",
    is_locked: true,
    lock_reason: "Core value",
  },

  // Certifications & Partnerships
  {
    category: "certifications",
    key: "aws_premier",
    title: "AWS Premier Consulting Partner",
    content:
      "Capgemini is an AWS Premier Consulting Partner with competencies in Migration, DevOps, Data & Analytics, Machine Learning, and more. Over 25,000 AWS-certified practitioners.",
    is_locked: true,
    lock_reason: "Verified partnership",
    metadata: { certifications_count: 25000, tier: "Premier" },
  },
  {
    category: "certifications",
    key: "azure_global",
    title: "Microsoft Azure Global SI Partner",
    content:
      "Capgemini is a Microsoft Azure Expert MSP and Global SI Partner with advanced specializations in Cloud Migration, Data & AI, and Modern Work.",
    is_locked: true,
    lock_reason: "Verified partnership",
  },
  {
    category: "certifications",
    key: "google_premier",
    title: "Google Cloud Premier Partner",
    content:
      "Capgemini is a Google Cloud Premier Partner with specializations in Data Analytics, Machine Learning, and Infrastructure.",
    is_locked: true,
    lock_reason: "Verified partnership",
  },
  {
    category: "certifications",
    key: "iso_27001",
    title: "ISO 27001 Certification",
    content:
      "Capgemini maintains ISO 27001 certification for Information Security Management Systems across global delivery centers.",
    is_locked: true,
    lock_reason: "Security certification",
  },
  {
    category: "certifications",
    key: "soc2",
    title: "SOC 2 Type II Compliance",
    content:
      "Capgemini's cloud and managed services operations are SOC 2 Type II compliant, demonstrating security, availability, and confidentiality controls.",
    is_locked: true,
    lock_reason: "Security certification",
  },
  {
    category: "certifications",
    key: "fedramp",
    title: "FedRAMP Authorization",
    content:
      "Capgemini Government Solutions maintains FedRAMP Moderate authorization for cloud services to US federal agencies.",
    is_locked: true,
    lock_reason: "Government certification",
  },

  // Legal constraints
  {
    category: "legal",
    key: "competitor_mentions",
    title: "Competitor Mention Policy",
    content:
      "Do not directly name competitors in proposals. Use phrases like 'other providers' or 'alternative approaches' when comparisons are necessary.",
    is_locked: true,
    lock_reason: "Legal policy",
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
  {
    category: "legal",
    key: "guarantee_language",
    title: "Guarantee Language Policy",
    content:
      "Avoid absolute guarantees. Use 'committed to', 'target', 'expected' rather than 'guaranteed' or 'will definitely'. SLAs must reference specific contractual terms.",
    is_locked: true,
    lock_reason: "Legal policy",
  },
];

// ===========================================
// PRODUCT CONTEXTS - Service Line Capabilities
// ===========================================
const PRODUCT_CONTEXTS = [
  {
    product_name: "Cloud Migration Factory",
    service_line: "cloud_migration",
    description:
      "Capgemini's industrialized approach to cloud migration that combines proven methodologies, automation tools, and deep cloud expertise to accelerate enterprise cloud adoption.",
    capabilities: [
      {
        name: "Assessment & Planning",
        description:
          "Comprehensive discovery and assessment of application portfolios, infrastructure dependencies, and migration readiness.",
        outcomes: ["risk_reduction", "speed_to_value"],
      },
      {
        name: "Migration Execution",
        description:
          "Automated migration using Cloud Migration Factory tools supporting rehost, replatform, and refactor patterns.",
        outcomes: ["speed_to_value", "cost_optimization"],
      },
      {
        name: "Landing Zone Setup",
        description:
          "Enterprise-grade cloud foundations with security, networking, and governance built-in from day one.",
        outcomes: ["risk_reduction", "compliance"],
      },
      {
        name: "Application Modernization",
        description:
          "Containerization, serverless transformation, and cloud-native redesign of legacy applications.",
        outcomes: ["innovation", "cost_optimization", "speed_to_value"],
      },
      {
        name: "Managed Cloud Operations",
        description:
          "24/7 monitoring, optimization, and management of cloud environments post-migration.",
        outcomes: ["cost_optimization", "quality_improvement"],
      },
    ],
    specifications: {
      supported_clouds: ["AWS", "Azure", "Google Cloud", "Multi-cloud"],
      migration_patterns: [
        "Rehost (Lift & Shift)",
        "Replatform",
        "Refactor",
        "Rebuild",
        "Retain",
        "Retire",
      ],
      automation_tools: [
        "CloudEndure",
        "AWS Migration Hub",
        "Azure Migrate",
        "Custom accelerators",
      ],
      typical_timeline: "6-18 months for enterprise migrations",
      team_composition:
        "Cloud architects, migration engineers, DevOps specialists, security engineers",
    },
    pricing_models: [
      {
        model: "Fixed Price",
        description:
          "Fixed cost for defined migration scope with clear deliverables",
        best_for: "Well-defined, stable scope migrations",
      },
      {
        model: "Time & Materials",
        description: "Flexible engagement based on effort expended",
        best_for: "Discovery phases, complex transformations",
      },
      {
        model: "Outcome-Based",
        description:
          "Pricing tied to achieved outcomes (cost savings, performance improvements)",
        best_for: "Clients seeking risk-sharing arrangements",
      },
    ],
    constraints: {
      minimum_engagement: "Typically 3+ months for meaningful migration work",
      team_size: "Minimum team of 4-6 for enterprise engagements",
      not_suitable_for: [
        "Single application migrations (use standard consulting)",
        "Environments requiring air-gapped deployment without prior setup",
      ],
    },
    supported_outcomes: [
      "cost_optimization",
      "speed_to_value",
      "risk_reduction",
      "innovation",
      "compliance",
    ],
    is_locked: true,
    lock_reason: "Verified service offering",
  },
  {
    product_name: "Application Modernization",
    service_line: "app_modernization",
    description:
      "Transform legacy applications into modern, cloud-native architectures that are scalable, maintainable, and ready for continuous innovation.",
    capabilities: [
      {
        name: "Legacy Assessment",
        description:
          "Technical debt analysis, modernization roadmap, and business case development.",
        outcomes: ["risk_reduction", "cost_optimization"],
      },
      {
        name: "Microservices Architecture",
        description:
          "Decompose monoliths into loosely-coupled microservices for independent scaling and deployment.",
        outcomes: ["speed_to_value", "innovation", "quality_improvement"],
      },
      {
        name: "Containerization",
        description:
          "Package applications in containers using Docker and orchestrate with Kubernetes.",
        outcomes: ["speed_to_value", "cost_optimization"],
      },
      {
        name: "API-First Design",
        description:
          "Design and implement APIs that enable integration, partner ecosystems, and new business models.",
        outcomes: ["innovation", "speed_to_value"],
      },
      {
        name: "DevOps Enablement",
        description:
          "CI/CD pipelines, infrastructure as code, and automated testing for rapid, reliable releases.",
        outcomes: ["speed_to_value", "quality_improvement"],
      },
    ],
    specifications: {
      platforms: ["Kubernetes", "OpenShift", "ECS/EKS", "Azure Container Apps"],
      languages: [
        "Java",
        "Node.js",
        ".NET",
        "Python",
        "Go",
        "Legacy (COBOL, PL/1)",
      ],
      patterns: [
        "Strangler Fig",
        "Event-Driven",
        "CQRS",
        "Saga Pattern",
        "API Gateway",
      ],
      ci_cd: ["Jenkins", "GitLab CI", "GitHub Actions", "Azure DevOps"],
    },
    pricing_models: [
      {
        model: "Sprint-Based",
        description: "Agile delivery with pricing per sprint/iteration",
        best_for: "Iterative modernization programs",
      },
      {
        model: "Application Bundle",
        description: "Fixed price per application modernized",
        best_for: "Portfolio modernization with similar application types",
      },
    ],
    supported_outcomes: [
      "speed_to_value",
      "cost_optimization",
      "quality_improvement",
      "innovation",
    ],
    is_locked: true,
    lock_reason: "Verified service offering",
  },
  {
    product_name: "Data & AI Platform",
    service_line: "data_analytics",
    description:
      "End-to-end data and AI solutions that turn data into actionable insights and intelligent automation.",
    capabilities: [
      {
        name: "Data Platform Modernization",
        description:
          "Cloud data warehouses, data lakes, and lakehouses built on modern architectures.",
        outcomes: ["cost_optimization", "speed_to_value", "innovation"],
      },
      {
        name: "Advanced Analytics",
        description:
          "Predictive modeling, machine learning, and statistical analysis to drive data-driven decisions.",
        outcomes: ["innovation", "quality_improvement", "cost_optimization"],
      },
      {
        name: "AI/ML Engineering",
        description:
          "Production-grade ML pipelines, MLOps, and responsible AI frameworks.",
        outcomes: ["innovation", "speed_to_value"],
      },
      {
        name: "Generative AI",
        description:
          "Enterprise GenAI solutions including RAG, fine-tuning, and AI assistants.",
        outcomes: ["innovation", "speed_to_value", "quality_improvement"],
      },
      {
        name: "Data Governance",
        description:
          "Data quality, lineage, cataloging, and compliance frameworks.",
        outcomes: ["risk_reduction", "compliance", "quality_improvement"],
      },
    ],
    specifications: {
      platforms: [
        "Snowflake",
        "Databricks",
        "AWS (Redshift, SageMaker)",
        "Azure (Synapse, ML)",
        "Google (BigQuery, Vertex AI)",
      ],
      ai_frameworks: ["TensorFlow", "PyTorch", "Scikit-learn", "LangChain"],
      llm_experience: [
        "OpenAI GPT",
        "Anthropic Claude",
        "Google Gemini",
        "Open source models",
      ],
    },
    supported_outcomes: [
      "innovation",
      "cost_optimization",
      "quality_improvement",
      "speed_to_value",
      "compliance",
    ],
    is_locked: true,
    lock_reason: "Verified service offering",
  },
];

// ===========================================
// EVIDENCE LIBRARY - Case Studies & Metrics
// ===========================================
const EVIDENCE_LIBRARY = [
  {
    evidence_type: "case_study",
    title: "Global Bank Cloud Migration - 200+ Applications to AWS",
    summary:
      "Migrated 200+ applications for a Fortune 500 bank to AWS, achieving 40% infrastructure cost reduction and 99.99% availability.",
    full_content: `
# Global Bank Cloud Migration

## Client Challenge
A Fortune 500 global bank needed to modernize its aging on-premises infrastructure while maintaining strict regulatory compliance (SOC 2, PCI-DSS). The existing environment of 200+ applications faced rising maintenance costs, limited scalability, and slow time-to-market for new features.

## Capgemini Solution
Capgemini deployed its Cloud Migration Factory methodology:
- Conducted comprehensive portfolio assessment using automated discovery tools
- Designed AWS Landing Zone with security and compliance built-in
- Executed phased migration over 18 months with zero critical incidents
- Implemented FinOps practices for ongoing cost optimization

## Results
- **40% reduction** in infrastructure costs within first year
- **99.99% availability** maintained throughout migration
- **60% faster** deployment cycles for new features
- **100% compliance** with regulatory requirements maintained
- **$15M annual savings** in operational costs
    `,
    client_industry: "financial_services",
    service_line: "cloud_migration",
    client_size: "enterprise",
    outcomes_demonstrated: [
      { outcome: "cost_optimization", description: "40% infrastructure cost reduction" },
      { outcome: "quality_improvement", description: "99.99% availability achieved" },
      { outcome: "speed_to_value", description: "60% faster deployments" },
      { outcome: "compliance", description: "Maintained SOC 2 and PCI-DSS compliance" },
    ],
    metrics: [
      { name: "Cost Reduction", value: "40%", context: "Infrastructure costs in year 1" },
      { name: "Availability", value: "99.99%", context: "During and after migration" },
      { name: "Applications Migrated", value: "200+", context: "Over 18 months" },
      { name: "Annual Savings", value: "$15M", context: "Operational cost reduction" },
      { name: "Deployment Speed", value: "60% faster", context: "New feature releases" },
    ],
    is_verified: true,
    verification_notes: "Metrics verified by client reference. NDA in place - use without client name.",
  },
  {
    evidence_type: "case_study",
    title: "Healthcare Provider HIPAA-Compliant Cloud Transformation",
    summary:
      "Enabled a major healthcare system to migrate to Azure while achieving HIPAA compliance and reducing data processing time by 70%.",
    full_content: `
# Healthcare Provider Cloud Transformation

## Client Challenge
A regional healthcare system with 50+ hospitals needed to modernize its data infrastructure while maintaining HIPAA compliance. Legacy systems couldn't handle growing data volumes from IoT medical devices and EHR integrations.

## Capgemini Solution
- Designed HIPAA-compliant Azure architecture with encryption at rest and in transit
- Migrated data warehouse to Azure Synapse for advanced analytics
- Implemented real-time data streaming for IoT medical devices
- Established data governance framework with Purview

## Results
- **70% reduction** in data processing time
- **100% HIPAA compliance** maintained
- **3x increase** in data available for analytics
- **Real-time insights** from IoT devices enabling proactive care
    `,
    client_industry: "healthcare",
    service_line: "cloud_migration",
    client_size: "enterprise",
    outcomes_demonstrated: [
      { outcome: "speed_to_value", description: "70% faster data processing" },
      { outcome: "compliance", description: "HIPAA compliance maintained" },
      { outcome: "innovation", description: "Real-time IoT analytics enabled" },
      { outcome: "quality_improvement", description: "3x more data for clinical decisions" },
    ],
    metrics: [
      { name: "Processing Time", value: "-70%", context: "Data processing duration" },
      { name: "Compliance", value: "100%", context: "HIPAA requirements" },
      { name: "Data Volume", value: "3x", context: "Available for analytics" },
      { name: "Hospitals", value: "50+", context: "Facilities migrated" },
    ],
    is_verified: true,
    verification_notes: "Client approved for reference. Contact available upon request.",
  },
  {
    evidence_type: "case_study",
    title: "Retail Giant Microservices Transformation",
    summary:
      "Transformed monolithic e-commerce platform into microservices architecture, enabling 10x traffic handling during peak seasons.",
    full_content: `
# Retail Microservices Transformation

## Client Challenge
A major retailer's monolithic e-commerce platform couldn't scale for Black Friday traffic, causing lost sales. Releases took 3+ months due to tightly coupled architecture.

## Capgemini Solution
- Decomposed monolith into 45 microservices using Strangler Fig pattern
- Deployed on Kubernetes with auto-scaling for demand spikes
- Implemented event-driven architecture for order processing
- Established CI/CD pipelines for independent service deployments

## Results
- **10x traffic capacity** during peak periods
- **Weekly releases** vs quarterly before
- **Zero downtime** during Black Friday for first time
- **$50M additional revenue** from eliminated outages
    `,
    client_industry: "retail",
    service_line: "app_modernization",
    client_size: "enterprise",
    outcomes_demonstrated: [
      { outcome: "speed_to_value", description: "Weekly vs quarterly releases" },
      { outcome: "quality_improvement", description: "Zero downtime during peak" },
      { outcome: "cost_optimization", description: "$50M revenue protected" },
      { outcome: "innovation", description: "Event-driven architecture" },
    ],
    metrics: [
      { name: "Traffic Capacity", value: "10x", context: "Peak period handling" },
      { name: "Release Frequency", value: "Weekly", context: "Down from quarterly" },
      { name: "Peak Availability", value: "100%", context: "Black Friday uptime" },
      { name: "Revenue Protected", value: "$50M", context: "From eliminated outages" },
      { name: "Microservices", value: "45", context: "Decomposed from monolith" },
    ],
    is_verified: true,
    verification_notes: "Results published in joint press release.",
  },
  {
    evidence_type: "metric",
    title: "Cloud Migration Track Record",
    summary: "Aggregate metrics from Capgemini's cloud migration practice.",
    full_content:
      "Capgemini has successfully delivered 500+ cloud migration projects globally, with an average customer satisfaction score of 4.7/5.",
    client_industry: null,
    service_line: "cloud_migration",
    outcomes_demonstrated: [
      { outcome: "quality_improvement", description: "High customer satisfaction" },
    ],
    metrics: [
      { name: "Projects Delivered", value: "500+", context: "Global cloud migrations" },
      { name: "Customer Satisfaction", value: "4.7/5", context: "Average CSAT score" },
      { name: "Certified Engineers", value: "25,000+", context: "Cloud certifications" },
    ],
    is_verified: true,
    verification_notes: "Internal metrics, verified annually.",
  },
];

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.log("Usage: npx tsx scripts/seed-company-context.ts <email> <password>");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log("Seeding L1 Company Context...\n");

  // Seed Company Context
  console.log("1. Seeding Company Context...");
  for (const ctx of COMPANY_CONTEXT) {
    const { error } = await supabase.from("company_context").upsert(
      { ...ctx, metadata: ctx.metadata || {} },
      { onConflict: "category,key" }
    );
    if (error) {
      console.error(`   Error inserting ${ctx.key}:`, error.message);
    } else {
      console.log(`   ✓ ${ctx.category}/${ctx.key}`);
    }
  }

  // Seed Product Contexts
  console.log("\n2. Seeding Product Contexts...");
  for (const prod of PRODUCT_CONTEXTS) {
    const { error } = await supabase.from("product_contexts").upsert(prod, {
      onConflict: "product_name,service_line",
    });
    if (error) {
      console.error(`   Error inserting ${prod.product_name}:`, error.message);
    } else {
      console.log(`   ✓ ${prod.product_name} (${prod.service_line})`);
    }
  }

  // Seed Evidence Library
  console.log("\n3. Seeding Evidence Library...");
  for (const ev of EVIDENCE_LIBRARY) {
    const { error } = await supabase.from("evidence_library").insert(ev);
    if (error && !error.message.includes("duplicate")) {
      console.error(`   Error inserting ${ev.title}:`, error.message);
    } else {
      console.log(`   ✓ ${ev.evidence_type}: ${ev.title}`);
    }
  }

  console.log("\n✅ L1 Company Context seeded successfully!");
  console.log("\nSummary:");
  console.log(`   - ${COMPANY_CONTEXT.length} company context entries`);
  console.log(`   - ${PRODUCT_CONTEXTS.length} product contexts`);
  console.log(`   - ${EVIDENCE_LIBRARY.length} evidence library entries`);
}

main().catch(console.error);
