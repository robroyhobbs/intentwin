# Company Truth (IMF L1) — Intent Specification

## 1. Overview

**Product:** IntentBid — AI-powered proposal generation tool
**Feature:** Company Truth Management (IMF L1 — Evidence & Capabilities Layer)
**Priority:** High — completes the IMF stack
**Target User:** Proposal managers, company admins
**Scope:** Management UI for products/services and evidence library, AI-assisted evidence extraction from documents, inline verification workflow. Enables generated proposals to cite real company data.

### Core Concept

IMF L1 is the "Company Truth" layer — verified facts about your company that get injected into every proposal. The database tables and pipeline integration already exist. This feature adds the **management UI** so users can populate and maintain their company's evidence base.

```
Company Admin maintains L1 data:
    → Products & Services (capabilities, specs, pricing)
    → Evidence Library (case studies, metrics, testimonials, certs, awards)
    → AI extracts evidence from uploaded documents
    → Verified evidence flows into proposal generation
    → Generated sections cite real company data
```

### What Already Exists

| Component                                               | Status                                                      |
| ------------------------------------------------------- | ----------------------------------------------------------- |
| `company_context` table + RLS                           | Done (migration 00009 + 00015)                              |
| `product_contexts` table + RLS                          | Done (migration 00009 + 00015)                              |
| `evidence_library` table + RLS                          | Done (migration 00009 + 00015)                              |
| TypeScript types (idd.ts)                               | Done (CompanyContext, ProductContext, EvidenceLibraryEntry) |
| `fetchL1Context()` in pipeline.ts                       | Done (queries all 3 tables)                                 |
| `buildL1ContextString()`                                | Done (formats into prompt context)                          |
| Company Profile UI (name, desc, differentiators, certs) | Done (/settings/company)                                    |
| Seed script with sample data                            | Done (scripts/seed-company-context.ts)                      |
| **Products/Services management UI**                     | **This feature**                                            |
| **Evidence Library management UI**                      | **This feature**                                            |
| **AI evidence extraction**                              | **This feature**                                            |

## 2. Architecture

### 2.1 Products & Services Tab

New tab on `/settings/company` alongside existing Profile, Differentiators, Certifications tabs.

```
/settings/company tabs:
  [Profile] [Differentiators] [Certifications] [Products & Services]
                                                  ↑ NEW

┌──────────────────────────────────────────────────────────────────┐
│ Products & Services                              [+ Add Product] │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ Cloud Migration Services          service_line: cloud        │ │
│ │ End-to-end cloud migration...                    [Edit][Del] │ │
│ │                                                              │ │
│ │ ▼ Capabilities (3)                                           │ │
│ │ ┌────────────────────────────────────────────────────────┐   │ │
│ │ │ Assessment & Planning                                  │   │ │
│ │ │ Comprehensive analysis of existing infrastructure...   │   │ │
│ │ │ Outcomes: cost_optimization, risk_reduction             │   │ │
│ │ └────────────────────────────────────────────────────────┘   │ │
│ │ ┌────────────────────────────────────────────────────────┐   │ │
│ │ │ Migration Execution                                    │   │ │
│ │ │ Automated migration with minimal downtime...           │   │ │
│ │ │ Outcomes: speed_to_value, quality_improvement           │   │ │
│ │ └────────────────────────────────────────────────────────┘   │ │
│ │ [+ Add Capability]                                           │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ Data & AI Platform                service_line: data_ai      │ │
│ │ Enterprise data platform...                      [Edit][Del] │ │
│ │ ▶ Capabilities (4)                                           │ │
│ └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

**Product form fields:**

- `product_name` (required text)
- `service_line` (freeform text with suggestions from org settings `services[]`)
- `description` (textarea)
- `capabilities[]` — inline expandable rows, each with:
  - `name` (text)
  - `description` (textarea)
  - `outcomes[]` (multi-select from OutcomeCategory)

**Simplified for MVP:** Skip `specifications`, `constraints`, `pricing_models` JSONB fields. These can be added later. Focus on the core: name, service line, description, capabilities.

### 2.2 Evidence Library Page

New dedicated sidebar item under "Knowledge" group. Route: `/evidence-library`.

```
Sidebar:
  Knowledge
    L1 Sources
    Uploaded Docs
    Upload
    Search
    Evidence Library  ← NEW (Library icon)
```

Card-based layout grouped by evidence type (5 sections):

```
┌──────────────────────────────────────────────────────────────────────┐
│ Evidence Library                    [+ Add Evidence] [AI Extract ▼] │
│                                                                      │
│ Filters: [All Types ▼] [Industry ▼] [Service Line ▼] [Verified ▼]  │
│                                                                      │
│ ── Case Studies (3) ─────────────────────────────────────────────── │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐        │
│ │ Global Bank      │ │ Healthcare Co   │ │ Retail Chain     │        │
│ │ Migration        │ │ HIPAA Platform  │ │ Microservices    │        │
│ │                  │ │                 │ │                  │        │
│ │ cloud · enterprise│ │ healthcare · ent│ │ retail · mid     │        │
│ │ 40% cost savings │ │ 99.99% uptime   │ │ 3x deploy speed  │        │
│ │                  │ │                 │ │                  │        │
│ │ ✓ Verified       │ │ ✓ Verified      │ │ ○ Unverified     │        │
│ │ [View] [Edit]    │ │ [View] [Edit]   │ │ [View] [Edit]    │        │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘        │
│                                                                      │
│ ── Metrics (2) ──────────────────────────────────────────────────── │
│ ┌─────────────────┐ ┌─────────────────┐                            │
│ │ Aggregate Stats  │ │ Cloud ROI       │                            │
│ │ 500+ migrations  │ │ Avg 35% savings │                            │
│ │ ✓ Verified       │ │ ✓ Verified      │                            │
│ └─────────────────┘ └─────────────────┘                            │
│                                                                      │
│ ── Testimonials (0) ─────────────────────────────────────────────── │
│ No testimonials yet. Add one or extract from documents.             │
│                                                                      │
│ ── Certifications (2) ───────────────────────────────────────────── │
│ ...                                                                  │
│                                                                      │
│ ── Awards (0) ───────────────────────────────────────────────────── │
│ No awards yet.                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

**Card contents:**

- Title (bold)
- Summary (truncated ~100 chars)
- Tags: `service_line` + `client_industry` + `client_size`
- Key metric (first from `metrics[]` if present)
- Verification badge: checkmark (verified) or circle (unverified)
- Inline verify toggle (click to toggle `is_verified`)
- View/Edit/Delete actions

**Filters:**

- Type: All / Case Study / Metric / Testimonial / Certification / Award
- Industry: freeform with suggestions from `organizations.settings.industries[]`
- Service Line: freeform with suggestions from `organizations.settings.services[]`
- Verified: All / Verified Only / Unverified Only

### 2.3 Evidence Form

Add/Edit form for evidence entries. Shown as a modal or inline expand:

**Common fields (all types):**

- `evidence_type` (select: case_study, metric, testimonial, certification, award)
- `title` (required text)
- `summary` (required textarea)
- `full_content` (rich textarea)
- `client_industry` (freeform with suggestions)
- `service_line` (freeform with suggestions)
- `client_size` (select: enterprise, mid_market, smb)

**Simplified for manual entry (MVP):**

- `metrics` — freeform textarea ("Key metrics, one per line"). Stored as JSONB.
- `outcomes` — freeform textarea ("Outcomes demonstrated, one per line"). Stored as JSONB.

> **Critique simplification:** AI extraction still produces structured JSONB (name/value/context arrays). Manual form uses textareas for speed. Can upgrade to dynamic rows later.

### 2.4 AI Evidence Extraction

Similar pattern to compliance matrix requirements extraction.

**Entry: Extract from existing org documents**

- "AI Extract" button on Evidence Library page
- Shows flat list of org's processed documents (from `documents` table where `processing_status = 'completed'`)
- User selects one or more documents
- Calls extraction endpoint

> **Critique simplification:** Dropped "Upload & Extract" flow. Users upload docs via existing Knowledge Base, then extract evidence here. Dropped proposal picker — shows flat document list since evidence is org-level.

**Extraction flow:**

```
Document text
    → Send to Gemini with evidence extraction prompt
    → AI returns structured JSON array:
        [{
          evidence_type: "case_study" | "metric" | ...,
          title: string,
          summary: string,
          full_content: string,
          client_industry?: string,
          service_line?: string,
          metrics?: [{ name, value, context }],
          outcomes_demonstrated?: [{ outcome, description }]
        }]
    → Parse + validate response
    → Insert into evidence_library (is_verified: false, is_extracted: true)
    → User reviews extracted evidence on library page
    → User verifies good entries, deletes bad ones
```

**AI extraction approach:** Use existing `generateText()` with a JSON extraction prompt. Temperature 0.2. Extracted evidence starts as **unverified** — user must verify before it appears in proposals.

### 2.5 API Routes

| Method | Path                             | Purpose                                                     |
| ------ | -------------------------------- | ----------------------------------------------------------- |
| GET    | `/api/settings/products`         | List products for current org                               |
| POST   | `/api/settings/products`         | Create a product                                            |
| PATCH  | `/api/settings/products`         | Update a product (by id in body)                            |
| DELETE | `/api/settings/products?id=[id]` | Delete a product                                            |
| GET    | `/api/evidence`                  | List evidence for current org (with filters)                |
| POST   | `/api/evidence`                  | Create evidence entry                                       |
| PATCH  | `/api/evidence`                  | Update evidence (incl. verify toggle via is_verified field) |
| DELETE | `/api/evidence?id=[id]`          | Delete evidence entry                                       |
| POST   | `/api/evidence/extract`          | AI-extract evidence from document text                      |

> **Critique simplification:** Removed `/api/evidence/verify` — PATCH handles verification via `is_verified` field.

**Auth pattern:** Same as compliance matrix — `getUserContext(request)` → org_id scoping → `createAdminClient()` for DB ops.

## 3. User Experience

### Key Flows

**Flow 1: Add a Product/Service**

1. Navigate to Settings → Company Profile → Products & Services tab
2. Click "+ Add Product"
3. Fill in name, service line, description
4. Add capabilities inline (name + description + outcomes)
5. Save → product appears in list
6. Product data automatically included in next proposal generation

**Flow 2: Browse & Manage Evidence**

1. Click "Evidence Library" in sidebar
2. See cards grouped by type (Case Studies, Metrics, etc.)
3. Filter by industry, service line, or verification status
4. Click card to view details
5. Toggle verify/unverify inline
6. Add new evidence manually or via AI extraction

**Flow 3: AI Evidence Extraction**

1. From Evidence Library page, click "AI Extract"
2. See flat list of org's processed documents
3. Select document(s)
4. AI extracts structured evidence entries
5. Toast: "5 evidence entries extracted"
6. Entries appear as unverified cards
7. User reviews and verifies good entries

**Flow 4: Evidence in Proposal Generation**

1. User creates/generates a proposal
2. Pipeline calls `fetchL1Context()` — pulls verified evidence
3. `buildL1ContextString()` formats evidence into prompt context
4. Section prompts include: "Verified Evidence: [case study details, metrics]"
5. Generated sections cite real company data as proof points

### Error States

- AI extraction fails → Toast error, no entries created, can retry
- No products/evidence → Empty states with clear CTAs
- Verification toggle fails → Toast error, revert toggle
- Delete with confirmation dialog (same pattern as compliance board)

## 4. Technical Implementation Guide

### Dependencies

No new dependencies needed. Uses existing: `sonner` (toasts), `lucide-react` (icons), `useAuthFetch` hook, Supabase client.

### Files to Create

```
src/app/api/settings/products/route.ts             # Products CRUD
src/app/api/evidence/route.ts                       # Evidence CRUD (incl. verify via PATCH)
src/app/api/evidence/extract/route.ts               # AI evidence extraction
src/lib/ai/prompts/extract-evidence.ts              # Extraction prompt + parser
src/app/(dashboard)/evidence-library/page.tsx        # Evidence library page
src/lib/ai/__tests__/company-truth-api.test.ts      # Products API tests
src/lib/ai/__tests__/evidence-api.test.ts           # Evidence API + verification tests
src/lib/ai/__tests__/extract-evidence.test.ts       # Extraction tests
```

### Files to Modify

```
src/app/(dashboard)/settings/company/page.tsx       # Add Products & Services tab
src/components/layout/sidebar.tsx                    # Add Evidence Library nav item
```

### Existing Types (no changes needed)

```typescript
// src/types/idd.ts — already defined
interface ProductContext { ... }
interface ProductCapability { ... }
interface EvidenceLibraryEntry { ... }
interface EvidenceMetric { ... }
interface OutcomeDemonstrated { ... }
type OutcomeCategory = "cost_optimization" | "speed_to_value" | "quality_improvement" | "risk_reduction" | "innovation" | "compliance";
```

### Extraction Prompt Structure

```
You are analyzing a company document to extract evidence of capabilities, results, and achievements.

Document content:
<document>{documentText}</document>

Extract every piece of evidence from this document. Evidence includes:
- Case studies (client engagements with outcomes)
- Metrics (quantitative results, statistics)
- Testimonials (client quotes, endorsements)
- Certifications (professional certifications, compliance)
- Awards (industry recognition, rankings)

For each evidence entry, return:
- evidence_type: "case_study" | "metric" | "testimonial" | "certification" | "award"
- title: Short descriptive title
- summary: 1-2 sentence summary
- full_content: Complete details
- client_industry: Industry if applicable (or null)
- service_line: Service area if applicable (or null)
- metrics: Array of {name, value, context} for quantitative results
- outcomes_demonstrated: Array of {outcome, description} where outcome is one of: cost_optimization, speed_to_value, quality_improvement, risk_reduction, innovation, compliance

Return ONLY a JSON array. No markdown, no explanation.
```

## 5. Decisions Summary

| Decision                 | Choice                                             | Rationale                                                          |
| ------------------------ | -------------------------------------------------- | ------------------------------------------------------------------ |
| Products UI location     | New tab on /settings/company                       | Keeps all company data together, consistent with existing patterns |
| Capabilities UX          | Inline expandable rows                             | Compact, no modal context switching, direct editing                |
| Evidence UI location     | Dedicated sidebar item                             | First-class feature, not buried in settings                        |
| Evidence layout          | Card grid grouped by type                          | Visual, scannable, clear organization                              |
| Evidence filters         | Freeform with org suggestions                      | Flexible but guided, doesn't lock users into predefined values     |
| Verification             | Inline toggle                                      | Simple, fast, no workflow overhead                                 |
| AI extraction sources    | Existing org docs only (flat list)                 | Reuses KB upload, no second upload pipeline                        |
| Extracted evidence state | Unverified by default                              | Human review before pipeline inclusion                             |
| MVP product fields       | Name, service_line, description, capabilities only | Skip specs/constraints/pricing for now                             |
| No new migrations        | Tables already exist                               | Zero schema changes needed                                         |

## 6. MVP Scope

### Included

- Products & Services CRUD tab with inline capabilities
- Evidence Library page with card grid, grouped by type
- Filters by type, industry, service line, verified status
- Inline verification toggle
- Manual add/edit/delete for evidence
- AI evidence extraction from existing docs + uploaded docs
- Sidebar nav item for Evidence Library
- API routes for both products and evidence
- Full test coverage (6 test categories per phase)

### Excluded

- Product specifications, constraints, pricing models (future enhancement)
- Evidence usage analytics (`times_used` tracking dashboard)
- Bulk import from spreadsheet
- Evidence AI auto-verification (human verification only)
- Cross-org evidence sharing
- Evidence version history
- Lock/unlock governance workflow

## 7. Risks

| Risk                                         | Mitigation                                        |
| -------------------------------------------- | ------------------------------------------------- |
| AI extracts low-quality evidence             | Unverified by default — user reviews              |
| Large documents exceed context window        | Reuse MAX_DOCUMENT_CHARS=500K truncation          |
| Too many evidence entries slow pipeline      | fetchL1Context already limits to 10               |
| Evidence cards render slowly with 100+ items | Group sections collapse, lazy rendering if needed |
| Duplicate evidence from re-extraction        | Show warning, let user decide                     |

## 8. Named Personnel (New — from Realism Enhancements)

New `team_members` table for L1. Required for government proposals where named key personnel are mandatory.

```sql
team_members (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  skills JSONB,            -- Extracted qualifications
  certifications JSONB,    -- e.g., ["CCIE", "PMP", "CISSP"]
  project_history JSONB,   -- Past performances with dates, scope, results
  resume_document_id UUID, -- FK to documents table (uploaded resume)
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**UI:** New "Team Members" tab on `/settings/company` alongside Products & Services. Upload resume PDF -> AI extracts structured data -> user verifies.

**Pipeline integration:** `fetchL1Context()` extended to query `team_members` filtered by role/certifications matching RFP requirements. `buildL1ContextString()` formats as `## Our Team` section in L1 prompt context.

See `.intent/realism-enhancements.intent.md` Section 2.1.B for full design.

## 9. Open Items

- [ ] Decide if evidence should track `source_document_id` for provenance
- [ ] Consider evidence "tagging" beyond industry/service_line
- [ ] Determine if pipeline should prefer recently-verified evidence
- [ ] Design resume extraction prompt for team_members AI ingestion
