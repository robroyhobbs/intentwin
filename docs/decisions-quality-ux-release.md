# Interview Decisions: IntentBid Quality & UX Release

> Anchor: Improve IntentBid reliability, progress visibility, and input handling so paying customers can complete the proposal workflow without retries or confusion.

## Context

- **Source:** Direct feedback from a paying customer
- **Timeline:** ASAP (days) for P0 reliability, bundled release for all
- **Scope:** Single unified Intent covering all 10 reported issues
- **Project:** ~/projects/capgemini-proposal-generator/

## Decisions

### 1. Release Scope
- **Question**: Single Intent or split by priority tier?
- **Decision**: Single unified "Quality & UX Release" Intent covering all 10 issues
- **Rationale**: Simpler to track, customer expects a cohesive response to their feedback

### 2. Retry Strategy
- **Question**: Auto-retry (server-side) or user-initiated?
- **Decision**: Auto-retry first — server retries up to 2x with exponential backoff, silently. If still fails, show "Retry" button with diagnostic error context.
- **Rationale**: Best UX for transient failures (most common cause). Reduces user friction for the majority case.
- **Details**:
  - Apply to: extraction, bid evaluation, section generation
  - Max retries: 2 per operation
  - Backoff: exponential (e.g., 2s, 4s)
  - On final failure: show diagnostic message with attempt count (e.g., "AI service timeout after 3 attempts")

### 3. Progress Indicators
- **Question**: What level of granularity for progress during extraction and bid evaluation?
- **Decision**: Task-based percentage estimation — track completed sub-tasks, each tick advances the progress bar.
- **Rationale**: Ships fast, reliable, no new SSE infrastructure needed.
- **Details**:
  - Extraction: 4 sub-tasks (parse document → extract requirements → extract structure → build summary) = 25% per tick
  - Bid evaluation: 3 sub-tasks (score opportunity → evaluate alignment → compute win probability) = 33% per tick
  - Generation: Already has per-section progress (keep as-is, enhance with batch parallel info)

### 4. SAM.gov URL Handling
- **Question**: Detection + guidance, public URL support, or full API integration?
- **Decision**: Extract + redirect now, API integration later. Parse opportunity ID from workspace URLs (`sam.gov/workspace/contract/opp/{id}/view`), construct public URL (`sam.gov/opp/{id}/view`), auto-fetch.
- **Rationale**: Addresses the immediate pain point. API integration deferred to future Intent.
- **Details**:
  - Detect workspace URL pattern: `sam.gov/workspace/contract/opp/{uuid}/view`
  - Extract UUID, construct: `sam.gov/opp/{uuid}/view`
  - Attempt fetch on public URL
  - If public URL also fails: show guidance message with paste instructions

### 5. Product Recommendations
- **Question**: Dedicated wizard step, inline panel, or settings suggestion?
- **Decision**: Inline collapsible panel within the bid evaluation step.
- **Rationale**: Leverages existing `computeCapabilityAlignment()` output. No new wizard step needed.
- **Details**:
  - Show product match scores against extracted requirements
  - Allow one-click enable/disable per product for the current proposal
  - Highlight gaps: "No product matches requirement X"

### 6. Parallel Section Generation
- **Question**: Batches, fully parallel, or keep sequential?
- **Decision**: Executive summary first, then remaining sections in batches of 3-4.
- **Rationale**: Balanced — faster than sequential, avoids rate limit spikes and concurrency bugs.
- **Details**:
  - Step 1: Generate executive summary (seeds differentiators)
  - Step 2: Fire remaining sections in batches of 3-4
  - Step 3: Finalize once all complete
  - Expected improvement: ~3x faster for 8-section proposals

### 7. NAICS Code System
- **Question**: Search filter only, search + extraction, or full NAICS system?
- **Decision**: Full NAICS system — multi-select search with autocomplete + extraction from RFPs with user confirmation + product matching.
- **Rationale**: Comprehensive solution that addresses the input difficulty and adds value through extraction.
- **Details**:
  - Replace text input with searchable combobox (tags UI) with NAICS code + description lookup
  - Support comma-separated paste for bulk entry
  - Extract NAICS codes from uploaded RFPs during intake
  - Present extracted codes for user confirmation (not auto-populate)
  - Use confirmed NAICS for product matching/recommendations

### 8. Changelog & Release Notes
- **Question**: Where should the changelog live?
- **Decision**: In-app `/changelog` page + "What's New" nav badge that clears on page view.
- **Rationale**: Ensures visibility without being intrusive. Badge clears when user actually views updates.
- **Details**:
  - New route: `/changelog` in dashboard
  - Render from structured markdown or JSON data source
  - Nav badge: red dot or "New" chip, tracks `last_viewed_changelog` per user
  - Badge clears when user visits `/changelog`

### 9. Error Message Strategy
- **Question**: Diagnostic context, generic, or tiered by plan?
- **Decision**: Diagnostic context always — show specific failure reason + attempt count.
- **Rationale**: Helps users decide whether to retry or contact support. Paying customers deserve transparency.
- **Details**:
  - Format: "[Step name] failed: [reason] (attempt 3/3)"
  - Include "Retry" button + "Contact Support" link
  - Log detailed error server-side for support debugging

### 10. NAICS Extraction Behavior
- **Question**: Auto-populate, suggest for confirmation, or show in review only?
- **Decision**: Suggest for confirmation — show extracted NAICS codes with a "Confirm" action, user can edit before saving.
- **Rationale**: Prevents bad auto-population from misidentified codes. User stays in control.

## Open Items

- SAM.gov API integration (deferred to future Intent — requires api.sam.gov registration)
- NAICS code data source — need a lookup table/API for code descriptions (NAICS 2022 revision)
- Rate limit implications of parallel batch generation (monitor after deploy)

## Out of Scope

- SAM.gov full API integration (future Intent)
- Real-time SSE streaming infrastructure (task-based estimation is sufficient for now)
- External docs site for changelog (in-app only)
- Changing AI model providers for performance (optimize current pipeline first)
