# Execution Plan: industry-intelligence

## Overview

Add industry-specific intelligence configs (pain points, terminology, priorities, win themes, section guidance) for 4 industries. Pipeline.ts builds an `industryContext` string and appends it to prompts — same pattern as existing persuasion layers. Zero changes to prompt builder signatures.

## Prerequisites

- Existing industry dropdown with 8 options (already in place)
- Existing pipeline.ts section generation loop (already in place)
- Existing outcomes route for win strategy generation (already in place)

---

## Phase 0: Industry Config Files

### Description

Create `src/lib/ai/industry-configs/` with the `IndustryConfig` type, `getIndustryConfig()` lookup, `buildIndustryContext()` string builder, and 4 industry config files.

### Tests

#### Happy Path

- [x] `getIndustryConfig("healthcare")` returns full IndustryConfig object
- [x] `getIndustryConfig("financial_services")` returns Financial Services config
- [x] `getIndustryConfig("public_sector")` returns Public Sector config
- [x] `getIndustryConfig("manufacturing")` returns Manufacturing config
- [x] `buildIndustryContext()` returns formatted string with pain points, keywords, priorities
- [x] `buildIndustryContext()` includes section-specific guidance when sectionType provided
- [x] Each config has at least 3 pain points, 5 keywords, 3 priorities, 2 win themes

#### Bad Path

- [x] `getIndustryConfig("other")` returns null
- [x] `getIndustryConfig("")` returns null
- [x] `getIndustryConfig("nonexistent_industry")` returns null
- [x] `buildIndustryContext()` with null config returns empty string

#### Edge Cases

- [x] `buildIndustryContext()` with config that has empty painPoints array omits that section
- [x] `buildIndustryContext()` with config that has empty keywords array omits that section
- [x] `buildIndustryContext()` with unknown sectionType omits section guidance
- [x] Config keys match exactly the dropdown values in proposals/new/page.tsx

#### Security

- [x] No sensitive data in any industry config (no API keys, no credentials)
- [x] Config files export only typed data, no executable logic

#### Data Leak

- [x] Industry context string doesn't reference internal file paths or system details
- [x] Error messages from getIndustryConfig don't expose filesystem structure

#### Data Damage

- [x] Config objects are read-only (not mutated by callers)
- [x] Calling getIndustryConfig multiple times returns consistent data

### E2E Gate

```bash
# TypeScript compilation
npx tsc --noEmit 2>&1 | grep -E "industry-configs" | head -5

# Verify module resolves
node -e "const m = require('./src/lib/ai/industry-configs'); console.log(Object.keys(m))"

# Verify all 4 configs exist
node -e "
const { getIndustryConfig } = require('./src/lib/ai/industry-configs');
['financial_services','healthcare','public_sector','manufacturing'].forEach(k => {
  const c = getIndustryConfig(k);
  if (!c) { console.error('MISSING:', k); process.exit(1); }
  console.log('OK:', k, '-', c.displayName);
});
console.log('All configs verified');
"
```

### Acceptance Criteria

- [ ] `src/lib/ai/industry-configs/index.ts` exports `IndustryConfig`, `getIndustryConfig()`, `buildIndustryContext()`
- [ ] 4 industry config files created with substantive content
- [ ] All 6 test categories pass
- [ ] TypeScript compiles with no errors

---

## Phase 1: Pipeline & Win Strategy Integration

### Description

Modify `pipeline.ts` to look up the industry config, build the `industryContext` string, and append it to each section prompt (same pattern as persuasion layers). Modify the outcomes route to inject win themes into strategy generation. No prompt builder signature changes needed.

### Tests

#### Happy Path

- [x] Pipeline appends industry context to prompt when industry has a config
- [x] Industry context includes section-specific guidance for each section type
- [x] Win strategy generation includes industry win themes when config exists
- [x] Generated proposal sections reference industry-specific terminology
- [x] Pipeline still generates all 10 sections successfully with industry context

#### Bad Path

- [x] Pipeline works correctly when industry is "other" (no config, no injection)
- [x] Pipeline works correctly when industry is empty string
- [x] Pipeline works correctly when intake_data has no client_industry field
- [x] Outcomes route works correctly when no industry config exists

#### Edge Cases

- [x] Pipeline with industry config + persuasion layers produces valid combined prompt
- [x] Very long industry context doesn't cause prompt truncation issues
- [x] Pipeline with all optional params (winStrategy, companyInfo, industryContext) works
- [x] Industry context appears after base prompt but integrates with persuasion layers

#### Security

- [x] Industry config content is sanitized (no prompt injection vectors in config data)
- [x] No user-controlled input flows directly into industry config lookup key without validation

#### Data Leak

- [x] Industry context doesn't expose internal config structure in generated content
- [x] Error during config lookup doesn't leak filesystem details to API response

#### Data Damage

- [x] Adding industry context doesn't modify the original intakeData object
- [x] Industry context injection doesn't break existing section generation for any section type
- [x] Outcomes route still returns valid WinStrategyData shape with industry injection

### E2E Gate

```bash
# TypeScript compilation
npx tsc --noEmit 2>&1 | grep -E "pipeline|outcomes" | head -5

# Production build
npx next build 2>&1 | tail -5

# Verify pipeline imports resolve
node -e "const p = require('./src/lib/ai/pipeline'); console.log('pipeline OK')"
```

### Acceptance Criteria

- [x] `pipeline.ts` imports and uses `getIndustryConfig` + `buildIndustryContext`
- [x] Industry context appended to prompts for configured industries
- [x] Outcomes route injects win themes for configured industries
- [x] No changes to any prompt builder function signatures
- [x] All 6 test categories pass
- [x] Production build succeeds
- [x] Backward compatible — unconfigured industries work exactly as before

---

## Final E2E Verification

```bash
# Full TypeScript check
npx tsc --noEmit

# Production build
npx next build

# Verify all industry configs load
node -e "
const { getIndustryConfig, buildIndustryContext } = require('./src/lib/ai/industry-configs');
['financial_services','healthcare','public_sector','manufacturing'].forEach(k => {
  const c = getIndustryConfig(k);
  const ctx = buildIndustryContext(c, 'executive_summary');
  console.log(k, ':', ctx.length, 'chars');
});
console.log('null config:', buildIndustryContext(null).length === 0 ? 'OK (empty)' : 'FAIL');
"
```

## Risk Mitigation

| Risk                                    | Mitigation                                                | Contingency                  |
| --------------------------------------- | --------------------------------------------------------- | ---------------------------- |
| Industry terminology is inaccurate      | Configs are plain TS files, easy to review and edit       | Update config and redeploy   |
| Industry context makes prompts too long | Block is ~150 words max                                   | Trim config arrays if needed |
| Generated content sounds templated      | Prompt says "use naturally"                               | Adjust guidance wording      |
| Breaking existing section generation    | No signature changes, context appended same as persuasion | Revert pipeline changes only |

## References

- [Intent](./industry-intelligence.intent.md)
