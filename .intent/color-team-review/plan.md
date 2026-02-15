# Color Team Review — Execution Plan

## Phase 1: Database Schema + RLS (Migration 00029)

### Files
- `supabase/migrations/00029_create_color_team_review.sql`

### Implementation
Create the three tables (`proposal_review_stages`, `stage_reviewers`, `section_reviews`) with:
- All CHECK constraints for valid values
- UNIQUE constraints to prevent duplicates
- Foreign keys with ON DELETE CASCADE
- RLS enabled on all tables
- 4 RLS policies per table (SELECT/INSERT/UPDATE/DELETE) using the org pattern:
  `organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())`
- Indexes on `proposal_id`, `stage_id`, `reviewer_id`
- `updated_at` trigger for `section_reviews`

### Tests (in `src/lib/ai/__tests__/color-team-review-schema.test.ts`)

**Happy Path:**
- [ ] Creates all three tables successfully
- [ ] Inserts a review stage for a proposal
- [ ] Assigns a reviewer to a stage
- [ ] Submits a section review with score and comments
- [ ] UNIQUE constraint on (proposal_id, stage) works
- [ ] UNIQUE constraint on (stage_id, reviewer_id) works
- [ ] UNIQUE constraint on (reviewer_id, section_id) works

**Bad Path:**
- [ ] Rejects invalid stage value (not pink/red/gold/white)
- [ ] Rejects invalid status value
- [ ] Rejects score outside 0-100 range
- [ ] Rejects duplicate reviewer assignment to same stage
- [ ] Foreign key prevents orphan records

**Edge Cases:**
- [ ] CASCADE deletes reviews when stage is deleted
- [ ] CASCADE deletes stages when proposal is deleted
- [ ] NULL score is allowed (reviewer can comment without scoring)

**Security:**
- [ ] RLS prevents cross-org read of review stages
- [ ] RLS prevents cross-org read of section reviews
- [ ] RLS prevents cross-org reviewer assignment

### Acceptance Criteria
- Migration runs without error on `npx supabase db push`
- All 16 tests pass
- One commit: `feat(review): add color team review database schema`

---

## Phase 2: Org Members API + Review Stages CRUD API

### Files
- `src/app/api/org/members/route.ts` — GET org members for reviewer dropdown
- `src/app/api/proposals/[id]/review-stages/route.ts` — GET (list stages) + POST (initialize stages)
- `src/app/api/proposals/[id]/review-stages/[stageId]/route.ts` — PATCH (update stage status)
- `src/app/api/proposals/[id]/review-stages/[stageId]/advance/route.ts` — POST (advance with gate check)
- `src/app/api/proposals/[id]/review-stages/current/route.ts` — GET current active stage

### Implementation

**GET `/api/org/members`:**
- Use `getUserContext()` to get org_id
- Query `profiles` WHERE `organization_id = org_id`
- Return `{ members: [{ id, full_name, email, role }] }`

**POST `/api/proposals/[id]/review-stages`:**
- Initialize all 4 stages with stage_order 1-4
- Set first stage (pink) to `active`, rest to `pending`
- Return created stages

**GET `/api/proposals/[id]/review-stages`:**
- Return all stages with nested reviewers and review counts
- Include progress summary per stage

**POST `/api/proposals/[id]/review-stages/[stageId]/advance`:**
- Check gate criteria based on stage type:
  - Pink: All mandatory sections have ≥1 review
  - Red: Average score ≥ 70, no section < 50
  - Gold: All reviewers marked complete
  - White: All sections reviewed
- If gate passes: mark current stage `completed`, next stage `active`
- If gate fails: return `{ canAdvance: false, failures: [...] }`
- Allow override with `{ force: true }` in body

### Tests (in `src/lib/ai/__tests__/color-team-review-api.test.ts`)

**Happy Path:**
- [ ] GET /org/members returns org members
- [ ] POST initializes all 4 stages correctly
- [ ] GET returns stages with reviewers and counts
- [ ] GET /current returns the active stage
- [ ] PATCH updates stage status
- [ ] POST /advance moves to next stage when gate passes
- [ ] POST /advance with force=true skips gate

**Bad Path:**
- [ ] POST /review-stages rejects if stages already exist
- [ ] POST /advance rejects when gate criteria not met
- [ ] PATCH rejects invalid status value
- [ ] Returns 404 for non-existent proposal
- [ ] Returns 404 for non-existent stage

**Edge Cases:**
- [ ] Advancing from white stage returns error (no next stage)
- [ ] GET /current returns null when no stages initialized
- [ ] Skipping a stage updates stage_order correctly

**Security:**
- [ ] Cannot access stages from another org's proposal
- [ ] Cannot advance another org's review
- [ ] Unauthenticated requests return 401

### Acceptance Criteria
- All 18 tests pass
- API responses match TypeScript interfaces defined in INTENT.md
- One commit: `feat(review): add color team review stages API`

---

## Phase 3: Reviewer Assignment + Section Reviews API

### Files
- `src/app/api/proposals/[id]/review-stages/[stageId]/reviewers/route.ts` — POST (assign) + GET (list)
- `src/app/api/proposals/[id]/review-stages/[stageId]/reviewers/[reviewerId]/route.ts` — DELETE (remove)
- `src/app/api/proposals/[id]/review-stages/[stageId]/reviews/route.ts` — GET (list) + POST (submit)
- `src/app/api/proposals/[id]/review-stages/[stageId]/reviews/[reviewId]/route.ts` — PATCH (update)

### Implementation

**POST `/reviewers`:**
- Validate reviewer_id is an org member
- Create `stage_reviewers` record
- Send assignment email via Resend (see Phase 5)
- Return created reviewer record

**POST `/reviews`:**
- Validate reviewer is assigned to this stage
- Validate section_id belongs to this proposal
- Create `section_reviews` record with score, comment, strengths, weaknesses, recommendations
- Update reviewer status to `in_progress` if first review
- Return created review

**PATCH `/reviews/[reviewId]`:**
- Only the reviewer who created it can update
- Update score, comments, etc.
- Return updated review

**GET `/reviews`:**
- Return all reviews for the stage
- Group by section for the matrix view
- Include reviewer names and completion status
- Calculate averages per section

### Tests (in `src/lib/ai/__tests__/color-team-review-reviewers.test.ts`)

**Happy Path:**
- [ ] Assigns a reviewer to a stage
- [ ] Lists reviewers for a stage
- [ ] Removes a reviewer from a stage
- [ ] Submits a section review
- [ ] Updates an existing review
- [ ] GET reviews returns grouped by section with averages

**Bad Path:**
- [ ] Cannot assign non-org-member as reviewer
- [ ] Cannot assign same reviewer twice
- [ ] Cannot submit review for section not in this proposal
- [ ] Cannot update another reviewer's review
- [ ] Cannot review if not assigned to stage

**Edge Cases:**
- [ ] Removing reviewer cascades their reviews
- [ ] Submitting last section marks reviewer as complete
- [ ] Review with NULL score (comment-only) is valid
- [ ] Multiple reviewers scoring same section calculates correct average

**Security:**
- [ ] Cross-org reviewer assignment blocked
- [ ] Cross-org review submission blocked
- [ ] Only review author can update their review

**Data Leak:**
- [ ] Cannot read reviews from another org's proposal

**Data Damage:**
- [ ] Deleting reviewer doesn't affect other reviewers' reviews
- [ ] Concurrent review submissions don't corrupt data

### Acceptance Criteria
- All 20 tests pass
- Reviewer assignment triggers email (tested in Phase 5)
- One commit: `feat(review): add reviewer assignment and section reviews API`

---

## Phase 4: UI Components

### Files
- `src/components/review-workflow/review-stage-tracker.tsx`
- `src/components/review-workflow/reviewer-assignment.tsx`
- `src/components/review-workflow/section-review-form.tsx`
- `src/components/review-workflow/stage-review-dashboard.tsx`
- `src/components/review-workflow/review-summary-card.tsx`
- `src/components/review-workflow/advance-gate-modal.tsx`

### Implementation

**`review-stage-tracker.tsx`:**
- Horizontal progress bar: Pink → Red → Gold → White
- Each stage shows: color dot + name + status badge
- Active stage highlighted, completed stages with checkmark
- Clicking a completed/active stage shows its dashboard
- Uses CSS variables for theming (not hardcoded colors)

**`reviewer-assignment.tsx`:**
- Dropdown of org members (fetched from `/api/org/members`)
- Selected reviewers shown as pills with remove button
- "Add Reviewer" button opens the dropdown
- Shows reviewer completion status (pending/in_progress/completed)

**`section-review-form.tsx`:**
- Section dropdown (populated from proposal sections)
- Score slider/input (0-100)
- Textarea fields: Strengths, Weaknesses, Recommendations
- Submit button
- Edit mode for existing reviews

**`stage-review-dashboard.tsx`:**
- Main component that composes the above
- Shows the review matrix table (sections × reviewers)
- Shows gate criteria status
- "Advance to [Next Stage]" button (opens gate modal)
- "Initialize Review" button if no stages exist yet

**`review-summary-card.tsx`:**
- Compact card for each reviewer
- Shows: name, sections reviewed count, average score, status badge
- Click to filter the matrix to that reviewer's scores

**`advance-gate-modal.tsx`:**
- Shows gate criteria with pass/fail indicators
- If all pass: "Advance" button enabled
- If any fail: shows which criteria failed, "Force Advance" option
- Confirmation before advancing

### Style Guide
- Follow existing component patterns in `src/components/`
- Use `var(--background)`, `var(--foreground)`, `var(--accent)`, `var(--border)` CSS variables
- Use `lucide-react` icons
- Use `sonner` for toast notifications
- Use `useAuthFetch` for API calls
- Tailwind classes matching existing codebase style

### Tests
- No unit tests for UI components (follow existing project pattern)
- Manual verification through the browser

### Acceptance Criteria
- All components render without errors
- Stage tracker shows correct state progression
- Review form submits and updates correctly
- Gate modal shows correct criteria
- One commit: `feat(review): add color team review UI components`

---

## Phase 5: Email Notifications

### Files
- `src/lib/email/review-notifications.ts`

### Implementation

Use existing Resend integration pattern. Create three notification functions:

**`sendReviewerAssignedEmail(reviewer, proposal, stage)`:**
```
Subject: You've been assigned to review: {proposal.title} ({stage} Team)
Body:
You've been assigned as a {stage} Team reviewer for "{proposal.title}".

Please review each section and provide your scores and feedback.

Review now: {baseUrl}/proposals/{proposal.id}?tab=review

— IntentWin
```

**`sendStageCompleteEmail(proposalOwner, proposal, stage)`:**
```
Subject: {stage} Team Review Complete — {proposal.title}
Body:
All reviewers have completed their {stage} Team review for "{proposal.title}".

Average score: {avgScore}/100
Sections reviewed: {count}

You can now advance to the next review stage.

View results: {baseUrl}/proposals/{proposal.id}?tab=review

— IntentWin
```

**`sendStageAdvancedEmail(reviewers, proposal, newStage)`:**
```
Subject: Your {newStage} Team review is ready: {proposal.title}
Body:
The proposal "{proposal.title}" has advanced to {newStage} Team review.

You've been assigned as a reviewer. Please complete your review.

Start reviewing: {baseUrl}/proposals/{proposal.id}?tab=review

— IntentWin
```

### Tests (in `src/lib/ai/__tests__/review-notifications.test.ts`)

**Happy Path:**
- [ ] Sends assignment email with correct subject and body
- [ ] Sends stage complete email to proposal owner
- [ ] Sends advanced email to all next-stage reviewers

**Bad Path:**
- [ ] Handles missing email gracefully (no crash)
- [ ] Handles Resend API error gracefully

**Edge Cases:**
- [ ] Does not send email if RESEND_API_KEY is not set (skip silently)
- [ ] Handles reviewer with no email in profile

### Acceptance Criteria
- All 7 tests pass
- Emails sent via Resend on reviewer assignment, stage completion, and advancement
- One commit: `feat(review): add color team review email notifications`

---

## Phase 6: Integration + Review Tab Wiring

### Files Modified
- `src/app/(dashboard)/proposals/[id]/page.tsx` — Add "Review" tab
- `src/app/api/proposals/[id]/review-stages/[stageId]/reviewers/route.ts` — Wire email on assign

### Implementation

**Proposal page integration:**
- Add `"review"` to the tab union type
- Add Review tab button alongside Sections/Compliance/Versions
- When tab is active, render `<StageReviewDashboard proposalId={id} sections={sections} />`
- Support `?tab=review` URL parameter for deep linking from emails

**Wire emails into API routes:**
- In POST `/reviewers`: call `sendReviewerAssignedEmail()` after successful assignment
- In POST `/advance`: call `sendStageAdvancedEmail()` to next stage reviewers
- In reviewer completion check: call `sendStageCompleteEmail()` when all reviewers done

### Tests

**Happy Path:**
- [ ] Review tab renders without error
- [ ] Clicking Review tab shows the dashboard
- [ ] ?tab=review deep link works
- [ ] Full flow: initialize → assign → review → advance works end-to-end

**Edge Cases:**
- [ ] Review tab shows "Initialize Review" when no stages exist
- [ ] Tab state preserved when switching between proposals

### Acceptance Criteria
- All 6 tests pass
- Full end-to-end flow works in browser
- `pnpm build` succeeds without errors
- One commit: `feat(review): wire color team review into proposal view`
- Final commit: `feat(review): complete color team review workflow`
- Push to origin/main
- Deploy to Vercel: `vercel --prod`
