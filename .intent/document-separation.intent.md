# Document Type Separation Intent

> Prevent RFP and template documents from polluting evidence retrieval during proposal generation by filtering at query time and auto-tagging uploads from the intake flow.

## Responsibilities

- Exclude `document_type='rfp'` and `document_type='template'` from RAG retrieval during proposal generation
- Auto-tag documents uploaded during proposal intake as `document_type='rfp'`
- Preserve current behavior for Knowledge Base uploads (manual type picker unchanged)
- Keep RFP docs visible in Knowledge Base UI (no layout changes)

## Non-Goals

- Separate vector store or database tables for RFP documents
- AI auto-classification of document types
- Migration of existing documents
- Changes to Knowledge Base UI layout or search

## Structure

```
Upload during intake         Upload in Knowledge Base
        │                              │
        ▼                              ▼
  Auto-tag as 'rfp'           User picks type manually
        │                              │
        └──────────┬───────────────────┘
                   ▼
         Same vector store
         (document_chunks)
                   │
                   ▼
        retrieveContext() filters:
        EXCLUDE: rfp, template
        INCLUDE: proposal, case_study,
                 methodology, capability,
                 team_bio, other
```

## Constraints

1. `retrieveContext()` must pass document type exclusion filter to the RPC search functions
2. Intake extract route must set `document_type='rfp'` on documents it processes
3. No new database tables, migrations, or RPC functions — use existing `filter_document_type` parameter
4. Backward compatible — proposals generated before this change are unaffected
