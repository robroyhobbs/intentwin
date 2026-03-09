import { ingestCopilotEvent } from "@/lib/copilot/ingest-event";
import type { CopilotPersistenceRepository } from "@/lib/copilot/persistence";

const HEALTH_EVENT_BUCKET_MS = 30 * 60 * 1000;
const CRITICAL_COMPONENTS = new Set([
  "supabase",
  "storage",
  "vector_search",
  "voyage",
  "gemini",
]);

interface HealthCheckSnapshot {
  ok: boolean;
  message: string;
  responseTimeMs?: number;
}

interface EmitHealthDegradationEventsInput {
  organizationId: string;
  checks: Record<string, HealthCheckSnapshot>;
  totalResponseTimeMs: number;
  emittedAt?: Date;
}

interface EmitHealthDegradationEventsFailure {
  component: string;
  message: string;
}

interface HealthDegradationEventInput {
  organizationId: string;
  component: string;
  check: HealthCheckSnapshot;
  totalResponseTimeMs: number;
  emittedAt: Date;
  bucketStart: Date;
}

type EmitHealthDegradationEventsResult =
  | {
      ok: true;
      emitted: number;
    }
  | {
      ok: false;
      emitted: number;
      failures: EmitHealthDegradationEventsFailure[];
    };

export async function emitHealthDegradationEvents(
  input: EmitHealthDegradationEventsInput,
  options: {
    repository?: CopilotPersistenceRepository;
  } = {},
): Promise<EmitHealthDegradationEventsResult> {
  const failedChecks = getFailedChecks(input.checks);
  if (failedChecks.length === 0) {
    return { ok: true, emitted: 0 };
  }

  const emittedAt = input.emittedAt ?? new Date();
  const bucketStart = getHealthEventBucketStart(emittedAt);
  const sharedInput = {
    organizationId: input.organizationId,
    totalResponseTimeMs: input.totalResponseTimeMs,
    emittedAt,
    bucketStart,
  };

  const results = await Promise.all(
    failedChecks.map(async ([component, check]) => {
      try {
        return await emitSingleHealthDegradationEvent(
          {
            ...sharedInput,
            component,
            check,
          },
          options.repository,
        );
      } catch (error) {
        return {
          component,
          ok: false as const,
          message: error instanceof Error ? error.message : String(error),
        };
      }
    }),
  );

  const failures = results.flatMap((result) =>
    result.ok ? [] : [{ component: result.component, message: result.message }],
  );

  if (failures.length > 0) {
    return {
      ok: false,
      emitted: results.length - failures.length,
      failures,
    };
  }

  return { ok: true, emitted: results.length };
}

function getFailedChecks(checks: Record<string, HealthCheckSnapshot>) {
  return Object.entries(checks).filter(([, check]) => !check.ok);
}

function getHealthEventBucketStart(emittedAt: Date): Date {
  return new Date(
    Math.floor(emittedAt.getTime() / HEALTH_EVENT_BUCKET_MS) *
      HEALTH_EVENT_BUCKET_MS,
  );
}

async function emitSingleHealthDegradationEvent(
  input: HealthDegradationEventInput,
  repository?: CopilotPersistenceRepository,
) {
  const result = await ingestCopilotEvent(
    buildHealthDegradationEvent(input),
    repository ? { repository } : {},
  );

  if (result.ok) {
    return { component: input.component, ok: true as const };
  }

  return {
    component: input.component,
    ok: false as const,
    message: result.message,
  };
}

function buildHealthDegradationEvent(input: HealthDegradationEventInput) {
  const bucketIso = input.bucketStart.toISOString();

  return {
    id: `health-component-degraded:${input.organizationId}:${input.component}:${bucketIso}`,
    type: "health.component.degraded" as const,
    organizationId: input.organizationId,
    source: "monitoring" as const,
    correlationId: `health-component-degraded:${input.organizationId}:${input.component}`,
    createdAt: input.emittedAt.toISOString(),
    payload: {
      component: input.component,
      severity: getHealthSeverity(input.component),
      message: input.check.message,
      totalResponseTimeMs: input.totalResponseTimeMs,
      bucketStart: bucketIso,
      ...(typeof input.check.responseTimeMs === "number"
        ? { responseTimeMs: input.check.responseTimeMs }
        : {}),
    },
  };
}

function getHealthSeverity(component: string): "critical" | "warning" {
  return CRITICAL_COMPONENTS.has(component) ? "critical" : "warning";
}
