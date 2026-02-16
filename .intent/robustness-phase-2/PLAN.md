# Phase 2 Execution Plan: Rate Limiting

## Tasks

### Task 2.1: Set Up Redis Infrastructure (1 hour)
- [ ] Create Upstash Redis account
- [ ] Configure environment variables
- [ ] Implement `src/lib/redis/client.ts`
- [ ] Test Redis connection

### Task 2.2: Implement Rate Limiting Core (3 hours)
- [ ] Create `src/lib/middleware/rate-limit.ts` with sliding window
- [ ] Implement `src/lib/middleware/rate-limit-config.ts`
- [ ] Create quota checking utilities
- [ ] Add usage tracking functions

### Task 2.3: Apply Rate Limits to Routes (3 hours)
- [ ] Add limits to AI generation routes
- [ ] Add limits to auth endpoints (5/min)
- [ ] Add limits to file upload routes
- [ ] Add limits to export generation
- [ ] Add organization quota enforcement

### Task 2.4: Client-Side Integration (2 hours)
- [ ] Create `useCsrf()` hook
- [ ] Add CSRF token to API client
- [ ] Implement retry with exponential backoff
- [ ] Add quota usage display in UI

### Task 2.5: Monitoring & Testing (1 hour)
- [ ] Add rate limit event logging
- [ ] Create alerting for violations
- [ ] Write integration tests for limits
- [ ] Test upgrade flow on limit exceeded

## Acceptance Criteria
- Rate limits enforced on all protected routes
- 429 responses include Retry-After headers
- Quota usage displayed in settings
- Tests verify limit enforcement
- Alerts fire on excessive violations

## Dependencies
- Phase 1 (Testing Infrastructure)
- Upstash Redis account

## Risks
- Redis latency in serverless environment
- False positives on legitimate traffic
