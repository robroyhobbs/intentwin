export interface ContentBlock {
  type: "text" | "mermaid";
  content: string;
}

/**
 * Splits markdown content into alternating text and mermaid blocks.
 * Detects ```mermaid ... ``` code fences.
 */
export function extractMermaidBlocks(markdown: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const regex = /```mermaid\s*\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(markdown)) !== null) {
    // Text before this mermaid block
    if (match.index > lastIndex) {
      const text = markdown.slice(lastIndex, match.index).trim();
      if (text) {
        blocks.push({ type: "text", content: text });
      }
    }

    // The mermaid block itself
    blocks.push({ type: "mermaid", content: match[1].trim() });
    lastIndex = match.index + match[0].length;
  }

  // Remaining text after the last mermaid block
  if (lastIndex < markdown.length) {
    const text = markdown.slice(lastIndex).trim();
    if (text) {
      blocks.push({ type: "text", content: text });
    }
  }

  // If no mermaid blocks found, return the whole thing as text
  if (blocks.length === 0 && markdown.trim()) {
    blocks.push({ type: "text", content: markdown.trim() });
  }

  return blocks;
}
