# Bulk Import: AI-Powered L1 + L2 Onboarding Pipeline

## 1. Overview

**Product positioning:** Core onboarding feature for IntentBid — the fastest path from "new account" to "ready to generate proposals."

**Core concept:** Upload up to 20 files at once. AI extracts structured L1 context (company facts, products, evidence) and simultaneously stores the files as L2 reference documents for RAG retrieval. User reviews extracted items before saving.

**Priority:** High — this eliminates the biggest friction point in new account setup.

**Target user:** Admin users setting up their organization's knowledge base for the first time, or adding new reference material later.

**Project scope:** New UI on Knowledge Base page + new API route for bulk extraction + review/approval flow.

## 2. Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────┐
│              Knowledge Base Page                         │
│                                                          │
│  [Upload Documents]  [Search]  [Bulk Import ★NEW]       │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │         Bulk Import Modal / Panel                  │  │
│  │                                                    │  │
│  │  Step 1: Drop Zone (up to 20 files)                │  │
│  │  Step 2: Processing (progress per file)            │  │
│  │  Step 3: Review extracted L1 items                 │  │
│  │  Step 4: Summary + links                           │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌─────────────────┐          ┌─────────────────────┐
│  POST /api/     │          │  POST /api/         │
│  documents/     │          │  bulk-import/       │
│  upload         │          │  extract            │
│  (existing)     │          │  (★NEW)             │
│                 │          │                     │
│  Stores file,   │          │  Sends file content │
│  chunks, embeds │          │  to Gemini for L1   │
│  as L2 content  │          │  extraction         │
└─────────────────┘          └─────────────────────┘
                                      │
                                      ▼
                             ┌─────────────────┐
                             │  Gemini 2.5 Pro  │
                             │                  │
                             │  Structured JSON │
                             │  extraction:     │
                             │  - company_context│
                             │  - products      │
                             │  - evidence      │
                             └─────────────────┘
                                      │
                                      ▼
                             ┌─────────────────┐
                             │  POST /api/      │
                             │  bulk-import/    │
                             │  commit          │
                             │  (★NEW)          │
                             │                  │
                             │  Writes approved │
                             │  items to L1     │
                             │  tables          │
                             └─────────────────┘
```

### Data Flow

```
Files dropped
    │
    ├─── Each file → existing upload pipeline (L2)
    │    └── document → chunks → embeddings
    │
    └─── Each file content → Gemini extraction (L1)
         └── structured JSON → review UI → approved items → DB
```

### Processing Pipeline (Parallel, 3 files at a time)

```
File Queue: [f1, f2, f3, f4, f5, f6, ...]
                │
         ┌──────┼──────┐
         ▼      ▼      ▼
      Worker  Worker  Worker
      (f1)    (f2)    (f3)
         │      │      │
         └──────┼──────┘
                ▼
         f4 starts when f1 finishes
         (sliding window of 3 concurrent, CONCURRENT_LIMIT = 3)
```

Each worker processes sequentially: L2 upload first, then L1 extraction.
This avoids dual-path state management while maintaining parallelism across files.

## 3. Detailed Behavior

### 3.1 File Upload

- **Accepted types:** .md, .pdf, .docx, .pptx, .txt
- **Max files:** 20 per batch
- **Max file size:** Existing per-file limit (inherited from current upload)
- **Drag-and-drop + file picker**

### 3.2 Sequential Processing Per File (L2 then L1)

Each file is processed in two sequential steps (simplified from dual-path per critique):

**Step 1 — L2 Storage (existing pipeline):**

1. Upload file to Supabase Storage
2. Parse content (existing parsers for PDF/DOCX/PPTX/MD)
3. Chunk text, generate embeddings via Voyage AI
4. Store in `documents` + `document_chunks`
5. Return parsed text content for L1 extraction

**Step 2 — L1 Extraction (new):**

1. Send parsed text to Gemini with structured extraction prompt
2. Gemini returns JSON array of extracted items with categories
3. Items collected in memory for review step

Files are parallelized 3 at a time (CONCURRENT_LIMIT = 3), but each file completes L2 before starting L1.

### 3.3 AI Extraction Prompt Strategy

The Gemini prompt should:

- Accept the full text of a document
- Return structured JSON matching our L1 schema
- Categorize each extracted item into one of:
  - `company_context` (with category: brand | values | certifications | legal | partnerships)
  - `product_context` (with service_line, capabilities, etc.)
  - `evidence_library` (with evidence_type: case_study | metric | testimonial | certification | award)

**Extraction prompt output schema:**

```typescript
interface ExtractionResult {
  company_context: Array<{
    category: "brand" | "values" | "certifications" | "legal" | "partnerships";
    key: string; // unique identifier like "employee-count" or "cmmc-level-2"
    title: string; // human-readable title
    content: string; // the actual content/fact
  }>;
  product_contexts: Array<{
    product_name: string;
    service_line: string;
    description: string;
    capabilities: Array<{ name: string; description: string }>;
  }>;
  evidence_library: Array<{
    evidence_type:
      | "case_study"
      | "metric"
      | "testimonial"
      | "certification"
      | "award";
    title: string;
    summary: string;
    full_content: string;
    client_industry?: string;
    service_line?: string;
    metrics?: Array<{ name: string; value: string; context: string }>;
  }>;
}
```

### 3.4 Conflict Detection

Before showing the review screen, compare extracted items against existing L1 data:

- **company_context:** Match on `(category, key)` — if exists, mark as conflict
- **product_contexts:** Match on `(product_name, service_line)` — if exists, mark as conflict
- **evidence_library:** Match on `title` — if exists, mark as conflict

**Conflict display in review:**

- Show existing value alongside extracted value
- Default selection: **keep existing** (L1 precedence)
- User can toggle to "use new" per item

### 3.5 Review Screen

```
┌─────────────────────────────────────────────────────┐
│  Bulk Import Review                                  │
│                                                      │
│  Extracted from 12 files:                            │
│                                                      │
│  ┌─ Company Context (25 items) ─────────────────┐   │
│  │ ✓ Brand: Company Overview          [new]      │   │
│  │ ✓ Brand: Employee Count            [new]      │   │
│  │ ⚠ Certs: CMMC Level 2             [conflict] │   │
│  │   Existing: "CMMC Level 2 certified"          │   │
│  │   New: "CMMC Level 2 (renewed 2025)"          │   │
│  │   ○ Keep existing  ● Use new                  │   │
│  │ ✓ Values: Core Mission             [new]      │   │
│  │ ...                                            │   │
│  └───────────────────────────────────────────────┘   │
│                                                      │
│  ┌─ Products (6 items) ─────────────────────────┐   │
│  │ ✓ Cloud Migration Services          [new]     │   │
│  │ ...                                            │   │
│  └───────────────────────────────────────────────┘   │
│                                                      │
│  ┌─ Evidence (8 items) ─────────────────────────┐   │
│  │ ✓ Case Study: DoD Network Migration  [new]    │   │
│  │ ...                                            │   │
│  └───────────────────────────────────────────────┘   │
│                                                      │
│  [Accept All (39 items)]  [Accept Selected]  [Cancel]│
└─────────────────────────────────────────────────────┘
```

- Each item has a checkbox (pre-checked for new, unchecked for conflicts where existing wins)
- Conflicts show existing value in a nested panel; checking the box = use new value
- Single "Accept N Items" button saves all checked items
- "Select All" / "Deselect All" toggles at the top

### 3.6 Commit (Save to Database)

POST `/api/bulk-import/commit` receives the approved items and:

1. Upserts `company_context` rows (onConflict: category, key)
2. Upserts `product_contexts` rows (onConflict: product_name, service_line)
3. Inserts `evidence_library` rows (or upserts on title if replacing)
4. All scoped to the user's `organization_id`

### 3.7 Post-Import Summary

```
┌─────────────────────────────────────────────────────┐
│                   ✓ (green check)                    │
│               Import Complete                        │
│         N items imported to your Knowledge Base       │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ Building │  │ Package  │  │  Award   │           │
│  │    25    │  │    6     │  │    8     │           │
│  │ Company  │  │ Products │  │ Evidence │           │
│  │  Facts   │  │          │  │          │           │
│  └──────────┘  └──────────┘  └──────────┘           │
│                                                      │
│  [View L1 Sources →]                                 │
│  [Done]                                              │
└─────────────────────────────────────────────────────┘
```

Note: L2 document counts are not shown in the summary (files are uploaded but count comes from the existing upload pipeline, not tracked separately in the bulk import flow).

### 3.8 Error Handling

| Scenario                              | Behavior                                               |
| ------------------------------------- | ------------------------------------------------------ |
| File parse fails                      | Show error badge on that file, continue others         |
| Gemini extraction fails for a file    | Show warning, file still stored as L2, no L1 extracted |
| Gemini returns invalid JSON           | Retry once, then mark as extraction failed             |
| Network error mid-batch               | Pause, show retry button for remaining files           |
| User navigates away during processing | Warn with "Processing in progress, are you sure?"      |

## 4. User Experience

### Flow

```
User clicks "Bulk Import" on Knowledge Base page
    ↓
Drop zone appears (modal or panel)
    ↓
User drops/selects up to 20 files
    ↓
Click "Import" → processing begins
    ↓
Progress UI: per-file status (uploading → parsing → extracting → done)
    ↓
All files done → Review screen appears
    ↓
User reviews extracted items (accept/reject, resolve conflicts)
    ↓
Click "Accept" → items saved to database
    ↓
Summary screen with links
```

### Progress States Per File

| State      | Display                         |
| ---------- | ------------------------------- |
| Pending    | Clock icon, filename            |
| Uploading  | Blue spinner, "Uploading..."    |
| Extracting | Accent spinner, "Extracting..." |
| Done       | Green check, "Done"             |
| Failed     | Red alert icon, error message   |

## 5. Technical Implementation Guide

### New Files

```
src/
├── app/
│   └── api/
│       └── bulk-import/
│           ├── extract/route.ts    # POST - extract L1 from file content
│           └── commit/route.ts     # POST - save approved items to DB
├── components/
│   └── knowledge-base/
│       ├── bulk-import-button.tsx  # Client wrapper (manages modal state)
│       ├── bulk-import-modal.tsx   # Main modal component (4-step wizard)
│       ├── bulk-import-review.tsx  # Review/approval screen (collapsible sections)
│       └── bulk-import-summary.tsx # Post-import summary (counts + nav)
└── lib/
    └── ai/
        └── l1-extractor.ts        # Gemini prompt + response parsing
```

### Modified Files

```
src/app/(dashboard)/knowledge-base/page.tsx  # Add "Bulk Import" button
```

### Key Implementation Details

**l1-extractor.ts:**

- Exports: `extractL1FromText(text, fileName)`, `parseExtractionResponse(raw)`, `buildL1ExtractionPrompt(text, fileName)`
- Exports constants: `VALID_COMPANY_CATEGORIES`, `VALID_EVIDENCE_TYPES` (used by commit route for validation)
- Exports types: `ExtractionResult`, `ExtractionResponse`, `CompanyContextItem`, `ProductContextItem`, `EvidenceItem`
- Truncates documents to `MAX_DOCUMENT_CHARS = 100_000` characters
- Calls `generateText(prompt, { temperature: 0.2, maxTokens: 8192 })`
- Parses JSON from code fences or raw text via `extractJsonFromText()`
- Validates each item's fields and category/type enums
- Deduplicates by `(category, key)`, `(product_name, service_line)`, and `(title)`
- Returns `{ data: ExtractionResult, error: string | null }`

**extract/route.ts:**

- Accepts: `{ content: string, fileName: string }`
- Auth: `getUserContext(request)` — requires valid session + organizationId
- DB: `createAdminClient()` (service-role, bypasses RLS) to fetch existing L1 data
- Calls `extractL1FromText()` then adds `isConflict` and `existingValue` flags per item
- Returns: `{ company_context: [...], product_contexts: [...], evidence_library: [...] }`

**commit/route.ts:**

- Accepts: `{ company_context: [...], product_contexts: [...], evidence_library: [...] }`
- Auth: `getUserContext(request)` — requires valid session + organizationId
- Validates all items: required fields + category/type against exported constants
- DB: `createAdminClient()` for upserts
- Upsert conflict keys: `category,key,organization_id` / `product_name,service_line,organization_id` / `title,organization_id`
- Returns: `{ counts: { company_context: N, product_contexts: N, evidence_library: N } }`

**bulk-import-button.tsx:**

- Client component wrapper imported by server-rendered Knowledge Base page
- Manages modal open/close state, calls `router.refresh()` on completion

**bulk-import-modal.tsx:**

- Multi-step wizard: Upload → Processing → Review → Summary
- Uses `react-dropzone` with `ACCEPTED_TYPES` map and `MAX_FILES = 20`
- Uses `useAuthFetch` hook for authenticated API calls
- Sliding window: processes `CONCURRENT_LIMIT = 3` files concurrently
- Per file: L2 upload via `/api/documents/upload` → L1 extract via `/api/bulk-import/extract`
- Cross-file deduplication via `mergeExtractedItems()` before review step
- Strips `isConflict`/`existingValue` from items before sending to commit endpoint
- Toast notifications via `sonner`

**bulk-import-review.tsx:**

- Exports types: `ExtractedItems`, `ExtractedCompanyContext`, `ExtractedProduct`, `ExtractedEvidence`
- Per-item checkboxes with `Set<string>` state per category
- Collapsible sections with Lucide chevron icons
- Select All / Deselect All toggles
- Conflict items show existing value in nested panel
- Non-conflict items pre-checked; conflict items unchecked by default

**bulk-import-summary.tsx:**

- Exports type: `ImportCounts`
- Shows per-category counts with icons (Building2, Package, Award)
- "View L1 Sources" navigation link
- "Done" button triggers modal close + page refresh

## 6. Decisions Summary

| Decision            | Choice                           | Rationale                                |
| ------------------- | -------------------------------- | ---------------------------------------- |
| Entry point         | Knowledge Base page              | User goes there to manage content anyway |
| File types          | MD, PDF, DOCX, PPTX, TXT         | Reuse existing parsers + plain text      |
| Dual processing     | L1 extract + L2 store            | Upload once, maximize value              |
| Concurrency         | 3 parallel (CONCURRENT_LIMIT)    | Balance speed vs API cost                |
| Conflict handling   | Per-item in review               | Most transparent, no separate mode       |
| Default on conflict | Keep existing L1                 | Existing data is verified/trusted        |
| Review granularity  | Preview + accept/reject per item | Control without editing overhead         |
| Batch limit         | 20 files                         | Keeps processing under a few minutes     |
| Post-import         | Summary with links               | Clear next steps                         |

## 7. MVP Scope

### Included

- Multi-file drag-and-drop upload (up to 20)
- Parallel processing with progress UI
- Gemini-powered L1 extraction to structured JSON
- Simultaneous L2 storage (existing pipeline)
- Review screen with accept/reject per item
- Conflict detection with existing L1 data
- Per-item conflict resolution (keep existing vs use new)
- Bulk commit to database
- Summary screen with counts and links

### Excluded (Future)

- Inline editing of extracted items before saving
- Scheduled/recurring re-extraction
- AI confidence scores per extracted item
- Export extraction results
- Undo/rollback of bulk import
- Admin UI for waitlist management (separate feature)
- Notification email when extraction completes

## 8. Risks

| Risk                                     | Likelihood | Impact | Mitigation                                                                 |
| ---------------------------------------- | ---------- | ------ | -------------------------------------------------------------------------- |
| Gemini returns poorly structured data    | Medium     | High   | Strong prompt engineering, JSON schema validation, retry on failure        |
| Large files exceed Gemini context window | Low        | Medium | Truncate to first 100K characters, note in review                          |
| Slow processing for 20 files             | Medium     | Low    | Progress UI manages expectations, parallel processing                      |
| Extraction duplicates across files       | Medium     | Medium | Deduplicate by key before review step                                      |
| User drops browser tab during processing | Low        | Medium | L2 uploads still complete, L1 extraction results lost — user can re-import |

## 9. Open Items

None — all decisions resolved during interview.

## 10. Finalized Implementation Details

> [!SYNCED] Last synced: 2026-02-12 from commit 777d1bc

### API Interfaces

| Endpoint                   | Method | Request Body                                                                   | Response                                                                       | Auth               |
| -------------------------- | ------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ------------------ |
| `/api/bulk-import/extract` | POST   | `{ content: string, fileName: string }`                                        | `{ company_context: [...], product_contexts: [...], evidence_library: [...] }` | `getUserContext()` |
| `/api/bulk-import/commit`  | POST   | `{ company_context: [...], product_contexts: [...], evidence_library: [...] }` | `{ counts: { company_context: N, product_contexts: N, evidence_library: N } }` | `getUserContext()` |

### Key Types (from `src/lib/ai/l1-extractor.ts`)

```typescript
export interface CompanyContextItem {
  category: "brand" | "values" | "certifications" | "legal" | "partnerships";
  key: string;
  title: string;
  content: string;
}

export interface ProductContextItem {
  product_name: string;
  service_line: string;
  description: string;
  capabilities: Array<{ name: string; description: string }>;
}

export interface EvidenceItem {
  evidence_type:
    | "case_study"
    | "metric"
    | "testimonial"
    | "certification"
    | "award";
  title: string;
  summary: string;
  full_content: string;
  client_industry?: string;
  service_line?: string;
  metrics?: Array<{ name: string; value: string; context: string }>;
}

export interface ExtractionResult {
  company_context: CompanyContextItem[];
  product_contexts: ProductContextItem[];
  evidence_library: EvidenceItem[];
}

export interface ExtractionResponse {
  data: ExtractionResult;
  error: string | null;
}
```

### UI Types (from `src/components/knowledge-base/bulk-import-review.tsx`)

```typescript
// Extended versions with conflict metadata (returned by extract endpoint)
export interface ExtractedCompanyContext extends CompanyContextItem {
  isConflict: boolean;
  existingValue?: { title: string; content: string };
}

export interface ExtractedProduct extends ProductContextItem {
  isConflict: boolean;
  existingValue?: { description: string };
}

export interface ExtractedEvidence extends EvidenceItem {
  isConflict: boolean;
  existingValue?: { summary: string };
}

export interface ExtractedItems {
  company_context: ExtractedCompanyContext[];
  product_contexts: ExtractedProduct[];
  evidence_library: ExtractedEvidence[];
}

export interface ImportCounts {
  company_context: number;
  product_contexts: number;
  evidence_library: number;
}
```

### DB Upsert Conflict Keys

| Table              | Conflict Columns                              |
| ------------------ | --------------------------------------------- |
| `company_context`  | `category, key, organization_id`              |
| `product_contexts` | `product_name, service_line, organization_id` |
| `evidence_library` | `title, organization_id`                      |

### Auth & DB Access Pattern

- Routes use `getUserContext(request)` from `@/lib/supabase/auth-api` for authentication
- Routes use `createAdminClient()` from `@/lib/supabase/admin` (service-role) to bypass RLS for server-side operations
- All DB writes include `organization_id` for multi-tenant isolation

### AI Configuration

- Model: Gemini (via `generateText()` from `@/lib/ai/claude.ts`)
- Temperature: 0.2 (low for structured extraction)
- Max tokens: 8,192
- Document truncation: 100,000 characters

### Dependencies

- `react-dropzone` — file drag-and-drop
- `sonner` — toast notifications
- `lucide-react` — icons (Layers, Building2, Package, Award, etc.)
- `useAuthFetch` hook — authenticated API calls with Supabase session tokens

### Test Coverage

- `src/lib/ai/__tests__/l1-extractor.test.ts` — 38 tests (extractor module)
- `src/lib/ai/__tests__/bulk-import-api.test.ts` — 44 tests (API routes)
- Total: 82 tests across 6 categories (happy path, bad path, edge cases, security, data leak, data damage)
