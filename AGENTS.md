# IntentWin Agent Instructions

> This file is the source of truth for all automated agents working on IntentWin.
> It's updated nightly by the compound review process with learnings from each session.

## Product Overview

IntentWin is an AI-powered proposal generation SaaS using Intent-Driven Development (IDD).

**Tech Stack:**

- Next.js 16 with React 19
- Supabase (PostgreSQL + Auth + Storage)
- Claude AI (Anthropic) for proposal generation
- Voyage AI for embeddings
- Stripe for billing (checkout, webhooks, customer portal)

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

**CRITICAL: Always use getUserContext for organization scoping!**

```typescript
import { getUserContext, verifyProposalAccess } from "@/lib/supabase/auth-api";

// Get user context with organization
const context = await getUserContext(request);
if (!context) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// For routes that access resources by ID, ALWAYS verify org access
const proposal = await verifyProposalAccess(context, proposalId);
if (!proposal) {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

// For new queries, always filter by organization_id
const { data } = await adminClient
  .from("proposals")
  .select("*")
  .eq("organization_id", context.organizationId);
```

**Available helpers in `@/lib/supabase/auth-api`:**

- `getUserContext(request)` - Returns user + organizationId + role
- `verifyProposalAccess(context, id)` - Checks proposal belongs to user's org
- `verifyDocumentAccess(context, id)` - Checks document belongs to user's org
- `checkPlanLimit(orgId, key)` - Checks if org is within usage limits
- `incrementUsage(orgId, key, amount)` - Tracks usage

## Database Schema Notes

**Key Tables:**

- `organizations` - Billing, plan limits, usage tracking
- `profiles` - User profiles linked to organizations
- `proposals` - Main proposal documents
- `proposal_sections` - Individual sections (10 per proposal)
- `documents` - Knowledge base uploads
- `document_chunks` - Embedded content for RAG

**Organization Scoping (COMPLETED):**
All tables now have `organization_id` columns with RLS policies:

- `organizations` - Main billing/plan entity
- `profiles` - Linked to organizations
- `proposals`, `documents` - Scoped by organization_id
- `company_context`, `product_contexts`, `evidence_library` - Fixed in migration 00015

## AI Generation Guidelines

- Use Claude Sonnet 4 for all generation
- Temperature: 0.7 for creative content, 0.3 for structured extraction
- Max tokens: 4096 per section
- Always inject L1 context (company truth) into prompts
- Always verify claims against evidence library

## Gotchas & Learnings

<!-- Updated nightly by compound review -->

### 2026-01-30 - Security & Multi-Tenancy

- **CRITICAL**: `adminClient` bypasses RLS! Always add `.eq('organization_id', context.organizationId)` to queries
- Use `getUserContext()` not `getAuthUser()` in API routes - it returns organization context
- Use `verifyProposalAccess()` / `verifyDocumentAccess()` for ID-based routes
- Document search RPC needed org-scoped version (`match_document_chunks_org`)
- Stripe API version must match installed types (2026-01-28.clover)
- Stripe client needs lazy init to allow builds without env vars
- Export storage paths should use `organizationId` not `userId` for proper isolation

### 2025-01-29 - Initial Setup

- Project uses Next.js 16 with App Router (not Pages Router)
- Supabase RLS policies use team_id but need organization_id (FIXED in 00014, 00015)
- Landing page rebranded to IntentWin, served at root URL
- Stripe integration complete (checkout, webhooks, portal)
- No tests exist - need Playwright setup

## Current Priorities

See `/reports/priorities.md` for the current priority queue.

## Compound Engineering

This project uses compound engineering for continuous improvement:

1. **Daily Compound Review (10:30 PM)**: Extract learnings, update this file
2. **Auto-Compound (11:00 PM)**: Pick top priority, implement, create PR

The goal is autonomous operation with minimal human oversight.
