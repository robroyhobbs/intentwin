import { createAdminClient } from "@/lib/supabase/admin";
import { createLogger } from "@/lib/utils/logger";
import {
  getOpportunityIdFromCopilotEvent,
  getProposalIdFromCopilotEvent,
  validateCopilotEventEnvelope,
} from "./event-envelope";
import {
  createSupabaseCopilotRepository,
  type CopilotInterventionDraft,
  type CopilotPersistenceRepository,
} from "./persistence";
import { routeCopilotEvent } from "./route-event";

interface IngestCopilotEventOptions {
  repository?: CopilotPersistenceRepository;
  requestId?: string;
}

interface IngestCopilotEventFailure {
  ok: false;
  status: 400 | 403;
  code: string;
  message: string;
}

interface IngestCopilotEventSuccess {
  ok: true;
  deduplicated: boolean;
  data: {
    event: {
      id: string;
      externalEventId: string;
      organizationId: string;
      type: string;
    };
    intervention: {
      id: string;
      assignedAgent: string;
      actionMode: string;
      status: string;
      proposalId: string | null;
      opportunityId: string | null;
    };
  };
}

export type IngestCopilotEventResult =
  | IngestCopilotEventFailure
  | IngestCopilotEventSuccess;

export async function ingestCopilotEvent(
  input: unknown,
  options: IngestCopilotEventOptions = {},
): Promise<IngestCopilotEventResult> {
  const validation = validateCopilotEventEnvelope(input);
  if (!validation.ok) {
    return validation;
  }

  const repository =
    options.repository ?? createSupabaseCopilotRepository(createAdminClient());
  const proposalId = getProposalIdFromCopilotEvent(validation.data);
  const scopeError = await validateProposalScope(
    repository,
    proposalId,
    validation.data.organizationId,
  );
  if (scopeError) {
    return scopeError;
  }

  const persisted = await persistValidatedEvent(repository, validation.data);
  logIngestionEvent(validation.data.organizationId, validation.data.type, {
    requestId: options.requestId,
    assignedAgent: persisted.intervention.assignedAgent,
    eventId: persisted.event.id,
    interventionId: persisted.intervention.id,
    deduplicated: persisted.deduplicated,
  });
  return toSuccessResult(persisted);
}

async function validateProposalScope(
  repository: CopilotPersistenceRepository,
  proposalId: string | null,
  organizationId: string,
): Promise<IngestCopilotEventFailure | null> {
  if (!proposalId) {
    return null;
  }

  const belongsToOrganization = await repository.proposalBelongsToOrganization(
    proposalId,
    organizationId,
  );

  if (belongsToOrganization) {
    return null;
  }

  return {
    ok: false,
    status: 403,
    code: "ORG_SCOPE_VIOLATION",
    message: "Proposal does not belong to organization",
  };
}

function buildInterventionDraft(
  event: Parameters<typeof routeCopilotEvent>[0],
  routedEvent: ReturnType<typeof routeCopilotEvent>,
): CopilotInterventionDraft {
  const copy = buildUserSafeCopy(event.type);
  return {
    status:
      routedEvent.actionMode === "approval_required"
        ? "awaiting_approval"
        : "open",
    proposalId: getProposalIdFromCopilotEvent(event),
    opportunityId: getOpportunityIdFromCopilotEvent(event),
    userSafeTitle: copy.title,
    userSafeMessage: copy.message,
  };
}

function buildUserSafeCopy(eventType: string): {
  title: string;
  message: string;
} {
  switch (eventType) {
    case "proposal.generation.failed":
      return {
        title: "Proposal generation issue detected",
        message: "IntentBid Copilot recorded a proposal generation issue and prepared the safest next step.",
      };
    case "proposal.stage.blocked":
      return {
        title: "Proposal workflow blocked",
        message: "IntentBid Copilot recorded a blocked proposal stage and queued guidance for the workspace.",
      };
    case "proposal.quality.low":
    case "proposal.compliance.gap_critical":
      return {
        title: "Proposal review required",
        message: "IntentBid Copilot recorded a proposal issue that requires review before further action.",
      };
    case "health.component.degraded":
    case "api.latency.threshold_exceeded":
      return {
        title: "Service reliability issue detected",
        message: "IntentBid Copilot detected a reliability issue and opened an intervention for follow-up.",
      };
    default:
      return {
        title: "Copilot intervention recorded",
        message: "IntentBid Copilot recorded a new intervention for this organization.",
      };
  }
}

async function persistValidatedEvent(
  repository: CopilotPersistenceRepository,
  event: Parameters<typeof routeCopilotEvent>[0],
) {
  const routedEvent = routeCopilotEvent(event);
  return repository.persistRoutedEvent({
    event,
    routedEvent,
    intervention: buildInterventionDraft(event, routedEvent),
  });
}

function logIngestionEvent(
  organizationId: string,
  eventType: string,
  details: {
    requestId?: string;
    assignedAgent: string;
    eventId: string;
    interventionId: string;
    deduplicated: boolean;
  },
): void {
  const log = createLogger({
    organizationId,
    copilotEventType: eventType,
    requestId: details.requestId,
  });

  log.event(
    details.deduplicated ? "copilot.event.deduplicated" : "copilot.event.ingested",
    {
      assignedAgent: details.assignedAgent,
      eventId: details.eventId,
      interventionId: details.interventionId,
    },
  );
}

function toSuccessResult(persisted: Awaited<ReturnType<typeof persistValidatedEvent>>): IngestCopilotEventSuccess {
  return {
    ok: true,
    deduplicated: persisted.deduplicated,
    data: {
      event: {
        id: persisted.event.id,
        externalEventId: persisted.event.externalEventId,
        organizationId: persisted.event.organizationId,
        type: persisted.event.type,
      },
      intervention: {
        id: persisted.intervention.id,
        assignedAgent: persisted.intervention.assignedAgent,
        actionMode: persisted.intervention.actionMode,
        status: persisted.intervention.status,
        proposalId: persisted.intervention.proposalId,
        opportunityId: persisted.intervention.opportunityId,
      },
    },
  };
}
