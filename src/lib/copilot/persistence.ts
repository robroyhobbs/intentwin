import type {
  PostgrestError,
  SupabaseClient,
} from "@supabase/supabase-js";
import type {
  CopilotEventEnvelope,
  CopilotEventType,
} from "./event-envelope";
import { buildCopilotEventDedupeKey } from "./event-envelope";
import type {
  CopilotActionMode,
  CopilotAgent,
  RoutedCopilotEvent,
} from "./route-event";

export type CopilotInterventionStatus =
  | "open"
  | "awaiting_approval"
  | "resolved";

export interface CopilotInterventionDraft {
  status: CopilotInterventionStatus;
  proposalId: string | null;
  opportunityId: string | null;
  userSafeTitle: string | null;
  userSafeMessage: string | null;
}

export interface PersistedCopilotEvent {
  id: string;
  externalEventId: string;
  organizationId: string;
  type: CopilotEventType;
  source: CopilotEventEnvelope["source"];
  correlationId: string;
}

export interface PersistedCopilotIntervention {
  id: string;
  organizationId: string;
  eventId: string;
  proposalId: string | null;
  opportunityId: string | null;
  assignedAgent: CopilotAgent;
  actionMode: CopilotActionMode;
  status: CopilotInterventionStatus;
  internalReason: string;
  userSafeTitle: string | null;
  userSafeMessage: string | null;
}

export interface CopilotPersistenceRepository {
  proposalBelongsToOrganization(
    proposalId: string,
    organizationId: string,
  ): Promise<boolean>;
  persistRoutedEvent(input: {
    event: CopilotEventEnvelope;
    routedEvent: RoutedCopilotEvent;
    intervention: CopilotInterventionDraft;
  }): Promise<{
    deduplicated: boolean;
    event: PersistedCopilotEvent;
    intervention: PersistedCopilotIntervention;
  }>;
}

interface CopilotEventRow {
  id: string;
  external_event_id: string;
  organization_id: string;
  event_type: CopilotEventType;
  source_system: CopilotEventEnvelope["source"];
  correlation_id: string;
}

interface CopilotInterventionRow {
  id: string;
  organization_id: string;
  event_id: string;
  proposal_id: string | null;
  opportunity_id: string | null;
  assigned_agent: CopilotAgent;
  action_mode: CopilotActionMode;
  status: CopilotInterventionStatus;
  internal_reason: string;
  user_safe_title: string | null;
  user_safe_message: string | null;
}

const eventSelect =
  "id, external_event_id, organization_id, event_type, source_system, correlation_id";
const interventionSelect =
  "id, organization_id, event_id, proposal_id, opportunity_id, assigned_agent, action_mode, status, internal_reason, user_safe_title, user_safe_message";

export function createSupabaseCopilotRepository(
  client: SupabaseClient,
): CopilotPersistenceRepository {
  return {
    async proposalBelongsToOrganization(proposalId, organizationId) {
      const { data, error } = await client
        .from("proposals")
        .select("id")
        .eq("id", proposalId)
        .eq("organization_id", organizationId)
        .maybeSingle();

      return !error && !!data;
    },
    async persistRoutedEvent(input) {
      const eventResult = await getOrCreateEvent(
        client,
        input.event,
        input.routedEvent,
      );
      const interventionResult = await getOrCreateIntervention(
        client,
        eventResult.event.id,
        input,
      );

      return {
        deduplicated: eventResult.deduplicated || interventionResult.deduplicated,
        event: eventResult.event,
        intervention: interventionResult.intervention,
      };
    },
  };
}

async function getOrCreateEvent(
  client: SupabaseClient,
  event: CopilotEventEnvelope,
  routedEvent: RoutedCopilotEvent,
): Promise<{ deduplicated: boolean; event: PersistedCopilotEvent }> {
  const { data, error } = await client
    .from("copilot_events")
    .insert({
      external_event_id: event.id,
      organization_id: event.organizationId,
      event_type: event.type,
      source_system: event.source,
      correlation_id: event.correlationId,
      payload: event.payload,
      dedupe_key: buildCopilotEventDedupeKey(event),
      routed_agent: routedEvent.agent,
      action_mode: routedEvent.actionMode,
      status: "routed",
      processed_at: new Date().toISOString(),
    })
    .select(eventSelect)
    .single();

  if (error && !isUniqueViolation(error)) {
    throw error;
  }

  if (data) {
    return { deduplicated: false, event: mapEventRow(data as CopilotEventRow) };
  }

  const existing = await findEventByDedupeKey(client, event);
  return { deduplicated: true, event: existing };
}

async function getOrCreateIntervention(
  client: SupabaseClient,
  eventId: string,
  input: {
    event: CopilotEventEnvelope;
    routedEvent: RoutedCopilotEvent;
    intervention: CopilotInterventionDraft;
  },
): Promise<{ deduplicated: boolean; intervention: PersistedCopilotIntervention }> {
  const existing = await findInterventionByEventId(
    client,
    eventId,
    input.event.organizationId,
  );

  if (existing) {
    return { deduplicated: true, intervention: existing };
  }

  const { data, error } = await insertIntervention(client, eventId, input);

  if (error && !isUniqueViolation(error)) {
    throw error;
  }

  if (data) {
    return {
      deduplicated: false,
      intervention: mapInterventionRow(data as CopilotInterventionRow),
    };
  }

  const persisted = await findInterventionByEventId(
    client,
    eventId,
    input.event.organizationId,
  );

  if (!persisted) {
    throw new Error("Persisted intervention not found");
  }

  return { deduplicated: true, intervention: persisted };
}

async function insertIntervention(
  client: SupabaseClient,
  eventId: string,
  input: {
    event: CopilotEventEnvelope;
    routedEvent: RoutedCopilotEvent;
    intervention: CopilotInterventionDraft;
  },
) {
  return client
    .from("copilot_interventions")
    .insert({
      organization_id: input.event.organizationId,
      event_id: eventId,
      proposal_id: input.intervention.proposalId,
      opportunity_id: input.intervention.opportunityId,
      assigned_agent: input.routedEvent.agent,
      action_mode: input.routedEvent.actionMode,
      status: input.intervention.status,
      internal_reason: input.routedEvent.reason,
      user_safe_title: input.intervention.userSafeTitle,
      user_safe_message: input.intervention.userSafeMessage,
    })
    .select(interventionSelect)
    .single();
}

async function findEventByDedupeKey(
  client: SupabaseClient,
  event: CopilotEventEnvelope,
): Promise<PersistedCopilotEvent> {
  const { data, error } = await client
    .from("copilot_events")
    .select(eventSelect)
    .eq("organization_id", event.organizationId)
    .eq("dedupe_key", buildCopilotEventDedupeKey(event))
    .maybeSingle();

  if (error || !data) {
    throw error ?? new Error("Persisted copilot event not found");
  }

  return mapEventRow(data as CopilotEventRow);
}

async function findInterventionByEventId(
  client: SupabaseClient,
  eventId: string,
  organizationId: string,
): Promise<PersistedCopilotIntervention | null> {
  const { data, error } = await client
    .from("copilot_interventions")
    .select(interventionSelect)
    .eq("event_id", eventId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapInterventionRow(data as CopilotInterventionRow);
}

function isUniqueViolation(error: PostgrestError | null): boolean {
  return error?.code === "23505";
}

function mapEventRow(row: CopilotEventRow): PersistedCopilotEvent {
  return {
    id: row.id,
    externalEventId: row.external_event_id,
    organizationId: row.organization_id,
    type: row.event_type,
    source: row.source_system,
    correlationId: row.correlation_id,
  };
}

function mapInterventionRow(
  row: CopilotInterventionRow,
): PersistedCopilotIntervention {
  return {
    id: row.id,
    organizationId: row.organization_id,
    eventId: row.event_id,
    proposalId: row.proposal_id,
    opportunityId: row.opportunity_id,
    assignedAgent: row.assigned_agent,
    actionMode: row.action_mode,
    status: row.status,
    internalReason: row.internal_reason,
    userSafeTitle: row.user_safe_title,
    userSafeMessage: row.user_safe_message,
  };
}
