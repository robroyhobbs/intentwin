# Interview Decisions: Enterprise Hardening (Phase 1)

> Anchor: Harden IntentWin for enterprise by guaranteeing tenant isolation via tested RLS policies and eliminating real AI calls from CI to make the test suite deterministic and cost-safe.

## Decisions

### 1. Scope — Two Parallel Workstreams
- **Question**: What is the core deliverable?
- **Decision**: Two independent workstreams executed in parallel via git worktrees:
  - **Workstream A**: RLS policy unit tests (pgTAP)
  - **Workstream B**: AI mock enforcement in CI (Playwright + GitHub Actions)
- **Rationale**: Both are prerequisites for enterprise readiness. They touch different parts of the codebase (DB vs test infra) so they can't conflict.

### 2. Tenant Model
- **Question**: What access pattern does IntentWin use?
- **Decision**: Org-scoped via `organization_id`. Users belong to an org. All data (proposals, knowledge base, etc.) is scoped by `organization_id`. RLS checks `auth.uid()` → `profiles` → `organization_id`.
- **Rationale**: Confirmed by user. This is the standard multi-tenant model.

### 3. RLS Test Scope
- **Question**: Which tables should have RLS tests?
- **Decision**: Core 3 + knowledge base:
  - `profiles`
  - `organizations`
  - `proposals`
  - `document_chunks` (knowledge base)
  - RPC: `match_document_chunks_org` (vector similarity search)
- **Rationale**: These are the tables with the highest sensitivity. Core 3 covers identity and proposals; document_chunks covers uploaded customer content; the RPC could bypass table-level RLS if not properly secured.

### 4. RLS Testing Framework
- **Question**: What testing framework for RLS policies?
- **Decision**: pgTAP via `supabase test db`, running both locally and in CI.
- **Rationale**: pgTAP is the standard for Supabase RLS testing. `supabase test db` handles container lifecycle. No external test runner needed.

### 5. RLS Test Fixtures
- **Question**: Pre-seeded data or self-contained fixtures?
- **Decision**: Self-contained fixtures. Each test run creates its own test users, orgs, and data within the test transaction, then cleans up.
- **Rationale**: Reproducible, no dependency on external state, works identically in local and CI environments.

### 6. RLS Test Matrix
- **Question**: What scenarios must be covered?
- **Decision**:
  - User can read/write own org's data ✓
  - User CANNOT read another org's data ✗
  - User CANNOT write to another org's data ✗
  - Anonymous user gets nothing ✗
  - Service role key bypasses RLS ✓
  - `match_document_chunks_org` respects `organization_id` filter ✓
  - `match_document_chunks_org` does NOT leak cross-tenant embeddings ✗
- **Rationale**: Covers all access patterns including the most dangerous edge case (RPC embedding leakage).

### 7. RLS Failure Behavior in CI
- **Question**: What happens when an RLS test fails?
- **Decision**: Hard fail. CI fails. PR cannot merge. Zero tolerance for tenant isolation bugs.
- **Rationale**: A cross-tenant data leak is an enterprise-ending bug. No exceptions.

### 8. AI Providers to Mock
- **Question**: Which AI providers are active in production?
- **Decision**: All 4: Google Gemini, OpenAI, Groq, Mistral. All make real API calls in production. All must be mocked in CI.
- **Rationale**: Confirmed by user. Currently `mock-ai.ts` has factories for Gemini, OpenAI, and Voyage. Missing: Groq and Mistral mock factories.

### 9. AI Mock Strategy
- **Question**: Application-level mocking, network-level blocking, or both?
- **Decision**: Network-level blocking as primary defense. Use Playwright `page.route()` to intercept and fail any outbound request to AI provider domains:
  - `generativelanguage.googleapis.com` (Gemini)
  - `api.openai.com` (OpenAI)
  - `api.groq.com` (Groq)
  - `api.mistral.ai` (Mistral)
  - `api.voyageai.com` (Voyage AI)
- **Rationale**: Network-level blocking is defense in depth. Even if application-level mocking is forgotten, the test fails immediately instead of making a real (costly, flaky) API call.

### 10. E2E AI Audit
- **Question**: Do current E2E tests make real AI calls?
- **Decision**: Unknown — user needs assistance. An audit of all 6 E2E spec files must be performed as the first step of Workstream B to determine current behavior.
- **Rationale**: Can't enforce mocks without knowing the current state.

### 11. CI Environment
- **Question**: What CI platform and tier?
- **Decision**: GitHub Actions free tier (2000 min/month). Use Docker layer caching for Supabase CLI images to minimize overhead (~20-30s after first run).
- **Rationale**: pgTAP tests run in <5s. The Supabase container startup is the bottleneck but caching makes it acceptable.

### 12. CI Mock Environment Variables
- **Question**: How to prevent leaked real AI calls from costing money?
- **Decision**: Set dummy API keys in CI environment (`GEMINI_API_KEY=test-mock`, etc.) so any leaked call auth-fails rather than incurring costs. This is a safety net behind the network-level blocking.
- **Rationale**: Belt and suspenders. Even if network blocking fails somehow, the dummy keys prevent real usage.

## Open Items
- None. All questions resolved.

## Out of Scope
- Migration squash (Phase 2, separate workstream)
- HNSW index migration (Phase 2, separate workstream)
- Langfuse/Helicone observability integration (Phase 2)
- Competitor intelligence / SAM.gov (Phase 3)
- Intelligence service CI/CD (separate repo)
- Any changes to the `src/app/(dashboard)` directory structure (per guardrails)
- Any changes to the 60+ API routes (per guardrails)
- Any LangGraph integration outside of Inngest step functions (per guardrails)
