# IntentWin

AI-powered proposal generation platform that transforms RFP documents into winning, compliance-ready proposals. Built for government contractors and professional services firms.

## What It Does

IntentWin ingests an RFP or solicitation document, cross-references it against your company's verified knowledge base (past performance, certifications, capabilities), and generates a structured proposal with section-by-section content — executive summary, technical approach, methodology, staffing, pricing rationale, risk mitigation, and win themes.

### Key Capabilities

- **RFP Intake & Analysis** — Upload PDF/DOCX solicitations; AI extracts requirements, evaluation criteria, and compliance items
- **Two-Layer Knowledge System** — L1 (verified company context: brand, products, evidence) + L2 (uploaded reference documents for RAG retrieval)
- **Section-by-Section Generation** — 15 prompt-specialized AI pipelines for each proposal section (executive summary, approach, methodology, team, pricing, etc.)
- **Quality Overseer** — Automated review scoring proposals on compliance, persuasiveness, specificity, and consistency with auto-remediation
- **Evidence Library** — Case studies, certifications, and metrics linked to proposals with verified sourcing
- **Version Control** — Full proposal versioning with diff comparison
- **Multi-Tenant** — Organization-scoped data isolation via Supabase RLS
- **Export** — DOCX and PDF generation with Mermaid diagram rendering

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Next.js 16 App                  │
│              (App Router + RSC)                   │
├─────────────┬───────────────────┬───────────────┤
│  Dashboard  │    API Routes     │   Auth (SSR)   │
│  - Proposals│  - /api/proposals │  Supabase Auth │
│  - Evidence │  - /api/intake    │  + RLS         │
│  - KB Docs  │  - /api/evidence  │               │
│  - Settings │  - /api/documents │               │
│  - Analytics│  - /api/rfp       │               │
├─────────────┴───────────────────┴───────────────┤
│                   AI Layer                        │
│  Google Gemini (generation) + Voyage AI (embed)   │
│  15 section prompts + quality review pipeline     │
├──────────────────────────────────────────────────┤
│                  Supabase                         │
│  PostgreSQL + pgvector + RLS + Edge Functions     │
│  25 migrations │ Multi-tenant org isolation       │
└──────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16, React 19, TypeScript 5 |
| Styling | Tailwind CSS 4, Framer Motion |
| AI Generation | Google Gemini (gemini-3-pro) |
| Embeddings | Voyage AI (voyage-3, 1024d) |
| Database | Supabase (PostgreSQL + pgvector) |
| Auth | Supabase Auth with SSR + RLS policies |
| Payments | Stripe (subscriptions + usage) |
| Email | Resend (transactional) |
| Editor | TipTap (rich text editing) |
| Export | Puppeteer (PDF), docxtemplater (DOCX) |
| Testing | Vitest + Playwright |
| Deployment | Vercel |

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login, signup, password reset
│   ├── (dashboard)/         # Authenticated pages
│   │   ├── proposals/       # Proposal list + editor
│   │   ├── evidence-library/# Case studies, certs, metrics
│   │   ├── knowledge-base/  # Document upload + management
│   │   ├── settings/        # Company context (L1 data)
│   │   ├── analytics/       # Usage and proposal analytics
│   │   └── onboarding/      # New org setup wizard
│   ├── (public)/            # Landing page, pricing
│   └── api/                 # 15+ API route groups
│       ├── proposals/       # CRUD + generation + versioning
│       ├── intake/          # RFP parsing + requirement extraction
│       ├── rfp/             # Compliance matrix generation
│       ├── documents/       # Upload, process, chunk, embed
│       ├── evidence/        # Evidence library CRUD
│       ├── settings/        # Company context management
│       └── cron/            # Scheduled jobs (cleanup, analytics)
├── components/
│   ├── proposals/           # Proposal editor, section renderer
│   ├── intake/              # RFP upload + analysis UI
│   ├── knowledge-base/      # Document manager
│   ├── review/              # Quality review display
│   └── ui/                  # Shared UI components
├── hooks/                   # React hooks (auth-fetch, etc.)
└── lib/
    ├── ai/
    │   ├── pipeline.ts      # Multi-section generation orchestrator
    │   ├── quality-overseer.ts # Automated quality review + scoring
    │   ├── embeddings.ts    # Vector embedding + similarity search
    │   └── prompts/         # 15 section-specific prompt templates
    ├── documents/           # File parsing (PDF, DOCX, PPTX)
    ├── export/              # PDF + DOCX export
    ├── review/              # Quality scoring logic
    ├── versioning/          # Proposal version management
    └── supabase/            # Client + server helpers

supabase/
└── migrations/              # 25 SQL migrations (schema + RLS)

scripts/                     # Seed data, utilities, diagnostics
```

## Getting Started

### Prerequisites

- Node.js 20+
- Supabase project (with pgvector extension)
- Google Gemini API key
- Voyage AI API key (for embeddings)

### Setup

```bash
# Clone and install
git clone <repo-url>
cd capgemini-proposal-generator
npm install

# Configure environment
cp .env.example .env.local
# Fill in your Supabase, Gemini, Voyage, and Stripe keys

# Run Supabase migrations
npx supabase db push

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the app.

### Demo Account

A demo account with pre-seeded L1 context is available:
- Email: `som@thecomsystems.com`
- Password: `COMSystems2026!`

Set `DEMO_PASSWORD` in `.env.local` to enable the `/demo-login` route.

## Data Model

### L1 Context (Verified Company Data)

Managed through Settings and Evidence Library. Structured, curated data that the AI uses as ground truth:

| Table | Purpose |
|-------|---------|
| `company_context` | Brand, values, certifications, differentiators, methodology |
| `product_contexts` | Service lines with capabilities and descriptions |
| `evidence_library` | Case studies, metrics, certifications with verification |

### L2 Content (Knowledge Base)

Uploaded documents (PDF, DOCX, PPTX) that are chunked, embedded, and retrieved via RAG during proposal generation:

| Table | Purpose |
|-------|---------|
| `documents` | File metadata, processing status |
| `document_chunks` | Extracted text segments with vector embeddings |

### Proposals

| Table | Purpose |
|-------|---------|
| `proposals` | Core proposal data, status, metadata |
| `proposal_sections` | Generated content per section |
| `proposal_versions` | Version history with diffs |
| `proposal_reviews` | Quality scores and feedback |

## AI Pipeline

Each proposal generation runs through specialized prompt chains:

1. **Intake** — Parse RFP, extract requirements and evaluation criteria
2. **Win Strategy** — Analyze competitive positioning and key themes
3. **Section Generation** (parallel) — Executive summary, understanding, approach, methodology, team, timeline, pricing, risk mitigation, case studies, outcomes, why-us
4. **Quality Review** — Score each section (0-100) across compliance, persuasiveness, specificity, consistency
5. **Auto-Remediation** — Re-generate sections scoring below threshold

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run test         # Run Vitest test suite
npm run lint         # ESLint
```

## License

Private. All rights reserved.
