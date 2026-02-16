# Phase 3 Execution Plan: Security Audit Completion

## Tasks

### Task 3.1: Console Statement Audit (2 hours)
- [ ] Run `scripts/audit-console-statements.ts`
- [ ] Review all 55 console statements
- [ ] Remove or sanitize PII in logs
- [ ] Replace with structured logger
- [ ] Verify no tokens/secrets exposed

### Task 3.2: Add Request Size Limits (1 hour)
- [ ] Create `src/lib/middleware/size-limit.ts`
- [ ] Apply limits to all API routes
- [ ] Set 50MB for uploads, 10MB for exports, 5MB for AI
- [ ] Return 413 with helpful message

### Task 3.3: Implement CSRF Protection (3 hours)
- [ ] Create `src/lib/csrf/csrf-token.ts`
- [ ] Implement Double Submit Cookie pattern
- [ ] Create CSRF API route for token retrieval
- [ ] Add CSRF header validation middleware
- [ ] Create `useCsrf()` React hook
- [ ] Apply to all state-changing routes

### Task 3.4: Input Sanitization (2 hours)
- [ ] Install `isomorphic-dompurify`
- [ ] Create `src/lib/sanitize/input-sanitizer.ts`
- [ ] Add HTML sanitization for rich text
- [ ] Add plain text sanitization
- [ ] Apply sanitization at API boundaries

### Task 3.5: Auth Coverage Verification (2 hours)
- [ ] Run `scripts/verify-auth-coverage.ts`
- [ ] Fix any routes missing auth checks
- [ ] Verify organization scoping on all queries
- [ ] Add missing `verifyProposalAccess` calls
- [ ] Test cross-tenant access prevention

### Task 3.6: Security Headers (1 hour)
- [ ] Update `vercel.json` CSP headers
- [ ] Add X-Frame-Options: DENY
- [ ] Add X-Content-Type-Options: nosniff
- [ ] Add Referrer-Policy
- [ ] Test with security scanner

## Acceptance Criteria
- Zero sensitive data in logs
- All routes enforce size limits
- CSRF tokens required on POST/PUT/DELETE
- Input sanitized before storage
- 100% of API routes have auth verification
- Security headers pass scanner checks

## Dependencies
- Phase 2 (Rate Limiting)

## Risks
- CSRF may break external integrations (webhooks)
- Size limits may affect legitimate large uploads
