import type {
  CopilotPersistenceRepository,
  PersistedCopilotEvent,
  PersistedCopilotIntervention,
} from "../../persistence";

export class InMemoryCopilotRepository implements CopilotPersistenceRepository {
  private readonly proposals = new Map<string, string>();
  private readonly records = new Map<
    string,
    {
      event: PersistedCopilotEvent;
      intervention: PersistedCopilotIntervention;
      createdAt: string;
    }
  >();

  seedProposal(proposalId: string, organizationId: string): void {
    this.proposals.set(proposalId, organizationId);
  }

  listNotificationRows(organizationId: string) {
    return [...this.records.values()]
      .filter((record) => record.intervention.organizationId === organizationId)
      .map((record) => ({
        id: record.intervention.id,
        assigned_agent: record.intervention.assignedAgent,
        action_mode: record.intervention.actionMode,
        status: record.intervention.status,
        user_safe_title: record.intervention.userSafeTitle,
        user_safe_message: record.intervention.userSafeMessage,
        proposal_id: record.intervention.proposalId,
        opportunity_id: record.intervention.opportunityId,
        created_at: record.createdAt,
      }));
  }

  async proposalBelongsToOrganization(
    proposalId: string,
    organizationId: string,
  ): Promise<boolean> {
    return this.proposals.get(proposalId) === organizationId;
  }

  async persistRoutedEvent(input: {
    event: {
      id: string;
      organizationId: string;
      type: string;
      source: string;
      correlationId: string;
      createdAt: string;
    };
    routedEvent: {
      agent: PersistedCopilotIntervention["assignedAgent"];
      actionMode: PersistedCopilotIntervention["actionMode"];
      reason: string;
    };
    intervention: {
      status: PersistedCopilotIntervention["status"];
      proposalId: string | null;
      opportunityId: string | null;
      userSafeTitle: string | null;
      userSafeMessage: string | null;
    };
  }): Promise<{
    deduplicated: boolean;
    event: PersistedCopilotEvent;
    intervention: PersistedCopilotIntervention;
  }> {
    const key = this.buildKey(input.event);

    const existing = this.records.get(key);
    if (existing) {
      return {
        deduplicated: true,
        event: existing.event,
        intervention: existing.intervention,
      };
    }

    const event = this.buildEvent(input);
    const intervention = this.buildIntervention(input, event.id);

    this.records.set(key, {
      event,
      intervention,
      createdAt: input.event.createdAt,
    });

    return { deduplicated: false, event, intervention };
  }

  private buildKey(input: {
    organizationId: string;
    source: string;
    id: string;
  }) {
    return [input.organizationId, input.source, input.id].join(":");
  }

  private buildEvent(input: {
    event: {
      id: string;
      organizationId: string;
      type: string;
      source: string;
      correlationId: string;
    };
  }): PersistedCopilotEvent {
    return {
      id: `db-event-${this.records.size + 1}`,
      externalEventId: input.event.id,
      organizationId: input.event.organizationId,
      type: input.event.type,
      source: input.event.source,
      correlationId: input.event.correlationId,
    };
  }

  private buildIntervention(
    input: {
      event: {
        organizationId: string;
      };
      routedEvent: {
        agent: PersistedCopilotIntervention["assignedAgent"];
        actionMode: PersistedCopilotIntervention["actionMode"];
        reason: string;
      };
      intervention: {
        status: PersistedCopilotIntervention["status"];
        proposalId: string | null;
        opportunityId: string | null;
        userSafeTitle: string | null;
        userSafeMessage: string | null;
      };
    },
    eventId: string,
  ): PersistedCopilotIntervention {
    return {
      id: `db-intervention-${this.records.size + 1}`,
      organizationId: input.event.organizationId,
      eventId,
      proposalId: input.intervention.proposalId,
      opportunityId: input.intervention.opportunityId,
      assignedAgent: input.routedEvent.agent,
      actionMode: input.routedEvent.actionMode,
      status: input.intervention.status,
      internalReason: input.routedEvent.reason,
      userSafeTitle: input.intervention.userSafeTitle,
      userSafeMessage: input.intervention.userSafeMessage,
    };
  }
}
