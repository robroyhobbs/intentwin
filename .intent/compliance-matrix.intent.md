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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policy: same org access only
ALTER TABLE proposal_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage requirements for their org's proposals"
  ON proposal_requirements
  FOR ALL
  USING (organization_id = (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- Index for proposal lookups
CREATE INDEX idx_proposal_requirements_proposal_id
  ON proposal_requirements(proposal_id);
```

**Key decisions:**

- `mapped_section_id` links to the proposal_sections table for auto-mapping
- `organization_id` denormalized for RLS performance
- No `sort_order` — cards ordered by category priority (mandatory first) then `created_at`
- No separate "extraction" table — requirements are the extracted artifacts

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

On export (DOCX/PDF/PPTX), if `not_addressed` requirements exist:

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

"Address Now" navigates to the compliance tab. "Export Anyway" proceeds with export.

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

### Files to Create

```
supabase/migrations/00020_create_compliance_matrix.sql
src/app/api/proposals/[id]/requirements/route.ts          # CRUD for requirements
src/app/api/proposals/[id]/requirements/extract/route.ts  # AI extraction endpoint
src/components/compliance/compliance-board.tsx              # Kanban board + header + cards (single file)
src/components/compliance/export-gate-modal.tsx             # Export warning modal (separate — used from export flow)
src/lib/ai/prompts/extract-requirements.ts                 # Extraction prompt
src/lib/ai/__tests__/extract-requirements.test.ts          # Tests
```

> **Critique simplification:** Merged board/header/card into one file. Only modal is separate (different call site).

### Files to Modify

```
src/app/(dashboard)/proposals/[id]/page.tsx   # Add compliance tab
package.json                                   # Add @dnd-kit/core
```

> **Critique simplification:** No intake flow modification. Extraction happens in background after upload, shown via toast. User reviews on compliance tab post-generation.

### API Routes

| Method | Path                                       | Purpose                                         |
| ------ | ------------------------------------------ | ----------------------------------------------- |
| GET    | `/api/proposals/[id]/requirements`         | List all requirements for a proposal            |
| POST   | `/api/proposals/[id]/requirements`         | Create a requirement (manual add)               |
| PATCH  | `/api/proposals/[id]/requirements`         | Batch update (status changes, reorder)          |
| DELETE | `/api/proposals/[id]/requirements/[reqId]` | Delete a requirement                            |
| POST   | `/api/proposals/[id]/requirements/extract` | Trigger AI extraction from proposal's documents |

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

- [ ] Decide if extraction should parse all uploaded docs or just the primary source doc
- [ ] Determine if compliance score should affect proposal status/display
- [ ] Consider adding requirement priority ordering within categories
