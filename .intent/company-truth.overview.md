# Company Truth (IMF L1): Management UI for company evidence & capabilities

## One sentence

Build the admin UI so users can manage their products/services and evidence library, with AI-assisted extraction from documents.

## Why?

The IMF pipeline already fetches L1 data (products, evidence, company context) and injects it into proposal generation — but there's no UI to manage the data. Without it, the evidence tables are empty and proposals generate without proof points. This feature closes the loop.

## Core experience

```
Admin populates company data:

Settings → Products & Services tab
    → Add products with capabilities
    → Service line + outcomes per capability

Evidence Library (sidebar)
    → Browse cards grouped by type
    → Add manually or AI-extract from docs
    → Verify entries (only verified → proposals)
    → Filter by industry, service, status

AI Extraction:
    → Upload doc or select existing
    → AI extracts case studies, metrics, testimonials
    → Entries appear unverified
    → Admin reviews + verifies
```

## Architecture

```
┌─────────────────────────────────────────┐
│ /settings/company                       │
│ [Profile][Differentiators][Certs][Prods]│  ← New tab
│                                         │
│ Products CRUD + inline capabilities     │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│ product_contexts table (EXISTS)        │
│ ├── product_name, service_line         │
│ ├── capabilities[] (JSONB)             │
│ └── organization_id (RLS)             │
└────────────────┬───────────────────────┘
                 │
                 ├───────────► fetchL1Context() ──► buildL1ContextString()
                 │                                        │
┌────────────────┴───────────────────────┐                ▼
│ evidence_library table (EXISTS)        │        Proposal Generation
│ ├── evidence_type (5 types)            │        (pipeline.ts)
│ ├── is_verified (gate for pipeline)    │
│ ├── metrics[], outcomes[] (JSONB)      │
│ └── organization_id (RLS)             │
└────────────────┬───────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ /evidence-library (NEW PAGE)            │  ← New sidebar item
│ Card grid grouped by type               │
│ Filters + inline verify + AI extract    │
└─────────────────────────────────────────┘
```

## Key decisions

| Question | Choice | Why |
|----------|--------|-----|
| Products UI | Tab on existing settings page | Company data stays together |
| Evidence UI | Dedicated sidebar page | First-class feature, needs space |
| Card layout | Grouped by evidence type | Clear visual organization |
| Verification | Inline toggle | Fast, no workflow overhead |
| AI extraction | From existing docs + upload | Maximum flexibility |
| Extracted state | Unverified | Human review before pipeline use |

## Scope

**In:** Products CRUD, Evidence CRUD, card library, filters, AI extraction, verify toggle, API routes, tests

**Out:** Product specs/pricing, usage analytics, bulk import, auto-verification, evidence versioning

## Risk + Mitigation

| Risk | Mitigation |
|------|------------|
| Bad AI extraction | Unverified by default, user reviews |
| Empty evidence tables | Clear empty states, AI extraction CTA |
| Too many evidence entries | Pipeline already limits to 10 verified |

## Next steps

1. `/intent-critique` — Check for over-engineering
2. `/intent-plan` — Generate phased TDD execution plan
3. `/swarm run` — Execute with multi-agent team
