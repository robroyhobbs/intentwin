# Phase 7: Code Quality

## Intent

Improve codebase maintainability through code consolidation, documentation, and cleanup. Reduce duplication and establish consistent patterns.

## Goals

1. **Consolidate Duplicates** - Merge repeated code into shared utilities
2. **Add Documentation** - JSDoc comments for key functions
3. **Error Boundaries** - React error boundaries for graceful failures
4. **Standardize Patterns** - Consistent code style across codebase

## Technical Approach

### 1. Consolidate Mock Utilities

```typescript
// src/lib/test-utils/mock-factories.ts
export function createMockSupabaseChain() {
  const chain: any = {};
  const methods = ["select", "insert", "update", "delete", "eq", "neq", "in", "order", "limit", "single"];
  
  methods.forEach(method => {
    chain[method] = vi.fn(() => chain);
  });
  
  chain.then = vi.fn((cb: Function) => Promise.resolve(cb({ data: null, error: null })));
  
  return chain;
}

export function createMockOrganization(overrides?: Partial<Organization>) {
  return {
    id: nanoid(),
    name: "Test Org",
    plan_tier: "starter",
    ...overrides
  };
}
```

### 2. JSDoc Documentation

```typescript
/**
 * Generates a proposal section using AI with L1 context and RAG retrieval.
 * 
 * @param proposalId - The UUID of the proposal
 * @param sectionType - The type of section to generate
 * @param options - Optional generation parameters
 * @returns The generated section content with metadata
 * @throws {GenerationError} If AI generation fails
 * 
 * @example
 * const section = await generateSection("uuid", "executive_summary", {
 *   feedback: "Make it more concise"
 * });
 */
export async function generateSection(
  proposalId: string,
  sectionType: SectionType,
  options?: GenerationOptions
): Promise<GeneratedSection> {
  // Implementation
}
```

### 3. Error Boundaries

```typescript
// src/components/error-boundary.tsx
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error("React Error Boundary", error, { errorInfo });
    Sentry.captureException(error, { extra: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### 4. Loading States

```typescript
// src/components/loading/proposal-skeleton.tsx
export function ProposalSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    </div>
  );
}
```

## Verification

- [ ] Mock utilities consolidated and reused
- [ ] 80% of exported functions have JSDoc
- [ ] Error boundaries on all major routes
- [ ] Loading states for all async operations
- [ ] ESLint passes with no warnings
