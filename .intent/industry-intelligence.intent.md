# Industry Intelligence — Invisible Prompt Configs

## 1. Overview

**Product positioning:** Make proposals industry-aware by injecting sector-specific pain points, terminology, and win themes into the existing generation pipeline — without adding any new UI steps.

**Core concept:** A set of TypeScript config files (one per industry) that provide industry-specific context to the prompt builders. When a user selects "Healthcare" in the existing dropdown, the system automatically injects healthcare pain points, language, priorities, and win themes into every section prompt and the win strategy generator.

**Priority:** High — directly improves proposal quality and perceived expertise.

**Target user:** Proposal authors who already select an industry during intake.

**Project scope:** Add industry config files + modify existing prompt builders and win strategy generation. No new UI, no database changes, no new API endpoints.

## 2. Architecture

```
src/lib/ai/
├── industry-configs/
│   ├── index.ts                    # getIndustryConfig() + IndustryConfig type
│   ├── financial-services.ts       # Financial Services config
│   ├── healthcare.ts               # Healthcare config
│   ├── public-sector.ts            # Public Sector config
│   └── manufacturing.ts            # Manufacturing config
├── prompts/
│   ├── understanding.ts            # MODIFIED: accepts industryContext string
│   ├── executive-summary.ts        # MODIFIED: accepts industryContext string
│   ├── approach.ts                 # MODIFIED: accepts industryContext string
│   ├── case-studies.ts             # MODIFIED: accepts industryContext string
│   ├── why-us.ts                   # MODIFIED: accepts industryContext string
│   ├── methodology.ts              # MODIFIED: accepts industryContext string
│   ├── team.ts                     # MODIFIED: accepts industryContext string
│   ├── timeline.ts                 # MODIFIED: accepts industryContext string
│   ├── pricing.ts                  # MODIFIED: accepts industryContext string
│   └── risk-mitigation.ts          # MODIFIED: accepts industryContext string
└── pipeline.ts                     # MODIFIED: looks up config, builds string, passes to prompts
```

### Data Flow

```
User selects "healthcare" in dropdown (existing)
        ↓
pipeline.ts reads intake_data.client_industry
        ↓
getIndustryConfig("healthcare") → IndustryConfig | null
        ↓
pipeline.ts builds industryContext string from config
        ↓
industryContext string passed to each buildPrompt() function
        ↓
Claude generates industry-aware content
```

## 3. Detailed Behavior

### 3.1 IndustryConfig Type

```typescript
export interface IndustryConfig {
  key: string; // "healthcare" — matches dropdown value
  displayName: string; // "Healthcare & Life Sciences"

  // Pain points common in this industry
  painPoints: string[]; // ["HIPAA compliance burden", "interoperability challenges", ...]

  // Industry-specific terminology the proposal should use
  keywords: string[]; // ["patient outcomes", "clinical workflows", "EHR", ...]

  // What matters most to buyers in this vertical
  priorities: string[]; // ["Regulatory compliance", "Patient data security", ...]

  // Win themes to inject into Phase 2 win strategy generation
  winThemes: string[]; // ["Deep healthcare regulatory expertise", ...]

  // Per-section guidance injected into prompts
  sectionGuidance: Partial<Record<SectionType, string>>;
  // e.g., { executive_summary: "Emphasize patient outcomes and compliance posture", ... }
}
```

### 3.2 Config Lookup

```typescript
export function getIndustryConfig(industryKey: string): IndustryConfig | null {
  return INDUSTRY_CONFIGS[industryKey] ?? null;
}
```

- Returns `null` for unknown industries (including "other")
- When `null`, prompts behave exactly as they do today — full backward compatibility

### 3.3 Prompt Injection

`pipeline.ts` builds the `industryContext` string once, then passes it to every `buildPrompt()` function as an optional `industryContext?: string` param. Prompt builders just append it — they don't import or know about IndustryConfig.

Example generated string for healthcare:

```
## Industry Intelligence
This proposal targets the Healthcare & Life Sciences sector.

**Key industry pain points to address:**
- HIPAA compliance burden across cloud workloads
- Legacy EHR system interoperability challenges
- Rising cybersecurity threats to patient data

**Use this terminology naturally:**
patient outcomes, clinical workflows, EHR integration, care delivery, population health, value-based care

**Buyer priorities in this sector:**
1. Regulatory compliance (HIPAA, HITECH, FDA)
2. Patient data security and privacy
3. Interoperability and system integration
4. Cost reduction without compromising care quality

**Section-specific guidance:**
Emphasize patient outcomes and compliance posture. Reference specific regulations by name.
```

### 3.4 Win Strategy Injection

The `/api/proposals/temp/outcomes` endpoint (Phase 2) already generates win themes. The industry config's `winThemes` are injected into that prompt so the AI proposes industry-relevant differentiators.

### 3.5 Graceful Degradation

- Industry not in configs → no injection, behaves like today
- Config has empty arrays → no injection for that field
- New industries added later → create a new config file, no other changes

## 4. MVP Industry Configs

### Financial Services

- Pain points: regulatory burden (SOX, PCI-DSS, Basel III), legacy core banking systems, fraud detection at scale, real-time transaction processing
- Terminology: risk management, regulatory compliance, fintech, open banking, AML/KYC, digital banking
- Priorities: Regulatory compliance, security, real-time processing, cost optimization
- Win themes: Deep financial regulatory expertise, proven core banking modernization

### Healthcare

- Pain points: HIPAA compliance, EHR interoperability, clinical workflow inefficiency, patient data fragmentation
- Terminology: patient outcomes, clinical workflows, EHR, HIPAA, care delivery, population health, value-based care
- Priorities: Regulatory compliance, patient data security, interoperability, care quality
- Win themes: Healthcare data security leadership, clinical workflow transformation experience

### Public Sector

- Pain points: FedRAMP authorization burden, citizen experience gaps, legacy system modernization mandates, budget constraints
- Terminology: citizen services, mission-critical, FedRAMP, FISMA, authority to operate (ATO), zero trust
- Priorities: Compliance (FedRAMP/FISMA), security clearance, citizen experience, cost efficiency
- Win themes: Federal compliance expertise, mission-critical system modernization

### Manufacturing

- Pain points: supply chain visibility gaps, OT/IT convergence challenges, predictive maintenance adoption, Industry 4.0 readiness
- Terminology: smart factory, digital twin, predictive maintenance, supply chain resilience, OT/IT convergence, Industry 4.0
- Priorities: Operational efficiency, supply chain resilience, quality control, sustainability
- Win themes: Smart manufacturing transformation, supply chain digitization expertise

## 5. Technical Implementation Guide

### Files to Create

1. `src/lib/ai/industry-configs/index.ts` — type + lookup function
2. `src/lib/ai/industry-configs/financial-services.ts`
3. `src/lib/ai/industry-configs/healthcare.ts`
4. `src/lib/ai/industry-configs/public-sector.ts`
5. `src/lib/ai/industry-configs/manufacturing.ts`

### Files to Modify

1. `src/lib/ai/pipeline.ts` — look up config, build `industryContext` string, pass to prompt builders
2. `src/lib/ai/prompts/*.ts` (all 10 section prompts) — accept optional `industryContext?: string`, append to prompt
3. `src/app/api/proposals/temp/outcomes/route.ts` — inject win themes into strategy generation

### Injection Pattern

`pipeline.ts` is the only file that imports from `industry-configs/`. It builds the string via `buildIndustryContext()` in `index.ts`, then passes it as a plain string to each prompt builder. Prompt builders just do:

```typescript
// In each buildXxxPrompt() function
export function buildUnderstandingPrompt(
  intakeData: Record<string, unknown>,
  analysis: string,
  retrievedContext: string,
  winStrategy?: WinStrategyData | null,
  companyInfo?: CompanyInfo,
  industryContext?: string, // NEW — just a string, no type import needed
) {
  let prompt = `... existing prompt ...`;
  if (industryContext) {
    prompt += `\n\n${industryContext}`;
  }
  return prompt;
}
```

## 6. Decisions Summary

| Decision          | Choice                                            | Rationale                                           |
| ----------------- | ------------------------------------------------- | --------------------------------------------------- |
| MVP industries    | Top 4 (Financial, Healthcare, Gov, Manufacturing) | Highest differentiation, most distinct needs        |
| Storage           | TypeScript config files                           | Version-controlled, no DB migration, easy to review |
| Intelligence type | Pain points + language + win themes               | Biggest impact on perceived expertise               |
| Section changes   | Same 10, smarter content                          | Zero disruption, no structural risk                 |
| Win strategy      | Yes, inject industry themes                       | Improves Phase 2 quality at minimal cost            |
| Injection method  | pipeline.ts builds string, prompts just append    | Only 1 file imports configs; prompts stay simple    |
| avoidTerms        | Dropped from config type                          | Unreliable in LLM prompts; use sectionGuidance      |
| Fallback          | Return null, no injection                         | Full backward compatibility                         |

## 7. MVP Scope

### Included

- 4 industry config files (financial, healthcare, public sector, manufacturing)
- IndustryConfig type + lookup + buildIndustryContext() in index.ts
- Modify pipeline.ts to build industryContext string
- Modify all 10 section prompt builders (append string param)
- Modify win strategy generation
- Graceful fallback for unconfigured industries

### Excluded

- Admin UI for editing industry configs
- Database-backed configs
- Per-industry section lists (all 10 stay the same)
- Quality review scoring calibration per industry (future enhancement)
- Compliance-specific requirements (future — focus on pain points & language first)
- Industries beyond the top 4 (can add config files later)

## 8. Risks

| Risk                                                  | Mitigation                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------- |
| Industry config has inaccurate terminology            | Configs are plain TypeScript — easy to review and update            |
| Prompt gets too long with injection                   | Block is ~150 words max, well within context window                 |
| Industry intelligence makes proposals sound templated | Instructions say "use naturally" — AI weaves in, doesn't copy-paste |
| Missing config for "other" industry                   | Returns null, falls back to current behavior                        |

## 9. Open Items

None — all decisions resolved.
