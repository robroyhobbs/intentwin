# IntentBid

AI-powered proposal generation platform that transforms RFP documents into winning, compliance-ready proposals. Built for government contractors and professional services firms.

## What It Does

IntentBid ingests an RFP or solicitation document, cross-references it against your company's verified knowledge base (past performance, certifications, capabilities), and generates a structured proposal with section-by-section content -- executive summary, technical approach, methodology, staffing, pricing rationale, risk mitigation, and win themes.

### Key Capabilities

- **RFP Intake & Analysis** -- Upload PDF/DOCX solicitations; AI extracts requirements, evaluation criteria, compliance items, and solicitation type (RFP/RFI/RFQ/SOW/Proactive)
- **Pre-Flight Readiness Gate** -- Automated check before generation: verifies evidence library, team members, product contexts, and intake completeness. Surfaces targeted upload prompts for missing data
- **Bid/No-Bid Scoring** -- Automated opportunity evaluation engine that scores RFPs on fit, capacity, and win probability
- **Three-Layer Knowledge System** -- L1 (verified company context: brand, products, evidence, named personnel) + L2 (uploaded reference documents for RAG retrieval) + L3 (AI-generated content with claim traceability)
- **Solicitation-Aware Generation** -- Sections are filtered and tailored by solicitation type; RFQs get pricing-focused output, RFIs get capability summaries
- **Named Personnel & Resume Extraction** -- Team members with certifications, clearance levels, and bios are injected into proposals; AI extracts structured data from uploaded resumes
- **Parallel Section Generation** -- Up to 15 AI-powered prompt pipelines run concurrently via Inngest with per-section retry; executive summary generates first for differentiator extraction
- **Repetition Limiter** -- Differentiators from the executive summary are tracked and subsequent sections are instructed to demonstrate (not repeat) them
- **Brand Name Lock** -- Primary brand name is enforced consistently across all generated sections via editorial standards
- **Audience Calibration** -- AI detects evaluator profile (technical level, role, organization size) from RFP and adjusts tone, depth, and terminology
- **Auto-Generated Assumptions** -- Standard assumptions and compliance boilerplate injected based on solicitation type
- **Sunshine Law & FOIA Engine** -- Automated public records request generator tailored to state-specific statutes to acquire incumbent contracts and SLED pricing data.
- **Industry Intelligence** -- Sector-specific proposal tuning for healthcare, financial services, manufacturing, and public sector
- **Opportunity Match Alerts** -- In-app alerts highlight new high-signal matches and saved opportunities with deadlines approaching so users can triage without re-running searches
- **Persuasion Engine** -- AI-driven persuasive writing optimization layered into generated content
- **Quality Overseer** -- Gemini-powered review with auto-remediation for sections scoring below threshold
- **Copilot Operations Layer** -- Event-driven interventions, approval queues, and user-safe notifications turn generation failures and reliability issues into visible follow-up work
- **Review Mode UI** -- Post-generation sidebar highlighting placeholders, unsubstantiated claims, and areas needing human review
- **Evidence Library** -- Case studies, certifications, and metrics with verified sourcing and AI extraction
- **Pricing Structure** -- Structured pricing tables with rate cards, labor categories, and fee schedules rather than vague cost language
- **Tech Specificity Enforcement** -- Vague capability claims (e.g., "industry-leading platform") are flagged with warnings to use concrete technology names and metrics
- **5-Format Export** -- HTML, DOCX, PPTX, Google Slides, and PDF with Mermaid diagram rendering
- **Color Team Review** -- Structured Pink/Red/Gold/White stage-gate review workflow with reviewer assignments
- **Version Control** -- Full proposal versioning with diff comparison and restore
- **Brand Voice** -- Configurable tone and terminology settings that shape AI-generated content
- **Multi-Tenant** -- Organization-scoped data isolation via Supabase RLS on every table
- **Multi-Document Support** -- Multiple documents per proposal with priority-based merge and per-field source traceability
- **Win/Loss Analytics** -- Interactive dashboard with trend analysis, industry breakdown, and outcome tracking

## The IntentBid Advantage: How We Beat Human Proposals

To deliver quality that exceeds a $20,000 human-written proposal at a fraction of the cost, IntentBid systematically exploits the three reasons humans lose bids: **Compliance failures**, **Boilerplate fatigue**, and **Lack of specificity**.

We engineer the platform around four core pillars to guarantee a superior outcome:

1. **The "Anti-Fluff" Enforcement Engine:** Human marketers write generic fluff ("innovative, synergistic platform"). Evaluators want engineering precision. IntentBid's Persuasion Engine strictly prohibits marketing jargon, forcing the AI to substitute adjectives with hard metrics, named technologies, and verified past-performance artifacts.
2. **"Weaponized" Agency Intelligence:** Humans reuse past proposals to save time. IntentBid uses our native Intelligence Service to profile the target agency (e.g., scoring weight preferences, competitor history) and rewrite the vendor's entire history to perfectly mirror the agency's specific psychological and procurement pain points.
3. **Zero-Defect Compliance Mapping:** Up to 30% of human bids are disqualified for missing sub-bullets. IntentBid generates a micro-compliance matrix for every section, visually bolding exact RFP keywords in the opening sentences so evaluators can effortlessly check their scoring boxes.
4. **Visual Density & Diagram Generation:** Humans submit 50-page walls of text. IntentBid automatically triggers Mermaid.js diagrams for Methodology, Timeline, and Architecture sections, combined with Markdown callout boxes for Win Themes, resulting in a highly scannable, visually expensive-looking document.

### Versatility Across Procurement Types

IntentBid's dynamic generation pipelines are battle-tested to win across the entire SLED (State, Local, Education) spectrum, not just massive IT contracts:

- **The IT / Consulting RFP:** (100+ pages) Deeply focuses on narrative, risk mitigation, and complex scoring matrices.
- **The Hardware IFB / RFQ:** (Commodities) "Lowest-bid wins" strategy. IntentBid excels at extracting 50+ line items, matching them to catalogs, and generating flawless mathematical Bid Tabulation tables, replacing Junior Estimators.
- **The Blue-Collar Services RFP:** (Landscaping, Janitorial, HVAC) Evaluators want proof of licenses and equipment. IntentBid takes sparse vendor inputs (bulleted lists of mowers) and transforms them into 15-page highly professional, safety-focused documents that win on perceived professionalism.
- **The A/E SOQ (Architecture & Engineering):** (QBS / Qualifications-Based Selection). Zero price consideration. IntentBid dynamically generates visually dense, resume-heavy, past-performance-driven PDFs that rival expensive graphic design agencies.

## Architecture

```
+--------------------------------------------------------------+
|                     Next.js 16 App                           |
|                  (App Router + RSC)                           |
+--------------------------------------------------------------+
|  Dashboard       | API Routes (60 files) |  Auth (SSR)       |
|  - Proposals     | - /api/proposals      |  Supabase Auth    |
|  - Evidence      | - /api/intake         |  Cookie sessions  |
|  - KB Docs       | - /api/evidence       |  Bearer fallback  |
|  - Analytics     | - /api/documents      |  Waitlist gate    |
|  - Settings      | - /api/bulk-import    |  Auto-confirm     |
+--------------------------------------------------------------+
|                    Middleware Layer                           |
|  Rate Limiting | Security Headers | Input Sanitization       |
|  Request Validation | Standardized API Responses             |
+--------------------------------------------------------------+
|                       AI Layer                               |
|  Google Gemini 3 Pro (generation + quality review)           |
|  Voyage AI voyage-3 (1024d vector embeddings)                |
|  15 section prompts | Gemini quality review + remediation    |
|  Pre-flight gate | Repetition limiter | Audience calibration |
|  Industry configs | Persuasion engine                        |
+--------------------------------------------------------------+
|                    Observability                             |
|  Structured JSON Logging | Correlation IDs                   |
|  Pipeline Metrics | Error Tracking (Sentry-ready)            |
|  Health Checks with component timing                         |
+--------------------------------------------------------------+
|                       Supabase                               |
|  PostgreSQL + pgvector + Row Level Security                  |
|  42 migrations | Multi-tenant org isolation                  |
|  Performance indexes on all hot query paths                  |
+--------------------------------------------------------------+
|                     Export Layer                              |
|  Puppeteer/chromium-min (PDF) | docx (DOCX) | pptxgenjs (PPTX)|
|  Google Slides API | HTML + Mermaid                          |
+--------------------------------------------------------------+
```

## Tech Stack

| Layer         | Technology                                                                       |
| ------------- | -------------------------------------------------------------------------------- |
| Framework     | Next.js 16, React 19, TypeScript 5                                               |
| Styling       | Tailwind CSS 4                                                                   |
| AI Generation | Google Gemini 3 Pro                                                              |
| Embeddings    | Voyage AI (voyage-3, 1024d)                                                      |
| Database      | Supabase (PostgreSQL 15 + pgvector)                                              |
| Auth          | Supabase Auth with SSR cookies + RLS policies                                    |
| Email         | Resend (transactional)                                                           |
| Editor        | TipTap (rich text editing)                                                       |
| Export        | Puppeteer + chromium-min (PDF), docx (DOCX), pptxgenjs (PPTX), Google Slides API |
| Testing       | Vitest (1,516 tests) + Playwright (E2E)                                          |
| CI/CD         | GitHub Actions (lint, typecheck, test, coverage, build)                          |
| Deployment    | Vercel (with `@sparticuz/chromium-min` for serverless PDF)                       |

## Engineering Quality

IntentBid follows a 7-phase robustness improvement program:

### Testing (1,516 tests, 0 failures)

- **Unit tests** -- Core AI pipeline, prompt builders, export generators, quality checks, bid scoring, preflight gate, review mode, audience calibration, assumptions, boilerplate sections, team members
- **Integration tests** -- API routes, auth flows, multi-tenancy isolation, RLS policies, pipeline integration, bulk import, compliance
- **Security tests** -- Input sanitization, XSS prevention, SQL injection prevention, data leak verification
- **E2E tests** -- Playwright specs for onboarding, proposal flow, export, knowledge base, multi-tenancy
- **CI pipeline** -- GitHub Actions with lint, typecheck, unit tests, integration tests, coverage, and build

### Security

- **Rate limiting** -- Sliding window in-memory limiter with per-route configs (AI generation, uploads, exports, auth, public)
- **Input sanitization** -- XSS/injection protection utilities (`escapeHtml`, `stripHtml`, `sanitizeString`, `sanitizeEmail`)
- **Security headers** -- HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy
- **Request validation** -- Body size limits, content type enforcement, structured JSON parsing
- **PII protection** -- Sensitive data redacted from all log output (passwords, tokens, API keys, emails)

### Observability

- **Structured logging** -- JSON output for production (Vercel/Datadog compatible), human-readable for development
- **Correlation IDs** -- Request-scoped logging with automatic ID generation and propagation
- **Pipeline metrics** -- Per-section timing, token usage tracking, success/failure rates, RAG retrieval stats
- **Error tracking** -- Sentry-ready wrapper with automatic capture, user context, breadcrumbs (works without Sentry installed)
- **Health checks** -- `/api/health` with parallel component checks (DB, storage, vector search, Voyage AI) and response timing
- **Copilot activity stream** -- Proposal-generation failures and degraded health checks emit organization-scoped copilot events that drive interventions, notifications, and operator workflows

## Copilot Operations: the Value Add

IntentBid now includes an internal Copilot operations layer that turns AI and platform issues into actionable work instead of silent failures. This is part of the value add: operators can see what happened, what Copilot did automatically, and where a human decision is required.

### What the current Copilot layer does

- **Captures failure telemetry** from proposal generation setup, section generation, and finalize flows
- **Turns degraded health checks into interventions** when critical components fail
- **Routes interventions to the right agent** (for example, reliability or compliance)
- **Separates auto-handled items from approval-required items**
- **Generates user-safe copy** so internal AI/reliability events can surface in a clean UI without leaking raw backend detail

### UI surfaces for activity

Yes — there is now a UI to see activity:

- **Header notification link** -- the dashboard header shows a Copilot notification badge with the current active count
- **`/notifications`** -- operator-facing notification feed for active and resolved Copilot items
- **`/copilot-console`** -- intervention queue for triage, approvals, and resolution workflows

### How to use it going forward

1. **Watch the header badge** after proposal generation or admin health checks
2. **Open `/notifications`** for a quick activity feed and status overview
3. **Open `/copilot-console`** when you need to triage issues or approve/reject intervention decisions
4. **Extend the system** by emitting additional org-scoped Copilot events from high-value workflows through `/api/copilot/events` or the helper emitters in `src/lib/copilot/`

### Current event producers

- Proposal generation failures in:
  - `POST /api/proposals/[id]/generate/setup`
  - `POST /api/proposals/[id]/generate/section`
  - `POST /api/proposals/[id]/generate/finalize`
- Health degradation events from `GET /api/health`

### Performance

- **Parallel generation** -- Sections generate in configurable concurrent batches (default 3) for ~3x speedup
- **Database indexes** -- 13 performance indexes covering all hot query paths (proposals, sections, documents, chunks, evidence)
- **Dynamic imports** -- Heavy client components (TipTap, recharts, @dnd-kit, review panels) loaded on demand
- **Bundle analyzer** -- `@next/bundle-analyzer` configured for `npm run analyze`

### API Robustness

- **Standardized responses** -- Consistent error/success response builders (`badRequest`, `unauthorized`, `forbidden`, `notFound`, `serverError`, `ok`, `created`)
- **Error boundaries** -- React `ErrorBoundary` and `InlineErrorBoundary` components with automatic error reporting
- **Structured error handling** -- `withErrorHandler` wrapper for API routes with automatic logging

## Project Structure

```
src/
+-- app/
|   +-- (auth)/                # Login, signup, password reset
|   +-- (dashboard)/           # Authenticated pages
|   |   +-- proposals/         # Proposal list, editor, versions, export
|   |   +-- evidence-library/  # Case studies, certs, metrics CRUD
|   |   +-- knowledge-base/    # L2 document upload, search, L1 sources
|   |   +-- notifications/     # Copilot notification feed for operator visibility
|   |   +-- copilot-console/   # Copilot intervention queue and approval workflows
|   |   +-- settings/          # Company context, products, brand voice, branding
|   |   +-- analytics/         # Win/loss analytics with recharts
|   |   +-- onboarding/        # New org setup wizard
|   +-- (public)/              # Landing, product, intelligence, government, pricing, about, blog
|   +-- api/                   # 60 API route files
|       +-- copilot/           # Event ingestion, interventions, approvals, notifications
|       +-- proposals/         # CRUD, generation, versioning, export, quality review
|       +-- intake/            # RFP parsing, requirement extraction, bid evaluation
|       +-- documents/         # Upload, process, chunk, embed, search
|       +-- evidence/          # Evidence library CRUD + AI extraction
|       +-- settings/          # Team members (with resume extraction), products
|       +-- bulk-import/       # Batch L1 data import with AI extraction
|       +-- health/            # Health check with component diagnostics
|       +-- ...                # 20+ additional route groups
+-- components/
|   +-- preflight/             # Pre-flight readiness report, targeted uploads, review mode sidebar
|   +-- proposals/             # Proposal editor, quality report, version history
|   +-- compliance/            # Compliance board with drag-and-drop
|   +-- review-workflow/       # Color team stage-gate review
|   +-- ui/                    # Shared UI components
+-- inngest/
|   +-- functions/             # Inngest step functions
|   |   +-- generate-proposal.ts       # Orchestrator: context build, fan-out, finalize
|   |   +-- generate-single-section.ts # Per-section generation with L1/persuasion/repetition limiter
|   |   +-- quality-review.ts          # 3-judge quality council
|   |   +-- compliance-assessment.ts   # Compliance scoring
|   |   +-- process-document.ts        # Document chunking + embedding
|   |   +-- regenerate-section.ts      # Single-section regeneration
+-- lib/
|   +-- ai/
|   |   +-- pipeline/          # Generation pipeline modules
|   |   |   +-- preflight.ts   # Pre-flight readiness gate
|   |   |   +-- context.ts     # L1 context fetch, section-specific filtering, outcome contracts
|   |   |   +-- build-pipeline-context.ts # Shared pipeline context builder
|   |   |   +-- section-configs.ts       # Section registry + solicitation-type filtering
|   |   |   +-- differentiators.ts       # Executive summary differentiator extraction
|   |   |   +-- retrieval.ts             # Org-scoped RAG retrieval
|   |   |   +-- types.ts                 # L1Context, PipelineContext, SectionConfig types
|   |   +-- quality-overseer.ts # 3-judge LLM council quality review
|   |   +-- bid-scoring.ts     # Bid/no-bid opportunity scoring
|   |   +-- persuasion.ts      # Persuasive writing engine
|   |   +-- industry-configs/  # Sector-specific proposal tuning
|   |   +-- prompts/           # 24 prompt templates (15 sections + extraction + review)
|   +-- api/                   # Standardized response builders
|   +-- constants/statuses.ts  # Typed status constants for all 10 domain entities
|   +-- rate-limit/            # Sliding window rate limiter + route configs
|   +-- security/              # Input sanitization + request validation
|   +-- observability/         # Error tracking, pipeline metrics
|   +-- copilot/               # Event schemas, routing, ingestion, persistence, notifications
|   +-- utils/logger.ts        # Structured logger with correlation IDs
|   +-- utils/ttl-cache.ts     # In-memory TTL cache (used for L1 context)
|   +-- documents/             # File parsing (PDF, DOCX, PPTX)
|   +-- export/                # PDF, DOCX, PPTX, Slides, HTML generators
|   +-- versioning/            # Proposal version snapshots
|   +-- test-utils/            # Mock factories, test helpers, API test utilities
|   +-- supabase/              # Server client, admin client, auth helpers
+-- types/                     # TypeScript type definitions

supabase/
+-- migrations/                # 42 SQL migrations (schema + RLS + indexes)

__tests__/
+-- integration/               # API, security, rate-limiting, observability, performance
+-- e2e/                       # Playwright specs

.github/
+-- workflows/ci.yml           # GitHub Actions CI pipeline
```

## AI Pipeline

Each proposal generation runs through:

1. **Intake** -- Parse RFP, extract requirements, evaluation criteria, solicitation type, and audience profile
2. **Bid/No-Bid Evaluation** -- Score opportunity fit, capacity, and win probability
3. **Pre-Flight Gate** -- Verify L1 data completeness (evidence, team members, products, intake fields); surface targeted upload prompts for gaps
4. **L1 Context Fetch** -- Pull verified company data for the user's org (cached 5 min with TTL cache)
5. **L2 RAG Retrieval** -- Org-scoped semantic search across uploaded documents
6. **Section-Specific L1 Filtering** -- Each section receives only relevant L1 data to prevent "lost in the middle" syndrome
7. **Industry Intelligence** -- Apply sector-specific context
8. **Win Strategy** -- Analyze competitive positioning and key themes
9. **Executive Summary First** -- Generate executive summary, then extract differentiators for the repetition limiter
10. **Parallel Section Generation** -- Remaining sections generated concurrently via Inngest steps with per-section retry, audience calibration, brand name lock, and editorial standards
11. **Repetition Limiter** -- Differentiators from executive summary are tracked; subsequent sections demonstrate (not repeat) them
12. **Persuasion Enhancement** -- Optimize content for persuasive impact
13. **Quality Review** -- 3-judge LLM council scores each section across compliance, persuasiveness, specificity, consistency
14. **Auto-Remediation** -- Re-generate sections scoring below threshold with judge feedback
15. **Review Mode** -- Post-generation UI highlights placeholders, unsubstantiated claims, and areas needing human attention

Section generation is orchestrated by Inngest with individual step retries (3 attempts per section). If the executive summary fails, remaining sections still generate without the repetition limiter (graceful degradation).

## Multi-Tenancy

Every data table includes an `organization_id` column with Row Level Security policies:

- **Signup trigger** (`handle_new_user`) -- automatically creates org + admin profile
- **RLS policies** -- all operations filter through the user's org
- **API routes** -- `getUserContext()` resolves the authenticated user's org before data access
- **Admin client** -- bypasses RLS, always uses explicit `.eq('organization_id', ...)` scoping
- **L1/L2 data** -- all context tables are org-scoped

## Getting Started

### Prerequisites

- Node.js 20+
- npm (or pnpm)
- Supabase project (with pgvector extension enabled)
- Google API key (for Gemini models)
- Voyage AI API key

### Setup

```bash
git clone https://github.com/robroyhobbs/intentwin.git
cd intentwin
npm install

cp .env.example .env.local
# Fill in: Supabase URL + keys, GOOGLE_API_KEY, Voyage key

npx supabase db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable                        | Required | Description                                                     |
| ------------------------------- | -------- | --------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Yes      | Supabase project URL                                            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes      | Supabase anon/public key                                        |
| `SUPABASE_SERVICE_ROLE_KEY`     | Yes      | Supabase service role key (server-only)                         |
| `GOOGLE_API_KEY`                | Yes      | Google API key (Gemini via `@google/genai` SDK)                 |
| `VOYAGE_API_KEY`                | Yes      | Voyage AI embedding key                                         |
| `GEMINI_MODEL`                  | No       | Gemini model ID override (default: gemini-3.1-pro-preview)      |
| `RESEND_API_KEY`                | No       | Resend transactional email key                                  |
| `INNGEST_EVENT_KEY`             | No       | Inngest event key (for background job orchestration)            |
| `INNGEST_SIGNING_KEY`           | No       | Inngest signing key                                             |
| `LOG_LEVEL`                     | No       | Logging level: debug, info, warn, error (default: warn in prod) |
| `SENTRY_DSN`                    | No       | Sentry error tracking DSN                                       |

## Scripts

```bash
npm run dev            # Development server
npm run build          # Production build
npm test               # Vitest test suite
npm run lint           # ESLint
npm run analyze        # Bundle analysis (opens browser report)

# Targeted testing
npm run test:unit      # Unit tests only (src/lib/)
npm run test:integration  # Integration tests only (__tests__/integration/)
npm run test:e2e       # Playwright E2E tests
npm run test:coverage  # Test coverage report
npm run test:ci        # CI mode with JUnit output
```

## License

Private. All rights reserved.
