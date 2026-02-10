# IMF Integration: Intent-Driven Proposal Generation

> Make every proposal section methodical, persuasive, and verifiable.

## Why?

Current proposal generation throws company context and RFP data at an AI and hopes for good output. There's no systematic methodology, no persuasion frameworks, no verification that claims are true. Every competitor with ChatGPT access can do this.

IMF changes the game: proposals follow a structured intent methodology where every claim traces to evidence, every section follows proven persuasion frameworks, and every output is verified against known truth.

## Core Experience

```
User creates proposal → fills intake → defines win themes
                                            │
    ┌───────────────────────────────────────┘
    ▼
┌─────────────────────────────────────────────────┐
│  PERSUASION ENGINE (Phase 1 - NOW)              │
│                                                 │
│  Win Themes  ──→  Woven through ALL sections    │
│  AIDA/PAS/FAB ──→ Section-specific frameworks   │
│  Competitive  ──→  Indirect positioning          │
│  Brand Voice  ──→  Tone + terminology enforced   │
│  Best Practices ──→ Eng + Marketing per section  │
└───────────────────────┬─────────────────────────┘
                        ▼
              [Generated Proposal]
              Quality-checked against
              win themes, length, voice
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PROMPT LAYERS                         │
│                                                         │
│  Layer 1: Brand Voice (org settings)                    │
│  Layer 2: Section Best Practices (code constants)       │
│  Layer 3: Persuasion Framework (AIDA/PAS/FAB/STAR)      │
│  Layer 4: Win Themes Backbone (per-proposal intake)     │
│  Layer 5: Competitive Positioning (intake + strategy)   │
│  Layer 6: Context (intake + analysis + retrieved docs)  │
│                                                         │
│  All layers combined → Single prompt → LLM → Output    │
└─────────────────────────────────────────────────────────┘
```

## Key Decisions

| Question | Choice | Why |
|----------|--------|-----|
| Unverified claims? | Generate alternatives | Help human, don't block |
| Compliance gate? | Soft (warn, allow override) | Practical for real use |
| Persuasion depth? | All three layers | Full differentiation |
| UX? | Progressive disclosure | Simple default, power mode |
| MVP? | Persuasion engine first | Best demo impact |

## Scope

**In (Phase 1):** Persuasion frameworks, win theme backbone, competitive positioning, brand voice, section best practices, quality checks

**Out (Phase 2):** RFP requirements extraction, compliance kanban, export gating

**Out (Phase 3):** Claim verification, alternative generation, evidence traceability

## Risk + Mitigation

| Risk | Fix |
|------|-----|
| Prompts too long | Gemini 1M context window handles it |
| Feels formulaic | Tune temperature + framework specificity |
| Win themes repetitive | Prompt says "weave naturally" |

## Next Steps

1. `/intent-critique` — Check for over-engineering
2. `/intent-plan` — Generate phased TDD execution plan
3. `/intent-build-now` — Implement Phase 1 (Persuasion Engine)
