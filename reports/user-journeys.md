# IntentWin User Journey Maps

> Generated 2026-02-24. Based on full codebase analysis of 31 pages across 4 sections.

---

## Journey 1: First-Time User to First Proposal (Happy Path)

**Persona:** Sarah, a proposal manager at a mid-size IT services firm. She just signed up.

```
/signup
  |-- Email access check
  |-- Account creation (name, email, password)
  v
/onboarding (5 steps, ~3 min)
  Step 1: Welcome (read + click)               [5 sec]
  Step 2: Company Name + Industry              [30-60 sec]
  Step 3: Differentiators (3 text fields)      [1-3 min]
  Step 4: Proposal Types (multi-select)        [15 sec]
    |-- DANGER: "Go to Knowledge Base" link navigates AWAY with no return
  Step 5: Confirm + Save                       [10 sec]
  v
/proposals/new (auto-redirect)
  |
  |-- PRE: Intake Mode Selection               [10-30 sec]
  |     Options: Upload File | Paste Content | Describe It | Manual Entry
  |     + Optional "Research the client" checkbox
  |
  |-- [If upload/paste/describe] AI Extraction  [15-45 sec processing]
  |     Review extracted fields, edit, confirm
  |
  |-- [If RFP data found] Bid/No-Bid Eval     [30-120 sec]
  |     Overall score (0-100), 5 factor scores
  |     Decision: Proceed or Skip
  |
  |-- Phase 1: Define Context                  [30 sec - 5 min]
  |     Client Name (required)
  |     Pain Points (required, 1+ items)
  |     Desired Outcomes (required, 1+ items)
  |     Industry, Solicitation Type, Service Line
  |     Advanced: Budget, Timeline, Compliance
  |
  |-- Phase 2: Win Strategy                    [30-90 sec]
  |     Auto-generated themes, outcomes, differentiators
  |     Edit priorities, add competitive intel
  |
  |-- Phase 3: Review & Approve Intent         [15-30 sec]
  |     Checkbox: "I approve this Intent"
  |     Click: "Create Proposal"
  v
/proposals/[id] (auto-redirect)
  |-- Status: "Ready to Generate"
  |   Readiness Report (pre-flight check)
  |   Click: "Generate Proposal"
  |
  |-- Generation in progress                   [2-10 min]
  |   10 sections generated sequentially
  |   Progress bar with section count
  |
  |-- Status: REVIEW
  |   Split-pane: Section nav | Content viewer
  |   Actions: Edit, Regenerate, AI Auto-Fix
  |   Quality scores per section
  v
/proposals/[id]/export
  |-- Choose format: Slides | PPTX | HTML | DOCX | PDF
  |-- Compliance gate check
  |-- Download generated file
  v
DONE. Total time: 20-90 minutes depending on path.
```

### Critical Friction Points in This Journey

| # | Location | Issue | Severity |
|---|----------|-------|----------|
| 1 | Onboarding Step 4 | "Go to Knowledge Base" link abandons onboarding flow entirely | HIGH |
| 2 | /proposals/new (all phases) | NO draft auto-save. Page refresh = total data loss. No beforeunload warning. | CRITICAL |
| 3 | Win Strategy phase | Win themes can be deleted but NOT added. No add button. | HIGH |
| 4 | Win Strategy phase | "Regenerate Strategy" destroys all edits with no confirmation dialog | MEDIUM |
| 5 | Bid Evaluation | "Skip This Opportunity" label suggests declining, not skipping the evaluation step | MEDIUM |
| 6 | Review phase | Does not show client name, industry, budget, timeline, scope, or bid eval summary | MEDIUM |
| 7 | Export page | Deploy instructions reference `/myvibe:publish` CLI tool -- meaningless to non-technical users | LOW |

---

## Journey 2: Opportunity-Driven Proposal (Intelligence to Proposal)

**Persona:** Mike, an experienced BD lead who browses opportunities to find ones worth bidding on.

```
/intelligence (Market Overview)
  |-- Scan dashboard charts for market trends
  |-- Click NAICS code for industry detail
  v
/intelligence/naics/[code]
  |-- Review competition breakdown, top agencies
  |-- Read win themes and section guidance
  |-- Click "View Awards for NAICS [code]"
  v
/intelligence/awards?naics=[code]
  |-- Browse historical awards for this industry
  |-- Note incumbent contractors, award amounts
  |-- Click award for detail panel
  v
/intelligence/opportunities
  |-- Filter by city, state, agency, status, NAICS
  |-- Browse open solicitations
  |-- Click opportunity for detail panel
  |-- Click "Start Proposal" on a promising opportunity
  |   (writes to sessionStorage: client_name, scope, solicitation_type, deadline)
  v
/proposals/new (pre-filled from opportunity)
  |-- Intake mode auto-set to "form" (skips upload)
  |-- Phase 1 fields pre-populated
  |-- Continue through Phase 2 (Strategy) and Phase 3 (Review)
  v
/proposals/[id] -> Generate -> Review -> Export
```

### Key Value Proposition of This Path
The opportunity feed eliminates the cold-start problem. Instead of "what should I bid on?", users start with real opportunities and flow directly into proposal creation with pre-filled data.

### Friction Points

| # | Issue | Severity |
|---|-------|----------|
| 1 | Intelligence dashboard charts are not clickable -- no drill-down to agencies or awards | MEDIUM |
| 2 | No way to "save" or "bookmark" an opportunity for later without starting a proposal | HIGH |
| 3 | No way to go from an award detail panel to a related opportunity (or vice versa) | MEDIUM |
| 4 | Agency Explorer is not linked from the dashboard's top agencies chart | LOW |

---

## Journey 3: Knowledge Base Setup (L1 Context Building)

**Persona:** Jennifer, the operations lead tasked with populating the knowledge base so proposals are well-grounded.

```
/knowledge-base (Document Hub)
  |-- See stats: Total Documents, Indexed, Total Chunks
  |-- See empty state if no documents
  v
/knowledge-base/upload
  |-- Upload single file (DOCX, PDF, PPTX, TXT, MD)
  |-- Fill metadata: title, type, industry, service line
  |-- Wait for processing
  |-- Redirect back to document list
  |-- REPEAT for each file (no multi-file upload)
  v
/knowledge-base (verify documents appear)
  |-- Check processing status (Ready, Processing, Failed)
  v
/evidence-library
  |-- Add case studies, metrics, testimonials
  |-- Set type, industry, service line, verified status
  |-- This data is independent of uploaded documents
  v
/settings/company
  |-- Tab: Company Profile (name, description)
  |-- Tab: Differentiators (text list)
  |-- Tab: Certifications (title + content CRUD)
  |-- Tab: Products & Services (capabilities, outcomes)
  |-- Tab: Team Members (name, role, bio, clearance)
  v
/settings/brand-voice
  |-- Set tone description
  |-- Add preferred/avoided terminology
  v
/knowledge-base/sources (L1 Sources viewer)
  |-- Verify all company context appears
  |-- Read-only -- cannot edit from here
  v
DONE. L1 context is ready for proposal generation.
```

### Friction Points

| # | Issue | Severity |
|---|-------|----------|
| 1 | Upload is single-file only. Uploading 20 past proposals = 20 separate visits. | HIGH |
| 2 | Three overlapping systems for company data: Evidence Library, L1 Sources, Settings > Company | HIGH |
| 3 | L1 Sources is read-only. User must navigate to Settings to edit, then come back to verify. | MEDIUM |
| 4 | "Total Chunks" is developer jargon. Users don't know what chunks are. | LOW |
| 5 | No document preview in the Knowledge Base list. Can only see metadata + delete. | MEDIUM |
| 6 | Evidence Library items are not visibly connected to proposals that cite them. | MEDIUM |
| 7 | Certifications exist in both Evidence Library (type: certification) and Settings > Company > Certifications tab. Which is authoritative? | HIGH |

---

## Journey 4: FOIA Intelligence Gathering

**Persona:** Alex, a business development analyst who wants to learn about incumbent pricing.

```
/intelligence/foia
  |-- Select state jurisdiction (dropdown, 50 states)
  |-- Enter agency name
  |-- Enter target document description
  |-- Click "Generate Request"
  |-- Wait 5-15 seconds for AI generation
  |-- Review generated FOIA letter
  |-- Click "Copy to Clipboard"
  |-- Paste into email and send manually
  v
DEAD END. No request tracking, no history, no inbox.
```

### Friction Points

| # | Issue | Severity |
|---|-------|----------|
| 1 | No persistence. Navigate away = letter is lost forever. | HIGH |
| 2 | No request lifecycle tracking (sent, received, responded). | HIGH |
| 3 | "Coming Soon" inbox tracking is a promise with no delivery date. | MEDIUM |
| 4 | No connection back to intelligence data. Results are not fed into the system. | MEDIUM |

---

## Journey 5: New User Orientation (What Do I Do First?)

**Persona:** Dave, a new user who completed onboarding and is now on the proposals dashboard.

```
/proposals (empty state)
  |-- Sees: "Start New Proposal" CTA and "Upload RFP Documents" link
  |-- Sees: GettingStartedChecklist component
  |
  |-- User thinks: "Should I create a proposal first, or set up my company data?"
  |-- User thinks: "What's Intelligence? What's L1 Sources? What's Evidence Library?"
  |-- Sidebar has 19 items across 4 groups
  |
  |-- Possible paths (all valid, none obviously correct):
  |   A) Click "New Proposal" (proceed with empty knowledge base)
  |   B) Navigate to Knowledge Base > Upload (populate data first)
  |   C) Navigate to Settings > Company Profile (set up company first)
  |   D) Navigate to Intelligence (explore market data)
  |   E) Navigate to Evidence Library (start documenting case studies)
  |   F) Get overwhelmed and leave
  v
NO CLEAR GUIDANCE on optimal order.
```

### What's Missing

| Missing Element | Impact |
|-----------------|--------|
| Interactive getting-started checklist with progress tracking | Users have no roadmap |
| "Recommended next step" banner that adapts to current state | Users have no context |
| Contextual help tooltips on sidebar items | Users don't know what things are |
| Simplified sidebar for new users (progressive disclosure) | Information overload |

---

## Journey Map Summary

| Journey | Total Steps | Estimated Time | Maturity | Biggest Gap |
|---------|-------------|----------------|----------|-------------|
| 1. First Proposal | 12-15 steps | 20-90 min | 75% | No draft auto-save |
| 2. Opportunity-Driven | 8-10 steps | 15-60 min | 70% | No opportunity bookmarks |
| 3. Knowledge Setup | 6-8 steps | 30-120 min | 55% | 3 overlapping systems |
| 4. FOIA Research | 4 steps | 2-5 min | 40% | Dead end, no persistence |
| 5. New User Orientation | N/A | N/A | 30% | No guided path |
