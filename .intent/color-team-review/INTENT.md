# Color Team Review Workflow — Intent Specification

## 1. Overview

**Product:** IntentBid — AI-powered proposal generation platform
**Feature:** Color Team Review Workflow (Pink/Red/Gold/White)
**Priority:** High — differentiating feature for government proposal market
**Target User:** Proposal managers, reviewers, executives, capture managers
**Scope:** Implement the standard government proposal color team review process with multi-reviewer assignment, per-section scoring, stage progression gates, and email notifications via Resend.

### Core Concept

Government proposals follow a standard color team review process where different groups review the proposal at successive stages of maturity. Each color represents a review stage with specific focus areas and pass/fail criteria. IntentBid needs to support this workflow natively to be credible for government contractors.

```
Proposal Generated
    → Pink Team (Storyboard Review)
        → Reviewers score sections, leave comments
        → Gate: All mandatory sections scored
        → Advance to Red
    → Red Team (Final Draft Review)
        → Different reviewers, stricter criteria
        → Gate: Average score ≥ 70, no section below 50
        → Advance to Gold
    → Gold Team (Executive Review)
        → Senior leadership review
        → Gate: Executive sign-off
        → Advance to White
    → White Team (Production Review)
        → Final formatting, compliance, submission readiness
        → Gate: Compliance matrix clear, all sections reviewed
        → Ready to Export
```

## 2. Architecture

### 2.1 Data Model

```sql
-- Review stages configuration per proposal
CREATE TABLE proposal_review_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('pink', 'red', 'gold', 'white')),
  stage_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'skipped')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(proposal_id, stage)
);

-- Reviewer assignments per stage
CREATE TABLE stage_reviewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID NOT NULL REFERENCES proposal_review_stages(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(stage_id, reviewer_id)
);

-- Per-section review scores and comments
CREATE TABLE section_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID NOT NULL REFERENCES proposal_review_stages(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES stage_reviewers(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES proposal_sections(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  comment TEXT,
  strengths TEXT,
  weaknesses TEXT,
  recommendations TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(reviewer_id, section_id)
);

-- RLS on all tables (organization_id scoped)
ALTER TABLE proposal_review_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_reviewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for each table (SELECT/INSERT/UPDATE/DELETE)
-- Pattern: organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
```

### 2.2 Review Stages

| Stage | Color | Focus | Typical Reviewers | Pass Criteria |
|-------|-------|-------|-------------------|---------------|
| Pink | Storyboard | Structure, approach, strategy | Proposal team leads | All mandatory sections have at least 1 review |
| Red | Final Draft | Content quality, persuasiveness, evidence | Subject matter experts, BD | Average score ≥ 70, no section < 50 |
| Gold | Executive | Win themes, pricing strategy, risk | Senior leadership, executives | Executive approval (all reviewers mark complete) |
| White | Production | Formatting, compliance, submission-ready | Editors, compliance officers | Compliance matrix clear, all sections marked complete |

### 2.3 API Routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/proposals/[id]/review-stages` | List all stages with reviewers and progress |
| POST | `/api/proposals/[id]/review-stages` | Initialize stages for a proposal (creates all 4) |
| PATCH | `/api/proposals/[id]/review-stages/[stageId]` | Update stage status (advance/skip) |
| POST | `/api/proposals/[id]/review-stages/[stageId]/reviewers` | Assign reviewers to a stage |
| DELETE | `/api/proposals/[id]/review-stages/[stageId]/reviewers/[reviewerId]` | Remove a reviewer |
| GET | `/api/proposals/[id]/review-stages/[stageId]/reviews` | Get all section reviews for a stage |
| POST | `/api/proposals/[id]/review-stages/[stageId]/reviews` | Submit a section review (score + comments) |
| PATCH | `/api/proposals/[id]/review-stages/[stageId]/reviews/[reviewId]` | Update a review |
| GET | `/api/proposals/[id]/review-stages/current` | Get the current active stage |
| POST | `/api/proposals/[id]/review-stages/[stageId]/advance` | Advance to next stage (checks gate criteria) |
| GET | `/api/org/members` | List org members (for reviewer assignment dropdown) |

### 2.4 UI Components

```
src/components/review-workflow/
├── review-stage-tracker.tsx       # Horizontal stage progress bar (Pink → Red → Gold → White)
├── reviewer-assignment.tsx        # Assign org members as reviewers for a stage
├── section-review-form.tsx        # Score + comments form for a single section
├── stage-review-dashboard.tsx     # Overview of all section reviews for current stage
├── review-summary-card.tsx        # Compact card showing reviewer's progress
└── advance-gate-modal.tsx         # Modal showing gate criteria + advance/fail state
```

### 2.5 Dashboard Page

New tab on the proposal view page: **"Review"** (alongside Sections, Compliance, Versions)

```
┌──────────────────────────────────────────────────────────────────┐
│  Sections  │  Compliance  │  Review  │  Versions                │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ◉ Pink ──── ◉ Red ──── ○ Gold ──── ○ White                    │
│  ✓ Complete   Active      Pending     Pending                   │
│                                                                  │
│  ┌─ Red Team Review ─────────────────────────────────────────┐  │
│  │                                                            │  │
│  │  Reviewers: [Jane Smith ✓] [Bob Jones ◐] [+ Add]         │  │
│  │                                                            │  │
│  │  Section Scores:                                           │  │
│  │  ┌─────────────────┬────────┬────────┬────────┐           │  │
│  │  │ Section         │ Jane   │ Bob    │ Avg    │           │  │
│  │  ├─────────────────┼────────┼────────┼────────┤           │  │
│  │  │ Exec Summary    │ 85     │ —      │ 85     │           │  │
│  │  │ Approach        │ 72     │ —      │ 72     │           │  │
│  │  │ Methodology     │ 90     │ —      │ 90     │           │  │
│  │  │ Team            │ 68     │ —      │ 68     │           │  │
│  │  │ Pricing         │ —      │ —      │ —      │           │  │
│  │  └─────────────────┴────────┴────────┴────────┘           │  │
│  │                                                            │  │
│  │  Gate: Avg ≥ 70 (current: 78.75) ✓  No section < 50 ✓    │  │
│  │  [ Advance to Gold Team → ]                                │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ Review a Section ────────────────────────────────────────┐  │
│  │  Section: [Exec Summary ▾]                                 │  │
│  │  Score: [85] / 100                                         │  │
│  │  Strengths: [Clear value proposition, strong opening...]   │  │
│  │  Weaknesses: [Missing specific timeline references...]     │  │
│  │  Recommendations: [Add Q3 delivery milestone detail...]    │  │
│  │  [ Submit Review ]                                         │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.6 Email Notifications (via Resend)

| Trigger | Recipient | Subject |
|---------|-----------|---------|
| Reviewer assigned | Reviewer | "You've been assigned to review: {proposal_title} ({stage} Team)" |
| All reviewers complete for a stage | Proposal owner | "{stage} Team Review Complete — Ready to Advance" |
| Stage advanced | All next-stage reviewers | "Your {stage} Team review is ready: {proposal_title}" |

Email template: Simple text-based via Resend API (already integrated in the project). No HTML template needed — plain text with a link to the proposal.

### 2.7 Integration Points

**Existing proposal view page (`proposals/[id]/page.tsx`):**
- Add "Review" tab alongside existing Sections/Compliance/Versions tabs
- Tab shows `stage-review-dashboard` component

**Existing sidebar (`components/layout/sidebar.tsx`):**
- No changes needed — reviews are accessed through the proposal detail page

**Existing auth system:**
- Reviewers must be org members (profiles table, same org)
- Use `getUserContext()` for auth in all API routes
- RLS policies enforce org isolation

## 3. Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Reviewer access | Org members only | Simpler auth, consistent with multi-tenant model |
| Review stages | All 4 (Pink/Red/Gold/White) | Full government standard |
| Notifications | Email (Resend) + in-app | Users need to know when assigned |
| Gate enforcement | Soft gates (warn, don't block) | Proposal managers should have override authority |
| Score range | 0-100 per section | Consistent with existing quality review scores |
| Review granularity | Per-section | Matches proposal structure |
| Stage initialization | Manual (POST to create) | Not all proposals need formal review |
| Reviewer assignment | Manual by proposal manager | Managers know who should review |
| Comment structure | Strengths/Weaknesses/Recommendations | Standard government review format |

## 4. Constraints

- All database operations must use `organization_id` for RLS
- Use existing `useAuthFetch` hook for API calls from client
- Use existing `getUserContext()` pattern in API routes
- Use existing Resend integration for emails
- Follow existing component patterns (Tailwind + CSS variables)
- Use lucide-react for icons (already in project)
- No new dependencies except what's needed for the review form
- Migration number: 00029
- Tests must cover: Happy Path, Bad Path, Edge Cases, Security, Data Leak, Data Damage

## 5. Out of Scope

- External reviewer access (magic links, guest auth)
- Review templates (predefined review criteria)
- Review analytics/trends
- Automated AI review scoring (use existing quality overseer separately)
- Custom stage configuration (always 4 stages)
- Review deadline tracking
- Review version history (reviews are mutable, not versioned)
