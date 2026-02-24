# Phase 6: Performance Optimization

## Intent

Optimize IntentBid for faster proposal generation and better resource utilization. Parallelize independent work, add intelligent caching, and reduce latency.

## Goals

1. **Parallel Generation** - Generate independent sections concurrently
2. **Redis Caching** - Cache L1 context and expensive computations
3. **Request Deduplication** - Prevent duplicate AI calls
4. **Database Optimization** - Add indexes and reduce N+1 queries
5. **Bundle Optimization** - Code splitting and lazy loading

## Technical Approach

### 1. Parallel Section Generation

```typescript
// src/lib/ai/pipeline-parallel.ts
export async function generateProposalSectionsParallel(
  proposalId: string,
  sections: SectionConfig[]
): Promise<GeneratedSection[]> {
  // Group sections by dependency
  const independentSections = sections.filter(s => !s.dependsOn);
  const dependentSections = sections.filter(s => s.dependsOn);

  // Phase 1: Generate independent sections in parallel
  const independentResults = await Promise.allSettled(
    independentSections.map(section => generateSection(proposalId, section))
  );

  // Phase 2: Generate dependent sections sequentially
  const dependentResults: GeneratedSection[] = [];
  for (const section of dependentSections) {
    const result = await generateSection(proposalId, section);
    dependentResults.push(result);
  }

  return [...independentResults, ...dependentResults];
}
```

### 2. Redis Caching Layer

```typescript
// src/lib/cache/redis-cache.ts
import { redis } from "@/lib/redis/client";

export async function getCachedL1Context(
  orgId: string
): Promise<L1Context | null> {
  const cacheKey = `l1:${orgId}`;
  const cached = await redis.get<string>(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  return null;
}

export async function setCachedL1Context(
  orgId: string,
  context: L1Context
): Promise<void> {
  const cacheKey = `l1:${orgId}`;
  await redis.setex(cacheKey, 300, JSON.stringify(context)); // 5 min TTL
}
```

### 3. Request Deduplication

```typescript
// src/lib/ai/deduplication.ts
export async function deduplicateGeneration<T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs: number = 30000
): Promise<T> {
  const lockKey = `lock:${key}`;
  const resultKey = `result:${key}`;
  
  // Check if already in progress
  const existing = await redis.get(lockKey);
  if (existing) {
    // Wait for result
    return await waitForResult(resultKey, ttlMs);
  }
  
  // Acquire lock
  await redis.setex(lockKey, ttlMs / 1000, "1");
  
  try {
    const result = await fn();
    await redis.setex(resultKey, 60, JSON.stringify(result));
    return result;
  } finally {
    await redis.del(lockKey);
  }
}
```

### 4. Database Indexes

```sql
-- Add performance indexes
CREATE INDEX CONCURRENTLY idx_proposals_org_status ON proposals(organization_id, status);
CREATE INDEX CONCURRENTLY idx_proposal_sections_proposal ON proposal_sections(proposal_id);
CREATE INDEX CONCURRENTLY idx_documents_org_type ON documents(organization_id, document_type);
CREATE INDEX CONCURRENTLY idx_document_chunks_doc ON document_chunks(document_id);
```

### 5. Code Splitting

```typescript
// Lazy load heavy components
const ProposalEditor = dynamic(
  () => import("@/components/proposals/ProposalEditor"),
  { loading: () => <ProposalEditorSkeleton /> }
);

const ExportModal = dynamic(
  () => import("@/components/export/ExportModal"),
  { ssr: false }
);
```

## Verification

- [ ] Section generation time reduced by 40%
- [ ] L1 context cached with 5min TTL
- [ ] Duplicate AI calls eliminated
- [ ] Database queries < 100ms
- [ ] Bundle size reduced by 20%
