# Inngest Migration — Decisions

## Anchor Statement

Replace all Next.js `after()` background processing with Inngest durable workflows to eliminate zombie states, add automatic retries, enable step-level persistence, and provide operational observability for all AI-heavy background tasks.

## Scope

Migrate ALL 5 `after()` routes + 1 cron job:

1. **Proposal generation** (`/api/proposals/[id]/generate`)
2. **Section regeneration** (`/api/proposals/[id]/sections/[sectionId]/regenerate`)
3. **Quality review** (`/api/proposals/[id]/quality-review`)
4. **Compliance assessment** (`/api/proposals/[id]/compliance-assessment`)
5. **Document upload/processing** (`/api/documents/upload`)
6. **Nurture cron** (`/api/cron/nurture`) — convert to Inngest scheduled function

## Architecture Decisions

### D1: Inngest as the workflow engine
- **Choice:** Inngest (hosted SaaS, free tier)
- **Rationale:** First-class Next.js/Vercel integration, step-level durability, built-in retries, dashboard, zero infra to manage
- **Free tier:** 25K events/month — sufficient for early growth, upgrade to Pro ($50/mo) when needed

### D2: Fan-out per section for proposal generation
- **Choice:** Each of the 10 sections becomes its own Inngest step via `step.run()`
- **Rationale:** Individual section retries, survives partial failures, one failed section doesn't restart all 10
- **Event cost:** ~12 events per proposal (1 trigger + 10 sections + 1 completion)

### D3: Post-generation triggers run in parallel
- **Choice:** Quality review and compliance assessment triggered in parallel by `proposal/generated` event
- **Rationale:** Faster completion, no dependency between them
- **Implementation:** Generate function sends `proposal/generated` event on completion; two separate Inngest functions listen for it

### D4: Retry policy — 3 retries with exponential backoff
- **Choice:** Inngest default (3 retries, exponential backoff)
- **Rationale:** Good balance of resilience vs. event consumption on free tier
- **Applies to:** Every step in every function

### D5: Keep zombie/stale detection as safety net
- **Choice:** Keep existing stale detection code alongside Inngest
- **Rationale:** Belt and suspenders — Inngest handles the happy path, stale detection catches edge cases (e.g., Inngest outage)
- **Cleanup:** Can remove later once Inngest proves reliable in production

### D6: Chunked embedding generation for document processing
- **Choice:** Process embeddings in batches of 50 chunks per Inngest step
- **Rationale:** Large documents (100+ pages) generate hundreds of chunks; chunking makes each batch individually retryable
- **Implementation:** Parse document in step 1, then fan-out embedding batches as separate steps

### D7: Nurture cron migration
- **Choice:** Convert Vercel cron to Inngest scheduled function
- **Rationale:** Consolidates all background work under one system; Inngest cron has retry support

## Inngest Function Inventory

| Function Name | Trigger | Steps | Timeout |
|---|---|---|---|
| `proposal/generate` | `proposal/generate.requested` | buildContext, section×10, sendCompletionEvent | 5 min |
| `proposal/quality-review` | `proposal/generated` OR `proposal/quality-review.requested` | runQualityReview | 5 min |
| `proposal/compliance-assess` | `proposal/generated` OR `proposal/compliance.requested` | runComplianceAssessment | 5 min |
| `section/regenerate` | `section/regenerate.requested` | regenerateSection | 2 min |
| `document/process` | `document/process.requested` | parseDocument, embedBatch×N | 5 min |
| `nurture/send` | cron `0 9 * * *` (or existing schedule) | processNurtureEmails | 2 min |

## Event Flow

```
User clicks "Generate"
  → API route: atomic concurrency guard (DB), send event
  → Inngest: proposal/generate.requested
    → step.run("build-context"): fetch L1, analyze
    → step.run("section-1"): generate section 1
    → step.run("section-2"): generate section 2
    → ... (parallel via step.run)
    → step.run("section-10"): generate section 10
    → step.sendEvent("proposal/generated")

proposal/generated event
  → Inngest: proposal/quality-review (parallel)
  → Inngest: proposal/compliance-assess (parallel)
```

## Files to Create/Modify

### New files:
- `src/inngest/client.ts` — Inngest client instance
- `src/inngest/functions/generate-proposal.ts` — Generate function
- `src/inngest/functions/regenerate-section.ts` — Regenerate function
- `src/inngest/functions/quality-review.ts` — Quality review function
- `src/inngest/functions/compliance-assessment.ts` — Compliance assessment function
- `src/inngest/functions/process-document.ts` — Document processing function
- `src/inngest/functions/nurture-cron.ts` — Nurture scheduled function
- `src/inngest/index.ts` — Function registry (exports all functions)
- `src/app/api/inngest/route.ts` — Inngest serve endpoint

### Modified files:
- `src/app/api/proposals/[id]/generate/route.ts` — Replace `after()` with `inngest.send()`
- `src/app/api/proposals/[id]/sections/[sectionId]/regenerate/route.ts` — Replace `after()` with `inngest.send()`
- `src/app/api/proposals/[id]/quality-review/route.ts` — Replace `after()` with `inngest.send()`
- `src/app/api/proposals/[id]/compliance-assessment/route.ts` — Replace `after()` with `inngest.send()`
- `src/app/api/documents/upload/route.ts` — Replace `after()` with `inngest.send()`
- `src/app/api/cron/nurture/route.ts` — Simplify to Inngest trigger (or remove if cron-only)
- `package.json` — Add `inngest` dependency

## Constraints

- All existing DB status management patterns stay intact (concurrency guards, status state machines)
- The API routes still return immediately — only the background execution mechanism changes
- No changes to the AI pipeline logic itself (generate.ts, regenerate.ts, quality-council.ts, etc.)
- Inngest functions call the SAME pipeline functions, just wrapped in durable steps
- `maxDuration` exports can be reduced on migrated routes (they only need enough time to send the event, not run the work)
- Environment variables: `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` must be set in Vercel

## Edge Cases

- **Inngest outage:** API routes still set DB status; stale detection will reset zombie records on next request
- **Duplicate events:** Inngest deduplicates by event ID; use `proposalId` as idempotency key
- **Cold start:** Inngest calls back into your app via HTTP; Vercel cold starts apply but are acceptable
- **Free tier exhaustion:** Monitor event count; alert when approaching 25K; upgrade path is clear
- **Partial section failure:** Fan-out means only failed sections retry; DB tracks per-section status
- **Concurrent generate requests:** Atomic DB guard stays in the API route (before sending event); Inngest never receives duplicate events for the same proposal
