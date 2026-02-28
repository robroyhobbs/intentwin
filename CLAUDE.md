# IntentBid — Agent Instructions

## Code Quality Constraints

These rules apply to ALL code written in this project by any agent or human.

### File Size Limits

- **Source files**: 300 lines max (enforced by ESLint `max-lines`)
- **Page components** (`page.tsx`, `layout.tsx`): 600 lines max (orchestrators that wire sub-components)
- **Style/constant/type files** (`styles.ts`, `constants.ts`, `types.ts`): 600 lines max
- **Test files**: No limit (test setup can be verbose)

When a file approaches the limit, split it:
- Extract sub-components into a `_components/` directory next to the page
- Extract utility functions into `lib/` modules
- Extract types into a `types.ts` file
- Extract constants into a `constants.ts` file

### Function Size Limits

- **Regular functions**: 50 lines max (enforced by ESLint `max-lines-per-function`)
- **Page component default exports**: 150 lines max
- **Max nesting depth**: 4 levels
- **Max parameters**: 5 per function (use an options object for more)

### Linting

Run `npx eslint <changed-files>` before considering work complete. The project must maintain **0 ESLint errors**. Warnings are acceptable for existing code but new code should produce 0 warnings.

Key rules:
- No `console.log` — use `import { logger } from "@/lib/utils/logger"` instead
- No unused variables — prefix intentionally unused params with `_`
- No `any` types in source code (allowed in tests)
- Use `===` instead of `==` (except for null checks)

### Import Conventions

- Use `@/` path aliases for all project imports
- Import types with `import type { ... }` when possible
- Group imports: React/Next → external libs → `@/` internal → relative
- No barrel re-exports (`index.ts` files that just re-export) — they create dead code

## Architecture

See `AGENTS.md` for the full product overview, IDD 3-layer model, API patterns, and gotchas.

### Key Reminders

- **Multi-tenancy**: ALL database queries MUST scope by `organization_id`
- **Auth**: Use `getUserContext()` in API routes, never `getAuthUser()` directly
- **AI routes**: Set `maxDuration` to 300 for AI-heavy API routes
- **Logging**: Use structured logger with correlation IDs, not `console.log`
- **Error responses**: Use `apiError()` / `apiSuccess()` from `@/lib/api/response.ts`
- **Input sanitization**: Use `sanitizeInput()` from `@/lib/security/sanitize.ts` for user input

### Architecture + Coordination Guardrails

- Domain boundary plan lives in `docs/plans/domain-boundaries.md` and should be treated as active guidance for new code placement and imports.
- CODEOWNERS source of truth: `.github/CODEOWNERS`.
- PR checklist source of truth: `.github/PULL_REQUEST_TEMPLATE.md`.
- Log architecture or process changes for Claude/other LLMs with:
  - `bash scripts/notify-llms.sh "<title>" "<summary>"`
- When creating new GitHub repositories for this project family, use:
  - `bash scripts/create-intentbid-repo.sh <suffix>`
  - Repositories must use the `intentbid-*` prefix.
- Performance guardrails:
  - Capture baseline: `npm run perf:baseline`
  - Enforce thresholds: `npm run perf:check`
  - Weekly monitor workflow: `.github/workflows/perf-monitor.yml`
- Production URL smoke checks:
  - Manual/local: `npm run smoke:prod`
  - Scheduled monitor: `.github/workflows/prod-smoke.yml`
  - Release gate: `.github/workflows/release-gate.yml` (auto-runs on `main`/`master` pushes, plus manual dispatch)
  - Deployment command secret: `DEPLOY_COMMAND` (used by release gate on push runs)
  - Optional rollback trigger secret: `ROLLBACK_WEBHOOK_URL`
- Alerting channels for monitor failures:
  - Slack: `SLACK_WEBHOOK_URL`
  - Email via Resend: `RESEND_API_KEY`, `ALERT_EMAIL_FROM`, `ALERT_EMAIL_TO`

## Testing

- Test runner: `vitest` (run with `npx vitest run`)
- E2E: Playwright (not currently in CI)
- Pre-existing test failures: `quality-overseer.test.ts` (9) and `bulk-import-api.test.ts` (14) need full rewrites
- New code should include tests. Run `npx vitest run` to verify 0 regressions.
