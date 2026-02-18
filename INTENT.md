# IntentWin - Intent

> AI-native proposal generation that starts with client outcomes and works backward through verified company capabilities.

## Vision

Transform proposal creation from document assembly to **outcome engineering**. Every proposal answers one question: "How will we deliver the specific outcomes this client needs?"

## Core Principle

```
Traditional Proposal:  Capabilities → Hope client sees value
IDD Proposal:          Client Outcomes → Mapped Capabilities → Verified Claims → Measurable Commitments
```

**Intent is the proposal's source code.** The client's desired outcomes and constraints define what gets generated. Humans review the Intent (outcomes, strategy). AI generates and verifies the execution (sections, claims).

---

## Three-Layer Context Model

```
┌─────────────────────────────────────────────────────────────────┐
│  L1 — COMPANY TRUTH (Canonical, Locked)                         │
│  ├── Company Context: Brand, values, certifications, legal      │
│  ├── Product Context: Capabilities, specs, pricing models       │
│  └── Evidence Context: Case studies, metrics, testimonials      │
│                                                                 │
│  Source of truth. Claims must be verifiable against L1.         │
│  Updated by: Company admins only                                │
├─────────────────────────────────────────────────────────────────┤
│  L2 — PROPOSAL INTENT (Human-Reviewed)                          │
│  ├── Client Outcome Contract: Current state → Desired state     │
│  ├── Win Strategy: Themes, differentiators, competitive angle   │
│  ├── Constraints: Budget, timeline, compliance, technical       │
│  └── Success Metrics: How outcomes will be measured             │
│                                                                 │
│  Defines WHAT the proposal must achieve. Human approves.        │
│  Updated by: Proposal owner + AI suggestions                    │
├─────────────────────────────────────────────────────────────────┤
│  L3 — GENERATED CONTENT (AI-Executed, Human-Verified)           │
│  ├── Proposal Sections: Executive summary through pricing       │
│  ├── Claims Validation: Each claim traced to L1 evidence        │
│  └── Outcome Mapping: Each section → which outcome it serves    │
│                                                                 │
│  HOW the intent is executed. AI generates, human spot-checks.   │
│  Verified against: L1 (accuracy) + L2 (relevance)               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Proposal Intent Structure

Every proposal has an INTENT that defines its purpose before any content is generated:

### 1. Outcome Contract (Required, Locked after approval)

```markdown
## Outcome Contract

### Client Current State

- [Where the client is today - pain points, challenges, limitations]

### Client Desired State

- [Where the client wants to be - specific, measurable outcomes]

### Transformation Promise

- [How your company will bridge the gap]

### Success Metrics

| Outcome         | Metric               | Target           | Measurement Method       |
| --------------- | -------------------- | ---------------- | ------------------------ |
| Cost reduction  | Infrastructure spend | -40%             | Cloud billing comparison |
| Speed to market | Release cycle        | 2 weeks → 2 days | Deployment frequency     |
```

### 2. Win Strategy (Required, Reviewed)

```markdown
## Win Strategy

### Win Themes

- [2-3 themes that resonate with this client's priorities]

### Differentiators

- [What makes your company uniquely qualified vs competitors]

### Competitive Positioning

- [How we position against likely competitors]

### Proof Points Required

- [Which case studies, certifications, or metrics to emphasize]
```

### 3. Constraints (Required, Locked)

```markdown
## Constraints

### Must Include

- [Required elements: compliance, certifications, specific capabilities]

### Must Avoid

- [Prohibited claims, competitors not to mention, sensitive topics]

### Budget Envelope

- [Budget range and pricing model constraints]

### Timeline Constraints

- [Delivery expectations, milestones, hard deadlines]
```

### 4. Section Requirements (Draft, AI-optimized)

```markdown
## Section Requirements

| Section           | Outcome Served | Key Points                     | Evidence Required  |
| ----------------- | -------------- | ------------------------------ | ------------------ |
| Executive Summary | All            | Outcome-first framing          | Top 3 metrics      |
| Understanding     | Trust          | Prove we understand their pain | Industry knowledge |
| Approach          | Speed, Quality | Show clear path to outcomes    | Methodology        |
| Case Studies      | Trust, Risk    | Prove we've done this before   | Metrics from L1    |
```

---

## Generation Pipeline (IDD-Aligned)

```
┌──────────────────────────────────────────────────────────────────┐
│ PHASE 1: INTENT CAPTURE                                          │
│                                                                  │
│   Interview Flow:                                                │
│   1. What outcomes does your client need to achieve?             │
│   2. What does success look like? (Specific metrics)             │
│   3. What constraints exist? (Budget, timeline, compliance)      │
│   4. Who is the competition? What's your angle?                  │
│   5. What proof points will resonate most?                       │
│                                                                  │
│   Output: Proposal INTENT (outcome contract + win strategy)      │
├──────────────────────────────────────────────────────────────────┤
│ PHASE 2: CAPABILITY MAPPING                                      │
│                                                                  │
│   For each stated outcome:                                       │
│   1. Query L1 (Company/Product Context) for relevant capabilities│
│   2. Query L1 (Evidence Context) for supporting case studies     │
│   3. Identify gaps (outcomes we can't fully support)             │
│   4. Flag claims that need verification                          │
│                                                                  │
│   Output: Outcome → Capability → Evidence mapping                │
├──────────────────────────────────────────────────────────────────┤
│ PHASE 3: SECTION GENERATION                                      │
│                                                                  │
│   For each section:                                              │
│   1. Inject: Outcome contract + relevant L1 context              │
│   2. Generate: Content that serves the mapped outcomes           │
│   3. Validate: Check claims against L1 evidence                  │
│   4. Annotate: Mark unverified claims for human review           │
│                                                                  │
│   Output: Draft sections with claim traceability                 │
├──────────────────────────────────────────────────────────────────┤
│ PHASE 4: VERIFICATION & REVIEW                                   │
│                                                                  │
│   Automated checks:                                              │
│   - Every claim has L1 source? (or flagged as unverified)        │
│   - Every section serves at least one stated outcome?            │
│   - Constraints respected? (must-include present, must-avoid absent)│
│   - Metrics are specific and measurable?                         │
│                                                                  │
│   Human review:                                                  │
│   - Approve/edit flagged claims                                  │
│   - Verify outcome framing resonates                             │
│   - Final sign-off                                               │
│                                                                  │
│   Output: Verified proposal ready for export                     │
└──────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Additions

### L1: Company Truth

```sql
-- Company-wide context (brand, values, legal)
company_context (
  id, category, key, value,
  is_locked, last_verified_at, verified_by
)

-- Product/service line capabilities
product_contexts (
  id, product_name, service_line,
  capabilities JSONB,      -- What it can do
  specifications JSONB,    -- Technical details
  pricing_models JSONB,    -- How it's priced
  constraints JSONB,       -- What it can't do
  is_locked, last_verified_at
)

-- Verified evidence (case studies, metrics)
evidence_library (
  id, evidence_type,       -- case_study, metric, testimonial, certification
  title, content,
  client_industry, service_line,
  outcomes_demonstrated JSONB,  -- Which outcomes this proves
  metrics JSONB,           -- Specific numbers
  is_verified, verified_by, verified_at
)
```

### L2: Proposal Intent

```sql
-- Enhanced proposals table
proposals (
  ...existing fields...

  -- Outcome Contract (L2)
  outcome_contract JSONB,  -- current_state, desired_state, transformation, metrics

  -- Intent approval status
  intent_status,           -- draft, pending_review, approved, locked
  intent_approved_by,
  intent_approved_at
)
```

### L3: Generation Tracking

```sql
-- Track claims to their evidence
section_claims (
  id, section_id,
  claim_text,
  evidence_id,             -- FK to evidence_library (null if unverified)
  verification_status,     -- verified, unverified, flagged
  flagged_reason
)

-- Track which outcomes each section serves
section_outcome_mapping (
  id, section_id,
  outcome_key,             -- References outcome in outcome_contract
  relevance_explanation
)
```

---

## Section Approval Mechanism

Adapt IDD's LOCKED/REVIEWED/DRAFT to proposals:

```
::: locked {reason="Client-approved outcome"}
## Outcome Contract
Client expects 40% cost reduction within 18 months...
:::

::: reviewed {by=proposal_owner date=2026-01-28}
## Win Strategy
Primary differentiator: Only vendor with FedRAMP High + healthcare experience...
:::

::: draft
## Executive Summary
[AI-generated content, human can freely edit]
:::
```

**Behavior:**

- **LOCKED sections**: Cannot be changed without explicit unlock (protects client commitments)
- **REVIEWED sections**: Changes trigger notification to reviewer
- **DRAFT sections**: AI and humans can freely iterate

---

## Verification Agents

### proposal-validate

- Intent completeness (outcomes defined? metrics specific?)
- Constraint compliance (must-include present? must-avoid absent?)
- Evidence coverage (% of claims with L1 sources)

### proposal-sync

- Compare Intent vs generated content
- Flag sections that don't serve any stated outcome
- Detect claims that contradict L1 context

### proposal-audit

- Overall health score
- Outcome coverage (every outcome addressed?)
- Evidence freshness (case studies current?)
- Competitive positioning strength

---

## Multi-Document Support

Proposals support multiple source documents with role-based classification and incremental addition:

```
┌──────────────────────────────────────────────────────────────────┐
│  PROPOSAL DOCUMENT LIFECYCLE                                      │
│                                                                  │
│  Initial Intake:                                                 │
│  1. Upload 1-N documents (PDF, DOCX, PPTX, TXT, MD)            │
│  2. Classify each document's role:                               │
│     - primary_rfp, amendment, attachment, qa_addendum,           │
│       incumbent_info, evaluation_criteria, template, supplemental│
│  3. Extract from all documents with role-based precedence        │
│  4. Persist document associations in proposal_documents table    │
│                                                                  │
│  Mid-Proposal Addition:                                          │
│  1. Upload new document, assign role                             │
│  2. Incremental extraction (new doc only)                        │
│  3. Semantic merge: compare against existing requirements        │
│     - NEW: requirement not in existing set                       │
│     - UPDATED: similar requirement with changed wording          │
│     - COVERED: already captured                                  │
│  4. User reviews merge plan, approves/rejects each change        │
│  5. Affected sections flagged for regeneration (manual trigger)  │
│                                                                  │
│  Key Safety Rules:                                               │
│  - Manual requirements (is_extracted=false) are NEVER modified   │
│  - Compliance statuses are preserved during merge                │
│  - Sections are never auto-regenerated without user confirmation │
└──────────────────────────────────────────────────────────────────┘
```

See `~/intent/intentwin-multi-document/intent.md` for full design.

---

## Out of Scope

- Real-time collaboration (future enhancement)
- Competitor intelligence gathering (manual input)
- Contract generation (legal review required)

---

## Success Metrics for This System

| Metric                 | Target         | Measurement                      |
| ---------------------- | -------------- | -------------------------------- |
| Proposal creation time | -60% vs manual | Time from intake to draft        |
| Win rate improvement   | +15%           | Track proposals through to award |
| Claim accuracy         | 100% verified  | Zero unverified claims in final  |
| Outcome alignment      | 100%           | Every section maps to outcome    |

---

## Skill Routing (Generation Sequence)

```
1. /intent-capture      → Structured interview for outcome contract
2. /capability-map      → Query L1 for relevant capabilities + evidence
3. /generate-sections   → Outcome-focused section generation
4. /verify-claims       → Check all claims against L1
5. /proposal-review     → Human review interface with annotations
6. /export              → Final document generation
```

---

## Decisions Log

| Decision           | Options Considered    | Choice        | Rationale                                |
| ------------------ | --------------------- | ------------- | ---------------------------------------- |
| Context storage    | Files vs DB           | DB (Supabase) | Queryable, versionable, access control   |
| Claim verification | Manual vs automated   | Hybrid        | AI flags, human confirms                 |
| Outcome structure  | Free-form vs template | Template      | Ensures completeness, enables validation |
