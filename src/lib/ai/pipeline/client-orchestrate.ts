/**
 * Client-side generation orchestration.
 * Generates sections sequentially and finalizes.
 * Caller provides the fetch function and handles UI updates via polling.
 */

type FetchFn = (url: string, options?: RequestInit) => Promise<Response>;

export interface GenerationSection {
  id: string;
  sectionType: string;
  title: string;
}

/**
 * Fire-and-forget: generate sections sequentially, then finalize.
 * Designed to run in the background while the caller's polling updates UI.
 *
 * - Executive summary is generated first (provides differentiators for later sections)
 * - Section endpoint has idempotency: already-completed sections return cached content
 * - Each section call is under 60s (fits within Vercel Hobby plan limit)
 */
export async function orchestrateGeneration(
  proposalId: string,
  sections: GenerationSection[],
  fetchFn: FetchFn,
): Promise<void> {
  const execSection = sections.find(
    (s) => s.sectionType === "executive_summary",
  );
  const otherSections = sections.filter(
    (s) => s.sectionType !== "executive_summary",
  );
  const orderedSections = execSection
    ? [execSection, ...otherSections]
    : otherSections;
  const execIndex = execSection ? 0 : -1;
  let differentiators: string[] = [];

  for (let i = 0; i < orderedSections.length; i++) {
    const section = orderedSections[i];
    try {
      const res = await fetchFn(
        `/api/proposals/${proposalId}/generate/section`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sectionId: section.id,
            sectionType: section.sectionType,
            differentiators,
          }),
        },
      );
      if (res.ok) {
        const result = await res.json();
        if (i === execIndex && result.differentiators) {
          differentiators = result.differentiators;
        }
      }
    } catch {
      // Section failed — continue with next
    }
  }

  try {
    await fetchFn(`/api/proposals/${proposalId}/generate/finalize`, {
      method: "POST",
    });
  } catch {
    // Finalize failure is non-blocking
  }
}
