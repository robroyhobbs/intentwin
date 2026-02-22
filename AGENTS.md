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

### 2026-02-21 - Quiet Day; Solicitation Type Extraction

- **Light activity**: Only commit was yesterday's compound review. One in-progress change: adding `solicitation_type` (RFP | RFI | RFQ | SOW | Proactive) to the intake extraction prompt. This distinguishes document types early in the pipeline so downstream generation can tailor tone and structure (e.g., RFQ responses need pricing tables, RFIs need capability summaries). Pattern: when adding a new extracted field, add it in both the `explicit` and `inferred` sections of the prompt schema so the AI always produces a value even when the document doesn't state it outright

### 2026-02-20 - AI Token Budgets, Demo Seeding & Knowledge Base Plumbing

- **AI JSON responses truncate silently when `maxOutputTokens` is too low**: Gemini review judge was returning `unexpected end of JSON input` because `maxOutputTokens: 1024` wasn't enough for structured JSON review output. Doubled to 2048 and wrapped `JSON.parse` with a try/catch that surfaces the response tail (last 200 chars) for debugging. Pattern: when an AI route returns structured JSON, set `maxOutputTokens` generously (2x what you think you need) and always catch parse errors with context about the raw response length
- **Seed scripts are the fastest way to demo — invest in them**: The 1,344-line `seed-general-company.ts` seeds a complete demo account (org, 20 L1 context entries, 4 products, 14 evidence items, sample RFP proposal with 15 compliance requirements). Having a one-command demo reset (`npx tsx scripts/seed-general-company.ts`) makes onboarding and sales demos reproducible. Pattern: seed scripts should be idempotent (upsert, not insert) and cover all entity types the user will interact with
- **`maxDuration` must be set on every AI-touching route — not just generation**: The `bulk-import/extract` route was missing `maxDuration`, relying on Vercel's 60s default. Large document parsing + AI extraction easily exceeds that. This is the third time this pattern has appeared (generation, quality review, now extraction). Consider a lint rule or codemod to flag API routes importing AI clients that lack a `maxDuration` export
- **Service catalog `fileName` should use UUID, not slugified names**: Sources page was building file identifiers from `${service_line}-${product_name}` slugs, which broke when product names contained special characters or duplicated across service lines. Switched to using the product's UUID (`p.id`) as the fileName, which is guaranteed unique and stable. Pattern: when building URL-safe identifiers for DB entities, prefer the primary key over derived slugs

### 2026-02-19 - Security Hygiene, Query Discipline & Status Centralization

- **Deleted secrets persist in git history — always rotate**: `scripts/generate-proposal.mjs` was deleted in `e407417` but the hardcoded Supabase service role key and Anthropic API key remain in git history. Created `docs/key-rotation.md` runbook. Pattern: any secret committed to git, even if deleted in the next commit, must be treated as compromised and rotated immediately. The Supabase service role key is especially critical because it bypasses all RLS
- **Unbounded queries are a production risk — always paginate**: List endpoints (evidence, waitlist, versions, reviews) had no `limit` or `range()`, meaning a single request could fetch thousands of rows. Fix: added `page`/`limit` query params with `range(from, to)` and `{ count: "exact" }` for total count. Default limit: 50, max: 200. Pattern: every list endpoint should accept pagination params and enforce a max limit, even for internal-only routes
- **Centralize status strings into typed constants**: 51 files used inline string literals like `"generating"`, `"draft"`, `"completed"` — typos cause silent bugs, and renaming a status requires a 50-file search. Created `src/lib/constants/statuses.ts` with `as const` objects for all 10 domain entities (Proposal, Generation, SectionReview, Intent, QualityReview, DealOutcome, Waitlist, Review, Compliance, Export). Pattern: `const X = { KEY: "value" } as const` + `type XType = (typeof X)[keyof typeof X]`. Import and use `ProposalStatus.GENERATING` instead of `"generating"`
- **Complete the `select("*")` elimination**: Previous session identified that `select("*")` fetches unnecessary JSONB blobs. This session completed the sweep across all 26 remaining files. Zero `select("*")` calls remain in the codebase. Lesson: when a pattern is identified as harmful, do a full codebase sweep in the same or next session rather than fixing incrementally
- **Gemini model versions drift quickly**: Upgraded from `gemini-2.5-pro-preview-05-06` to `gemini-3.1-pro-preview` for generation and quality review, and `gemini-3-pro-image-preview` for diagram generation. Model IDs are hardcoded in 3 different files. Consider centralizing model IDs into a config or env vars to make upgrades a single-line change

### 2026-02-18 - Pipeline Hardening, Serverless PDF, Multi-Document Support

- **`after()` callbacks need `maxDuration` or Vercel kills them silently**: The generate route used `after()` for background section generation but had no `maxDuration` export. Vercel's default 60s limit killed the callback before all 10 sections completed, leaving trailing sections stuck in `generating` status. Fix: add `export const maxDuration = 300` to any route using `after()` with AI work. Same issue hit the export and regenerate routes
- **Serverless PDF generation requires explicit Chromium binary management**: `puppeteer-core` alone has no browser binary — `@sparticuz/chromium` provides one for serverless. After removing it during dependency cleanup (2026-02-16), PDF exports silently timed out. Fix: restore the package AND add `outputFileTracingIncludes` in `next.config.ts` so Vercel bundles the binary. Lesson: `depcheck` false positives on native binary packages that are dynamically loaded
- **`networkidle0` hangs in serverless environments**: Puppeteer's `networkidle0` wait condition never resolves if the HTML references external resources (Google Fonts CDN) that can't be fetched from a serverless function. Fix: use `domcontentloaded` + explicit timeout instead, and inline system font fallbacks (Arial, Helvetica) in the HTML template
- **Zombie state pattern — wrap background AI work with timeout + DB cleanup**: Quality review, generation, and export routes all had the same bug: if the AI call hangs or Vercel kills the function, the DB status stays in a processing state forever. Fix pattern: (1) wrap the work in a timeout < `maxDuration`, (2) catch timeout → reset DB status, (3) auto-detect stale records on next request (e.g., status = 'reviewing' AND updated_at < 5 min ago → reset)
- **Concurrent generation guard with atomic DB update**: Two users clicking "Generate" simultaneously would create duplicate sections. Fix: `UPDATE proposals SET status = 'generating' WHERE id = $1 AND status != 'generating'` — if zero rows affected, return 409. The DB update IS the lock; no external mutex needed
- **Idempotent section insert on retry**: If generation partially fails and the user retries, the insert of new sections would fail on unique constraint. Fix: delete existing sections before insert (`DELETE FROM proposal_sections WHERE proposal_id = $id`) making retries safe
- **API response shape mismatch — polling checks the wrong path**: `flexible-intake.tsx` polled `data.document?.processing_status` but the GET route returned fields at top level (no `.document` wrapper). Every PDF upload appeared to fail after 30s. Lesson: when writing polling code, read the actual API route response, don't guess the shape
- **Environment variable trailing whitespace**: `EMBEDDING_MODEL` env var had a trailing newline from Vercel dashboard paste, sending `voyage-3\n` to the Voyage API → 400 error. Fix: `.trim()` all env var reads defensively. This is invisible in dashboard UIs
- **Vitest path alias resolution in worker forks**: `vite-tsconfig-paths` plugin doesn't propagate `@/` aliases into Vitest worker forks reliably. Fix: use explicit `resolve.alias` in `vitest.config.ts` instead. Also remove deprecated `singleFork`/`poolOptions` (removed in Vitest 4)
- **Multi-document architecture**: Added `proposal_documents` junction table with audit trail, incremental extraction + semantic merge endpoints, and role-aware extraction prompts. Key design: each document tracks `source_document_id` on extracted fields for traceability, and merge uses priority ordering (RFP > scope > pricing) for conflict resolution
- **Non-null assertions hide bugs**: Cursor Bugbot flagged `event!` assertions on optional DB insert results. The insert can return null on conflict or RLS denial. Fix: proper null checks with fallback behavior rather than `!` assertions. Pattern: treat every DB write result as potentially null

### 2026-02-17 - Performance Sprint: Caching, Query Optimization & Multi-Tenant Security

- **RAG retrieval was leaking cross-tenant data**: `match_document_chunks` RPC had no org filter — any org's embeddings could surface in another org's proposal generation. Fix: created `match_document_chunks_org` RPC with `filter_organization_id` parameter and passed `organizationId` through the entire retrieval pipeline. Every RPC that touches user data must accept and enforce org scoping
- **`select("*")` on list endpoints fetches massive JSONB blobs**: The proposals list route was pulling `intake_data`, `quality_review`, and other large JSONB columns for every row. Fix: explicit column selection (`id, title, status, created_at, ...`) + server-side pagination with `range()`. Added `{ count: "exact" }` for total count without fetching all rows
- **Lightweight vs full access checks**: `verifyProposalAccess()` fetches the entire proposal row (including JSONB). Many routes only need to confirm ownership. Added `checkProposalAccess()` / `checkDocumentAccess()` that select only `id` — use these when you don't need the row data
- **Supabase admin client is stateless — singleton is safe**: Each `.from()` call makes an independent HTTP request with no shared connection state. Converting `createAdminClient()` to a module-level singleton eliminates ~3-5 redundant object allocations per request with zero risk of connection leakage
- **L1 context (Company Truth) rarely changes — cache it**: L1 data is admin-only updates, but `fetchL1Context()` was hitting the DB on every section generation. Added `TtlCache<L1Context>` (5-min TTL, 50 entries max, LRU eviction) keyed by `org:serviceLine:industry`. On Vercel each serverless instance keeps its own cache — no cross-instance coordination needed
- **Rate limiting belongs in middleware, not per-route**: Had `checkRateLimit()` calls scattered across 8+ API routes with inconsistent configs. Moved to a single middleware check (`pathname.startsWith("/api")`) that runs before session refresh. Per-route configs live in `rate-limit/config.ts`. Removed duplicate per-route calls
- **Quality council reviews can parallelize across sections**: Section reviews were sequential (`for...of` loop) but each section's judges already ran in parallel. Wrapped in `parallelBatch()` with `PIPELINE_CONCURRENCY` limit. Fatal errors now only abort if zero sections succeed (partial results are still useful)
- **Batch DB updates beat N+1 loops**: Nurture cron was doing individual `UPDATE` per waitlist entry. Collected successful IDs, then did a single `.in("id", successfulIds)` update. Same pattern applies anywhere you're updating multiple rows with the same values
- **Broken migration index syntax**: Migration 00031 had a `CREATE INDEX IF NOT EXISTS` on a column that didn't exist in `deal_outcome_history`. Fix: corrected the column reference. Always verify migration SQL against the actual table schema before committing
- **`after()` for fire-and-forget generation**: Replaced detached `Promise` calls in the generate route with Next.js `after()` to ensure background work completes even if the response stream closes. `after()` runs after the response is sent but within the function's lifetime

### 2026-02-16 - Code Quality Enforcement, Bloat Reduction & Component Architecture

- **ESLint as architectural guardrails**: Added `max-lines` (300 src / 600 pages), `max-lines-per-function` (50 / 150 for page exports), `max-depth` (4), `max-params` (5) as warnings. Separate rule overrides for test files, scripts, and export modules prevent false positives. Starting from 26 errors → 0 errors in one pass; 237 warnings remain as intentional guardrails for legacy code
- **God component splitting pattern**: 6 page components (1,000+ lines each) split into 36 sub-components using `_components/` directories co-located with each page. Pattern: extract types.ts first, then stateless presentational sub-components, keep orchestration/state in page.tsx. Biggest win: `proposals/new/page.tsx` went from 1,494 → 614 lines
- **Slides generator monolith**: 3,158-line `slides-generator.ts` split into `slides/` directory (types, constants, icons, styles, templates, slide-builder). Main file became a thin 141-line facade. Key: separate concerns by domain (visual styles vs. content templates vs. builder logic)
- **Dead code is security surface**: Removed ~800 lines of unused modules (error-boundary, validators, error-tracking, request-validation, barrel re-exports). Several had no imports anywhere. Barrel `index.ts` files that only re-export create phantom dependencies — delete them
- **Wire before you write**: Found 4 existing modules (`response.ts`, `sanitize.ts`, `logRegenerationMetric`, `logQualityReviewMetric`) that were built but never called. Wiring `apiError()` into 10 API routes fixed 8+ `error.message` client leaks (information disclosure). Always check if infra already exists before building new
- **Marketing page cleanup**: Deleted ~2,800 lines across About, Capabilities, Blog, Pricing pages. When cutting pages, check 6 dependency types: nav links, signup flows, email templates, middleware allowlists, payment flows, sitemap
- **Unused npm dependencies accumulate silently**: Removed framer-motion, puppeteer, pdf-parse-new, unpdf, @sparticuz/chromium — all installed but zero imports. Run periodic `depcheck` or equivalent
- **Review client factory pattern**: 3 near-identical AI client files (groq, mistral, openai) shared 80% code. Extracted `review-client-factory.ts` to eliminate duplication. Pattern: when 3+ files share structure, extract the common shape into a factory
- **Project CLAUDE.md as agent guardrails**: Created project-level `CLAUDE.md` documenting code quality constraints, architecture reminders, and testing conventions. This ensures all agents (human and AI) follow the same rules without re-reading AGENTS.md

### 2026-02-15 - Race Conditions, Data Normalization & DevOps

- **Race condition between regenerate and quality review**: Fire-and-forget async operations (regenerate section, quality review) can run simultaneously, leaving sections stuck in `generating` state. Fix: add mutual exclusion checks (query current status before proceeding) and use Next.js `after()` instead of detached promises for background work
- **ExtractedIntake nesting gotcha**: Copy-pasted RFP content arrives as a nested `ExtractedIntake` object (`.extracted.field.value` wrappers) but `buildRfpSummary()` expected flat top-level fields, producing 0/0 bid scores with no data. Fix: normalize the structure before scoring, and add a `source_text` fallback when structured fields are sparse (< 3 sections extracted)
- **Vercel maxDuration default is too low for AI workflows**: 60s timeout kills long-running quality review API calls. Bumped to 300s. Always set `maxDuration` explicitly for AI-heavy routes
- **Gemini judge ID drift**: Hardcoded model IDs (`gemini-2.0-flash`) in quality overseer didn't match actual model being used, causing misleading audit trails. Fix: read from `GEMINI_MODEL` env var so judge ID stays in sync with deployment config
- **launchd PATH issues**: Cron-like scripts run via macOS launchd don't inherit user shell PATH. The `claude` CLI wasn't found during automated compound review. Fix: explicitly export PATH including `~/.bun/bin`, `~/.local/bin`, `/opt/homebrew/bin` at script top
- **Color team review (Pink→Red→Gold→White)**: Large feature (9 API routes, 6 UI components, 3 DB tables, email notifications) landed cleanly using IDD intent→plan→build pipeline. Key pattern: stage gate advancement requires minimum reviewer consensus before proceeding
- **Recharts integration**: Replaced CSS-only bar charts in analytics dashboard with interactive recharts components (AreaChart, BarChart, PieChart, ScatterChart). Much better UX for win/loss trend analysis

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
