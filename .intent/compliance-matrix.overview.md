# Compliance Matrix: Never miss a client requirement again

## One sentence

AI extracts every requirement from client documents and tracks whether your proposal addresses each one — with a visual kanban board and export safety gate.

## Why?

Proposal teams lose deals when they miss requirements buried in 50-page RFPs. Manual requirement tracking in spreadsheets is tedious and error-prone. IntentBid should catch gaps automatically.

## Core experience

```
Upload source doc (RFP, brief, deck, email)
    ↓
AI extracts requirements automatically
  "12 requirements found — 4 mandatory, 6 desirable, 2 informational"
    ↓
Optional: review + edit extracted requirements
    ↓
Generate proposal (requirements inform AI)
    ↓
Compliance Kanban Board
  ┌────────┐  ┌────────────┐  ┌──────────────┐  ┌──────┐
  │  Met   │  │ Partially  │  │ Not Addressed│  │ N/A  │
  │  ████  │  │    ██      │  │    ████      │  │  █   │
  │  ████  │  │    ██      │  │   [Address]  │  │      │
  └────────┘  └────────────┘  └──────────────┘  └──────┘
  Score: 5/10 met (50%) | 3 mandatory gaps
    ↓
Click "Address" → regenerate targeted section
    ↓
Export → "3 requirements unaddressed" → Address / Export Anyway
```

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    INTAKE FLOW                        │
│  Upload → Extract Requirements → Optional Review     │
└──────────────┬───────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────┐
│              proposal_requirements TABLE              │
│  id | requirement_text | category | compliance_status │
│     | source_ref | mapped_section_id | sort_order     │
└──────────────┬───────────────────────────────────────┘
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐
│ Kanban │ │ Export  │ │ Regen  │
│ Board  │ │ Gate   │ │ Flow   │
│(@dnd)  │ │ Modal  │ │        │
└────────┘ └────────┘ └────────┘
```

## Key decisions

| Question | Choice | Why |
|----------|--------|-----|
| Source docs | Any file type, not just RFPs | Real proposals respond to briefs, decks, emails |
| Categorization | AI auto-labels | Reduces manual work |
| Kanban interaction | Full drag-and-drop | Demo wow-factor |
| UI placement | Full tab (not slide panel) | Kanban needs space |
| Export gate | Modal with details | Actionable, not just a warning |
| Address flow | Targeted section regen | Fast, precise |

## Scope

**In:** AI extraction, kanban board, drag-and-drop, auto-mapping, targeted regen, export gate, intake integration

**Out:** Cross-proposal templates, requirement history, multi-user assignment, spreadsheet import

## Risk + Mitigation

| Risk | Mitigation |
|------|------------|
| AI over/under-extracts | User can add/edit/remove |
| Wrong auto-mapping | User override, mapping is a suggestion |
| Too many cards for kanban | @dnd-kit handles scale; virtualize if needed |

## Next steps

1. `/intent-critique` — Check for over-engineering
2. `/intent-plan` — Generate phased execution plan
3. `/intent-build-now` or `/swarm run` — Build it
