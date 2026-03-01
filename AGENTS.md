# IntentBid Agent Instructions

> This file is the source of truth for all automated agents working on IntentBid.
> It's updated nightly by the compound review process with learnings from each session.

## Product Overview

IntentBid is an AI-powered proposal generation SaaS using Intent-Driven Development (IDD).

**Tech Stack:**

- Next.js 16 with React 19
- Supabase (PostgreSQL + Auth + Storage)
- Google Gemini (gemini-3.1-pro-preview) for proposal generation
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

## Operational Coordination

- Boundary/source-of-truth design doc: `docs/plans/domain-boundaries.md`
- LLM update log (Claude + other assistants): `docs/plans/llm-change-log.md`
  - Add entries via `scripts/notify-llms.sh "<title>" "<summary>"`
- New GitHub repositories in this product family must use `intentbid-*` naming.
  - Use `scripts/create-intentbid-repo.sh <suffix>` to enforce prefix.

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

- Use Gemini 3.1 Pro Preview for all generation (via `@/lib/ai/gemini.ts`)
- Temperature: 0.7 for creative content, 0.3 for structured extraction
- Max tokens: 4096 per section
- Always inject L1 context (company truth) into prompts
- Always verify claims against evidence library

## Gotchas & Learnings

<!-- Updated nightly by compound review -->

### 2026-02-28 - Intelligence Contracts, Server-Timing Observability, Wizard State Extraction, Rollback Drills

- **Interface-first refactoring enables testability**: Added `IntelligenceService` interface (`contracts.ts`) and made `IntelligenceClient` implement it. All consumers now depend on the interface, not the concrete class. Also exported a `getIntelligenceClient()` factory alongside the singleton. Pattern: when refactoring a module that external code depends on, add an interface first, then refactor implementations behind it — this makes mock/stub injection trivial for tests
- **Server-Timing headers give free browser observability**: Added `Server-Timing` metrics to intelligence, generate, and export API routes (wave 3). Each route now reports stage durations (fetch, generate, upload, sign) in the response header. Browser DevTools Network tab shows these automatically — no APM vendor required. Pattern: for API routes with multiple async stages, add `Server-Timing` headers with `formatTimingMs()` — it costs 2 lines per stage and gives instant production diagnostics
- **Parallel DB fetches reduce export P99 latency**: Export route was fetching proposal then sections sequentially. Wrapped in `Promise.all` to run both queries concurrently. Same pattern applied to the intelligence route. Pattern: when an API handler makes 2+ independent DB queries, always `Promise.all` them — the cost is trivial and the latency improvement is the slower query's duration
- **Map caches leak memory without eviction**: Intelligence client's `Map<string, CachedEntry>` cache had no size limit or cleanup. In long-lived serverless instances (Vercel keeps warm for ~15min), the cache grew unbounded. Added `CACHE_MAX_ENTRIES` (250), periodic expired-entry cleanup every 25 writes, and LRU overflow eviction. Pattern: any in-memory `Map` cache needs three things — max size, expiry cleanup, and overflow eviction. Without all three, it's a memory leak with a TTL delay
- **Wizard state belongs in the domain layer, not React components**: Extracted `WizardState`, `WizardAction`, and `wizardReducer` from `wizard-reducer.ts` (React component directory) into `lib/proposal-core/wizard-state.ts`. Also extracted draft persistence into `wizard-draft.ts`. The wizard components are now thin UI shells around domain-layer state. Pattern: if a reducer has 200+ lines and 15+ action types, it's domain logic wearing a React costume — extract it to `lib/` so it's testable without rendering
- **Release gate workflows need secret validation upfront**: The `release-gate.yml` workflow took 4 commits to stabilize (3868e30 → c5753cf → 53d0fc4 → 4f8ef68) because deploy command secrets were validated too late — empty strings, missing fallbacks, and Vercel token edge cases all surfaced at deploy time. Fix: added explicit validation step that checks `DEPLOY_COMMAND` presence before attempting deploy. Pattern: CI workflows that consume secrets should have a dedicated validation step at the top — failing early with a clear message beats failing mid-deploy with a cryptic error
- **Monthly rollback drills catch broken recovery before incidents do**: Added `rollback-drill.yml` — a monthly cron workflow that runs pre-drill smoke, triggers a rollback webhook, then runs post-drill smoke. If either smoke fails, the drill alerts via send-alert.sh. Pattern: disaster recovery that isn't tested regularly is disaster theater. A monthly drill with automated smoke checks validates that (1) the rollback webhook works, (2) smoke tests still pass after rollback, (3) alerting channels are functional
- **Modularizing context builders pays off at ~100 lines**: `context-builder.ts` had `buildAgencySection` and `buildPricingSection` inline helpers at 92 lines. Extracted to `context-builder-helpers.ts`. Also extracted `buildPricingBenchmarkMap` for reuse. The main file dropped from 198 to 106 lines. Pattern: when a file has 2+ private helper functions totaling >80 lines, extract them to a `-helpers.ts` sibling — keeps the main file focused on orchestration
- **Export format type guards centralize validation**: Created `lib/export/formats.ts` with `EXPORT_FORMATS` set and `isExportFormat()` type guard. Replaced inline `["docx","pptx",...].includes()` checks. Also extracted `generateExportFile()` into `lib/export/runtime.ts` to decouple format dispatch from the route handler. Pattern: when 2+ routes validate the same string union, extract a type guard — it's one line to call and prevents format list drift between files
- **Batch architecture changes into a single "guardrails" commit**: Commit 66fd0c0 (51 files, +2205/-468 lines) published CODEOWNERS, PR template, perf monitoring, smoke tests, domain boundaries, repo creation scripts, and 10+ wizard/intelligence refactors in one commit. While large, these were all previously-drafted guardrails that needed to land together. Pattern: infrastructure/guardrail changes that reference each other (CLAUDE.md mentions scripts, scripts reference workflows) should land atomically — partial landings create inconsistent instructions for both humans and AI agents
- **Deduplicating email helpers prevents divergent formatting**: 5 nurture email templates each had inline `getFirstName()` logic (split on space, return first word, fallback to "there"). Extracted to `lib/email/get-first-name.ts`. Subtle bug: two templates used `.split(" ")[0]` while three used `.split(/\s/)[0]` — the extraction unified on the regex version. Pattern: when >2 files implement the same 3-line utility, extract it — the divergence risk outweighs the indirection cost

### 2026-02-27 - Release Gate Workflow, Smoke Test Resilience, Repo Cleanup

- **`set -e` in multi-channel alert scripts causes cascading failures**: `send-alert.sh` originally used `set -euo pipefail`, which aborts on the first non-zero exit. If the Slack webhook curl failed, the email alert was never attempted. Fix: drop `-e`, wrap each curl in an `if` block, track `sent_any` and `failed_any` independently, and report a distinct message when channels are configured but all fail. Pattern: notification scripts should be fail-soft — try every channel, report aggregate results, never abort on first failure
- **Smoke test content markers break when UI copy changes**: The original `smoke-production.sh` checked for a single exact string per URL (e.g., `"Invite-Only Early Access"`). Any copy change in the landing page broke CI. Fix: accept pipe-delimited multiple markers (`"MarkerA|MarkerB"`) and pass if any one matches. This gives resilience against copy edits while still validating the page renders real content. Pattern: smoke tests should validate structural presence (the page rendered *something* correct), not exact copy — use OR-match on multiple candidate strings
- **`python` vs `python3` matters on macOS**: The alert script used bare `python` for JSON payload construction. macOS hasn't shipped `python` (only `python3`) since Monterey. Changed to `python3` in both Slack and email payload generators. Pattern: always use `python3` explicitly in shell scripts — `python` is not portable across modern systems
- **Release gate pattern: pre-smoke → deploy → post-smoke → rollback**: The new `release-gate.yml` workflow runs smoke checks before deploying, then again after. If post-deploy smoke fails, it triggers a rollback webhook and sends alerts. The deploy command itself is configurable via secrets or workflow input. This eliminates "deploy and pray" — production is validated both directions. Pattern: CI/CD gates should bracket deploys with health checks, not just run them after
- **Completed `.intent/` files accumulate as dead weight — purge them**: The repo had 35+ completed intent files (11,000+ lines across `.intent/`, `reports/`, `research/`, `workspace/`) from past sprints. They served no ongoing purpose and cluttered searches and IDE navigation. All deleted in the release gate commit along with the stale `pnpm-lock.yaml`. Pattern: when an IDD cycle completes and learnings are captured in AGENTS.md, delete the intent/plan/task files — they're archival, not operational

### 2026-02-23 - Enterprise Hardening, Route HOF Rollout, Migration Squash, FOIA Engine

- **`withProposalRoute` HOF eliminated ~800 lines of auth boilerplate across 30 routes**: Every proposal sub-route had the same 10-line auth+access preamble (getUserContext, checkProposalAccess, param unwrapping). The `withProposalRoute(handler, options)` HOF wraps this once, with a `requireFullProposal` option to control lightweight vs full row fetch. Rollout to all 30 routes reduced total LOC by ~800 and made auth bugs structurally impossible. Pattern: when >5 routes share identical setup code, extract a higher-order function — not middleware (too coarse) and not per-route (too verbose)
- **Squashing 45 migrations into a baseline cuts provisioning time dramatically**: 45 sequential migrations (00001-00045) squashed into a single `00001_baseline.sql` (3,513 lines). New environments now run 1 migration instead of 45. The key gotcha: HNSW index tuning parameters (`ef_construction`, `m`) must be preserved in the squash — they're easy to lose because they look like optional CREATE INDEX params. Post-squash migrations start at 00002
- **Client research data was silently discarded at proposal creation boundary**: The `client_research` JSONB column already existed in the proposals table, but the POST body never included the research data gathered during intake. It was stored in React state, displayed on the review screen, then lost. Pattern: when adding a new DB column, trace the full data flow (UI → API → DB) and verify the column is actually populated, not just declared
- **Intelligence panel "flash then vanish" caused by conditional rendering on data presence**: The agency intelligence panel would flash (loading → data → hide) when `total_awards_tracked === 0` because the render condition was `agencyIntel ? <panel> : null`. The panel appeared during loading, received data, then immediately unmounted because zero awards = falsy render. Fix: always set the data and render a "no data found" message instead. Pattern: optional UI panels should show three states (loading → data → empty), never loading → hide
- **Surfacing actual AI error messages prevents black-hole debugging**: Bid evaluation errors were caught and replaced with a generic "Please try again" message. When Gemini returned rate limit errors or malformed JSON, users saw nothing useful and the actual cause was swallowed. Fix: include `errorMessage.slice(0, 200)` in the response and log the full stack. Same pattern applied across 44 routes via the standardized `serverError()` helper — but bid-eval was still using the old pattern
- **Dead code compounds faster than you think — do quarterly sweeps**: Today's cleanup removed 394 lines across 21 files: an entire unused module (`editorial-pass.ts`, 137 lines), 3 never-called response helpers, duplicate client instances, and barrel re-exports. The `editorial-pass.ts` module had been built during Phase 1, superseded by quality-overseer in Phase 2, but never deleted. Pattern: when superseding a module, delete the old one in the same PR
- **DOCX export rewrite: raw OOXML beats template libraries for branded output**: The docxtemplater/PizZip approach couldn't handle dynamic branding (org colors, fonts, logos in headers). Rewrote to generate raw OOXML XML strings with a markdown-to-OOXML converter. Much more control over styling, and the org branding (primary/secondary/accent colors, font family, logo) flows through naturally. Tradeoff: more code, but zero dependency on template files
- **FOIA/Sunshine Law engine as a new intelligence vertical**: Added a FOIA request generator (page + API route + migration) for SLED opportunities. Key design: requests are org-scoped, AI-generated from agency context, and stored for tracking. The migration (`00003_foia_requests.sql`) comes after the squashed baseline. Phase 2 will add inbound email tracking
- **`force-dynamic` was sprayed across layouts unnecessarily**: Auth layouts, dashboard layouts, and the root layout all had `export const dynamic = 'force-dynamic'` — this disabled static optimization for every page. Removed from 4 files. The theme provider also had a `useEffect` hydration workaround that was no longer needed with React 19. Pattern: audit layout-level exports quarterly — stale `dynamic` exports silently tank performance
- **pgTAP tests need careful migration ordering**: RLS policy tests reference tables that must exist first. When squashing migrations, test helper SQL (`00000_test_helpers.sql`) must create test users and roles before any test file runs. Several tests had syntax errors (missing semicolons, wrong function signatures) that only surfaced when running against the squashed baseline
- **Helicone observability headers require `.trim()` on API keys**: The Helicone auth header was passing the raw env var which had a trailing newline from Vercel dashboard copy-paste — same class of bug as the EMBEDDING_MODEL issue from 2026-02-18. Applied `.trim()` across all 5 AI client files. Pattern: every `process.env.X` read for API keys should go through a helper that trims whitespace

### 2026-02-22 - Realism Pipeline (6 Phases), Intelligence Integration, Test Coverage Push

- **Inngest step serialization silently drops `undefined` values**: `JSON.stringify` omits keys with `undefined` values, so `PipelineContext` fields like `serviceLine` became absent after passing through Inngest `step.run()`. Downstream code checking `=== undefined` still matched, but TypeScript's type narrowing broke. Fix: explicitly default optional fields to `null` before returning from step functions, then reconstruct with `?? undefined` on the receiving side. Pattern: treat Inngest steps as a JSON serialization boundary — no `undefined`, no `Date` objects, no class instances
- **Inngest finalize step must never throw when all sections fail**: Throwing in the finalize step causes Inngest to retry the *entire* function, which deletes all sections (idempotent cleanup) and re-generates — creating a loop where users see sections appear then vanish. Fix: finalize catches all errors, sets proposal status to DRAFT, and returns gracefully. Reduced retries from 3→2 to limit blast radius
- **AI JSON parsing needs a triple-strategy extractor**: Bid scoring responses come in 3+ formats: markdown code-fenced JSON, raw JSON with preamble text, and pure JSON. A single `JSON.parse` with regex code-block extraction fails ~20% of the time. Fix: cascading strategy — (1) code block match, (2) outermost brace extraction, (3) raw parse. Also accept string-typed scores (`"85"` → `85`) since models inconsistently quote numbers. Pattern: any `parseXFromResponse()` function should use `extractJsonFromResponse()` with multi-strategy fallback
- **`maxTokens` for structured JSON output should be 2x your estimate**: Bid scoring parser was truncating at 2048 tokens, producing broken JSON with no parse error (just incomplete). Doubled to 4096. This is the fourth time this pattern has surfaced (generation, quality review, extraction, now scoring). Rule of thumb: if the AI returns structured JSON, set `maxTokens` to at least 2x the expected output size
- **Realism phases ship best as a sequential stack**: Phases 0-5 (Pre-Flight Gate → Named Personnel → Assumptions → Repetition Limiter → Review Mode UI → Task Mirroring) each built on prior phase infrastructure. Phase 0 added preflight checks that Phase 1 populated with team member data, Phase 2 used the section config system Phase 3 extended, etc. Pattern: when planning a multi-phase feature, design the data model and extension points in Phase 0 even if they're not immediately used
- **Task-mirrored section generation requires fail-open extraction**: RFP task structure extraction via AI can return malformed JSON, duplicate tasks, or miss sections entirely. `parseTaskStructureResponse()` never throws — it deduplicates by normalized title, caps at 50 tasks, validates categories, and returns an empty structure on total failure. The section builder falls back to fixed sections when < 3 tasks are extracted. Pattern: AI extraction at pipeline boundaries must be fail-open with reasonable defaults
- **Splitting large files mid-sprint pays for itself immediately**: `context.ts` (606 lines) → `context.ts` + `build-pipeline-context.ts`; `generate-proposal.ts` (479 lines) → `generate-proposal.ts` + `generate-single-section.ts`. Each subsequent phase was faster to implement because the split files had clear single responsibilities. Do the split *before* adding new features, not after
- **360 tests in one session is achievable by targeting untested utility modules**: Coverage jumped 54%→74% by focusing on pure-function modules (`sources/parser`, `documents/chunker`, `utils/ttl-cache`, `email/nurture-templates`) that need zero mocking infrastructure. Pattern: when pushing for coverage thresholds, identify modules with 0% coverage and high line counts first — they're usually pure functions with easy test surfaces
- **External service integration should be env-var gated with null returns**: `IntelligenceClient` returns `T | null` for all methods, is a singleton with 10-min TTL cache, and silently falls back when `INTELLIGENCE_SERVICE_URL` is unset. UI pages show a friendly "not configured" empty state. Zero-latency impact: intelligence is fetched in parallel with L1 context. Pattern: external service SDKs should be (1) singleton, (2) TTL-cached, (3) timeout-bounded (5s), (4) null-returning on failure, (5) env-var gated

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

### 2026-02-25 - Gotenberg PDF, AI Stack Simplification, RFP-Driven Sections, Export Polish, Tiered Pricing

- **Gotenberg replaces Puppeteer/Chromium for PDF export**: After 5 commits fighting serverless Chromium binary management (`@sparticuz/chromium`, `chromium-min`, remote binary downloads), replaced the entire approach with Gotenberg — a Docker container running Chromium that accepts HTML via multipart POST and returns PDF. Production sends HTML to `GOTENBERG_URL`; development falls back to local Chrome via dynamic `puppeteer-core` import. Eliminates 50MB binary bundles, cold-start downloads, and `outputFileTracingIncludes` hacks. Pattern: when a native binary dependency causes recurring serverless issues, externalize it to a dedicated service. Deploy script: `scripts/deploy-gotenberg.sh` for Cloud Run
- **HTML-to-PDF needs explicit print overrides**: Gotenberg renders HTML in a real browser, but sections using CSS transitions/opacity animations rendered as invisible in the PDF. Fix: added a `forPdf` option to `generateHtml()` that injects `opacity: 1 !important; transform: none !important;` overrides, hides the interactive sidebar TOC, and forces `print-color-adjust: exact`. Pattern: any HTML designed for interactive viewing needs a separate CSS pass for print/PDF — animations, scroll triggers, and hover states all break in paged rendering
- **Multi-LLM quality council was complexity without proportional value**: Removed Groq (Llama 3.3) and Mistral from the 3-judge quality review council, leaving Gemini-only. Deleted `groq-client.ts`, `mistral-client.ts`, `helicone.ts` (observability proxy), and 850 lines of council aggregation/voting logic. The multi-model approach added latency (3 parallel API calls), required 3 API keys, and the score variance between models made aggregation unreliable. Pattern: start with one good model, only add multi-model voting if you have empirical evidence of quality improvement. Also extracted `fetch-l1-context.ts` from the bloated `context.ts` to keep files under 300 lines
- **RFP-driven custom sections are now first-class**: Added `RfpSectionRequirement` and `RfpEvaluationCriterion` types (`src/types/intake.ts`). Sections prefixed `custom_` bypass `SECTION_CONFIGS` lookup and build prompts dynamically from RFP-extracted metadata (title, description, specific requirements). The step-configure wizard now shows evaluation criteria with weights and maps them to sections. Pattern: when a fixed section taxonomy can't cover all RFP structures, support a `custom_` escape hatch with runtime prompt construction — but keep the same generation/review pipeline
- **User section selections were silently ignored**: The wizard Step 3 let users select/deselect sections, but `generate-proposal.ts` always generated all sections from `buildSectionList()`. Fix: filter `allSections` through `ctx.intakeData.selected_sections` before creating section rows. Fallback: if `selected_sections` is missing (legacy proposals), generate all. Pattern: trace user choices through the full pipeline (UI → API → Inngest → generation) — wizard state stored in React doesn't help if the backend never reads it
- **Tone modulation in editorial standards**: Added `tone` parameter to `buildEditorialStandards()` supporting 4 modes: professional (default, no modifier), conversational (contractions, direct address), technical (precision, specs, minimal marketing), executive (outcomes, ROI, short decisive sentences). Each mode injects a `## WRITING TONE` block into the section prompt. Pattern: tone is a prompt-engineering concern, not a post-processing concern — inject it at generation time, not via editing afterward
- **Static sources/ directory was bleeding into production**: The `sources/` directory contains Capgemini demo content (case studies, methodologies) used during development. `buildPipelineContext()` loaded these unconditionally, so real customer proposals included fabricated Capgemini examples. Fix: gate `loadSources()` behind `process.env.NODE_ENV !== "production"`. In production, every org has its own L1 context in Supabase. Pattern: demo/seed data must be explicitly gated — file-based content that "just works" in dev becomes a data leak in production
- **Slide builder had hardcoded fallback content**: When section content was empty, the PPTX slide builder fell back to fabricated metrics ("95% Client Satisfaction", "40% Cost Reduction") and generic phase names. These appeared in real exports. Fix: changed fallbacks to `undefined` so empty sections render without fabricated data. Pattern: fallback content in export generators is a liability — prefer showing nothing over showing fabricated claims
- **DOCX now embeds diagram images and has a TOC**: Extended the raw OOXML DOCX generator to fetch diagram images in parallel (with 8s timeout per image), embed them in `word/media/`, and add proper relationship entries. Also added a Word TOC field (`TOC \\o "1-3" \\h \\z \\u`) that users can right-click to populate. Blockquote rendering added with left-border accent. Pattern: OOXML image embedding requires coordinated changes in 4 places — Content_Types.xml, document.xml.rels, the drawing XML inline, and the zip file entry
- **HTML export rebranded from `--cap-*` to `--brand-*` CSS vars**: All CSS custom properties renamed from `--cap-blue`, `--cap-dark` etc. to `--brand-primary`, `--brand-dark`. This was a branding debt from the original Capgemini-specific implementation. Pattern: when building multi-tenant SaaS, use generic token names from day one — renaming CSS vars across 500+ lines of styles is tedious
- **plan_tier CHECK constraint was missing values**: The DB constraint only allowed `trial`/`active`/`cancelled`. Adding `free` and `invite` required a migration (00005). Always audit CHECK constraints when adding new enum values to a column — a missing value causes hard 500s from Postgres
- **Dynamic Stripe price creation causes price proliferation**: The original checkout route called `stripe.prices.create()` on every checkout session, generating unbounded prices in the Stripe dashboard. Fix: store price IDs as env vars (`STRIPE_STARTER_PRICE_ID`, `STRIPE_PRO_PRICE_ID`, `STRIPE_ENTERPRISE_PRICE_ID`) and resolve them via `getStripePriceId(tier, interval)`. Check `stripe.prices.list()` if you suspect proliferation
- **Feature flags belong in the subscription event**: Store `feature_flags` JSONB on the org row and populate it from `PRICING_TIERS` config during the Stripe webhook handler. Flag logic lives in one place (the config), not spread across every feature check. Server-side: `checkFeature(organizationId, flag)` returns boolean, call at the top of protected routes. Return 403 not 401 for missing entitlements
- **Free tier is a product, not a crippled demo**: Free tier (DOCX-only, manual creation, no AI) should feel complete for its use case. Upgrade triggers are specific capability walls (AI generate button, RFP upload) not a general degraded experience

### 2026-02-24 - Wizard Rewrite (Phases 0-4), Public Pages, Production Hardening

- **State machine wizard replaced 1,500-line god component**: `proposals/new/page.tsx` (1,494 lines) was rewritten as a 4-step wizard with a reducer-based state machine (`wizard-reducer.ts`). Phase 0 established the shell, provider, and types; Phases 1-4 added each step. The reducer pattern makes step transitions testable (286 reducer tests) without rendering UI. Pattern: for multi-step forms, design the state machine first (types + reducer + tests), then build UI on top — the state machine IS the spec
- **Wizard reducer tests catch logic bugs that UI tests miss**: 55 logic tests on step-configure and step-generate caught edge cases (empty section lists, invalid tone selections, missing intake data) that would require complex Playwright flows to test via UI. Pattern: extract form logic into pure functions and test those, not the React components that call them
- **Public pages needed for Google Cloud Program application**: Added About, Blog (5 articles), Product, Intelligence Overview, Pricing, and Government pages in a single sprint. Key architecture: shared `PublicNav` component extracted from 6 duplicated nav implementations. Middleware allowlist needed updates for each new route. Pattern: when adding multiple public pages at once, create the shared layout components first (nav, footer, middleware rules) to avoid N duplicated implementations
- **Production hardening across 7 areas in one commit** (957dec0): Error boundaries for auth and knowledge-base, loading skeletons for 8 dashboard routes, extracted `generate-outcomes.ts` from duplicated route logic, `extract-json.ts` utility for multi-strategy JSON extraction, FOIA request indexes migration. The commit touched 39 files. Pattern: batch related hardening changes into themed commits (all loading states, all error boundaries) rather than scattering across feature PRs
- **Serverless Chromium was a 5-commit debugging saga**: Commits 4ca68b0 → 07befce → e2898be → 9044669 → 4b42892 all fought with PDF export on Vercel — wrong `outputFileTracingIncludes` paths, broken `AWS_LAMBDA` env detection, chromium-min remote binary downloads failing. This directly motivated the Gotenberg migration on Feb 25. Pattern: if you need 5+ commits to make a dependency work in serverless, the dependency is wrong — externalize it
- **`use client` directive missing on loading.tsx breaks Vercel build**: `loading.tsx` files with JSX (skeleton components) need the `'use client'` directive in App Router. Local `next dev` doesn't catch this — only the production build on Vercel fails. Pattern: always run `next build` locally before pushing loading/error boundary components

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
- Landing page rebranded to IntentBid, served at root URL
- Stripe integration complete (checkout, webhooks, portal)
- No tests exist - need Playwright setup

## Current Priorities

1. **FOIA Engine Phase 2 (Inbound Email & Tracking)**
   - Create an email alias generator so each organization gets a unique inbound address (e.g., `req-123@foia.intentbid.com`).
   - Enable receiving, tracking, and parsing of inbound communications (using Postmark/SendGrid inbound webhooks + Inngest).
   - Build a "FOIA Request History" UI view so users can see saved requests and tracked status.
   - Refine the L1 Source pre-population to include the user's specific name and title in the generated FOIA request.
2. See `/reports/priorities.md` for the rest of the queue.

## Compound Engineering

This project uses compound engineering for continuous improvement:

1. **Daily Compound Review (10:30 PM)**: Extract learnings, update this file
2. **Auto-Compound (11:00 PM)**: Pick top priority, implement, create PR

The goal is autonomous operation with minimal human oversight.
