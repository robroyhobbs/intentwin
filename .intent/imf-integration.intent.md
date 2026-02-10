# IMF Integration into IntentWin — Intent Specification

## 1. Overview

**Product:** IntentWin — AI-powered proposal generation tool
**Feature:** IMF (Intent Management Framework) Integration
**Priority:** High — core differentiator
**Target User:** Proposal managers, business development teams, consultants
**Scope:** Transform the generation pipeline from ad-hoc AI prompting to a layered intent system with engineering and marketing best practices

### Core Concept

Proposals are generated through a systematic methodology where:

- Every claim traces to verified evidence (L1)
- Every section addresses defined requirements (L0)
- Every paragraph follows a persuasion framework (L2)
- Every output is verified before human review (L3)

This is what separates IntentWin from "paste context into ChatGPT."

### IMF Layer Mapping

```
L0: REQUIREMENTS TRUTH (RFP/RFI)
    What the client demands. Extracted, locked, non-negotiable.
    Source: Uploaded RFP document → AI extraction
    Status: LOCKED after human review

L1: COMPANY TRUTH (Evidence Library)
    What we can verifiably claim.
    Source: Uploaded docs + org settings (capabilities, certs, case studies)
    Status: LOCKED (verified) or REVIEWED

L2: PROPOSAL INTENT (Win Strategy + Persuasion)
    How we frame this specific opportunity.
    Source: Intake form → win themes, positioning, competitive angles
    Status: REVIEWED before generation

L3: GENERATED OUTPUT (Proposal Sections)
    AI-generated content verified against L0/L1/L2.
    Status: DRAFT until human approves
```

## 2. Architecture

### Phase 1: Persuasion Engine (MVP)

#### 2.1 Prompt Architecture Overhaul

The current pipeline at `src/lib/ai/pipeline.ts` builds prompts per-section with context. The new architecture layers persuasion frameworks into every prompt.

**Current flow:**

```
intakeData + analysis + retrievedContext + winStrategy → prompt → generateText()
```

**New flow:**

```
intakeData + analysis + retrievedContext + winStrategy
    + persuasionFramework(sectionType)
    + winThemesBackbone(winStrategy)
    + competitivePositioning(intakeData)
    + brandVoice(orgSettings)
    + sectionBestPractices(sectionType)
    → prompt → generateText()
```

#### 2.2 Persuasion Framework System

Each section type gets a persuasion strategy based on its purpose:

| Section           | Primary Framework                       | Structure                                               |
| ----------------- | --------------------------------------- | ------------------------------------------------------- |
| Executive Summary | AIDA (Attention-Interest-Desire-Action) | Hook → insight → value → CTA                            |
| Understanding     | Problem-Agitate-Solve                   | Pain → amplify → preview solution                       |
| Approach          | Feature-Advantage-Benefit (FAB)         | What we do → why it matters → outcome for you           |
| Methodology       | Before-After-Bridge                     | Current state → future state → our bridge               |
| Team              | Social Proof + Authority                | Credentials → relevance → trust                         |
| Case Studies      | STAR (Situation-Task-Action-Result)     | Context → challenge → what we did → measurable outcomes |
| Timeline          | Certainty Framework                     | Phases → milestones → risk mitigation → confidence      |
| Pricing           | Value Framing                           | Investment context → ROI → comparison → confidence      |
| Risk Mitigation   | Acknowledge-Address-Assure              | Name risk → our mitigation → evidence it works          |
| Why Us            | Competitive Differentiation             | Unique → proven → relevant → urgent                     |

#### 2.3 Win Themes Backbone

Win themes (defined per-proposal in intake, 2-4 themes) are passed to every section prompt. The LLM decides which themes to emphasize per section.

**Rule:** Every section must naturally reference at least one win theme. The prompt instructs the AI to weave themes into the narrative rather than state them explicitly. No explicit section→theme mapping needed — the LLM handles emphasis based on section context.

#### 2.4 Competitive Positioning Layer

When intake data includes competitors or competitive context, pass differentiators and objections to the prompt with indirect framing instructions.

**Prompt inputs:** differentiators (from win strategy), common objections to preemptively address.

**Rule:** Never name competitors directly unless the RFP does. Always use indirect framing: "Some approaches fail because... Our approach..." Frame around differentiators, not against competitors.

#### 2.5 Brand Voice Enforcement

Extend org settings to include brand voice parameters:

```typescript
interface BrandVoice {
  tone: string; // e.g., "confident, collaborative, outcomes-focused"
  terminology: {
    use: string[]; // Preferred terms
    avoid: string[]; // Terms to never use
  };
}
```

Added to org settings JSONB. `tone` is a free-text field that captures overall voice (formality, perspective, style can be described here). `terminology` provides hard constraints for post-gen validation. Injected into system prompt.

#### 2.6 Section Best Practices

Each section type has engineering + marketing best practices encoded:

```typescript
interface SectionBestPractices {
  sectionType: string;
  engineering: {
    requiredElements: string[]; // Must include (e.g., "metrics", "timeline")
    structureGuidance: string; // How to organize content
    lengthGuidance: { min: number; max: number; unit: "words" | "pages" };
    qualityChecks: string[]; // Post-gen validation rules
  };
  marketing: {
    framework: string; // AIDA, PAS, FAB, etc.
    openingStrategy: string; // How to start the section
    closingStrategy: string; // How to end (CTA, transition, reinforcement)
    winThemeReinforcement: boolean; // Must reference a win theme
  };
}
```

Proof point guidance ("reference evidence where available") is included in prompt text, not as a numeric minimum.

### Phase 2: Compliance Matrix (Future)

#### 2.7 RFP Requirements Extraction

After RFP upload, run extraction pipeline:

```
RFP Document → Parse → AI extraction → RequirementsList
    → Human review (add/edit/remove/categorize)
    → Lock as L0

interface ExtractedRequirement {
  id: string;
  requirementText: string;
  category: "mandatory" | "desirable" | "informational";
  section: string;              // RFP section reference
  complianceStatus: "met" | "partially_met" | "not_addressed" | "na";
  mappedSections: string[];     // Which proposal sections address this
  evidence: string[];           // L1 references supporting compliance
  notes: string;                // Human notes
}
```

#### 2.8 Compliance Kanban Board

Visual kanban UI with four columns:

```
┌──────────┐ ┌──────────────┐ ┌───────────────┐ ┌──────┐
│   Met    │ │ Partially    │ │ Not Addressed │ │ N/A  │
│          │ │ Met          │ │               │ │      │
│ [Card]   │ │ [Card]       │ │ [Card]        │ │[Card]│
│ [Card]   │ │ [Card]       │ │ [Card]        │ │      │
│ [Card]   │ │              │ │               │ │      │
└──────────┘ └──────────────┘ └───────────────┘ └──────┘
```

Each card shows:

- Requirement text (truncated)
- Category badge (mandatory/desirable)
- Mapped section(s)
- Action: "Suggest section" → triggers regeneration with requirement included

#### 2.9 Soft Export Gate

On export, if `not_addressed` requirements exist:

```
"3 mandatory requirements are not yet addressed:
 - Req 4.2.1: Disaster recovery plan
 - Req 5.1.3: Data residency compliance
 - Req 6.2.0: Subcontractor management

 [Address Now]  [Export Anyway]  [Cancel]"
```

### Phase 3: Verification Pass (Future)

#### 2.10 Post-Generation Verification

After all sections are generated, run verification:

```
For each section:
  For each factual claim:
    Search L1 (evidence library + org settings)
    If match found → mark as "verified" with source
    If no match → flag as "unverified"
    For unverified claims:
      Generate 2-3 alternative phrasings backed by L1 evidence
      Present to user: "Original | Alt 1 | Alt 2 | Alt 3"
```

#### 2.11 Verification Score

```typescript
interface VerificationResult {
  sectionId: string;
  totalClaims: number;
  verifiedClaims: number;
  unverifiedClaims: ClaimWithAlternatives[];
  score: number; // 0-100
}

interface ClaimWithAlternatives {
  originalText: string;
  alternatives: {
    text: string;
    evidenceSource: string;
    relevanceScore: number;
  }[];
}
```

## 3. Data Model Changes

### Phase 1 (Persuasion Engine)

**Organizations table** — extend `settings` JSONB:

```json
{
  "brand_voice": {
    "tone": "confident, collaborative, outcomes-focused",
    "terminology": { "use": [...], "avoid": [...] }
  },
  "capabilities": ["Cloud Migration", "App Modernization", ...],
  "certifications": ["AWS Partner", "ISO 27001", ...],
  "company_description": "...",
  "industry_focus": [...]
}
```

**No new tables for Phase 1.** The persuasion frameworks and best practices are code-level constants, not user-configurable data.

### Phase 2 (Compliance Matrix) — Design Later

Will need a `proposal_requirements` table linking requirements to proposals with compliance status tracking. Design schema when building Phase 2.

### Phase 3 (Verification) — Design Later

Will need a `section_claims` table linking claims to evidence with verification status. Design schema when building Phase 3.

## 4. Implementation Guide — Phase 1

### 4.1 Files to Create

```
src/lib/ai/
├── persuasion.ts              # All persuasion prompt builders:
│                              #   frameworks (AIDA, PAS, FAB, STAR)
│                              #   section best practices
│                              #   win themes backbone
│                              #   competitive positioning
│                              #   brand voice
│                              # Split into multiple files only if >300 lines
```

### 4.2 Files to Modify

```
src/lib/ai/pipeline.ts         # Inject persuasion layers into section prompts
src/lib/ai/prompts/*.ts        # Update each section prompt builder
src/lib/ai/claude.ts           # No changes (LLM abstraction stays clean)
```

### 4.3 Prompt Structure (Example: Executive Summary)

```
SYSTEM: {brandVoice} + {role}

USER:
## SECTION: Executive Summary

### Persuasion Framework: AIDA
- ATTENTION: Open with a compelling insight about the client's situation
- INTEREST: Show deep understanding of their specific challenges
- DESIRE: Paint the transformation picture (current → future state)
- ACTION: Clear next step / confidence in partnership

### Win Themes to Reinforce
{winThemes mapped to this section}

### Competitive Positioning
{framingStrategy with differentiators}

### Best Practices
- Length: 300-500 words (1 page)
- Must include: quantified value proposition, reference to methodology
- Must NOT include: detailed pricing, technical jargon
- Opening: Lead with client's #1 challenge, not your company description
- Closing: End with transformation promise, not generic "we look forward to..."

### Context
{intakeData}
{enhancedAnalysis}
{retrievedContext}
{winStrategy}
{companyInfo}

Write the Executive Summary following the AIDA framework above.
```

### 4.4 Quality Validation Post-Generation

After each section is generated, run quick checks:

```typescript
interface QualityCheck {
  winThemePresent: boolean; // At least one win theme referenced
  lengthInRange: boolean; // Within best practice length
  noBlockedTerms: boolean; // Brand voice "avoid" terms not used
  hasProofPoint: boolean; // References evidence or metrics
}
```

All four checks are simple string operations (no LLM call needed). Framework adherence is ensured by prompt guidance, not post-gen validation.

## 5. Decisions Summary

| Decision            | Choice                                | Rationale                         |
| ------------------- | ------------------------------------- | --------------------------------- |
| Unverified claims   | Generate alternatives                 | Helps human without blocking      |
| Compliance gate     | Soft gate on export                   | Practical, not bureaucratic       |
| Persuasion scope    | Win themes + psychology + competitive | Full differentiation              |
| UX model            | Progressive disclosure                | Easy to demo, powerful to use     |
| L1 evidence source  | Uploads + org settings                | Builds on existing data           |
| Gap handling        | Suggest section, offer regeneration   | Actionable guidance               |
| Win themes scope    | Per-proposal (intake)                 | Already exists in flow            |
| Verification timing | Post-generation pass                  | Don't slow generation             |
| MVP                 | Persuasion first                      | Best demo impact, fastest to ship |
| Compliance UI       | Kanban board                          | Visual, impressive                |

## 6. MVP Scope (Phase 1: Persuasion Engine)

### Included

- Persuasion framework per section type (AIDA, PAS, FAB, STAR, etc.)
- Win themes backbone (woven through all sections)
- Competitive positioning layer (indirect framing by default)
- Brand voice enforcement (from org settings)
- Section-specific best practices (engineering + marketing)
- Post-generation quality checks
- Updated prompts for all 10 section types

### Excluded (Phase 2+)

- RFP requirements extraction
- Compliance matrix kanban board
- Post-generation claim verification
- Alternative generation for unverified claims
- Verification scoring
- Export gating

## 7. Risks

| Risk                                   | Mitigation                                                        |
| -------------------------------------- | ----------------------------------------------------------------- |
| Prompts become too long (token limits) | Use Gemini's 1M context window; compress context if needed        |
| Persuasion frameworks feel formulaic   | Test output quality; adjust temperature and framework specificity |
| Win theme repetition across sections   | Prompt instructs "weave naturally, never repeat verbatim"         |
| Brand voice terms not enforced         | Post-gen quality check validates against avoid list               |
| Phase 2/3 data model conflicts         | Phase 1 uses no new tables; design Phase 2/3 schemas when needed  |

## 8. Open Items

- [ ] Define specific AIDA/PAS/FAB prompt templates per section
- [ ] Determine if org settings UI needs update for brand voice (or just expose in settings page)
- [ ] Test Gemini 3 Pro response quality with layered prompts
- [ ] Benchmark generation time with added prompt complexity
