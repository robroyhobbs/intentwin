# IntentWin

AI-powered proposal generation platform that transforms RFP documents into winning, compliance-ready proposals. Built for government contractors and professional services firms.

## What It Does

IntentWin ingests an RFP or solicitation document, cross-references it against your company's verified knowledge base (past performance, certifications, capabilities), and generates a structured proposal with section-by-section content -- executive summary, technical approach, methodology, staffing, pricing rationale, risk mitigation, and win themes.

### Key Capabilities

- **RFP Intake & Analysis** -- Upload PDF/DOCX solicitations; AI extracts requirements, evaluation criteria, and compliance items
- **Bid/No-Bid Scoring** -- Automated opportunity evaluation engine that scores RFPs on fit, capacity, and win probability
- **Two-Layer Knowledge System** -- L1 (verified company context: brand, products, evidence) + L2 (uploaded reference documents for RAG retrieval)
- **Parallel Section Generation** -- 10 AI-powered prompt pipelines run concurrently in configurable batches for ~3x faster generation
- **Industry Intelligence** -- Sector-specific proposal tuning for healthcare, financial services, manufacturing, and public sector
- **Persuasion Engine** -- AI-driven persuasive writing optimization layered into generated content
- **Quality Overseer** -- 3-judge LLM council review system with auto-remediation for sections scoring below threshold
- **Evidence Library** -- Case studies, certifications, and metrics with verified sourcing and AI extraction
- **5-Format Export** -- HTML, DOCX, PPTX, Google Slides, and PDF with Mermaid diagram rendering
- **Color Team Review** -- Structured Pink/Red/Gold/White stage-gate review workflow with reviewer assignments
- **Version Control** -- Full proposal versioning with diff comparison and restore
- **Brand Voice** -- Configurable tone and terminology settings that shape AI-generated content
- **Multi-Tenant** -- Organization-scoped data isolation via Supabase RLS on every table
- **Win/Loss Analytics** -- Interactive dashboard with trend analysis, industry breakdown, and outcome tracking

## Architecture

```
+--------------------------------------------------------------+
|                     Next.js 16 App                           |
|                  (App Router + RSC)                           |
+--------------------------------------------------------------+
|  Dashboard       | API Routes (53 files) |  Auth (SSR)       |
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
|  10 section prompts | 3-judge quality council                |
|  Industry configs | Persuasion engine                        |
+--------------------------------------------------------------+
|                    Observability                             |
|  Structured JSON Logging | Correlation IDs                   |
|  Pipeline Metrics | Error Tracking (Sentry-ready)            |
|  Health Checks with component timing                         |
+--------------------------------------------------------------+
|                       Supabase                               |
|  PostgreSQL + pgvector + Row Level Security                  |
|  30 migrations | Multi-tenant org isolation                  |
|  Performance indexes on all hot query paths                  |
+--------------------------------------------------------------+
|                     Export Layer                              |
|  Puppeteer/Chrome (PDF) | docx (DOCX) | pptxgenjs (PPTX)   |
|  Google Slides API | HTML + Mermaid                          |
+--------------------------------------------------------------+
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16, React 19, TypeScript 5 |
| Styling | Tailwind CSS 4 |
| AI Generation | Google Gemini 3 Pro |
| Embeddings | Voyage AI (voyage-3, 1024d) |
| Database | Supabase (PostgreSQL 15 + pgvector) |
| Auth | Supabase Auth with SSR cookies + RLS policies |
| Email | Resend (transactional) |
| Editor | TipTap (rich text editing) |
| Export | Puppeteer (PDF), docx (DOCX), pptxgenjs (PPTX), Google Slides API |
| Testing | Vitest (540+ tests) + Playwright (E2E) |
| CI/CD | GitHub Actions (lint, typecheck, test, coverage, build) |
| Deployment | Vercel (with `@sparticuz/chromium` for serverless PDF) |

## Engineering Quality

IntentWin follows a 7-phase robustness improvement program:

### Testing (540+ tests)

- **Unit tests** -- Core AI pipeline, export generators, quality checks, bid scoring
- **Integration tests** -- API routes, auth flows, multi-tenancy isolation, RLS policies
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
|   |   +-- settings/          # Company context, products, brand voice, branding
|   |   +-- analytics/         # Win/loss analytics with recharts
|   |   +-- onboarding/        # New org setup wizard
|   +-- (public)/              # Landing, pricing, blog, capabilities
|   +-- api/                   # 53 API route files, 76 HTTP handlers
|       +-- proposals/         # CRUD, generation, versioning, export, quality review
|       +-- intake/            # RFP parsing, requirement extraction, bid evaluation
|       +-- documents/         # Upload, process, chunk, embed, search
|       +-- evidence/          # Evidence library CRUD + AI extraction
|       +-- health/            # Health check with component diagnostics
|       +-- ...                # 20+ additional route groups
+-- components/
|   +-- error-boundary.tsx     # React error boundaries with Sentry integration
|   +-- proposals/             # Proposal editor, quality report, version history
|   +-- compliance/            # Compliance board with drag-and-drop
|   +-- review-workflow/       # Color team stage-gate review
|   +-- ui/                    # Shared UI components
+-- lib/
|   +-- ai/
|   |   +-- pipeline.ts        # Parallel multi-section generation orchestrator
|   |   +-- quality-overseer.ts # 3-judge LLM council quality review
|   |   +-- bid-scoring.ts     # Bid/no-bid opportunity scoring
|   |   +-- persuasion.ts      # Persuasive writing engine
|   |   +-- industry-configs/  # Sector-specific proposal tuning
|   |   +-- prompts/           # 10 section-specific prompt templates
|   +-- api/                   # Standardized response builders
|   +-- rate-limit/            # Sliding window rate limiter + route configs
|   +-- security/              # Input sanitization + request validation
|   +-- observability/         # Error tracking, pipeline metrics
|   +-- utils/logger.ts        # Structured logger with correlation IDs
|   +-- documents/             # File parsing (PDF, DOCX, PPTX)
|   +-- export/                # PDF, DOCX, PPTX, Slides, HTML generators
|   +-- test-utils/            # Mock factories, test helpers, API test utilities
|   +-- supabase/              # Server client, admin client, auth helpers
+-- types/                     # TypeScript type definitions

supabase/
+-- migrations/                # 30 SQL migrations (schema + RLS + indexes)

__tests__/
+-- integration/               # API, security, rate-limiting, observability, performance
+-- e2e/                       # Playwright specs

.github/
+-- workflows/ci.yml           # GitHub Actions CI pipeline
```

## AI Pipeline

Each proposal generation runs through:

1. **Intake** -- Parse RFP, extract requirements and evaluation criteria
2. **Bid/No-Bid Evaluation** -- Score opportunity fit, capacity, and win probability
3. **L1 Context Fetch** -- Pull verified company data for the user's org
4. **L2 RAG Retrieval** -- Semantic search across uploaded documents
5. **Industry Intelligence** -- Apply sector-specific context
6. **Win Strategy** -- Analyze competitive positioning and key themes
7. **Parallel Section Generation** -- 10 sections generated in concurrent batches with per-section metrics
8. **Persuasion Enhancement** -- Optimize content for persuasive impact
9. **Quality Review** -- 3-judge LLM council scores each section across compliance, persuasiveness, specificity, consistency
10. **Auto-Remediation** -- Re-generate sections scoring below threshold with judge feedback

Pipeline concurrency is configurable via `PIPELINE_CONCURRENCY` env var (default: 3).

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
- Google Gemini API key
- Voyage AI API key

### Setup

```bash
git clone https://github.com/robroyhobbs/intentwin.git
cd intentwin
npm install

cp .env.example .env.local
# Fill in: Supabase URL + keys, Gemini key, Voyage key

npx supabase db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-only) |
| `GOOGLE_AI_API_KEY` | Yes | Google Gemini API key |
| `VOYAGE_API_KEY` | Yes | Voyage AI embedding key |
| `RESEND_API_KEY` | No | Resend transactional email key |
| `PIPELINE_CONCURRENCY` | No | Parallel section generation batch size (default: 3) |
| `LOG_LEVEL` | No | Logging level: debug, info, warn, error (default: warn in prod) |
| `SENTRY_DSN` | No | Sentry error tracking DSN |

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
