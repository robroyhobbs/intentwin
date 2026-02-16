# Phase 1: Testing Infrastructure

## Intent

Establish comprehensive, reliable test coverage for IntentWin to prevent regressions, enable confident refactoring, and ensure production readiness. Move from 15 sparse test files to full E2E, integration, and unit test coverage.

## Problem Statement

Current state:
- Only 15 test files for entire codebase
- Mock Supabase client duplicated across tests (verbose, inconsistent)
- No E2E tests (Playwright installed but unused)
- No integration tests with real database
- Critical user flows untested: signup → proposal → export
- Security policies (RLS) not programmatically verified

This creates risk:
- Refactoring AI pipeline is dangerous without test safety net
- Multi-tenancy bugs could leak data between organizations
- Export failures only discovered in production

## Goals

1. **Reusable Test Infrastructure** - Extract mock utilities used across all tests
2. **E2E Coverage** - Critical user paths tested end-to-end
3. **Integration Tests** - Database operations with real Supabase test instance
4. **Security Tests** - Verify RLS policies prevent cross-tenant access
5. **CI-Ready** - Tests run in < 5 minutes, reliable in CI environment

## Success Criteria

| Metric | Current | Target |
|--------|---------|--------|
| Test files | 15 | 50+ |
| Code coverage | ~15% | 70%+ |
| E2E critical paths | 0 | 5 |
| Integration tests | 0 | 10+ |
| Mock utility reuse | 0% | 90%+ |
| CI test duration | N/A | < 5 min |

## Technical Approach

### 1. Test Utilities Module

Create centralized test utilities:

```
src/lib/test-utils/
├── mock-supabase.ts      # Reusable Supabase client mock
├── mock-ai.ts            # AI provider mocks (Gemini, Voyage)
├── mock-stripe.ts        # Stripe SDK mock
├── test-data.ts          # Factory functions for test data
├── setup.ts              # Vitest setup (cleanup, env)
└── e2e/
    ├── auth-helper.ts    # E2E authentication helpers
    └── fixtures.ts       # Test fixtures and seeds
```

### 2. E2E Test Suite

Cover critical paths:

**Path 1: Onboarding Flow**
- Visit signup → Create account → Complete onboarding wizard
- Verify organization auto-created
- Verify dashboard checklist appears

**Path 2: Proposal Creation**
- Create new proposal → Fill RFP details → Generate sections
- Verify all 10 sections generated
- Verify quality review triggered

**Path 3: Export Pipeline**
- Export proposal to all 5 formats (HTML, DOCX, PPTX, PDF, Slides)
- Verify branding applied
- Verify content integrity

**Path 4: Knowledge Base**
- Upload document → Process → Search
- Verify embeddings created
- Verify RAG retrieval works

**Path 5: Multi-Tenancy Isolation**
- Create data as Org A
- Verify Org B cannot access
- Verify RLS policies enforced

### 3. Integration Test Suite

Test with real Supabase test database:

**AI Pipeline Integration**
- Full pipeline execution with real API calls
- Verify section generation quality
- Verify persuasion layer applied

**Database Operations**
- CRUD operations on all tables
- Verify RLS policies active
- Verify cascade deletes

**Export Generation**
- Real export generation (not mocked)
- Verify file integrity
- Verify branding application

### 4. Security Tests

Programmatically verify security:

```typescript
describe("RLS Policies", () => {
  test("org A cannot read org B proposals", async () => {
    // Attempt cross-tenant access via raw SQL
    // Verify permission denied
  });
  
  test("anon user cannot access any data", async () => {
    // Attempt queries without auth
    // Verify all fail
  });
});
```

## Test Data Strategy

### Factories (test-data.ts)

```typescript
export function createMockOrganization(overrides?: Partial<Organization>) {
  return {
    id: nanoid(),
    name: "Test Organization",
    plan_tier: "starter",
    ...overrides
  };
}

export function createMockProposal(overrides?: Partial<Proposal>) {
  return {
    id: nanoid(),
    title: "Test Proposal",
    status: "draft",
    ...overrides
  };
}
```

### Test Database Setup

- Use Supabase local instance for integration tests
- Run migrations before test suite
- Seed with minimal required data
- Clean up after each test

## Configuration

### Vitest Config Updates

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/lib/test-utils/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: [
        "node_modules",
        "src/lib/test-utils/**/*",
        "**/*.d.ts"
      ]
    },
    pool: "forks", // Isolate tests
    poolOptions: {
      forks: {
        singleFork: true // For Supabase connection safety
      }
    }
  }
});
```

### Playwright Config

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // Auth state conflicts
  workers: 1,
  use: {
    baseURL: process.env.TEST_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry"
  },
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    { 
      name: "chromium", 
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"]
    }
  ]
});
```

## File Structure

```
__tests__/
├── unit/
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── pipeline.test.ts
│   │   │   ├── quality-overseer.test.ts
│   │   │   └── bid-scoring.test.ts
│   │   ├── export/
│   │   │   ├── pdf-generator.test.ts
│   │   │   └── pptx-generator.test.ts
│   │   └── supabase/
│   │       └── auth-api.test.ts
│   └── components/
│       └── proposal-editor.test.tsx
├── integration/
│   ├── api/
│   │   ├── proposals.integration.test.ts
│   │   ├── documents.integration.test.ts
│   │   └── stripe.integration.test.ts
│   ├── ai/
│   │   └── pipeline.integration.test.ts
│   └── security/
│       └── rls-policies.test.ts
└── e2e/
    ├── auth.setup.ts
    ├── onboarding.spec.ts
    ├── proposal-flow.spec.ts
    ├── export.spec.ts
    ├── knowledge-base.spec.ts
    └── multi-tenancy.spec.ts
```

## Dependencies

Add to devDependencies:
- `@playwright/test` (already present)
- `@vitest/coverage-v8`
- `msw` (Mock Service Worker for API mocking)
- `factory.ts` or `@faker-js/faker` (test data generation)

## Out of Scope

- Visual regression testing (future)
- Load/performance testing (separate initiative)
- Mobile-specific E2E tests (desktop only for now)

## Decisions

| Decision | Options | Choice | Rationale |
|----------|---------|--------|-----------|
| Test DB | Local Supabase vs TestContainers | Local Supabase | Faster, matches prod |
| E2E Browser | Chrome only vs Multi-browser | Chrome only | Faster, covers 80% |
| Mock Strategy | MSW vs Manual mocks | Hybrid | MSW for API, manual for AI |
| Coverage Tool | v8 vs istanbul | v8 | Native, faster |

## Verification Checklist

- [ ] All 5 critical E2E paths passing
- [ ] 70%+ code coverage reported
- [ ] Tests pass in CI environment
- [ ] Mock utilities used in 90%+ of tests
- [ ] Security tests verify RLS policies
- [ ] Integration tests use real database
- [ ] Test duration < 5 minutes
- [ ] No test flakes (3 consecutive green runs)

## Success Metrics

Upon completion:
- Developers can refactor AI pipeline with confidence
- New features include tests in PR template
- CI blocks PRs with < 70% coverage
- Zero production bugs in tested critical paths
