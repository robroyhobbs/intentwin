"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { Agentation } from "agentation";
import type { ProposalReview } from "@/types/review";
import { logger } from "@/lib/utils/logger";

interface AgentationWrapperProps {
  proposalId: string;
  sectionId?: string;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onAnnotationAdded?: (review: ProposalReview) => void;
  children: React.ReactNode;
}

export function AgentationWrapper({
  proposalId,
  sectionId,
  authFetch,
  onAnnotationAdded,
  children,
}: AgentationWrapperProps) {
  const handleAnnotationAdd = useCallback(
    async (annotation: {
      id: string;
      comment: string;
      element?: string;
      elementPath?: string;
      boundingBox?: { x: number; y: number; width: number; height: number };
      cssClasses?: string;
      selectedText?: string;
    }) => {
      if (!annotation.comment) return;

      try {
        const response = await authFetch(
          `/api/proposals/${proposalId}/reviews`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              section_id: sectionId || null,
              annotation_type: "comment",
              content: annotation.comment,
              selector_data: {
                element: annotation.element,
                elementPath: annotation.elementPath,
                boundingBox: annotation.boundingBox,
                cssClasses: annotation.cssClasses,
              },
              selected_text: annotation.selectedText,
            }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          onAnnotationAdded?.(data.review);
          toast.success("Comment added");
        } else {
          const err = await response.json().catch(() => ({}));
          toast.error(err.error || "Failed to save comment");
        }
      } catch (error) {
        logger.error("Failed to save annotation", error);
        toast.error("Failed to save comment — check your connection");
      }
    },
    [proposalId, sectionId, authFetch, onAnnotationAdded],
  );

  return (
    <div className="relative group/agentation">
      <div className="absolute -inset-1 rounded-xl border-2 border-transparent group-hover/agentation:border-[#12ABDB]/20 transition-all duration-300 pointer-events-none" />
      {children}
      <Agentation
        onAnnotationAdd={handleAnnotationAdd}
        copyToClipboard={false}
      />
    </div>
  );
}
