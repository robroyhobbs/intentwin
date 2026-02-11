# Compliance Matrix — Intent Specification

## 1. Overview

**Product:** IntentWin — AI-powered proposal generation tool
**Feature:** Compliance Matrix (IMF Phase 2 — L0 Requirements Truth)
**Priority:** High — demo readiness
**Target User:** Proposal managers, business development teams
**Scope:** Extract client requirements from uploaded source documents, track compliance status with a visual kanban board, auto-map requirements to proposal sections, and gate export on unaddressed requirements.

### Core Concept

When a client sends an RFP, brief, deck, or any source document, IntentWin's AI extracts every requirement/expectation and tracks whether the generated proposal addresses each one. This is the L0 layer of the IMF — "Requirements Truth."

```
Source Document Upload
    → AI extracts requirements (auto-categorized)
    → User reviews extracted requirements (soft gate)
    → Requirements inform proposal generation
    → Compliance kanban tracks coverage
    → Export gate warns on gaps
```

## 2. Architecture

### 2.1 Requirements Extraction Pipeline

Requirements are extracted from uploaded source documents during the intake phase. Source documents can be RFPs, RFIs, client briefs, pitch decks, emails, or any uploaded file.

```
Upload source doc
    → Parse text (existing pipeline: PDF, DOCX, PPTX, TXT)
    → Send to Gemini with extraction prompt
    → AI returns structured JSON:
        [{
          requirement_text: string,
          source_reference: string,     // e.g., "Section 4.2"
          category: "mandatory" | "desirable" | "informational",
          suggested_sections: string[]  // which proposal sections should address this
        }]
    → Parse + validate response
    → Insert into proposal_requirements table
    → Show in intake flow for optional review
```

**AI extraction approach:** Use existing `generateText()` with a JSON extraction prompt. Parse the response to extract the JSON array. Temperature 0.2 for consistency. The AI decides how many requirements to extract based on document scope — a 2-page brief might yield 5 requirements, a 50-page RFP might yield 40.

**Categorization:** The AI auto-labels each requirement as:

- **Mandatory** — explicit "must have", "shall", "required" language
- **Desirable** — "should have", "preferred", "ideally" language
- **Informational** — context, background, nice-to-know items

### 2.2 Data Model

```sql
CREATE TABLE proposal_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  requirement_text TEXT NOT NULL,
  source_reference TEXT,           -- "Section 4.2", "Slide 3", etc.
  category TEXT NOT NULL DEFAULT 'desirable'
    CHECK (category IN ('mandatory', 'desirable', 'informational')),
  compliance_status TEXT NOT NULL DEFAULT 'not_addressed'
    CHECK (compliance_status IN ('met', 'partially_met', 'not_addressed', 'not_applicable')),
  mapped_section_id UUID REFERENCES proposal_sections(id) ON DELETE SET NULL,
  notes TEXT,
  is_extracted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: 4 separate policies for granular control
ALTER TABLE proposal_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "requirements_select" ON proposal_requirements FOR SELECT
  USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "requirements_insert" ON proposal_requirements FOR INSERT
  WITH CHECK (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "requirements_update" ON proposal_requirements FOR UPDATE
  USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "requirements_delete" ON proposal_requirements FOR DELETE
  USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Index for proposal lookups
CREATE INDEX idx_proposal_requirements_proposal_id
  ON proposal_requirements(proposal_id);
```

> [!SYNCED] Last synced: 2026-02-11 from commits be28a52..86a3db6

**Key decisions:**

- `mapped_section_id` links to the proposal_sections table for auto-mapping
- `organization_id` denormalized for RLS performance
- No `sort_order` — cards ordered by category priority (mandatory first) then `created_at`
- No separate "extraction" table — requirements are the extracted artifacts
- `is_extracted` boolean differentiates AI-extracted from manual requirements (re-extraction deletes only `is_extracted=true` rows, preserving manual ones)
- 4 separate RLS policies (SELECT/INSERT/UPDATE/DELETE) instead of single FOR ALL for granular control

### 2.3 Compliance Kanban Board

Full-width tab on the proposal view page (replaces main content area when active). Four columns with drag-and-drop:

```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Met (3)         │ │ Partially Met(2)│ │ Not Addressed(4)│ │ N/A (1)         │
│                 │ │                 │ │                 │ │                 │
│ ┌─────────────┐ │ │ ┌─────────────┐ │ │ ┌─────────────┐ │ │ ┌─────────────┐ │
│ │ Req 4.2.1   │ │ │ │ Req 5.1.3   │ │ │ │ Req 6.2.0   │ │ │ │ Req 8.1     │ │
│ │ MANDATORY   │ │ │ │ DESIRABLE   │ │ │ │ MANDATORY   │ │ │ │ INFO        │ │
│ │ → Approach  │ │ │ │ → Timeline  │ │ │ │             │ │ │ │             │ │
│ └─────────────┘ │ │ └─────────────┘ │ │ │ [Address ▶] │ │ │ └─────────────┘ │
│ ┌─────────────┐ │ │ ┌─────────────┐ │ │ └─────────────┘ │ │                 │
│ │ Req 4.3.2   │ │ │ │ Req 7.1.0   │ │ │ ┌─────────────┐ │ │                 │
│ │ DESIRABLE   │ │ │ │ MANDATORY   │ │ │ │ Req 6.3.1   │ │ │                 │
│ │ → Pricing   │ │ │ │ → Team      │ │ │ │ MANDATORY   │ │ │                 │
│ └─────────────┘ │ │ └─────────────┘ │ │ │ [Address ▶] │ │ │                 │
│ ┌─────────────┐ │ │                 │ │ └─────────────┘ │ │                 │
│ │ Req 5.2.0   │ │ │                 │ │                 │ │                 │
│ │ INFO        │ │ │                 │ │                 │ │                 │
│ │ → Case St.  │ │ │                 │ │                 │ │                 │
│ └─────────────┘ │ │                 │ │                 │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘

Header: Compliance Score: 5/10 (50%)  |  3 mandatory gaps  |  [+ Add Requirement]
```

**Card contents:**

- Requirement text (truncated to ~80 chars)
- Category badge (mandatory = red, desirable = yellow, informational = blue)
- Mapped section name (if mapped)
- "Address" button on unaddressed cards (triggers targeted regeneration)
- Click to expand full details + notes field

**Drag-and-drop:** Uses @dnd-kit for smooth, accessible drag between columns. Dropping a card into a column updates its `compliance_status` and persists to DB.

### 2.4 Auto-Mapping

When requirements are extracted, the AI also suggests which proposal section(s) should address each requirement. This is stored as `mapped_section_id` and displayed on the kanban card.

```
Extraction response includes suggested_sections: ["approach", "methodology"]
    → Match against SECTION_CONFIGS types
    → Find the corresponding proposal_sections row
    → Set mapped_section_id to the first match
    → User can override via dropdown on the card
```

### 2.5 "Address Now" Flow

When user clicks "Address" on an unaddressed requirement:

```
1. Navigate to the mapped section in the section editor
2. Show a requirement banner at the top of the section:
   "This section should address: [requirement text]"
3. User clicks "Regenerate" to regenerate the section
4. Existing section regen flow handles the rest
5. User manually updates compliance_status on the kanban
```

> **Critique simplification:** Navigates to section + shows banner instead of auto-regenerating. Avoids reimplementing half the pipeline. User triggers regen explicitly from the editor which already supports it.

### 2.6 Soft Export Gate

On export (any format: slides/pptx/html/docx/pdf), if `not_addressed` or `partially_met` requirements exist:

```
┌──────────────────────────────────────────────────────┐
│  ⚠ 3 Requirements Not Yet Addressed                │
│                                                      │
│  MANDATORY:                                          │
│  • Req 6.2.0: Disaster recovery plan                │
│    → Suggested: Risk Mitigation section              │
│  • Req 6.3.1: Data residency compliance             │
│    → Suggested: Approach section                     │
│                                                      │
│  DESIRABLE:                                          │
│  • Req 7.2.1: Training plan details                 │
│    → Suggested: Methodology section                  │
│                                                      │
│  [ Address Now ]  [ Export Anyway ]  [ Cancel ]      │
└──────────────────────────────────────────────────────┘
```

"Address Now" navigates to `/proposals/[id]?tab=compliance`. "Export Anyway" proceeds with export. **Fail-open:** if the requirements API check fails, export proceeds normally (no blocking).

> [!SYNCED] Gate intercepts both `not_addressed` AND `partially_met` (broader than originally spec'd)

### 2.7 Integration with Intake Flow

Requirements extraction triggers automatically after document upload completes:

```
Upload Documents → Processing completes
    → API call: POST /api/proposals/[id]/requirements/extract
    → Background extraction (async, no UI blocking)
    → Toast notification: "12 requirements extracted"
    → Requirements visible on Compliance tab after generation
```

> **Critique simplification:** No new intake step. No modification to flexible-intake.tsx. Extraction triggered from the document upload completion handler. User reviews on compliance tab post-generation.

## 3. User Experience

### Key Flows

**Flow 1: Document Upload + Extraction**

1. User uploads source document(s) during intake
2. System extracts requirements in background (async)
3. Toast notification: "12 requirements extracted"
4. Requirements are saved and visible on Compliance tab after generation

**Flow 2: Compliance Tracking (Post-Generation)**

1. User views a generated proposal
2. Clicks "Compliance" tab in proposal view
3. Sees kanban board with all requirements across 4 columns
4. Compliance score shown in header (e.g., "7/12 Met — 58%")
5. User drags cards between columns to update status
6. Clicks "Address" on unaddressed requirements to navigate to the section editor with a requirement banner

**Flow 3: Export with Gate**

1. User clicks Export (DOCX/PDF/PPTX)
2. If unaddressed requirements exist → modal with details
3. User chooses: Address Now / Export Anyway / Cancel

### Error States

- Document extraction fails → Show "Extraction failed, add requirements manually" with manual entry form
- No requirements extracted → Show empty state: "No requirements found. Add manually or re-upload."
- Section regeneration fails → Show error toast, keep original section content
- Drag-and-drop fails to save → Show error toast, revert card position

## 4. Technical Implementation Guide

### Dependencies to Add

```json
{
  "@dnd-kit/core": "^6.x"
}
```

> **Critique simplification:** Start with `@dnd-kit/core` only for cross-column drag. Add `@dnd-kit/sortable` later if within-column reordering is needed.

### Files Created

> [!SYNCED] Confirmed file list from implementation

```
supabase/migrations/00020_create_compliance_matrix.sql      # DB schema + RLS
src/app/api/proposals/[id]/requirements/route.ts            # CRUD (GET/POST/PATCH/DELETE)
src/app/api/proposals/[id]/requirements/extract/route.ts    # AI extraction endpoint
src/components/compliance/compliance-board.tsx                # Kanban board + header + cards (single file)
src/components/compliance/export-gate-modal.tsx               # Export warning modal
src/lib/ai/prompts/extract-requirements.ts                   # Prompt builder + JSON parser
src/lib/ai/__tests__/compliance-api.test.ts                  # 33 CRUD API tests
src/lib/ai/__tests__/extract-requirements.test.ts            # 32 extraction tests
```

### Files Modified

```
src/app/(dashboard)/proposals/[id]/page.tsx        # Compliance tab + ?tab=compliance
src/app/(dashboard)/proposals/[id]/export/page.tsx # Export gate modal integration
package.json                                        # @dnd-kit/core ^6.3.1
```

> **Critique simplification:** No intake flow modification. Extraction happens in background after upload, shown via toast. User reviews on compliance tab post-generation.

### API Routes

| Method | Path                                             | Purpose                                          |
| ------ | ------------------------------------------------ | ------------------------------------------------ |
| GET    | `/api/proposals/[id]/requirements`               | List all requirements + summary for a proposal   |
| POST   | `/api/proposals/[id]/requirements`               | Create a requirement (manual add)                |
| PATCH  | `/api/proposals/[id]/requirements`               | Batch update (status, notes, mapping, category)  |
| DELETE | `/api/proposals/[id]/requirements?reqId=[reqId]` | Delete a requirement by query param              |
| POST   | `/api/proposals/[id]/requirements/extract`       | Trigger AI extraction from specific document_ids |

> [!SYNCED] DELETE uses query param `?reqId=` (not path param). Extract accepts `{ document_ids: string[] }` body.

### Extraction Prompt Structure

```
You are analyzing a client document to extract requirements and expectations.

Document content:
{documentText}

Extract every requirement, ask, or expectation from this document.

For each requirement, return:
- requirement_text: The specific requirement in one clear sentence
- source_reference: Where in the document this appears (section, page, slide number)
- category: "mandatory" (explicit must-have), "desirable" (should-have/preferred), or "informational" (context/background)
- suggested_sections: Which proposal sections should address this (from: executive_summary, understanding, approach, methodology, team, case_studies, timeline, pricing, risk_mitigation, why_us)

Return ONLY a JSON array. No markdown, no explanation.
```

## 5. Decisions Summary

| Decision           | Choice                                             | Rationale                                       |
| ------------------ | -------------------------------------------------- | ----------------------------------------------- |
| Source doc types   | Any uploaded file (not just RFPs)                  | Proposals respond to briefs, decks, emails too  |
| Extraction timing  | During intake (before generation)                  | Requirements inform generation quality          |
| Review gate        | Soft (show, don't block)                           | Balance thoroughness with speed                 |
| Kanban interaction | Full drag-and-drop (@dnd-kit)                      | Demo impact — feels like Trello                 |
| UI placement       | Full tab on proposal view                          | Kanban needs space, slide-in too cramped        |
| Auto-mapping       | AI suggests section, user overrides                | Reduces manual work, keeps user in control      |
| Address flow       | Navigate to section + banner (user triggers regen) | Simpler than auto-regen, reuses existing editor |
| Export gate        | Modal with requirement details                     | Actionable info, not just a warning             |
| Categorization     | AI auto-labels (mandatory/desirable/informational) | Reduces user work, AI handles language cues     |
| Extraction count   | AI decides based on document scope                 | 2-page brief ≠ 50-page RFP                      |
| DB approach        | New table with RLS                                 | Clean separation, proper access control         |
| AI backend         | Existing generateText with JSON prompt             | Consistent with codebase, already working       |

## 6. MVP Scope

### Included

- AI extraction of requirements from any uploaded source document
- Auto-categorization (mandatory/desirable/informational)
- Compliance kanban board with 4 columns and drag-and-drop
- Auto-mapping requirements to proposal sections
- Manual requirement add/edit/delete
- "Address Now" navigates to section editor with requirement banner
- Compliance score header (X/Y met, percentage)
- Soft export gate modal
- Background extraction triggered after document upload (toast notification)

### Excluded

- Cross-proposal requirement templates (reuse across proposals)
- Requirement history/changelog
- Multi-user requirement assignment
- Automated compliance scoring (AI-based, not keyword-based)
- Requirement grouping/tagging beyond the 3 categories
- Bulk requirement import from spreadsheet

## 7. Risks

| Risk                                       | Mitigation                                              |
| ------------------------------------------ | ------------------------------------------------------- |
| AI extracts too many/few requirements      | Prompt tuning + user can add/remove                     |
| Extraction misses non-obvious requirements | Soft gate — user reviews and can add missed ones        |
| Drag-and-drop performance with 50+ cards   | @dnd-kit handles large lists well; virtualize if needed |
| Auto-mapping to wrong section              | User can override; mapping is a suggestion              |
| User forgets to regen after "Address Now"  | Banner persists until requirement marked as met         |
| Source docs too large for context window   | Gemini 1M context handles most docs; chunk if needed    |

## 8. Open Items

- [x] ~~Decide if extraction should parse all uploaded docs or just the primary source doc~~ → **Resolved:** Extraction accepts specific `document_ids` in request body. Caller controls which docs to extract from.
- [ ] Determine if compliance score should affect proposal status/display (deferred)
- [ ] Consider adding requirement priority ordering within categories (deferred)

---

## 9. Finalized Implementation Details

> [!SYNCED] Last synced: 2026-02-11
> From: commits be28a52..86a3db6 (4 phases)

### API Response Shapes

**GET `/api/proposals/[id]/requirements`:**

```typescript
{
  requirements: Requirement[];
  summary: {
    total: number;
    met: number;
    partially_met: number;
    not_addressed: number;
    not_applicable: number;
    mandatory_gaps: number;  // count of mandatory requirements not met
  };
}
```

**POST `/api/proposals/[id]/requirements/extract`:**

```typescript
// Request
{ document_ids: string[] }

// Response
{
  count: number;
  requirements: RequirementExtraction[];
}
```

### TypeScript Interfaces

```typescript
// Server-side extraction result
interface RequirementExtraction {
  requirement_text: string;
  source_reference: string;
  category: "mandatory" | "desirable" | "informational";
  suggested_sections: string[];
}

// Client-side requirement (from API)
interface Requirement {
  id: string;
  requirement_text: string;
  source_reference: string | null;
  category: "mandatory" | "desirable" | "informational";
  compliance_status:
    | "met"
    | "partially_met"
    | "not_addressed"
    | "not_applicable";
  mapped_section_id: string | null;
  notes: string | null;
  is_extracted: boolean;
  created_at: string;
  updated_at: string;
}

// Compliance summary (computed server-side in GET)
interface ComplianceSummary {
  total: number;
  met: number;
  partially_met: number;
  not_addressed: number;
  not_applicable: number;
  mandatory_gaps: number;
}

// Component props
interface ComplianceBoardProps {
  proposalId: string;
  sections?: { id: string; title: string; section_type: string }[];
}

interface ExportGateModalProps {
  proposalId: string;
  requirements: UnaddressedRequirement[];
  format: string;
  onExportAnyway: () => void;
  onCancel: () => void;
}
```

### Constants

```typescript
const VALID_SECTION_TYPES = [
  "executive_summary",
  "understanding",
  "approach",
  "methodology",
  "team",
  "case_studies",
  "timeline",
  "pricing",
  "risk_mitigation",
  "why_us",
] as const;

const MAX_DOCUMENT_CHARS = 500_000; // truncation limit for extraction prompt
const EXTRACTION_TEMPERATURE = 0.2;
const EXTRACTION_MAX_TOKENS = 4096;
const NOTES_DEBOUNCE_MS = 800;

const CATEGORY_ORDER = { mandatory: 0, desirable: 1, informational: 2 };
const CATEGORY_COLORS = {
  mandatory: {
    bg: "rgba(239, 68, 68, 0.1)",
    text: "#ef4444",
    label: "MANDATORY",
  },
  desirable: {
    bg: "rgba(234, 179, 8, 0.1)",
    text: "#eab308",
    label: "DESIRABLE",
  },
  informational: {
    bg: "rgba(59, 130, 246, 0.1)",
    text: "#3b82f6",
    label: "INFO",
  },
};
```

### Compliance Score Formula

```
score = Math.round(((met + not_applicable) / total) * 100)
```

N/A counts as "addressed" — only `not_addressed` and `partially_met` are considered gaps.

### Module Structure

```
src/
├── app/api/proposals/[id]/requirements/
│   ├── route.ts                    # CRUD (GET/POST/PATCH/DELETE)
│   └── extract/route.ts           # AI extraction endpoint
├── components/compliance/
│   ├── compliance-board.tsx        # Kanban board + header + cards (single file)
│   └── export-gate-modal.tsx       # Export warning modal
├── lib/ai/
│   ├── prompts/extract-requirements.ts  # Prompt builder + JSON parser
│   └── __tests__/
│       ├── compliance-api.test.ts       # 33 CRUD API tests
│       └── extract-requirements.test.ts # 32 extraction tests
└── app/(dashboard)/proposals/[id]/
    ├── page.tsx                    # Sections/Compliance tab toggle + ?tab= param
    └── export/page.tsx             # Export gate integration
```

### Key Implementation Decisions

| Decision            | Final Choice                              | Rationale                                                  |
| ------------------- | ----------------------------------------- | ---------------------------------------------------------- |
| `is_extracted` flag | Boolean column on `proposal_requirements` | Re-extraction deletes only AI rows, preserves manual       |
| DELETE endpoint     | Query param `?reqId=`                     | Simpler than nested path param, consistent with other APIs |
| Export gate scope   | `not_addressed` + `partially_met`         | `partially_met` still needs attention                      |
| Tab routing         | `?tab=compliance` search param            | Enables deep linking from export gate modal                |
| Compliance score    | `(met + not_applicable) / total`          | N/A = addressed (not a gap)                                |
| RLS policies        | 4 separate (per operation)                | Granular control, easier auditing                          |
| Notes saving        | 800ms debounce                            | Prevents excessive API calls during editing                |
| Delete UX           | Confirmation modal                        | Prevents accidental deletion                               |
| Drag-and-drop       | Optimistic update + rollback              | Instant UI feedback, API consistency                       |
| Export gate failure | Fail-open (proceed with export)           | Never block user's export workflow                         |

### Test Coverage

| Suite                        | Tests   | Categories                                                         |
| ---------------------------- | ------- | ------------------------------------------------------------------ |
| compliance-api.test.ts       | 33      | Happy Path, Bad Path, Edge Cases, Security, Data Leak, Data Damage |
| extract-requirements.test.ts | 32      | Happy Path, Bad Path, Edge Cases, Security, Data Leak, Data Damage |
| **Total new**                | **65**  | All 6 IDD categories                                               |
| **Total suite**              | **143** | No regressions                                                     |
