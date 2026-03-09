/**
 * Client-side generation orchestration.
 * Generates exec summary first, then remaining sections in parallel batches.
 * Caller provides the fetch function and handles UI updates via polling.
 */

type FetchFn = (url: string, options?: RequestInit) => Promise<Response>;

export interface GenerationSection {
  id: string;
  sectionType: string;
  title: string;
}

const BATCH_SIZE = 3;

function generateSection(
  proposalId: string,
  section: GenerationSection,
  differentiators: string[],
  fetchFn: FetchFn,
): Promise<Response> {
  return fetchFn(`/api/proposals/${proposalId}/generate/section`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sectionId: section.id,
      sectionType: section.sectionType,
      differentiators,
    }),
  });
}

/**
 * Fire-and-forget: generate exec summary, then batch remaining sections, then finalize.
 * Designed to run in the background while the caller's polling updates UI.
 *
 * - Executive summary is generated first (provides differentiators for later sections)
 * - Remaining sections fire in batches of 3 using Promise.allSettled()
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

  let differentiators: string[] = [];

  // Phase 1: Generate executive summary first (provides differentiators)
  if (execSection) {
    try {
      const res = await generateSection(
        proposalId,
        execSection,
        differentiators,
        fetchFn,
      );
      if (res.ok) {
        const result = await res.json();
        if (result.differentiators) {
          differentiators = result.differentiators;
        }
      }
    } catch {
      // Exec summary failed — continue with remaining sections
    }
  }

  // Phase 2: Generate remaining sections in parallel batches
  for (let i = 0; i < otherSections.length; i += BATCH_SIZE) {
    const batch = otherSections.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(
      batch.map((section) =>
        generateSection(proposalId, section, differentiators, fetchFn),
      ),
    );
  }

  // Phase 3: Finalize
  try {
    await fetchFn(`/api/proposals/${proposalId}/generate/finalize`, {
      method: "POST",
    });
  } catch {
    // Finalize failure is non-blocking
  }
}
