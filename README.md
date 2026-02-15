# IntentWin

AI-powered proposal generation platform that transforms RFP documents into winning, compliance-ready proposals. Built for government contractors and professional services firms.

## What It Does

IntentWin ingests an RFP or solicitation document, cross-references it against your company's verified knowledge base (past performance, certifications, capabilities), and generates a structured proposal with section-by-section content — executive summary, technical approach, methodology, staffing, pricing rationale, risk mitigation, and win themes.

### Key Capabilities

- **RFP Intake & Analysis** — Upload PDF/DOCX solicitations; AI extracts requirements, evaluation criteria, and compliance items
- **Bid/No-Bid Scoring** — Automated opportunity evaluation engine that scores RFPs on fit, capacity, and win probability before committing resources
- **Two-Layer Knowledge System** — L1 (verified company context: brand, products, evidence) + L2 (uploaded reference documents for RAG retrieval)
- **Bulk Import** — Batch extraction and import of L1 company context from uploaded documents
- **Section-by-Section Generation** — 15 prompt-specialized AI pipelines for each proposal section (executive summary, approach, methodology, team, pricing, etc.)
- **Industry Intelligence** — Industry-specific proposal tuning for healthcare, financial services, manufacturing, and public sector
- **Persuasion Engine** — AI-driven persuasive writing optimization layered into generated content
- **Quality Overseer** — 3-judge LLM council review system scoring proposals on compliance, persuasiveness, specificity, and consistency with auto-remediation
- **AI Evidence Extraction** — Automatically extract case studies, certifications, and metrics from uploaded documents
- **Evidence Library** — Case studies, certifications, and metrics linked to proposals with verified sourcing
- **5-Format Export** — HTML, DOCX, PPTX, Google Slides, and PDF with Mermaid diagram rendering
- **Version Control** — Full proposal versioning with diff comparison and restore
- **Brand Voice** — Configurable brand voice settings that shape AI-generated content tone and style
- **Multi-Tenant** — Organization-scoped data isolation via Supabase RLS; every table filtered by `organization_id`
- **Waitlist + Self-Service Signup** — Access-controlled onboarding with auto-confirm and automatic org provisioning

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Next.js 16 App                            │
│                  (App Router + RSC)                            │
├──────────────┬────────────────────┬──────────────────────────┤
│   Dashboard  │    API Routes      │       Auth (SSR)          │
│  - Proposals │  - /api/proposals  │  Supabase Auth + RLS      │
│  - Evidence  │  - /api/intake     │  Cookie-based sessions    │
│  - KB Docs   │  - /api/evidence   │  Bearer token fallback    │
│  - L1 Sources│  - /api/sources    │  Waitlist gate            │
│  - Settings  │  - /api/documents  │  Auto-confirm enabled     │
│  - Analytics │  - /api/bulk-import│                           │
├──────────────┴────────────────────┴──────────────────────────┤
│                        AI Layer                               │
│   Google Gemini 3 Pro (generation + quality review)            │
│   Voyage AI voyage-3 (1024d vector embeddings)                │
│   15 section prompts + 3-judge quality council                │
│   Industry intelligence + persuasion engine                   │
├──────────────────────────────────────────────────────────────┤
│                       Supabase                                │
│   PostgreSQL + pgvector + Row Level Security                  │
│   25+ migrations │ Multi-tenant org isolation                 │
│   Auth triggers (handle_new_user → auto-provision org)        │
├──────────────────────────────────────────────────────────────┤
│                     Export Layer                               │
│   Puppeteer/Chrome (PDF) │ docx (DOCX) │ pptxgenjs (PPTX)    │
│   Google Slides API │ HTML + Mermaid                          │
└──────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer         | Technology                                                        |
| ------------- | ----------------------------------------------------------------- |
| Framework     | Next.js 16, React 19, TypeScript 5                                |
| Styling       | Tailwind CSS 4, Framer Motion                                     |
| AI Generation | Google Gemini 3 Pro                                               |
| Embeddings    | Voyage AI (voyage-3, 1024d)                                       |
| Database      | Supabase (PostgreSQL 15 + pgvector)                               |
| Auth          | Supabase Auth with SSR cookies + RLS policies                     |
| Payments      | Stripe (subscriptions + usage metering)                           |
| Email         | Resend (transactional)                                            |
| Editor        | TipTap (rich text editing)                                        |
| Export        | Puppeteer (PDF), docx (DOCX), pptxgenjs (PPTX), Google Slides API |
| Testing       | Vitest + Playwright                                               |
| Deployment    | Vercel (with `@sparticuz/chromium` for serverless PDF)            |

## Project Structure

```
src/
├── app/
│   ├── (auth)/                # Login, signup, password reset, callback
│   ├── (dashboard)/           # Authenticated pages
│   │   ├── proposals/         # Proposal list + editor + versions + export
│   │   ├── evidence-library/  # Case studies, certs, metrics CRUD
│   │   ├── knowledge-base/    # L2 document upload + search + L1 sources browser
│   │   │   ├── sources/       # L1 context viewer (reads from DB)
│   │   │   ├── search/        # Semantic search across knowledge base
│   │   │   └── upload/        # Document upload interface
│   │   ├── settings/          # Company context (L1), products, brand voice, branding
│   │   ├── analytics/         # Usage and proposal outcome analytics
│   │   └── onboarding/        # New org setup wizard
│   ├── (public)/              # Public-facing pages
│   │   ├── landing/           # Marketing landing page with JSON-LD
│   │   ├── capabilities/      # Sales-ready capabilities showcase
│   │   ├── pricing/           # Plan tiers and pricing
│   │   ├── blog/              # Blog with dynamic [slug] routing
│   │   ├── about/             # About page
│   │   ├── request-access/    # Waitlist request form
│   │   ├── privacy/           # Privacy policy
│   │   └── terms/             # Terms of service
│   ├── demo-login/            # Demo account quick-login
│   └── api/                   # 25+ API route groups
│       ├── proposals/         # CRUD + generation + versioning + export + quality review
│       ├── intake/            # RFP parsing + requirement extraction + bid evaluation
│       ├── bulk-import/       # Batch L1 context extraction and import
│       ├── sources/           # L1 context API (org-scoped, DB-backed)
│       ├── documents/         # Upload, process, chunk, embed, search, reprocess
│       ├── evidence/          # Evidence library CRUD + AI extraction
│       ├── diagrams/          # Mermaid diagram generation
│       ├── settings/          # Company context + products management
│       ├── analytics/         # Proposal outcome analytics
│       ├── admin/             # Waitlist management
│       ├── auth/              # Access check, session management
│       ├── stripe/            # Billing webhooks + checkout + portal
│       ├── cron/              # Scheduled jobs (nurture emails)
│       └── health/            # Health check endpoint
├── components/
│   ├── proposals/             # Proposal editor, section renderer
│   ├── intake/                # RFP upload + analysis UI
│   ├── knowledge-base/        # Document manager
│   ├── review/                # Quality review display
│   └── ui/                    # Shared UI components
├── content/                   # Static content (blog posts, etc.)
├── hooks/                     # React hooks (auth-fetch, etc.)
├── types/                     # TypeScript type definitions
└── lib/
    ├── ai/
    │   ├── pipeline.ts        # Multi-section generation orchestrator
    │   ├── quality-overseer.ts # 3-judge LLM council quality review
    │   ├── bid-scoring.ts     # Bid/no-bid opportunity scoring
    │   ├── persuasion.ts      # Persuasive writing engine
    │   ├── l1-extractor.ts    # L1 context extraction from documents
    │   ├── embeddings.ts      # Vector embedding + similarity search
    │   ├── industry-configs/  # Healthcare, financial, manufacturing, public sector
    │   └── prompts/           # 15 section-specific prompt templates
    ├── documents/             # File parsing (PDF, DOCX, PPTX)
    ├── export/                # PDF, DOCX, PPTX, Slides, HTML generators
    ├── review/                # Quality scoring logic
    ├── versioning/            # Proposal version management
    └── supabase/              # Server client, admin client, auth helpers

supabase/
└── migrations/                # 25+ SQL migrations (schema + RLS + triggers)

scripts/                       # Seed data, export testing, signup testing
```

## Multi-Tenancy

Every data table includes an `organization_id` column with Row Level Security policies that enforce tenant isolation:

- **Signup trigger** (`handle_new_user`) — automatically creates an organization and admin profile on signup
- **RLS policies** — all SELECT/INSERT/UPDATE/DELETE operations filter through the user's org via their profile
- **API routes** — use `getUserContext()` to resolve the authenticated user's org before any data access
- **L1 Sources** — served from database tables (`company_context`, `product_contexts`, `evidence_library`), not filesystem
- **L2 Documents** — `documents` and `document_chunks` tables are org-scoped

New accounts start with a completely clean slate — zero documents, zero L1 context, zero proposals.

## Data Model

### L1 Context (Verified Company Data)

Managed through Settings and the L1 Sources browser. Structured, curated data that the AI uses as ground truth:

| Table              | Purpose                                                               |
| ------------------ | --------------------------------------------------------------------- |
| `company_context`  | Brand, values, certifications, differentiators, methodology           |
| `product_contexts` | Service lines with capabilities, specs, and pricing models            |
| `evidence_library` | Case studies, metrics, testimonials, certifications with verification |

### L2 Content (Knowledge Base)

Uploaded documents (PDF, DOCX, PPTX) that are chunked, embedded, and retrieved via RAG during proposal generation:

| Table             | Purpose                                              |
| ----------------- | ---------------------------------------------------- |
| `documents`       | File metadata, processing status, chunk count        |
| `document_chunks` | Extracted text segments with 1024d vector embeddings |

### Proposals

| Table               | Purpose                                            |
| ------------------- | -------------------------------------------------- |
| `proposals`         | Core proposal data, status, client info, metadata  |
| `proposal_sections` | Generated content per section type                 |
| `proposal_versions` | Version history with full snapshot + restore       |
| `proposal_reviews`  | Quality scores, dimension breakdowns, and feedback |

### Access Control

| Table            | Purpose                                                     |
| ---------------- | ----------------------------------------------------------- |
| `organizations`  | Tenant container with plan tier + usage limits              |
| `profiles`       | User profile linked to org with role (admin/manager/member) |
| `allowed_emails` | Emails permitted to sign up (waitlist gate)                 |
| `waitlist`       | Access request submissions                                  |

## AI Pipeline

Each proposal generation runs through specialized prompt chains:

1. **Intake** — Parse RFP, extract requirements and evaluation criteria
2. **Bid/No-Bid Evaluation** — Score opportunity fit, capacity, and win probability
3. **L1 Context Fetch** — Pull verified company data (brand, products, evidence) for the user's org
4. **L2 RAG Retrieval** — Semantic search across uploaded documents for relevant content
5. **Industry Intelligence** — Apply industry-specific context (healthcare, financial services, manufacturing, public sector)
6. **Win Strategy** — Analyze competitive positioning and key themes
7. **Section Generation** (parallel) — Executive summary, understanding, approach, methodology, team, timeline, pricing, risk mitigation, case studies, outcomes, why-us
8. **Persuasion Enhancement** — Optimize generated content for persuasive impact
9. **Quality Review** — 3-judge LLM council scores each section (0-100) across compliance, persuasiveness, specificity, consistency
10. **Auto-Remediation** — Re-generate sections scoring below threshold with judge feedback

## Export Formats

| Format        | Technology                         | Notes                                                      |
| ------------- | ---------------------------------- | ---------------------------------------------------------- |
| HTML          | Server-rendered + Mermaid diagrams | Includes inline CSS for email-safe output                  |
| DOCX          | `docx` library                     | Structured sections with headers and formatting            |
| PPTX          | `pptxgenjs`                        | Rich-text multi-slide rendering with markdown parsing      |
| Google Slides | Google Slides API                  | Requires Google OAuth credentials                          |
| PDF           | Puppeteer + Chrome/Edge            | Uses `@sparticuz/chromium` on Vercel, local browser on dev |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (or npm)
- Supabase project (with pgvector extension enabled)
- Google Gemini API key
- Voyage AI API key (for embeddings)
- Chrome, Edge, or Chromium installed (for local PDF export)

### Setup

```bash
# Clone and install
git clone https://github.com/robroyhobbs/intentwin.git
cd intentwin
pnpm install

# Configure environment
cp .env.example .env.local
# Fill in: Supabase URL + keys, Gemini key, Voyage key, Stripe keys

# Run Supabase migrations
npx supabase db push

# Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to access the app.

### Environment Variables

| Variable                        | Required | Description                             |
| ------------------------------- | -------- | --------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Yes      | Supabase project URL                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes      | Supabase anon/public key                |
| `SUPABASE_SERVICE_ROLE_KEY`     | Yes      | Supabase service role key (server-only) |
| `GOOGLE_AI_API_KEY`             | Yes      | Google Gemini API key                   |
| `VOYAGE_API_KEY`                | Yes      | Voyage AI embedding key                 |
| `STRIPE_SECRET_KEY`             | No       | Stripe billing key                      |
| `STRIPE_WEBHOOK_SECRET`         | No       | Stripe webhook verification             |
| `RESEND_API_KEY`                | No       | Resend transactional email key          |

### New Account Setup

1. Add the email to `allowed_emails` table (Supabase Dashboard or admin API)
2. User signs up at `/signup` — org + profile created automatically
3. Configure L1 context in Settings > Company
4. Upload reference documents to Knowledge Base
5. Create first proposal

## Scripts

```bash
pnpm dev                              # Development server
pnpm build                            # Production build
pnpm test                             # Vitest test suite
pnpm lint                             # ESLint

# Utilities
npx tsx scripts/test-all-exports.ts   # Test all 5 export formats
npx tsx scripts/test-signup-flow.ts   # E2E signup flow test
npx tsx scripts/reseed-l1-from-research.ts  # Reseed L1 context from research docs
```

## License

Private. All rights reserved.
