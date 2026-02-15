# Bulk Import: Upload files, AI populates your company profile

## One sentence
Upload up to 20 files at once — AI extracts structured company facts (L1) while also storing the files as searchable reference documents (L2).

## Why?
Setting up a new account requires manually entering company context, products, and evidence one-by-one in Settings. This is tedious and error-prone. Most companies already have this information in existing documents (capability statements, case studies, certifications). Bulk Import turns "hours of data entry" into "drop files, review, done."

## Core experience

```
Drop 12 files ──→ AI processes (parallel) ──→ Review extracted items ──→ Accept ──→ Done
                        │                            │
                        ├── L2: chunk + embed         ├── Conflicts shown
                        └── L1: extract facts         └── Existing L1 wins by default
```

## Architecture

```
Knowledge Base Page
    │
    ├── "Bulk Import" button
    │
    ▼
Bulk Import Modal (4 steps)
    │
    ├── Step 1: Drop zone (≤20 files, MD/PDF/DOCX/PPTX)
    ├── Step 2: Parallel processing (3-4 concurrent)
    │   ├── L2 path: upload → parse → chunk → embed (existing)
    │   └── L1 path: parse → Gemini extract → structured JSON (new)
    ├── Step 3: Review (accept/reject per item, resolve conflicts)
    └── Step 4: Summary + links to Settings / KB
```

## Key decisions

| Question | Choice | Why |
|----------|--------|-----|
| Where? | Knowledge Base page | Users go there for content management |
| File types? | All supported (MD/PDF/DOCX/PPTX) | Reuse existing parsers |
| L1 + L2? | Both | Upload once, maximum value |
| Conflicts? | Per-item in review, existing wins default | Transparent, no hidden modes |
| Concurrency? | 3-4 parallel | Speed vs API cost balance |
| Batch limit? | 20 files | Processing stays under a few minutes |
| Review depth? | Preview + accept/reject | Control without editing overhead |

## Scope

**In:** Multi-file upload, AI extraction, dual L1+L2 processing, review UI, conflict resolution, summary
**Out:** Inline editing, confidence scores, undo/rollback, scheduled re-extraction

## Risk + Mitigation

| Risk | Mitigation |
|------|------------|
| Poor AI extraction | Strong prompt engineering + JSON schema validation + retry |
| Slow for 20 files | Parallel processing + progress UI |
| Duplicates across files | Deduplicate by key before review |

## Next steps
1. `/intent-critique` — check for over-engineering
2. `/intent-plan` — generate phased TDD execution plan
3. `/intent-build-now` — implement
