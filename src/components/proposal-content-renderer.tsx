"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { extractMermaidBlocks } from "@/lib/diagrams/extract-mermaid";
import { MermaidRenderer } from "@/components/mermaid-renderer";

interface ProposalContentRendererProps {
  content: string;
  className?: string;
}

export function ProposalContentRenderer({
  content,
  className,
}: ProposalContentRendererProps) {
  const blocks = useMemo(() => extractMermaidBlocks(content), [content]);

  return (
    <div className={className}>
      {blocks.map((block, i) => {
        if (block.type === "mermaid") {
          return <MermaidRenderer key={`mermaid-${i}`} chart={block.content} />;
        }

        return (
          <div key={`text-${i}`} className="prose prose-sm max-w-none text-gray-700">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {block.content}
            </ReactMarkdown>
          </div>
        );
      })}
    </div>
  );
}
