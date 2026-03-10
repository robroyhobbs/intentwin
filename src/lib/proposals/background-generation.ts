import {
  orchestrateGeneration,
  type GenerationSection,
} from "@/lib/ai/pipeline/client-orchestrate";

type FetchFn = (url: string, options?: RequestInit) => Promise<Response>;

type OrchestrateFn = (
  proposalId: string,
  sections: GenerationSection[],
  fetchFn: FetchFn,
) => Promise<void>;

export interface StartBackgroundGenerationResult {
  sections: GenerationSection[];
  status: "started" | "already-generating";
}

async function extractResponseError(response: Response): Promise<string> {
  const data = await response
    .json()
    .catch(() => null) as Record<string, unknown> | null;

  if (typeof data?.error === "string" && data.error.trim().length > 0) {
    return data.error;
  }

  return `Failed to start generation (${response.status})`;
}

export async function startBackgroundGeneration(
  proposalId: string,
  fetchFn: FetchFn,
  orchestrateFn: OrchestrateFn = orchestrateGeneration,
): Promise<StartBackgroundGenerationResult> {
  const response = await fetchFn(`/api/proposals/${proposalId}/generate/setup`, {
    method: "POST",
  });

  if (response.status === 409) {
    return { status: "already-generating", sections: [] };
  }

  if (!response.ok) {
    throw new Error(await extractResponseError(response));
  }

  const setupData = (await response.json()) as { sections?: GenerationSection[] };
  const sections = Array.isArray(setupData.sections) ? setupData.sections : [];

  if (sections.length === 0) {
    throw new Error("Generation setup returned no sections");
  }

  void orchestrateFn(proposalId, sections, fetchFn);

  return { status: "started", sections };
}
