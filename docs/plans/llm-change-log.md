# LLM Change Log

Use this file to keep Claude and other LLMs aligned on architecture and operational changes.

## 2026-02-27T21:29:38Z — Boundary-first architecture rollout
- Added domain boundary design doc, LLM update log workflow, and intentbid-prefixed GitHub repo creation guardrail script.

## 2026-02-27T21:36:36Z — App URL + CI guardrails update
- Set app defaults to app.intentbid.com for app routes/notifications and added boundary/complexity guardrail scripts plus baseline performance capture workflow.

## 2026-02-27T21:38:42Z — Wizard slice interface extraction
- Moved proposal wizard draft persistence into src/lib/proposal-core/wizard-draft.ts and wired WizardProvider to this module to begin proposal-core boundary separation.

## 2026-02-27T22:18:42Z — Wizard state boundary extraction
- Moved wizard state, actions, metadata, and reducer into src/lib/proposal-core/wizard-state.ts with app-layer shim re-exports to preserve behavior while enforcing proposal-core boundaries.

## 2026-02-27T22:20:12Z — Wizard runtime imports moved to proposal-core
- Wizard provider/shell/sidebar/step-generate now import wizard state contracts directly from src/lib/proposal-core/wizard-state.ts; app-layer shims retained for compatibility.

## 2026-02-27T22:21:13Z — Export format contracts centralized
- Added src/lib/export/formats.ts with canonical format/type/extension/mime contracts and updated export API + export UI to use shared contracts.

## 2026-02-27T22:24:39Z — Intelligence contracts + compatibility
- Added IntelligenceService contracts while keeping intelligenceClient import compatibility for existing AI module mocks/tests; accessor available for future DI migration.

## 2026-02-27T22:25:41Z — Ownership + PR hardening
- Added .github/CODEOWNERS and PR template requiring boundary/perf/rollback checks; linked these guardrails in CLAUDE.md.

## 2026-02-27T22:46:54Z — Export route lazy-load optimization
- Switched proposal export API route to dynamic imports per requested format, reducing cold-path module loading for non-used export generators.

## 2026-02-27T23:09:22Z — Perf wave2 instrumentation + cache hygiene
- Added export route completion timing/size logs and bounded intelligence cache cleanup with non-mutating cache-key generation; verified with tests/typecheck/build and refreshed baseline.

## 2026-02-27T23:47:44Z — Observability + perf monitoring rollout
- Added runtime SLO warnings for export/intelligence paths, automated perf threshold checker, and weekly GitHub performance monitor workflow with artifacts.

## 2026-02-28T03:31:51Z — Production smoke monitoring
- Added production smoke script and hourly GitHub workflow for intentbid.com + app.intentbid.com health checks.

## 2026-02-28T03:49:56Z — Ops hardening rollout
- Added status+latency+content production smoke assertions, monitor failure alert hooks (Slack/Resend), and release-gate workflow with optional rollback webhook.

## 2026-02-28T06:04:05Z — Release gate automation
- Updated release-gate workflow to auto-run on main/master pushes, resolve deploy command from DEPLOY_COMMAND secret, and send failure alerts for deploy/smoke failures.

## 2026-02-28T06:29:20Z — Low-risk maintenance cleanup
- Standardized error boundary logging to structured logger, removed redundant test unhandled rejection handler, and added annotation error context metadata for observability.

## 2026-02-28T06:36:27Z — Optimization batch: email+rate-limit
- Added shared getFirstName helper across nurture/waitlist email templates and simplified rate limiter internals with optional unref + shared window-start helper.

## 2026-02-28T06:43:42Z — Modularization: export runtime extraction
- Moved export generator runtime branching from API route into src/lib/export/runtime.ts and updated route to delegate to shared module.

## 2026-02-28T07:10:45Z — Release gate verified
- Release Gate run 22515843699 succeeded end-to-end (pre-smoke, deploy, post-smoke). DEPLOY_COMMAND/VERCEL_TOKEN flow is now validated.

## 2026-02-28T07:27:48Z — Performance wave 3: export timing
- Added Server-Timing response metrics on export API for fetch/generate/upload/sign/status/total phases to support real-user latency analysis.
