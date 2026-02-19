# Inngest Migration — Phased Execution Plan

**Domain Skill:** Backend/General (`intent-build-now`)
**Test Runner:** Vitest (`vitest run`)
**Estimated LOC:** ~600-800 new, ~200 modified

---

## Phase 1: Foundation — Inngest Client + Serve Route

### Goal
Install Inngest, create the client, set up the serve endpoint, verify it works locally.

### Test-first
- **Happy:** Inngest client exports correctly, serve route returns 200 on GET (introspection)
- **Sad:** Missing `INNGEST_EVENT_KEY` throws clear error at send time
- **Edge:** Serve route handles POST (event delivery) without crashing

### Files
- `package.json` — add `inngest` dependency
- `src/inngest/client.ts` — Inngest client instance
- `src/inngest/index.ts` — Function registry (empty initially)
- `src/app/api/inngest/route.ts` — Serve endpoint
- `src/inngest/__tests__/client.test.ts` — Client tests

### Steps
1. `pnpm add inngest`
2. Create `src/inngest/client.ts` with `new Inngest({ id: "intentwin" })`
3. Create `src/inngest/index.ts` exporting empty functions array
4. Create `src/app/api/inngest/route.ts` using `serve()` from `inngest/next`
5. Write tests for client creation and function registry
6. Run `vitest run` — confirm green
7. Run `pnpm build` — confirm no type errors

---

## Phase 2: Generate Proposal Function

### Goal
Create the Inngest function for proposal generation with per-section fan-out. Wire up the API route.

### Test-first
- **Happy:** Function triggers on `proposal/generate.requested`, calls `buildPipelineContext`, runs 10 section steps, sends `proposal/generated` event
- **Sad:** If `buildPipelineContext` throws, proposal status resets to `draft`
- **Edge:** If 3 of 10 sections fail, remaining 7 complete; proposal moves to `review` with error count
- **Security:** Function validates `proposalId` exists before proceeding
- **Integration:** API route sends event instead of using `after()`; returns 200 immediately

### Files
- `src/inngest/functions/generate-proposal.ts` — The Inngest function
- `src/inngest/__tests__/generate-proposal.test.ts` — Tests
- `src/inngest/index.ts` — Register the function
- `src/app/api/proposals/[id]/generate/route.ts` — Replace `after()` with `inngest.send()`
- `src/lib/ai/pipeline/generate.ts` — Extract section generation into callable units

### Steps
1. Write failing tests for the Inngest function (mock pipeline, mock step.run)
2. Create `generate-proposal.ts`:
   - Event: `proposal/generate.requested` with `data: { proposalId }`
   - Step 1: `step.run("build-context", () => buildPipelineContext(...))`
   - Steps 2-11: `step.run("section-N", () => generateSection(N, context))`
   - Final step: `step.sendEvent("proposal/generated", { proposalId })`
   - Retries: 3, timeout: 5 min
3. Register in `src/inngest/index.ts`
4. Modify generate route: replace `after()` block with `inngest.send()`
5. Remove `maxDuration = 300` from generate route (only needs time to send event)
6. Run tests — confirm green
7. Run `pnpm build` — confirm no type errors

---

## Phase 3: Quality Review + Compliance Assessment Functions

### Goal
Create Inngest functions for quality review and compliance assessment. Both trigger on `proposal/generated` (parallel) AND can be manually triggered.

### Test-first
- **Happy:** Quality review function runs on `proposal/generated` event; compliance assessment runs on same event
- **Happy:** Manual trigger via `proposal/quality-review.requested` works
- **Sad:** If quality review fails, status resets to `failed` with error message
- **Edge:** Stale review detection still works (belt and suspenders)
- **Integration:** Generate function's `proposal/generated` event triggers both functions in parallel

### Files
- `src/inngest/functions/quality-review.ts` — Quality review function
- `src/inngest/functions/compliance-assessment.ts` — Compliance assessment function
- `src/inngest/__tests__/quality-review.test.ts` — Tests
- `src/inngest/__tests__/compliance-assessment.test.ts` — Tests
- `src/inngest/index.ts` — Register both functions
- `src/app/api/proposals/[id]/quality-review/route.ts` — Replace `after()` with `inngest.send()`
- `src/app/api/proposals/[id]/compliance-assessment/route.ts` — Replace `after()` with `inngest.send()`
- `src/lib/ai/pipeline/generate.ts` — Remove detached quality review + compliance assessment calls

### Steps
1. Write failing tests for both functions
2. Create `quality-review.ts`:
   - Events: `proposal/generated` OR `proposal/quality-review.requested`
   - Step: `step.run("run-review", () => runQualityReview(...))`
   - Retries: 3, timeout: 5 min
3. Create `compliance-assessment.ts`:
   - Events: `proposal/generated` OR `proposal/compliance.requested`
   - Step: `step.run("run-assessment", () => runComplianceAssessment(...))`
   - Retries: 3, timeout: 5 min
4. Register both in index.ts
5. Modify quality-review route: replace `after()` with `inngest.send()`
6. Modify compliance-assessment route: replace `after()` with `inngest.send()`
7. Remove detached promise calls from `generate.ts` pipeline (quality review + compliance)
8. Run tests — confirm green

---

## Phase 4: Regenerate Section Function

### Goal
Create Inngest function for single section regeneration.

### Test-first
- **Happy:** Function triggers on `section/regenerate.requested`, regenerates the section, sets status to `completed`
- **Sad:** If regeneration fails after retries, section status is `failed`
- **Edge:** Concurrent regeneration of same section — only one should proceed (DB guard)
- **Integration:** API route sends event instead of using `after()`

### Files
- `src/inngest/functions/regenerate-section.ts` — The function
- `src/inngest/__tests__/regenerate-section.test.ts` — Tests
- `src/inngest/index.ts` — Register
- `src/app/api/proposals/[id]/sections/[sectionId]/regenerate/route.ts` — Replace `after()`

### Steps
1. Write failing tests
2. Create `regenerate-section.ts`:
   - Event: `section/regenerate.requested` with `data: { proposalId, sectionId, qualityFeedback? }`
   - Step: `step.run("regenerate", () => regenerateSection(...))`
   - Retries: 3, timeout: 2 min
3. Register in index.ts
4. Modify regenerate route: replace `after()` with `inngest.send()`
5. Add concurrency guard to the function (check section status before regenerating)
6. Run tests — confirm green

---

## Phase 5: Document Processing Function

### Goal
Create Inngest function for document upload processing with chunked embedding.

### Test-first
- **Happy:** Function triggers on `document/process.requested`, parses doc, generates embeddings in batches, sets status to `completed`
- **Sad:** If parsing fails, document status is `failed` with error message
- **Edge:** Large document (500 chunks) processes in 10 batches of 50
- **Edge:** If one embedding batch fails, it retries that batch only
- **Integration:** Upload route sends event instead of using `after()`

### Files
- `src/inngest/functions/process-document.ts` — The function
- `src/inngest/__tests__/process-document.test.ts` — Tests
- `src/inngest/index.ts` — Register
- `src/app/api/documents/upload/route.ts` — Replace `after()` with `inngest.send()`

### Steps
1. Write failing tests
2. Create `process-document.ts`:
   - Event: `document/process.requested` with `data: { documentId }`
   - Step 1: `step.run("parse-document", () => parseDocument(...))`
   - Steps 2+: `step.run("embed-batch-N", () => embedChunks(batch))` (50 chunks per batch)
   - Final step: Update document status to `completed` with chunk count
   - Retries: 3, timeout: 5 min
3. Extract parsing and embedding logic from `documents/pipeline.ts` into callable units
4. Register in index.ts
5. Modify upload route: replace `after()` with `inngest.send()`
6. Remove the unused `maxDuration` absence issue (no longer needed)
7. Run tests — confirm green

---

## Phase 6: Nurture Cron Function

### Goal
Convert Vercel cron to Inngest scheduled function.

### Test-first
- **Happy:** Function runs on schedule, sends nurture emails, updates DB
- **Sad:** If email sending fails, entries are not marked as sent
- **Edge:** Zero eligible entries — function completes with `sent: 0`

### Files
- `src/inngest/functions/nurture-cron.ts` — The function
- `src/inngest/__tests__/nurture-cron.test.ts` — Tests
- `src/inngest/index.ts` — Register
- `src/app/api/cron/nurture/route.ts` — Keep as manual trigger fallback (simplified)
- `vercel.json` — Remove cron config (if present)

### Steps
1. Write failing tests
2. Create `nurture-cron.ts`:
   - Trigger: `cron: "0 9 * * *"` (daily at 9 AM)
   - Steps: One per nurture step (4 steps, each handles its own window)
   - Retries: 3
3. Register in index.ts
4. Simplify cron route to just log that Inngest handles it now (or keep as manual fallback)
5. Run tests — confirm green

---

## Phase 7: Integration Testing + Cleanup

### Goal
End-to-end verification, remove dead code, update environment variables.

### Steps
1. Run full test suite: `vitest run`
2. Run build: `pnpm build`
3. Run linter: `pnpm lint`
4. Verify all `after()` imports are removed from migrated routes
5. Verify all `maxDuration` exports are updated (reduced or removed on event-sending routes)
6. Add `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` to Vercel env vars
7. Update `AGENTS.md` with Inngest patterns and gotchas
8. Commit and deploy
