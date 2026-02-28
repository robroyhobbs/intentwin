# IntentWin Domain Boundaries (v1)

## Goal
Keep feature velocity high without monolith drift by enforcing explicit module ownership and dependency flow.

## Domains

1. **proposal-core**
   - Scope: intake normalization, proposal orchestration, sections, quality loop inputs.
   - Current homes: `src/lib/ai/**`, `src/inngest/functions/**`, proposal-focused API routes.

2. **intelligence-client**
   - Scope: all reads/writes to intelligence service, adapters, caching, resilience policy.
   - Current homes: `src/lib/intelligence/**`, intelligence-related API route handlers.

3. **export-engine**
   - Scope: DOCX/PDF/PPTX/HTML/Slides generators and shared export contracts.
   - Current homes: `src/lib/export/**`, export API route handlers.

4. **workspace-ui**
   - Scope: dashboard UX flows, wizard/editor state orchestration, view components.
   - Current homes: `src/app/(dashboard)/**`, `src/components/**`.

5. **platform**
   - Scope: auth, tenancy, DB clients, observability, security, shared APIs/utilities.
   - Current homes: `src/lib/supabase/**`, `src/lib/security/**`, `src/lib/observability/**`, `src/lib/api/**`.

## Dependency Direction

- `workspace-ui` -> `proposal-core`, `intelligence-client`, `export-engine`, `platform`
- `proposal-core` -> `intelligence-client`, `export-engine`, `platform`
- `intelligence-client` -> `platform`
- `export-engine` -> `platform`
- `platform` -> (none of the feature domains)

No lateral shortcuts that bypass domain API/contracts.

## Guardrails

- Add CI import-boundary checks (Phase 1).
- Enforce changed-file complexity budgets.
- Route external-service calls through domain adapters only.
- Add CODEOWNERS by domain before final hardening.

