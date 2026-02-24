# Phase 2: Rate Limiting

## Intent

Protect IntentBid from abuse, control AI costs, and ensure fair resource allocation across organizations. Implement comprehensive rate limiting at API, route, and AI generation levels.

## Problem Statement

Current state:
- No rate limiting on any API routes
- AI generation costs can spiral (no caps)
- Malicious or buggy clients can overwhelm system
- No protection against brute force auth attempts
- No organization-level resource quotas

This creates risk:
- Runaway AI costs from unbounded generation
- Denial of service from API abuse
- One org can starve others of resources
- Auth endpoints vulnerable to brute force

## Goals

1. **API Rate Limiting** - Per-route limits with sliding window
2. **AI Generation Caps** - Organization-level quotas on generation
3. **Auth Protection** - Strict limits on login/signup endpoints
4. **Cost Control** - Prevent runaway AI spending
5. **Fair Resource Sharing** - Ensure all orgs get service

## Success Criteria

| Limit Type | Target | Action on Exceed |
|------------|--------|------------------|
| General API | 100 req/min per org | 429 with Retry-After |
| AI Generation | 50 req/day per org (Starter) | 429 + upgrade prompt |
| Auth Endpoints | 5 req/min per IP | 429 + log alert |
| Export Generation | 10 req/hour per org | Queue for later |
| File Upload | 5 req/min per org | 429 |

## Technical Approach

### 1. Redis Infrastructure

Use Upstash Redis (serverless, Vercel-compatible):

```typescript
// src/lib/redis/client.ts
import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});
```

**Why Upstash:**
- Serverless-friendly (REST API, no connection pooling)
- Free tier sufficient for initial load
- Vercel integration (Edge-compatible)
- Automatic failover

### 2. Rate Limiting Middleware

Create configurable middleware:

```typescript
// src/lib/middleware/rate-limit.ts
interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  keyPrefix: string;     // Redis key prefix
  keyGenerator?: (req: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  handler?: (req: NextRequest) => Promise<NextResponse>;
}

export function rateLimit(config: RateLimitConfig) {
  return async (req: NextRequest) => {
    const key = config.keyGenerator?.(req) || 
                `${config.keyPrefix}:${req.ip}`;
    
    const { success, limit, remaining, reset } = 
      await checkRateLimit(key, config);
    
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": String(remaining),
            "X-RateLimit-Reset": String(reset),
            "Retry-After": String(Math.ceil((reset - Date.now()) / 1000))
          }
        }
      );
    }
    
    return null; // Continue to handler
  };
}
```

### 3. Sliding Window Algorithm

Implement efficient sliding window:

```typescript
async function checkRateLimit(
  key: string, 
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  // Remove old entries outside window
  await redis.zremrangebyscore(key, 0, windowStart);
  
  // Count requests in current window
  const count = await redis.zcard(key);
  
  if (count >= config.maxRequests) {
    // Get oldest request for reset time
    const oldest = await redis.zrange(key, 0, 0, { withScores: true });
    const resetTime = Number(oldest[0]?.score || now) + config.windowMs;
    
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: resetTime
    };
  }
  
  // Add current request
  await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` });
  await redis.pexpire(key, config.windowMs);
  
  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - count - 1,
    reset: now + config.windowMs
  };
}
```

### 4. Route-Specific Configuration

Apply different limits per route:

```typescript
// src/lib/middleware/rate-limit-config.ts

export const rateLimits = {
  // Strict: Auth endpoints
  auth: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 5,           // 5 per minute
    keyPrefix: "ratelimit:auth",
    keyGenerator: (req) => `ratelimit:auth:${req.ip}`
  },
  
  // Standard: General API
  api: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 100,         // 100 per minute
    keyPrefix: "ratelimit:api",
    keyGenerator: (req) => {
      const orgId = extractOrgId(req);
      return `ratelimit:api:${orgId || req.ip}`;
    }
  },
  
  // Expensive: AI Generation
  aiGeneration: {
    windowMs: 24 * 60 * 60 * 1000,  // 24 hours
    maxRequests: 50,                // 50 per day (Starter tier)
    keyPrefix: "ratelimit:ai",
    keyGenerator: (req) => {
      const orgId = extractOrgId(req);
      return `ratelimit:ai:${orgId}`;
    }
  },
  
  // Moderate: File uploads
  upload: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 5,
    keyPrefix: "ratelimit:upload",
    keyGenerator: (req) => `ratelimit:upload:${extractOrgId(req)}`
  },
  
  // Moderate: Export generation
  export: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    keyPrefix: "ratelimit:export"
  }
};
```

### 5. Organization Quotas by Plan

Different limits per subscription tier:

```typescript
// src/lib/billing/plan-limits.ts

export const planLimits = {
  starter: {
    aiGenerationsPerDay: 50,
    documentsPerMonth: 100,
    proposalsPerMonth: 20,
    exportsPerMonth: 50,
    storageGb: 5
  },
  pro: {
    aiGenerationsPerDay: 200,
    documentsPerMonth: 500,
    proposalsPerMonth: 100,
    exportsPerMonth: 200,
    storageGb: 25
  },
  business: {
    aiGenerationsPerDay: 1000,
    documentsPerMonth: -1, // Unlimited
    proposalsPerMonth: -1,
    exportsPerMonth: -1,
    storageGb: 100
  }
};

export async function checkQuota(
  orgId: string, 
  quotaType: keyof PlanLimits
): Promise<QuotaResult> {
  const plan = await getOrganizationPlan(orgId);
  const limit = planLimits[plan][quotaType];
  
  if (limit === -1) return { allowed: true }; // Unlimited
  
  const usage = await getCurrentUsage(orgId, quotaType);
  
  if (usage >= limit) {
    return {
      allowed: false,
      limit,
      used: usage,
      remaining: 0,
      upgradeUrl: "/settings/billing"
    };
  }
  
  return {
    allowed: true,
    limit,
    used: usage,
    remaining: limit - usage
  };
}
```

### 6. Middleware Integration

Apply rate limiting in route handlers:

```typescript
// src/app/api/proposals/[id]/generate/route.ts
import { rateLimit } from "@/lib/middleware/rate-limit";
import { rateLimits } from "@/lib/middleware/rate-limit-config";
import { checkQuota } from "@/lib/billing/plan-limits";

export async function POST(request: Request) {
  // 1. Rate limit check
  const rateLimitResult = await rateLimit(rateLimits.aiGeneration)(request);
  if (rateLimitResult) return rateLimitResult;
  
  // 2. Organization quota check
  const context = await getUserContext(request);
  const quotaCheck = await checkQuota(context.organizationId, "aiGenerationsPerDay");
  
  if (!quotaCheck.allowed) {
    return NextResponse.json(
      {
        error: "Daily AI generation limit reached",
        limit: quotaCheck.limit,
        used: quotaCheck.used,
        upgradeUrl: quotaCheck.upgradeUrl
      },
      { status: 429 }
    );
  }
  
  // 3. Continue with generation...
  
  // 4. Track usage
  await incrementUsage(context.organizationId, "aiGenerationsPerDay");
}
```

### 7. Monitoring & Alerting

Track rate limit events:

```typescript
// src/lib/monitoring/rate-limit-metrics.ts

export async function logRateLimitEvent(event: RateLimitEvent) {
  await logger.event("rate_limit_exceeded", {
    orgId: event.orgId,
    endpoint: event.endpoint,
    limitType: event.limitType,
    timestamp: new Date().toISOString()
  });
  
  // Alert if same org exceeds 5x in 1 hour
  const recentViolations = await getRecentViolations(event.orgId, "1h");
  if (recentViolations >= 5) {
    await sendAlert({
      severity: "warning",
      message: `Organization ${event.orgId} exceeded rate limits 5+ times`,
      channel: "slack"
    });
  }
}
```

## Error Handling

### Client-Side

```typescript
// Retry with exponential backoff on 429
async function fetchWithRetry(url: string, options: RequestInit) {
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      const delay = retryAfter 
        ? parseInt(retryAfter) * 1000 
        : Math.pow(2, retries) * 1000;
      
      await sleep(delay);
      retries++;
      continue;
    }
    
    return response;
  }
  
  throw new Error("Rate limit exceeded after retries");
}
```

### User Experience

Show quota usage in UI:

```tsx
// components/billing/QuotaUsage.tsx
export function QuotaUsage({ orgId }: { orgId: string }) {
  const { data: quotas } = useQuotas(orgId);
  
  return (
    <div className="space-y-4">
      <QuotaBar 
        label="AI Generations Today"
        used={quotas.aiGenerations.used}
        limit={quotas.aiGenerations.limit}
      />
      <QuotaBar 
        label="Proposals This Month"
        used={quotas.proposals.used}
        limit={quotas.proposals.limit}
      />
    </div>
  );
}
```

## File Structure

```
src/lib/
├── redis/
│   ├── client.ts              # Upstash Redis client
│   └── connection.ts          # Connection pooling (if needed)
├── middleware/
│   ├── rate-limit.ts          # Core rate limiting logic
│   ├── rate-limit-config.ts   # Route-specific limits
│   └── rate-limit-wrapper.ts  # Next.js middleware wrapper
├── billing/
│   ├── plan-limits.ts         # Plan quota definitions
│   └── usage-tracking.ts      # Usage increment/decrement
└── monitoring/
    └── rate-limit-metrics.ts  # Metrics and alerting
```

## Dependencies

```json
{
  "dependencies": {
    "@upstash/redis": "^1.28.0"
  }
}
```

## Environment Variables

```bash
# Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# Rate Limiting (optional overrides)
RATE_LIMIT_AI_GENERATIONS_PER_DAY=50
RATE_LIMIT_API_REQUESTS_PER_MINUTE=100
```

## Testing

```typescript
// __tests__/integration/rate-limiting.test.ts
describe("Rate Limiting", () => {
  test("blocks requests over limit", async () => {
    // Make 101 requests (limit is 100)
    for (let i = 0; i < 101; i++) {
      const res = await fetch("/api/test");
      if (i < 100) expect(res.status).toBe(200);
      else expect(res.status).toBe(429);
    }
  });
  
  test("includes Retry-After header", async () => {
    // Exceed limit
    await exhaustLimit("/api/test");
    
    const res = await fetch("/api/test");
    expect(res.headers.get("Retry-After")).toBeDefined();
  });
  
  test("resets after window expires", async () => {
    // Exceed limit
    await exhaustLimit("/api/test");
    
    // Wait for window
    await sleep(60 * 1000);
    
    // Should succeed again
    const res = await fetch("/api/test");
    expect(res.status).toBe(200);
  });
});
```

## Out of Scope

- Global DDoS protection (use Cloudflare/Vercel Edge)
- IP reputation scoring (future enhancement)
- Per-user rate limiting (org-level only for now)

## Decisions

| Decision | Options | Choice | Rationale |
|----------|---------|--------|-----------|
| Redis Provider | Upstash vs Redis Cloud vs Self-hosted | Upstash | Serverless-friendly, Vercel-optimized |
| Algorithm | Fixed window vs Sliding window | Sliding window | Smoother, prevents burst at window edge |
| Storage | Redis vs Postgres | Redis | Faster, built-in TTL |
| Scope | IP vs Org vs User | Org for most, IP for auth | Multi-tenancy protection |

## Verification Checklist

- [ ] Rate limits applied to all AI generation routes
- [ ] Auth endpoints limited to 5 req/min per IP
- [ ] Organization quotas enforced by plan tier
- [ ] 429 responses include Retry-After header
- [ ] Quota usage displayed in UI
- [ ] Rate limit events logged
- [ ] Alerting on excessive violations
- [ ] Tests verify limit enforcement
- [ ] Load test confirms limits work under pressure

## Success Metrics

Upon completion:
- Zero runaway AI costs
- Fair resource allocation across orgs
- Auth endpoints protected from brute force
- Users see clear quota usage and upgrade paths
- 429 responses guide clients on retry timing
