# Interview Decisions: Bid/No-Bid Scoring Engine

> Anchor: Evaluate RFP opportunities with an AI-assisted weighted scoring rubric during intake so users can make informed bid/no-bid decisions before investing in proposal generation.

## Decisions

### 1. Workflow placement

- **Question**: Where in the workflow should the evaluation happen?
- **Decision**: During intake, after RFP extraction and before win strategy. Flow becomes: Upload RFP → Extract → **Bid/No-Bid Score** → Win Strategy → Generate.
- **Rationale**: Natural decision point — you know what the RFP asks, so you can evaluate fit before investing more time.

### 2. Scoring rubric

- **Question**: How should factors be determined?
- **Decision**: Fixed rubric with 5 core factors. We define the factors and weights. AI pre-scores from RFP + evidence, user confirms/overrides.
- **Rationale**: Consistent evaluation across opportunities. 5 factors balances thoroughness with speed.

### 3. The 5 factors

- **Question**: Which scoring factors for MVP?
- **Decision**: Requirement Match (30%), Past Performance (25%), Capability Alignment (20%), Timeline Feasibility (15%), Strategic Value (10%).
- **Rationale**: Covers 90% of the bid decision. Capability Alignment uses actual org data (capabilities, past work) rather than speculative competitive intel. Price competitiveness and relationship can be added later.

### 4. AI role in scoring

- **Question**: How should AI and evidence data participate?
- **Decision**: AI pre-scores all factors by analyzing RFP requirements against L1 context and knowledge base, then presents scores with rationale. User can override any score before seeing the final result.
- **Rationale**: Reduces friction (user isn't starting from zero) while keeping humans in the loop for judgment calls.

### 5. Post-score action

- **Question**: What happens after scoring?
- **Decision**: Score + recommendation shown. User clicks "Proceed to Proposal" or "Skip This Opportunity". Simple gate — no pipeline tracking in MVP.
- **Rationale**: Keeps it focused. Proceed/skip is the only decision that matters.

### 6. Score thresholds

- **Question**: What thresholds and labels?
- **Decision**: 3-tier — Score > 70 = "Recommended to Bid" (green), 40-70 = "Evaluate Further" (yellow), < 40 = "Recommended to Pass" (red).
- **Rationale**: More nuanced than binary. The middle tier reflects reality — many opportunities need human judgment.

### 7. Data persistence

- **Question**: Save the evaluation or keep it transient?
- **Decision**: Save on the proposal record — store bid_score and factor_scores in a JSONB column. Visible later for analytics and win/loss correlation.
- **Rationale**: Critical data for learning. Over time, correlating bid scores with actual outcomes makes the rubric smarter.

## Open Items

- None

## Out of Scope

- Opportunity pipeline/tracker (future feature)
- Auto-proceed based on threshold
- Custom rubric configuration per organization
- SAM.gov or GovWin monitoring integration
- Price competitiveness and relationship scoring factors (future addition)
