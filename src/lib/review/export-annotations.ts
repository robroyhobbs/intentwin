import type { ProposalReview } from "@/types/review";
import { ReviewStatus } from "@/lib/constants/statuses";

/**
 * Export review annotations as structured markdown for feedback sharing.
 */
export function exportAnnotationsAsMarkdown(
  proposalTitle: string,
  reviews: ProposalReview[],
  sections?: { id: string; title: string }[]
): string {
  const sectionMap = new Map(
    (sections || []).map((s) => [s.id, s.title])
  );

  const lines: string[] = [
    `# Review Feedback: ${proposalTitle}`,
    "",
    `**Date:** ${new Date().toLocaleDateString()}`,
    `**Total Comments:** ${reviews.length}`,
    `**Open:** ${reviews.filter((r) => r.status === ReviewStatus.OPEN).length}`,
    `**Resolved:** ${reviews.filter((r) => r.status === ReviewStatus.RESOLVED).length}`,
    "",
    "---",
    "",
  ];

  // Group by section
  const grouped = new Map<string, ProposalReview[]>();
  const noSection: ProposalReview[] = [];

  for (const review of reviews) {
    if (review.section_id) {
      const existing = grouped.get(review.section_id) || [];
      existing.push(review);
      grouped.set(review.section_id, existing);
    } else {
      noSection.push(review);
    }
  }

  // Render grouped reviews
  for (const [sectionId, sectionReviews] of grouped) {
    const sectionTitle = sectionMap.get(sectionId) || "Unknown Section";
    lines.push(`## ${sectionTitle}`);
    lines.push("");

    for (const review of sectionReviews) {
      const statusEmoji =
        review.status === ReviewStatus.RESOLVED
          ? "[RESOLVED]"
          : review.status === ReviewStatus.DISMISSED
            ? "[DISMISSED]"
            : "[OPEN]";

      lines.push(
        `- **${statusEmoji}** ${review.content}`
      );
      if (review.selected_text) {
        lines.push(`  > "${review.selected_text}"`);
      }
      lines.push(
        `  *— ${review.reviewer_email || "Reviewer"}, ${new Date(review.created_at).toLocaleDateString()}*`
      );
      lines.push("");
    }
  }

  if (noSection.length > 0) {
    lines.push("## General Comments");
    lines.push("");
    for (const review of noSection) {
      const statusEmoji =
        review.status === ReviewStatus.RESOLVED
          ? "[RESOLVED]"
          : review.status === ReviewStatus.DISMISSED
            ? "[DISMISSED]"
            : "[OPEN]";
      lines.push(`- **${statusEmoji}** ${review.content}`);
      if (review.selected_text) {
        lines.push(`  > "${review.selected_text}"`);
      }
      lines.push(
        `  *— ${review.reviewer_email || "Reviewer"}, ${new Date(review.created_at).toLocaleDateString()}*`
      );
      lines.push("");
    }
  }

  return lines.join("\n");
}
