import { ingestCopilotEvent } from "@/lib/copilot/ingest-event";
import type { CopilotPersistenceRepository } from "@/lib/copilot/persistence";

interface EmitProposalGenerationFailedEventInput {
  organizationId: string;
  proposalId: string;
  retryable: boolean;
  stage: "setup" | "section" | "finalize";
  errorMessage: string;
  attempts?: number;
  correlationId?: string;
  sectionId?: string;
  sectionType?: string;
}

export async function emitProposalGenerationFailedEvent(
  input: EmitProposalGenerationFailedEventInput,
  options: {
    repository?: CopilotPersistenceRepository;
  } = {},
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const result = await ingestCopilotEvent({
      id: crypto.randomUUID(),
      type: "proposal.generation.failed",
      organizationId: input.organizationId,
      source: "intentwin",
      correlationId: input.correlationId ?? crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      payload: {
        proposalId: input.proposalId,
        retryable: input.retryable,
        stage: input.stage,
        errorMessage: input.errorMessage,
        ...(typeof input.attempts === "number" ? { attempts: input.attempts } : {}),
        ...(input.sectionId ? { sectionId: input.sectionId } : {}),
        ...(input.sectionType ? { sectionType: input.sectionType } : {}),
      },
    }, options);

    if (!result.ok) {
      return { ok: false, message: result.message };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
