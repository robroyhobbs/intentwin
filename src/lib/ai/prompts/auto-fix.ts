/**
 * Prompt builder for AI-powered review auto-fix.
 * Takes a section's content and reviewer comments, instructs Claude
 * to revise the content addressing each comment.
 */

interface ReviewComment {
  id: string;
  content: string;
  selected_text?: string | null;
}

export function buildAutoFixPrompt(
  sectionTitle: string,
  sectionContent: string,
  comments: ReviewComment[],
  qualityFeedback?: string | null,
): { system: string; user: string } {
  const commentsList = comments
    .map((c, i) => {
      let entry = `${i + 1}. ${c.content}`;
      if (c.selected_text) {
        entry += `\n   Referenced text: "${c.selected_text}"`;
      }
      return entry;
    })
    .join("\n");

  const hasComments = comments.length > 0;
  const hasFeedback = !!qualityFeedback;

  const system = `You are an expert proposal editor. Your task is to revise proposal section content based on ${hasComments && hasFeedback ? "reviewer feedback and quality judge assessments" : hasComments ? "reviewer feedback" : "quality judge assessments"}.

Rules:
- Address every piece of feedback listed below
- Preserve the overall structure, formatting (headings, lists, paragraphs), and Mermaid diagram blocks
- Maintain professional tone and terminology
- Make targeted edits — do NOT rewrite content that doesn't need changing
- If a comment references specific text, focus your revision on that text
- Keep the same level of detail and depth
- Do not add meta-commentary about your changes — just output the revised content
- Return ONLY the revised section content, nothing else`;

  let userParts = `## Section: ${sectionTitle}\n\n## Current Content:\n\n${sectionContent}`;

  if (hasComments) {
    userParts += `\n\n## Reviewer Comments to Address:\n\n${commentsList}`;
  }

  if (hasFeedback) {
    userParts += `\n\n## Quality Judge Feedback (from independent reviewer council):\n\n${qualityFeedback}`;
  }

  userParts += `\n\nPlease revise the section content above to address all feedback. Return only the revised content.`;

  return { system, user: userParts };
}
