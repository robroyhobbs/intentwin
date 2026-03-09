import { z } from "zod";
import { sanitizeString } from "@/lib/security/sanitize";

export const COPILOT_EVENT_TYPES = [
  "proposal.created",
  "proposal.stage.blocked",
  "proposal.generation.failed",
  "proposal.quality.low",
  "proposal.compliance.gap_critical",
  "proposal.inputs.missing",
  "opportunity.match.high",
  "opportunity.deadline.near",
  "health.component.degraded",
  "api.latency.threshold_exceeded",
  "user.stuck.detected",
] as const;

export const COPILOT_EVENT_SOURCES = [
  "intentwin",
  "intentbid-intelligence",
  "monitoring",
] as const;

export type CopilotEventType = (typeof COPILOT_EVENT_TYPES)[number];
export type CopilotEventSource = (typeof COPILOT_EVENT_SOURCES)[number];

export interface CopilotEventEnvelope {
  id: string;
  type: CopilotEventType;
  organizationId: string;
  source: CopilotEventSource;
  correlationId: string;
  createdAt: string;
  payload: Record<string, unknown>;
}

export interface CopilotValidationFailure {
  ok: false;
  status: 400;
  code: string;
  message: string;
}

interface CopilotValidationSuccess {
  ok: true;
  data: CopilotEventEnvelope;
}

export type CopilotEnvelopeValidationResult =
  | CopilotValidationFailure
  | CopilotValidationSuccess;

const baseEnvelopeSchema = z.object({
  id: z.string().trim().min(1),
  type: z.string().trim().min(1),
  organizationId: z.uuid(),
  source: z.enum(COPILOT_EVENT_SOURCES),
  correlationId: z.string().trim().min(1),
  createdAt: z.string().datetime({ offset: true }),
  payload: z.record(z.string(), z.unknown()),
});

const eventPayloadSchemas: Record<CopilotEventType, z.ZodType<Record<string, unknown>>> = {
  "proposal.created": z.object({ proposalId: z.uuid() }).passthrough(),
  "proposal.stage.blocked": z.object({
    proposalId: z.uuid(),
    stage: z.string().trim().min(1),
  }).passthrough(),
  "proposal.generation.failed": z.object({
    proposalId: z.uuid(),
    retryable: z.boolean(),
  }).passthrough(),
  "proposal.quality.low": z.object({
    proposalId: z.uuid(),
    score: z.number(),
  }).passthrough(),
  "proposal.compliance.gap_critical": z.object({
    proposalId: z.uuid(),
    gapCount: z.number().int().nonnegative(),
  }).passthrough(),
  "proposal.inputs.missing": z.object({
    proposalId: z.uuid(),
    missing: z.array(z.string().trim().min(1)).min(1),
  }).passthrough(),
  "opportunity.match.high": z.object({
    opportunityId: z.string().trim().min(1),
    score: z.number(),
  }).passthrough(),
  "opportunity.deadline.near": z.object({
    opportunityId: z.string().trim().min(1),
    deadline: z.string().trim().min(1),
  }).passthrough(),
  "health.component.degraded": z.object({
    component: z.string().trim().min(1),
    severity: z.string().trim().min(1),
  }).passthrough(),
  "api.latency.threshold_exceeded": z.object({
    route: z.string().trim().min(1),
    thresholdMs: z.number().nonnegative(),
    actualMs: z.number().nonnegative(),
  }).passthrough(),
  "user.stuck.detected": z.object({
    surface: z.string().trim().min(1),
    signal: z.string().trim().min(1),
  }).passthrough(),
};

export function isKnownCopilotEventType(
  value: string,
): value is CopilotEventType {
  return COPILOT_EVENT_TYPES.includes(value as CopilotEventType);
}

export function validateCopilotEventEnvelope(
  input: unknown,
): CopilotEnvelopeValidationResult {
  const baseResult = baseEnvelopeSchema.safeParse(input);
  if (!baseResult.success) {
    return invalidEnvelope("Invalid copilot event envelope");
  }

  if (!isKnownCopilotEventType(baseResult.data.type)) {
    return invalidType();
  }

  const sanitizedPayload = sanitizeCopilotPayload(
    baseResult.data.payload,
  ) as Record<string, unknown>;
  const payloadResult =
    eventPayloadSchemas[baseResult.data.type].safeParse(sanitizedPayload);

  if (!payloadResult.success) {
    return invalidEnvelope("Invalid copilot event payload");
  }

  return {
    ok: true,
    data: {
      ...baseResult.data,
      type: baseResult.data.type,
      payload: payloadResult.data,
    },
  };
}

export function buildCopilotEventDedupeKey(
  event: Pick<CopilotEventEnvelope, "id" | "source">,
): string {
  return `${event.source}:${event.id}`;
}

export function getProposalIdFromCopilotEvent(
  event: CopilotEventEnvelope,
): string | null {
  const proposalId = event.payload.proposalId;
  return typeof proposalId === "string" ? proposalId : null;
}

export function getOpportunityIdFromCopilotEvent(
  event: CopilotEventEnvelope,
): string | null {
  const opportunityId = event.payload.opportunityId;
  return typeof opportunityId === "string" ? opportunityId : null;
}

function sanitizeCopilotPayload(value: unknown): unknown {
  if (typeof value === "string") {
    return sanitizeString(value);
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeCopilotPayload);
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        sanitizeCopilotPayload(item),
      ]),
    );
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalidEnvelope(message: string): CopilotValidationFailure {
  return {
    ok: false,
    status: 400,
    code: "INVALID_COPILOT_EVENT_ENVELOPE",
    message,
  };
}

function invalidType(): CopilotValidationFailure {
  return {
    ok: false,
    status: 400,
    code: "UNKNOWN_COPILOT_EVENT_TYPE",
    message: "Unknown copilot event type",
  };
}
