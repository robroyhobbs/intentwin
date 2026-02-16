# Phase 5: Observability

## Intent

Implement production-grade observability with error tracking, structured logging, performance monitoring, and health checks. Ensure we can diagnose issues quickly and understand system behavior.

## Goals

1. **Error Tracking** - Sentry integration for real-time error monitoring
2. **Structured Logging** - Correlation IDs and context-rich logs
3. **Performance Monitoring** - AI pipeline timing and database query metrics
4. **Health Checks** - Comprehensive system health endpoints
5. **Alerting** - Proactive notifications for critical issues

## Technical Approach

### 1. Sentry Integration

```typescript
// src/lib/observability/sentry.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  integrations: [
    Sentry.httpIntegration(),
    Sentry.prismaIntegration()
  ],
  beforeSend(event) {
    // Filter out sensitive data
    if (event.request?.headers) {
      delete event.request.headers["authorization"];
      delete event.request.headers["cookie"];
    }
    return event;
  }
});
```

### 2. Enhanced Structured Logging

```typescript
// src/lib/observability/logger.ts
import { logger as baseLogger } from "@/lib/utils/logger";

export interface LogContext {
  requestId: string;
  organizationId?: string;
  userId?: string;
  traceId?: string;
}

export function createLogger(context: LogContext) {
  return {
    info: (message: string, meta?: Record<string, unknown>) => {
      baseLogger.info(message, { ...context, ...meta });
    },
    warn: (message: string, meta?: Record<string, unknown>) => {
      baseLogger.warn(message, { ...context, ...meta });
    },
    error: (message: string, error: Error, meta?: Record<string, unknown>) => {
      baseLogger.error(message, {
        ...context,
        error: error.message,
        stack: error.stack,
        ...meta
      });
      Sentry.captureException(error, { extra: { ...context, ...meta } });
    }
  };
}
```

### 3. AI Pipeline Performance Tracking

```typescript
// src/lib/observability/ai-metrics.ts
export interface AIGenerationMetrics {
  proposalId: string;
  sectionType: string;
  duration: number;
  tokenCount: number;
  success: boolean;
  error?: string;
}

export async function trackAIGeneration(metrics: AIGenerationMetrics) {
  logger.info("AI Generation Complete", metrics);
  
  // Send to monitoring service
  await sendMetrics("ai.generation", {
    value: metrics.duration,
    tags: {
      section: metrics.sectionType,
      success: String(metrics.success)
    }
  });
}
```

### 4. Health Check Endpoint

```typescript
// src/app/api/health/route.ts
export async function GET() {
  const checks = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkAIProviders(),
    checkStorage()
  ]);

  const healthy = checks.every(c => c.healthy);

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      version: process.env.VERCEL_GIT_COMMIT_SHA,
      checks: Object.fromEntries(checks.map(c => [c.name, c]))
    },
    { status: healthy ? 200 : 503 }
  );
}
```

## Dependencies

```json
{
  "dependencies": {
    "@sentry/nextjs": "^8.x"
  }
}
```

## Verification

- [ ] Sentry receiving errors
- [ ] All logs include correlation IDs
- [ ] AI pipeline metrics tracked
- [ ] Health check endpoint functional
- [ ] Alerts configured for critical errors
