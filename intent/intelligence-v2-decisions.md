# Intelligence V2 — Quick Intent Capture

## Stream A: Deeper Pipeline Integration

### Goal
Make intelligence data actively improve proposal quality at every step, not just display it on dashboard pages.

### Decisions
- **Pricing suggestions in cost volume**: When the pipeline generates pricing/cost sections, inject GSA CALC+ rate benchmarks for the extracted labor categories into the prompt. Show "market rate: $X/hr" alongside any pricing table the AI generates.
- **Agency-aware section generation**: If we have an agency profile, inject the preferred eval method, typical criteria weights, and common contract types into every section generation prompt. The AI should emphasize what this specific agency cares about.
- **Quality review calibration**: If agency has high average offers (competitive), raise the quality threshold. If sole-source history, lower it. Adjust the 8.5 fixed threshold to be intelligence-informed.
- **Silent degradation**: All integrations must work identically when intelligence returns null. No new failure modes.
- **No new UI pages**: This is all backend prompt engineering and context injection. The user sees smarter output, not new screens.

### Files to modify
- `src/lib/ai/pipeline/build-pipeline-context.ts` — already fetches intelligence, enrich the prompt strings
- `src/lib/ai/pipeline/context.ts` — may need to expand intelligence context format
- `src/lib/intelligence/context-builder.ts` — add new builder functions for pricing and agency context
- `src/lib/ai/bid-scoring.ts` — use intelligence to adjust scoring weights dynamically
- Section generation prompts (wherever they consume PipelineContext)

---

## Stream B: Win Probability Model

### Goal
Give users a statistical win probability at bid/no-bid decision time based on historical data match.

### Decisions
- **Model approach**: Simple frequentist model, not ML. Match on agency + NAICS + competition_type + set_aside_type + award_amount_range. Calculate historical win rates for similar profiles.
- **New API endpoint**: `GET /api/v1/intelligence/win-probability?agency=X&naics=Y&amount=Z&competition_type=C&set_aside=S&business_size=small`
- **Response shape**: `{ probability: 0.35, confidence: "medium", matching_awards: 47, factors: [...], comparable_awards: [...] }`
- **Confidence levels**: high (>100 matching awards), medium (20-100), low (<20), insufficient (<5 returns null)
- **Surface in UI**: Replace or augment the current bid score with "Win Likelihood: 35% (based on 47 similar awards)". Show in the BidEvaluationScreen.
- **Factors breakdown**: Show which factors helped/hurt (e.g., "Full & open competition: +12%", "Small business set-aside: +8%")
- **Build in intelligence service**: New endpoint + computation logic. Not a separate model service.

### Files to modify
- Intelligence service: new `src/api/v1/win-probability.ts` endpoint
- Intelligence service: new `src/analysis/win-probability.ts` computation
- IntentBid: `src/lib/intelligence/client.ts` — add `getWinProbability()` method
- IntentBid: `src/lib/intelligence/types.ts` — add response type
- IntentBid: `src/app/(dashboard)/proposals/new/_components/bid-evaluation-screen.tsx` — display probability
- IntentBid: `src/lib/ai/bid-scoring.ts` — incorporate probability into scoring

---

## Stream C: GAO Protest Decision Scraping

### Goal
Populate `intel_winning_patterns` and `intel_evaluation_criteria` tables with real evaluation data from GAO protest decisions.

### Decisions
- **Source**: GAO decisions are published at https://www.gao.gov/legal/bid-protests/search — free, no auth, ~2,500/year
- **Approach**: Build a scraper/adapter that fetches decision PDFs, extracts structured data using Gemini, stores in DB
- **Extract from each decision**: agency, NAICS, evaluation criteria + weights, strengths/weaknesses cited, outcome (sustained/denied), tradeoff rationale, price comparison data
- **Rate limiting**: GAO website, not an API. Respect robots.txt, throttle to 1 req/2sec
- **Storage**: Use existing `intel_winning_patterns` and `intel_evaluation_criteria` tables (schema already defined)
- **Initial load target**: Most recent 500 protest decisions
- **Gemini for extraction**: Use structured output mode to extract evaluation criteria, factor weights, strengths/weaknesses from protest decision text
- **This is intelligence-service only**: No IntentBid changes in this stream

### Files to create
- `src/adapters/gao-protests.ts` — fetcher + parser
- `src/processing/extract-protest-data.ts` — Gemini extraction pipeline
- `src/jobs/sync-gao-protests.ts` — Inngest cron job
- `scripts/gao-initial-load.ts` — bulk load script

### Files to modify
- `src/index.ts` — register new Inngest job
- `src/lib/config.ts` — add GEMINI_API_KEY config

---

## Stream D: Competitive Landscape per RFP

### Goal
When a user uploads an RFP and we extract agency + NAICS, automatically show the competitive landscape for that specific opportunity.

### Decisions
- **Trigger**: After extraction completes (agency name + NAICS code are available)
- **Data needed**: Awards from same agency + NAICS, top awardees (competitors), avg award size, competition level, typical # of offers
- **New API endpoint**: `GET /api/v1/intelligence/competitive-landscape?agency=X&naics=Y` — returns aggregated competitive analysis
- **Response shape**: `{ total_similar_awards: N, top_competitors: [{name, wins, total_value}], avg_award_amount, avg_offers, competition_mix: {full: N, sole: N}, set_aside_mix: {...}, recent_winners: [...] }`
- **Surface in UI**: New "Competitive Landscape" card in the ExtractionReview step (after agency is identified). Shows top 5 competitors, avg deal size, competition breakdown.
- **Also surface in BidEvaluationScreen**: "You'd be competing against companies like X, Y, Z who have won N similar contracts"
- **Silent degradation**: If no matching data, card doesn't render

### Files to create
- Intelligence service: `src/api/v1/competitive-landscape.ts`
- Intelligence service: `src/analysis/competitive-landscape.ts`
- IntentBid: new component in extraction review

### Files to modify
- IntentBid: `src/lib/intelligence/client.ts` — add `getCompetitiveLandscape()` method
- IntentBid: `src/lib/intelligence/types.ts` — add response type
- IntentBid: `src/components/intake/extraction-review.tsx` — add competitive landscape card
- IntentBid: bid evaluation screen — add competitor context

---

## Shared Constraints
- Every new endpoint needs tests (TDD)
- Every new client method returns T | null
- Zero type errors after each stream completes
- All existing tests must continue passing
- No breaking changes to existing functionality
- Intelligence service uses X-Service-Key header (not Authorization: Bearer)
- Production intelligence URL: https://intentbid-intelligence-1034040114938.us-east1.run.app
- Production API key: 1adef4189a2ed19c6ef5435aac6b2317f539d16b9ec48f074a9ee7a6f0ce33a6
