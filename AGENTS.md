# ProposalAI Agent Instructions

> This file is the source of truth for all automated agents working on ProposalAI.
> It's updated nightly by the compound review process with learnings from each session.

## Product Overview

ProposalAI is an AI-powered proposal generation SaaS using Intent-Driven Development (IDD).

**Tech Stack:**
- Next.js 16 with React 19
- Supabase (PostgreSQL + Auth + Storage)
- Claude AI (Anthropic) for proposal generation
- Voyage AI for embeddings
- Stripe for billing (to be implemented)

**Target:** $10K MRR in 90 days

## Core Patterns

### IDD 3-Layer Model
Always respect the Intent-Driven Development architecture:
- **L1 (Company Truth)**: Canonical data - brand, capabilities, case studies. Locked, admin-only updates.
- **L2 (Proposal Intent)**: Client outcomes, win strategy, constraints. Human-reviewed.
- **L3 (Generated Content)**: AI-generated sections with claim traceability. AI executes, human verifies.

### Multi-Tenancy (Critical)
- All queries MUST scope by `organization_id`
- Never expose data across organizations
- RLS policies enforce isolation at database level

### Usage Tracking
- Track proposals created per billing period
- Track AI tokens consumed
- Enforce plan limits before generation

## File Conventions

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── (dashboard)/       # Authenticated dashboard
│   ├── (public)/          # Public pages (landing, pricing)
│   └── api/               # API routes
├── components/            # React components (PascalCase)
├── lib/                   # Utilities (camelCase)
│   ├── ai/               # Claude AI integration
│   ├── stripe/           # Billing (to be created)
│   └── supabase/         # Database clients
└── types/                # TypeScript types
```

## API Route Patterns

```typescript
// Always check auth
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

// Always get organization context
const { data: profile } = await supabase
  .from('profiles')
  .select('organization_id')
  .eq('id', user.id)
  .single();

// Always scope queries by organization
const { data } = await supabase
  .from('proposals')
  .select('*')
  .eq('organization_id', profile.organization_id);
```

## Database Schema Notes

**Key Tables:**
- `organizations` - Billing, plan limits, usage tracking
- `profiles` - User profiles linked to organizations
- `proposals` - Main proposal documents
- `proposal_sections` - Individual sections (10 per proposal)
- `documents` - Knowledge base uploads
- `document_chunks` - Embedded content for RAG

**Important:** The `company_context`, `product_contexts`, and `evidence_library` tables need organization scoping (currently global - security issue to fix).

## AI Generation Guidelines

- Use Claude Sonnet 4 for all generation
- Temperature: 0.7 for creative content, 0.3 for structured extraction
- Max tokens: 4096 per section
- Always inject L1 context (company truth) into prompts
- Always verify claims against evidence library

## Gotchas & Learnings

<!-- Updated nightly by compound review -->

### 2025-01-29 - Initial Setup
- Project uses Next.js 16 with App Router (not Pages Router)
- Supabase RLS policies use team_id but need organization_id
- Landing page at /src/app/(public)/landing/page.tsx is Capgemini-branded
- No Stripe integration exists yet
- No tests exist - need Playwright setup

## Current Priorities

See `/reports/priorities.md` for the current priority queue.

## Compound Engineering

This project uses compound engineering for continuous improvement:

1. **Daily Compound Review (10:30 PM)**: Extract learnings, update this file
2. **Auto-Compound (11:00 PM)**: Pick top priority, implement, create PR

The goal is autonomous operation with minimal human oversight.
