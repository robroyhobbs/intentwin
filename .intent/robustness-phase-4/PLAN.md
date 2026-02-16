# Phase 4 Execution Plan: API Robustness

## Tasks

### Task 4.1: Create Zod Schemas (2 hours)
- [ ] Create `src/lib/schemas/api.ts`
- [ ] Define all input validation schemas
- [ ] Add type exports for TypeScript
- [ ] Create common schema utilities

### Task 4.2: Validation Middleware (2 hours)
- [ ] Create `src/lib/middleware/validate-request.ts`
- [ ] Handle Zod validation errors
- [ ] Return consistent 400 responses
- [ ] Support body, query, and param validation

### Task 4.3: Error Standardization (2 hours)
- [ ] Create `src/lib/api/errors.ts`
- [ ] Define error classes for each status code
- [ ] Create error factory functions
- [ ] Implement error handler middleware
- [ ] Ensure all errors include requestId

### Task 4.4: Request Logging (1 hour)
- [ ] Create `src/lib/middleware/request-logger.ts`
- [ ] Log all requests with correlation IDs
- [ ] Log response times
- [ ] Add request ID to response headers

### Task 4.5: Refactor Routes (4 hours)
- [ ] Refactor proposals routes with validation
- [ ] Refactor documents routes with validation
- [ ] Refactor AI routes with validation
- [ ] Refactor export routes with validation
- [ ] Apply error handling middleware
- [ ] Remove old validation code

### Task 4.6: OpenAPI Documentation (2 hours)
- [ ] Create `src/lib/api/openapi.ts`
- [ ] Generate spec from Zod schemas
- [ ] Create `/api/openapi` route
- [ ] Add swagger-ui at `/api/docs`

## Acceptance Criteria
- All API routes validate inputs
- Error format consistent
- OpenAPI spec available at `/api/openapi`
- Request logging with correlation IDs
- Validation tests passing

## Dependencies
- Phase 3 (Security Audit)

## Risks
- Route refactoring may introduce regressions
- OpenAPI generation from Zod may have limitations
