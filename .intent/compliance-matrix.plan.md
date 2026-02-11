# Execution Plan: Compliance Matrix

## Overview

Build the L0 Requirements Truth layer of the IMF: AI extraction of client requirements from uploaded documents, a visual drag-and-drop compliance kanban board, auto-mapping to proposal sections, and a soft export gate. This makes IntentWin's proposal process auditable and requirement-traceable.

## Prerequisites

- IMF Phase 1 (Persuasion Engine) complete (commits 24b797d..0b16641) ✓
- Supabase connected with RLS policies working ✓
- Gemini integration via generateText() working ✓
- vitest configured and passing (78 tests) ✓
- @dnd-kit/core needs to be installed (Phase 2)

---

## Phase 0: Database Schema + API Routes

### Description

Create the `proposal_requirements` table with RLS, build the CRUD API routes, and write tests. This is the data foundation — no UI, no AI, just clean data access.

**Deliverables:**

- Supabase migration creating `proposal_requirements` table
- API routes: GET, POST, PATCH, DELETE for requirements
- Full test coverage of API logic

**Files to create:**

- `supabase/migrations/00020_create_compliance_matrix.sql`
- `src/app/api/proposals/[id]/requirements/route.ts`
- `src/lib/ai/__tests__/compliance-api.test.ts`

### Tests

#### Happy Path

- [x] GET `/api/proposals/[id]/requirements` returns empty array for new proposal
- [x] POST creates a requirement with all fields (text, category, source_reference)
- [x] POST auto-defaults `compliance_status` to `not_addressed`
- [x] POST auto-defaults `category` to `desirable`
- [x] GET returns created requirements sorted by category priority (mandatory first) then created_at
- [x] PATCH updates compliance_status (e.g., `not_addressed` → `met`)
- [x] PATCH batch updates multiple requirements in one call
- [x] DELETE removes a requirement by ID

#### Bad Path

- [x] POST with empty requirement_text returns 400
- [x] POST with invalid category value returns 400
- [x] PATCH with invalid compliance_status returns 400
- [x] DELETE with non-existent requirement ID returns 404
- [x] GET for non-existent proposal returns 404
- [x] PATCH with non-array updates returns 400
- [x] PATCH with update missing id returns 400

#### Edge Cases

- [x] POST requirement_text with 10,000+ characters succeeds (TEXT column, no limit)
- [x] PATCH batch update with empty array returns 200 (no-op)
- [x] GET with proposal that has 100+ requirements returns all correctly
- [x] POST trims whitespace from requirement_text

#### Security

- [x] API validates user belongs to proposal's organization (RLS)
- [x] Cannot access requirements from another org's proposal
- [x] SQL injection in requirement_text is prevented (parameterized queries)
- [x] Queries filter by organization_id (RLS supplement)

#### Data Leak

- [x] Error responses don't expose database schema details
- [x] 404 response doesn't reveal whether the proposal exists in another org
- [x] API response doesn't include organization_id (internal field)

#### Data Damage

- [x] Creating requirement with invalid proposal_id doesn't create orphan rows
- [x] Failed insert returns error without leaving partial data
- [x] PATCH update failure returns error without modifying other requirements

### E2E Gate

```bash
cd /Users/robroyhobbs/projects/capgemini-proposal-generator

# Run migration (verify SQL is valid)
npx supabase db push --dry-run 2>&1 | head -5

# Run API tests
npx vitest run src/lib/ai/__tests__/compliance-api.test.ts

# TypeScript compiles
npx tsc --noEmit
```

### Acceptance Criteria

- [x] Migration file creates table with all columns, constraints, RLS policy, and index
- [x] GET/POST/PATCH/DELETE routes implemented and tested
- [x] All 6 test categories pass (33 tests)
- [x] TypeScript compiles clean

---

## Phase 1: AI Requirements Extraction

### Description

Build the extraction prompt and API endpoint that takes a proposal's uploaded documents, sends them to Gemini, and parses the structured JSON response into `proposal_requirements` rows. Pure backend — no UI.

**Deliverables:**

- Extraction prompt builder
- `/api/proposals/[id]/requirements/extract` endpoint
- Unit tests for prompt + parsing logic

**Files to create:**

- `src/lib/ai/prompts/extract-requirements.ts`
- `src/app/api/proposals/[id]/requirements/extract/route.ts`
- `src/lib/ai/__tests__/extract-requirements.test.ts`

### Tests

#### Happy Path

- [x] `buildRequirementsExtractionPrompt(docText)` returns prompt with document content embedded
- [x] Prompt includes all 10 section types for suggested_sections
- [x] Parsing valid JSON array response returns typed RequirementExtraction[]
- [x] Each parsed requirement has: requirement_text, source_reference, category, suggested_sections
- [x] Extraction endpoint fetches proposal's documents, extracts text, calls generateText
- [x] Response includes count and extracted requirements
- [x] Calls generateText with low temperature (0.2) for structured extraction

#### Bad Path

- [x] Empty document text still produces a valid prompt
- [x] AI returns malformed JSON — parser falls back gracefully (empty array, logs warning)
- [x] AI returns JSON wrapped in markdown code block — parser strips wrapper
- [x] AI returns requirements with invalid category — defaults to "desirable"
- [x] AI returns requirements with invalid suggested_sections — filters to valid types only
- [x] Proposal with no uploaded documents returns 400 "No documents to extract from"
- [x] generateText throws — endpoint returns 500 with safe error message
- [x] Documents with no extractable content returns 400

#### Edge Cases

- [x] Very large document (500K+ chars) — prompt truncates to fit context window
- [x] Document with no clear requirements — AI returns empty array, endpoint returns empty
- [x] Multiple documents per proposal — all documents concatenated for extraction
- [x] parseExtractionResponse handles empty string
- [x] parseExtractionResponse handles code fence without json label

#### Security

- [x] Document text in prompt is wrapped in structured tags (prevents injection)
- [x] Extraction endpoint validates user owns the proposal
- [x] Unauthenticated request returns 401

#### Data Leak

- [x] Extraction prompt doesn't include org settings or brand voice
- [x] Error responses don't include raw AI response text
- [x] Prompt categories are the only valid values (no custom/internal labels)

#### Data Damage

- [x] Failed AI response does not delete existing requirements
- [x] Re-extraction deletes only previously-extracted requirements (preserve manual ones)
- [x] Empty AI response does not insert any rows

### E2E Gate

```bash
cd /Users/robroyhobbs/projects/capgemini-proposal-generator

# Run extraction tests
npx vitest run src/lib/ai/__tests__/extract-requirements.test.ts

# Run all tests (no regressions)
npx vitest run

# TypeScript compiles
npx tsc --noEmit
```

### Acceptance Criteria

- [x] Extraction prompt produces well-structured output
- [x] JSON parsing handles all Gemini response formats (raw, code-fenced, partial)
- [x] Re-extraction is idempotent (preserves manual requirements)
- [x] All 6 test categories pass (32 tests)
- [x] TypeScript compiles clean

---

## Phase 2: Compliance Kanban Board

### Description

Build the drag-and-drop kanban board UI component with @dnd-kit/core. Four columns (Met, Partially Met, Not Addressed, N/A), requirement cards with category badges, compliance score header, and "Add Requirement" form. Integrate as a tab on the proposal view page.

**Deliverables:**

- @dnd-kit/core installed
- ComplianceBoard component (board + header + cards)
- Compliance tab on proposal view page
- Manual add/edit/delete UI

**Files to create:**

- `src/components/compliance/compliance-board.tsx`

**Files to modify:**

- `src/app/(dashboard)/proposals/[id]/page.tsx` (add Compliance tab)
- `package.json` (add @dnd-kit/core)

### Tests

#### Happy Path

- [ ] Board renders 4 columns with correct headers (Met, Partially Met, Not Addressed, N/A)
- [ ] Requirements are distributed into correct columns based on compliance_status
- [ ] Cards show requirement text (truncated to ~80 chars), category badge, mapped section name
- [ ] Category badges use correct colors (mandatory=red, desirable=yellow, informational=blue)
- [ ] Compliance score header shows correct count and percentage (e.g., "5/10 Met — 50%")
- [ ] Header shows mandatory gaps count
- [ ] Dragging a card to a different column updates compliance_status via API
- [ ] "Add Requirement" button opens inline form
- [ ] Adding a requirement via form creates it and refreshes the board
- [ ] Clicking a card expands to show full text, notes field, section mapping dropdown
- [ ] "Address" button on unaddressed cards is visible

#### Bad Path

- [ ] Board with no requirements shows empty state: "No requirements found"
- [ ] API error during drag-and-drop shows error toast and reverts card position
- [ ] API error during "Add" shows error toast and preserves form data
- [ ] Adding requirement with empty text shows validation error
- [ ] Network timeout during status update shows retry option

#### Edge Cases

- [ ] Board with 50+ requirements renders without performance issues
- [ ] Very long requirement text truncates cleanly with ellipsis
- [ ] All requirements in one column (e.g., all "Not Addressed") renders correctly
- [ ] Rapid successive drags don't cause race conditions
- [ ] Cards ordered by category priority (mandatory first) within each column

#### Security

- [ ] Board only shows requirements for the current user's organization
- [ ] "Add Requirement" sanitizes input before sending to API
- [ ] Card expansion doesn't render unescaped HTML in requirement text

#### Data Leak

- [ ] Board doesn't display organization_id or internal IDs in the DOM
- [ ] Console logs don't include full requirement data in production

#### Data Damage

- [ ] Deleting a requirement from the board shows confirmation dialog
- [ ] Drag-and-drop uses optimistic update with rollback on failure
- [ ] Editing notes saves via debounced API call (doesn't lose rapid edits)

### E2E Gate

```bash
cd /Users/robroyhobbs/projects/capgemini-proposal-generator

# Verify @dnd-kit installed
node -e "require('@dnd-kit/core')" && echo "OK"

# TypeScript compiles
npx tsc --noEmit

# All tests pass
npx vitest run

# Dev server starts without errors
timeout 15 bash -c 'npx next dev -p 3099 2>&1 | head -20' || true
```

### Acceptance Criteria

- [x] @dnd-kit/core installed and working
- [x] Kanban board renders with 4 columns and drag-and-drop
- [x] Cards show category badges, mapped section, truncated text
- [x] Compliance score header with count, percentage, mandatory gaps
- [x] Manual add/edit/delete working with confirmation dialog
- [x] Proposal view page has "Compliance" tab (Sections/Compliance toggle)
- [x] TypeScript compiles clean
- [x] All tests pass (143 total)

---

## Phase 3: Export Gate + Polish

### Description

Build the soft export gate modal that warns about unaddressed requirements on export. Implement the "Address Now" navigation flow (click Address → navigate to section editor). Polish the full integration: extraction trigger from document upload, toast notifications, empty states.

**Deliverables:**

- Export gate modal component
- "Address Now" navigation to section editor
- Extraction trigger wired to document upload completion
- Toast notifications for extraction
- End-to-end flow working

**Files to create:**

- `src/components/compliance/export-gate-modal.tsx`

**Files to modify:**

- `src/app/(dashboard)/proposals/[id]/page.tsx` (wire export gate + Address Now navigation)

### Tests

#### Happy Path

- [ ] Export gate modal appears when exporting with unaddressed requirements
- [ ] Modal lists unaddressed requirements grouped by category (mandatory first)
- [ ] Modal shows suggested section for each requirement
- [ ] "Export Anyway" proceeds with export normally
- [ ] "Cancel" closes modal without exporting
- [ ] "Address Now" navigates to compliance tab
- [ ] "Address" button on kanban card navigates to the mapped section in section editor
- [ ] Export with all requirements met/N/A skips the modal entirely
- [ ] Toast notification appears after extraction completes: "X requirements extracted"

#### Bad Path

- [ ] Export gate handles proposal with 0 requirements gracefully (no modal)
- [ ] "Address" on card with no mapped section shows "Select a section first" prompt
- [ ] Extraction fails silently — no toast, no blocking, extraction can be retried from compliance tab
- [ ] Export gate API call fails — falls through to export (fail-open, not fail-closed)

#### Edge Cases

- [ ] Modal with 20+ unaddressed requirements scrolls without breaking layout
- [ ] All requirements are "not_applicable" — no modal (N/A counts as addressed)
- [ ] Modal appears correctly for all export formats (DOCX, PDF, PPTX)
- [ ] "Address Now" preserves current export format state for when user returns

#### Security

- [ ] Export gate checks requirements for current proposal only (no cross-proposal leakage)
- [ ] "Address" navigation validates section belongs to current proposal

#### Data Leak

- [ ] Export gate modal doesn't include internal requirement IDs in DOM
- [ ] "Export Anyway" action doesn't log which requirements were skipped

#### Data Damage

- [ ] Export gate is read-only — doesn't modify any requirement data
- [ ] Rapid "Export Anyway" clicks don't trigger multiple exports
- [ ] "Address Now" → back to export doesn't duplicate the gate check

### E2E Gate

```bash
cd /Users/robroyhobbs/projects/capgemini-proposal-generator

# Full test suite
npx vitest run

# TypeScript compiles
npx tsc --noEmit

# Production build succeeds
npx next build

# Health check passes
curl -s http://localhost:3001/api/health | jq .status
```

### Acceptance Criteria

- [ ] Export gate modal shows unaddressed requirements on export
- [ ] "Export Anyway" / "Cancel" / "Address Now" all work correctly
- [ ] "Address" button on kanban navigates to section editor
- [ ] Extraction triggered from document upload with toast notification
- [ ] Full end-to-end flow works: upload → extract → generate → compliance tab → export gate
- [ ] All tests pass
- [ ] TypeScript compiles clean
- [ ] Production build succeeds

---

## Final E2E Verification

```bash
cd /Users/robroyhobbs/projects/capgemini-proposal-generator

# Full test suite
npx vitest run

# TypeScript compile
npx tsc --noEmit

# Production build
npx next build

# Dev server health
curl -s http://localhost:3001/api/health | jq .
```

## Risk Mitigation

| Risk                                                     | Mitigation                                        | Contingency                                                    |
| -------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| Gemini returns unparseable JSON                          | Parser handles code-fenced, partial, and raw JSON | Fall back to empty requirements with "extraction failed" toast |
| @dnd-kit conflicts with existing drag (react-dropzone)   | Different libraries, different purposes           | Replace with native HTML5 drag if conflicts arise              |
| Large document exceeds prompt size                       | Gemini 1M context window handles most docs        | Truncate with notice if >500K chars                            |
| RLS policy on new table conflicts with existing policies | Follow same pattern as proposal_sections table    | Test with demo account before committing                       |
| Proposal view page becomes too complex with new tab      | Tab replaces main content (not additive)          | Extract to separate route if needed                            |

## References

- [Intent Spec](./compliance-matrix.intent.md)
- [Overview](./compliance-matrix.overview.md)
- Pipeline: `src/lib/ai/pipeline.ts`
- Proposal view: `src/app/(dashboard)/proposals/[id]/page.tsx`
- Existing extraction: `src/components/intake/extraction-review.tsx`
