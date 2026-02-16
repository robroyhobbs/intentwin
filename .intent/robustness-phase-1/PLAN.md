# Phase 1 Execution Plan: Testing Infrastructure

## Tasks

### Task 1.1: Set Up Test Infrastructure (2 hours)
- [ ] Create `src/lib/test-utils/` directory structure
- [ ] Implement `mock-supabase.ts` with chainable mock client
- [ ] Implement `mock-ai.ts` for Gemini/Voyage mocks
- [ ] Implement `test-data.ts` with factory functions
- [ ] Create `setup.ts` for Vitest configuration
- [ ] Update `vitest.config.ts` with coverage settings

### Task 1.2: Create E2E Test Suite (4 hours)
- [ ] Configure Playwright with auth setup
- [ ] Write `e2e/auth.setup.ts` for test authentication
- [ ] Write `e2e/onboarding.spec.ts` - signup → onboarding flow
- [ ] Write `e2e/proposal-flow.spec.ts` - create → generate → export
- [ ] Write `e2e/knowledge-base.spec.ts` - upload → search documents
- [ ] Write `e2e/multi-tenancy.spec.ts` - verify data isolation

### Task 1.3: Create Integration Tests (3 hours)
- [ ] Write `integration/ai/pipeline.integration.test.ts`
- [ ] Write `integration/api/proposals.integration.test.ts`
- [ ] Write `integration/security/rls-policies.test.ts`
- [ ] Set up test database seeding

### Task 1.4: Refactor Existing Tests (2 hours)
- [ ] Update existing tests to use new mock utilities
- [ ] Remove duplicate mock implementations
- [ ] Add missing test cases for edge scenarios

### Task 1.5: CI Integration (1 hour)
- [ ] Add test commands to package.json
- [ ] Create GitHub Actions workflow for tests
- [ ] Configure coverage reporting

## Acceptance Criteria
- All 5 E2E tests passing
- 70%+ code coverage achieved
- Tests run in < 5 minutes
- Mock utilities reused in 90%+ of tests
- No test flakes (3 consecutive green runs)

## Dependencies
- None (foundation phase)

## Risks
- Playwright browser installation issues
- Test database setup complexity
