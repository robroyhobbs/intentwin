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
  comments: ReviewComment[]
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

  const system = `You are an expert proposal editor for Capgemini. Your task is to revise proposal section content based on reviewer feedback.

Rules:
- Address every reviewer comment listed below
- Preserve the overall structure, formatting (headings, lists, paragraphs), and Mermaid diagram blocks
- Maintain professional Capgemini tone and terminology
- Make targeted edits — do NOT rewrite content that doesn't need changing
- If a comment references specific text, focus your revision on that text
- Keep the same level of detail and depth
- Do not add meta-commentary about your changes — just output the revised content
- Return ONLY the revised section content, nothing else`;

  const user = `## Section: ${sectionTitle}

## Current Content:

${sectionContent}

## Reviewer Comments to Address:

${commentsList}

Please revise the section content above to address all reviewer comments. Return only the revised content.`;

  return { system, user };
}
