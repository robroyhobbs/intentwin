# Execution Plan: IMF Integration — Phase 1 (Persuasion Engine)

## Overview

Transform IntentWin's generation pipeline from ad-hoc AI prompting to a layered persuasion system. Each of the 10 proposal sections gets a specific persuasion framework (AIDA, PAS, FAB, etc.), win themes woven throughout, competitive positioning via indirect framing, brand voice enforcement, and automated quality checks — all without adding new database tables.

## Prerequisites

- Gemini 3 Pro integration complete (claude.ts rewritten) ✓
- Pipeline with 10 section configs exists (pipeline.ts) ✓
- 10 prompt builders exist (src/lib/ai/prompts/\*.ts) ✓
- Org settings JSONB in Supabase organizations table ✓
- No test framework — vitest will be added in Phase 0

---

## Phase 0: Test Infrastructure + Persuasion Module

### Description

Set up vitest and create the core `src/lib/ai/persuasion.ts` module containing all persuasion framework constants, prompt builders, and quality check functions. These are pure functions with no external dependencies — ideal for thorough unit testing.

**Deliverables:**

- vitest configured and running
- `src/lib/ai/persuasion.ts` with all exports
- Full unit test suite

**Files to create:**

- `vitest.config.ts`
- `src/lib/ai/persuasion.ts`
- `src/lib/ai/__tests__/persuasion.test.ts`

**Files to modify:**

- `package.json` (add vitest dep + test script)
- `tsconfig.json` (if path aliases need vitest support)

### Tests

#### Happy Path

- [x] `getPersuasionPrompt("executive_summary")` returns AIDA framework text
- [x] `getPersuasionPrompt("understanding")` returns PAS framework text
- [x] `getPersuasionPrompt("approach")` returns FAB framework text
- [x] All 10 section types return non-empty framework prompts
- [x] `getBestPracticesPrompt("executive_summary")` includes length guidance (300-500 words)
- [x] `getBestPracticesPrompt("case_studies")` includes STAR structure guidance
- [x] `buildWinThemesPrompt(["theme1", "theme2"])` returns prompt with both themes
- [x] `buildCompetitivePrompt(["diff1"], ["obj1"])` returns indirect framing text
- [x] `buildBrandVoiceSystemPrompt({ tone: "confident", terminology: { use: ["we"], avoid: ["synergy"] } })` returns system prompt fragment
- [x] `runQualityChecks(content, "executive_summary", ["theme1"], ["synergy"])` returns QualityCheck object with all 4 fields

#### Bad Path

- [x] `getPersuasionPrompt("nonexistent_section")` returns generic/fallback framework
- [x] `getBestPracticesPrompt("nonexistent_section")` returns generic best practices
- [x] `buildWinThemesPrompt([])` returns empty string (no themes = no prompt)
- [x] `buildCompetitivePrompt([], [])` returns empty string (no differentiators = no positioning)
- [x] `buildBrandVoiceSystemPrompt({ tone: "", terminology: { use: [], avoid: [] } })` returns minimal/empty prompt
- [x] `runQualityChecks("", ...)` handles empty content gracefully (all checks false)

#### Edge Cases

- [x] Win themes with special characters (quotes, newlines) don't break prompt
- [x] Brand voice avoid terms with regex-special characters don't crash quality check
- [x] Very long win themes (>500 chars) are handled without truncation issues
- [x] Content with mixed unicode passes quality checks correctly
- [x] Section type matching is case-insensitive or consistently cased

#### Security

- [x] Prompt injection in win themes is escaped/neutralized (themes containing "ignore previous instructions")
- [x] Brand voice terms can't inject prompt commands
- [x] Generated prompt text doesn't include raw user input unescaped

#### Data Leak

- [x] Quality check results don't expose internal framework names to end users
- [x] Error messages from prompt builders don't leak system prompt content
- [x] No sensitive constants (API keys, internal URLs) in persuasion module

#### Data Damage

- [x] Persuasion constants are frozen/immutable (Object.freeze or readonly)
- [x] Quality check is read-only — doesn't modify the content passed to it
- [x] Multiple concurrent calls to prompt builders don't interfere (no shared mutable state)

### E2E Gate

```bash
# Verify vitest runs and all persuasion tests pass
cd /Users/robroyhobbs/projects/capgemini-proposal-generator
npx vitest run src/lib/ai/__tests__/persuasion.test.ts
```

### Acceptance Criteria

- [x] vitest installed and configured with path alias support
- [x] `npm run test` (or `npx vitest`) works
- [x] `persuasion.ts` exports: `getPersuasionPrompt`, `getBestPracticesPrompt`, `buildWinThemesPrompt`, `buildCompetitivePrompt`, `buildBrandVoiceSystemPrompt`, `runQualityChecks`
- [x] All 6 test categories pass
- [x] TypeScript compiles clean (`npx tsc --noEmit`)

---

## Phase 1: Pipeline Integration

### Description

Wire the persuasion module into the generation pipeline. Modify `pipeline.ts` to extract brand voice from org settings, build persuasion context per section, pass brand voice to the system prompt, and run quality checks after each section is generated. Modify `claude.ts` to accept and use brand voice in the system prompt.

**Deliverables:**

- Pipeline fetches brand_voice from org settings
- Each section generation includes persuasion layers
- System prompt includes brand voice when available
- Quality checks logged after each section
- Pipeline integration test

**Files to modify:**

- `src/lib/ai/pipeline.ts`
- `src/lib/ai/claude.ts`

**Files to create:**

- `src/lib/ai/__tests__/pipeline-persuasion.test.ts`

### Tests

#### Happy Path

- [x] Pipeline extracts `brand_voice` from `organizations.settings` JSONB
- [x] Pipeline builds persuasion prompt per section type and appends to generation prompt
- [x] Pipeline passes brand voice to `generateText` system prompt
- [x] Pipeline runs quality checks after each section generation
- [x] Quality check results are logged (dev mode) but don't block generation
- [x] `buildSystemPrompt` with brand voice includes tone and terminology
- [x] Generated section prompts contain persuasion framework text
- [x] Generated section prompts contain win themes when present
- [x] Generated section prompts contain competitive positioning when differentiators exist

#### Bad Path

- [x] Pipeline handles missing `brand_voice` in org settings (null/undefined) — uses defaults
- [x] Pipeline handles org with no settings at all — uses defaults
- [x] Pipeline handles missing win strategy — skips win themes and competitive positioning
- [x] Quality check failure doesn't throw — logs warning, continues generation
- [x] Pipeline handles `brand_voice.terminology` with null use/avoid arrays

#### Edge Cases

- [x] Org with `brand_voice.tone` set but empty `terminology` — only tone injected
- [x] Proposal with win themes but no differentiators — win themes only, no competitive
- [x] All 10 sections generate successfully with full persuasion layers
- [x] Prompt length stays within Gemini's context window (measure token count)

#### Security

- [x] Brand voice from org settings is sanitized before injection into system prompt
- [x] Win themes from intake data are sanitized before injection into prompts
- [x] Org settings access is scoped to the proposal's organization (no cross-org leak)

#### Data Leak

- [x] Quality check logs don't include full generated content (only check results)
- [x] System prompt with brand voice doesn't appear in API responses to client
- [x] Persuasion framework metadata isn't stored in proposal_sections table

#### Data Damage

- [x] Adding persuasion layers doesn't break existing section generation (backward compatible)
- [x] If persuasion module throws, section still generates with original prompt (graceful degradation)
- [x] Existing proposal re-generation still works (no schema changes required)

### E2E Gate

```bash
# Verify TypeScript compiles with pipeline changes
cd /Users/robroyhobbs/projects/capgemini-proposal-generator
npx tsc --noEmit

# Run pipeline persuasion integration tests
npx vitest run src/lib/ai/__tests__/pipeline-persuasion.test.ts

# Verify dev server starts without errors
timeout 15 npx next dev -p 3099 2>&1 | head -20
```

### Acceptance Criteria

- [x] Pipeline fetches and uses brand_voice from org settings
- [x] Each section prompt includes persuasion framework + best practices + win themes
- [x] System prompt reflects brand voice when available
- [x] Quality checks run post-generation and log results
- [x] Graceful degradation: persuasion failures don't break generation
- [x] TypeScript compiles clean
- [x] All tests pass

---

## Phase 2: Section Prompt Overhaul + End-to-End Verification

### Description

Update all 10 section prompt builders to incorporate their assigned persuasion framework. Each prompt gets restructured to follow the framework pattern (e.g., AIDA for Executive Summary) while preserving existing context injection. Then run a full end-to-end proposal generation to verify output quality.

**Deliverables:**

- All 10 prompt builders updated with persuasion structure
- Full proposal generation test via API
- Output quality verification

**Files to modify:**

- `src/lib/ai/prompts/executive-summary.ts` (AIDA)
- `src/lib/ai/prompts/understanding.ts` (PAS)
- `src/lib/ai/prompts/approach.ts` (FAB)
- `src/lib/ai/prompts/methodology.ts` (Before-After-Bridge)
- `src/lib/ai/prompts/team.ts` (Social Proof + Authority)
- `src/lib/ai/prompts/case-studies.ts` (STAR)
- `src/lib/ai/prompts/timeline.ts` (Certainty Framework)
- `src/lib/ai/prompts/pricing.ts` (Value Framing)
- `src/lib/ai/prompts/risk-mitigation.ts` (Acknowledge-Address-Assure)
- `src/lib/ai/prompts/why-us.ts` (Competitive Differentiation)

**Files to create:**

- `src/lib/ai/__tests__/section-prompts.test.ts`

### Tests

#### Happy Path

- [x] Executive Summary prompt includes AIDA structure (Attention/Interest/Desire/Action markers)
- [x] Understanding prompt includes PAS structure (Problem/Agitate/Solve markers)
- [x] Approach prompt includes FAB structure (Feature/Advantage/Benefit markers)
- [x] Methodology prompt includes Before-After-Bridge structure
- [x] Team prompt includes Social Proof + Authority guidance
- [x] Case Studies prompt includes STAR structure
- [x] Timeline prompt includes Certainty Framework guidance
- [x] Pricing prompt includes Value Framing guidance
- [x] Risk Mitigation prompt includes Acknowledge-Address-Assure structure
- [x] Why Us prompt includes Competitive Differentiation guidance
- [x] All 10 prompts include persuasion context when persuasion data provided
- [x] All 10 prompts include best practices section with length guidance
- [x] All 10 prompts still include intake data, analysis, and retrieved context

#### Bad Path

- [x] Each prompt works without persuasion data (backward compatible — no persuasion = original behavior)
- [x] Each prompt works without win strategy (no win themes section)
- [x] Each prompt works without company info (falls back to "Our Company")
- [x] Prompt builder doesn't throw when persuasion prompt returns empty string

#### Edge Cases

- [x] Prompt with maximum context (large intake data + long analysis + many retrieved chunks + full persuasion) stays coherent
- [x] Prompt with minimal context (tiny intake, no analysis, no retrieved) still generates valid output
- [x] Section type names match exactly between pipeline SECTION_CONFIGS and persuasion module

#### Security

- [x] User-provided intake data in prompts doesn't enable prompt injection
- [x] Win themes embedded in prompts are properly quoted/contextualized
- [x] Retrieved context from RAG doesn't override framework instructions

#### Data Leak

- [x] Prompts don't expose internal section ordering or generation strategy
- [x] Debug prompt stored in DB (generation_prompt) is truncated and doesn't leak full brand voice

#### Data Damage

- [x] Updated prompt builders maintain same function signature (no breaking changes)
- [x] Existing proposals can still be viewed after code change (no migration needed)
- [x] Re-generation of existing proposal works with new prompts

### E2E Gate

```bash
# Run all test suites
cd /Users/robroyhobbs/projects/capgemini-proposal-generator
npx vitest run

# TypeScript compile check
npx tsc --noEmit

# API smoke test: verify proposal generation endpoint responds
# (Requires dev server running on port 3001)
curl -s http://localhost:3001/api/health | jq .status

# Verify all 10 prompt builders produce non-empty prompts
npx vitest run src/lib/ai/__tests__/section-prompts.test.ts
```

### Acceptance Criteria

- [x] All 10 section prompt builders updated with persuasion frameworks
- [x] Each prompt follows its assigned framework structure
- [x] Backward compatibility maintained (no persuasion data = original behavior)
- [x] All test suites pass (persuasion + pipeline + section prompts)
- [x] TypeScript compiles clean
- [ ] Full proposal generates successfully via the UI/API

---

## Final E2E Verification

```bash
# Full test suite
cd /Users/robroyhobbs/projects/capgemini-proposal-generator
npx vitest run

# TypeScript
npx tsc --noEmit

# Build check (Next.js production build)
npx next build

# Dev server health
curl -s http://localhost:3001/api/health | jq .
```

## Risk Mitigation

| Risk                                     | Mitigation                                                        | Contingency                                        |
| ---------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------- |
| Persuasion prompts make output formulaic | Tune temperature (0.7-0.8), include "vary structure" instructions | Reduce framework specificity, make guidance looser |
| Prompts too long for Gemini context      | Gemini 3 Pro has 1M context; monitor token counts                 | Compress retrieved context, truncate analysis      |
| Brand voice not set for demo org         | Seed default brand_voice in Trellex org settings                  | Graceful fallback to default system prompt         |
| vitest path alias conflicts with Next.js | Use vite-tsconfig-paths plugin                                    | Fall back to relative imports in test files        |
| Quality checks false positives           | Checks are advisory (log only), not blocking                      | Disable individual checks via config if noisy      |

## References

- [Intent Spec](./imf-integration.intent.md)
- [Overview](./imf-integration.overview.md)
- Pipeline: `src/lib/ai/pipeline.ts`
- LLM abstraction: `src/lib/ai/claude.ts`
- Prompt builders: `src/lib/ai/prompts/*.ts`
