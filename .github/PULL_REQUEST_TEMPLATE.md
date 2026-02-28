## Summary

- What changed and why?

## Boundary Impact (Required)

- Domain(s) touched: `proposal-core` / `export-engine` / `intelligence-client` / `workspace-ui` / `platform`
- [ ] No new cross-domain imports
- [ ] If cross-domain change is intentional, justification is documented

## Performance Impact (Required)

- [ ] No material performance impact
- [ ] Performance impact measured (include baseline/delta if relevant)
- Build/typecheck/test/runtime notes:

## Verification

- [ ] `npm run guardrails:boundaries`
- [ ] `npm run guardrails:complexity:changed` (or CI equivalent)
- [ ] Targeted tests for touched modules
- [ ] Typecheck passes

## Rollback Plan (Required)

- If this causes regressions, what exact files/flags are reverted first?

## LLM/Agent Sync

- [ ] Logged architecture/process change via `scripts/notify-llms.sh`
