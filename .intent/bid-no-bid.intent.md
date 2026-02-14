# Bid/No-Bid Scoring Engine Intent

> Evaluate RFP opportunities with an AI-assisted weighted scoring rubric during intake so users can make informed bid/no-bid decisions before investing in proposal generation.

## Responsibilities

- Present a 5-factor scoring evaluation after RFP extraction, before win strategy
- AI pre-scores each factor by analyzing extracted RFP requirements against L1 context and knowledge base documents
- Display scores with AI-generated rationale per factor; user can override any score
- Calculate weighted total and show 3-tier recommendation (Bid / Evaluate Further / Pass)
- Gate the intake flow: user must explicitly proceed or skip after seeing the score
- Persist bid_score and factor_scores on the proposal record for future analytics

## Non-Goals

- Opportunity pipeline or tracker UI
- Custom rubric configuration per organization
- SAM.gov or external RFP source monitoring
- Auto-proceeding based on score threshold
- Price competitiveness or relationship factors (future)

## Structure

```
Intake Flow (updated):

Upload RFP → Extract Fields → BID/NO-BID EVALUATION → Win Strategy → Generate
                                      │
                                      ▼
                          ┌─────────────────────┐
                          │  AI Pre-Scoring      │
                          │                      │
                          │  RFP requirements    │
                          │       vs             │
                          │  L1 context + KB     │
                          │       ↓              │
                          │  5 factor scores     │
                          │  + rationale         │
                          └──────────┬───────────┘
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │  User Review         │
                          │                      │
                          │  Override any score   │
                          │  See recommendation   │
                          │                      │
                          │  [Proceed] or [Skip] │
                          └─────────────────────┘

Scoring Factors:
┌──────────────────────┬────────┐
│ Factor               │ Weight │
├──────────────────────┼────────┤
│ Requirement Match    │  30%   │
│ Past Performance     │  25%   │
│ Capability Alignment │  20%   │
│ Timeline Feasibility │  15%   │
│ Strategic Value      │  10%   │
└──────────────────────┴────────┘

Thresholds:
  > 70  →  "Recommended to Bid"     (green)
  40-70 →  "Evaluate Further"       (yellow)
  < 40  →  "Recommended to Pass"    (red)
```

## Constraints

1. Scoring API endpoint accepts proposalId, analyzes extracted RFP data + L1/KB context, returns 5 factor scores with rationale
2. Each factor score is 0-100; weighted total computed client-side from factor scores and fixed weights
3. User can override any factor score before proceeding; overridden scores are saved alongside AI-suggested scores
4. Bid evaluation is stored in `proposals.bid_evaluation` JSONB column (no new tables)
5. Intake flow step order enforced: extract must complete before bid evaluation is available
6. "Skip" records bid_evaluation with user_decision="skip"; "Proceed" records user_decision="proceed" — both persist for analytics
