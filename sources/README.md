# IntentWin - Source Materials

> L1 Company Truth: The canonical source of verified claims, capabilities, and evidence for proposal generation.

## Directory Structure

```
sources/
├── company-context/       # Your company profile: brand, values, certifications, legal
├── methodologies/         # Your delivery frameworks and methodologies
├── case-studies/          # Verified client success stories with metrics
├── service-catalog/       # Detailed service offerings, pricing, deliverables
├── proposal-examples/     # Reference proposals and templates
└── evidence-library/      # Certifications, awards, analyst recognition
```

## Getting Started

1. **Company Context** -- Start here. Upload your company overview, values, and brand guidelines.
2. **Service Catalog** -- Add your service offerings with capabilities and pricing models.
3. **Evidence Library** -- Add certifications, partnerships, and industry recognition.
4. **Case Studies** -- Add past client success stories with quantified outcomes.
5. **Methodologies** -- Document your delivery frameworks and assessment tools.
6. **Proposal Examples** -- Add past proposals or templates as reference material.

## Adding New Materials

1. Place source documents in the appropriate subdirectory
2. Use consistent naming: `{topic}-{type}.md` (e.g., `cloud-migration-methodology.md`)
3. Include metadata header with:
   - `source_url`: Original source link (if applicable)
   - `verified_date`: When the content was verified
   - `content_type`: methodology | case_study | service | pricing | certification

## Verification Status

Mark files with verification status:
- `[VERIFIED]` - Content confirmed against official company sources
- `[UNVERIFIED]` - Needs confirmation before use in proposals
- `[PARTIAL]` - Some content verified, some needs review

## How IntentWin Uses These Files

These materials serve as the **source of truth** for the proposal generator's L1 context layer. All generated claims must be traceable to content in this directory. When you generate a proposal, IntentWin will:

1. Query relevant documents based on the proposal's industry, service line, and client needs
2. Extract capabilities, metrics, and proof points
3. Map claims to verified evidence
4. Flag any generated claims that lack L1 backing

## Refresh Schedule

| Source Type | Recommended Refresh |
|-------------|---------------------|
| Company profile | Annually or on major changes |
| Service catalog | Quarterly |
| Case studies | As new ones are completed |
| Certifications | When renewed or new ones obtained |
| Methodologies | When frameworks are updated |
