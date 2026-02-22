"use client";

import { useMemo } from "react";
import { CheckCircle2, AlertTriangle, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PlaceholderAction, type PlaceholderItem } from "./placeholder-action";

interface Section {
  id: string;
  title: string;
  section_type: string;
  generated_content: string | null;
  edited_content: string | null;
}

interface ReviewModeSidebarProps {
  sections: Section[];
  onNavigateToSection: (sectionId: string) => void;
}

/**
 * Regex patterns for detecting placeholders in generated content.
 * Matches:
 * - [CASE STUDY NEEDED: ...]
 * - [TEAM MEMBER NEEDED: ...]
 * - {signatory_name}, {signatory_title}, {date}, {client_name}
 * - $TBD
 */
const PLACEHOLDER_PATTERNS = [
  /\[CASE STUDY NEEDED:[^\]]*\]/g,
  /\[TEAM MEMBER NEEDED:[^\]]*\]/g,
  /\{signatory_name\}/g,
  /\{signatory_title\}/g,
  /\{date\}/g,
  /\{client_name\}/g,
  /\$TBD/g,
];

/**
 * Scan section content for placeholder markers.
 * Checks both generated and edited content (edited takes precedence).
 */
function extractPlaceholders(sections: Section[]): PlaceholderItem[] {
  const items: PlaceholderItem[] = [];

  for (const section of sections) {
    const content = section.edited_content || section.generated_content || "";

    for (const pattern of PLACEHOLDER_PATTERNS) {
      // Reset regex lastIndex for global patterns
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(content)) !== null) {
        items.push({
          id: `${section.id}-${match.index}-${match[0]}`,
          text: match[0],
          sectionId: section.id,
          sectionTitle: section.title,
          resolved: false,
        });
      }
    }
  }

  return items;
}

/**
 * Determine resolved status by comparing generated vs edited content.
 * A placeholder is resolved if it appeared in generated_content but
 * is no longer present in edited_content.
 */
function markResolvedPlaceholders(
  sections: Section[],
): PlaceholderItem[] {
  const items: PlaceholderItem[] = [];

  for (const section of sections) {
    const generatedContent = section.generated_content || "";
    const editedContent = section.edited_content || "";

    for (const pattern of PLACEHOLDER_PATTERNS) {
      pattern.lastIndex = 0;
      let match;

      // Find all placeholders in generated content
      while ((match = pattern.exec(generatedContent)) !== null) {
        const placeholderText = match[0];
        // Check if it was removed in the edited version
        const resolved = editedContent
          ? !editedContent.includes(placeholderText)
          : false;

        items.push({
          id: `${section.id}-${match.index}-${placeholderText}`,
          text: placeholderText,
          sectionId: section.id,
          sectionTitle: section.title,
          resolved,
        });
      }

      // Also check edited content for NEW placeholders (shouldn't happen but be safe)
      if (editedContent) {
        pattern.lastIndex = 0;
        while ((match = pattern.exec(editedContent)) !== null) {
          const placeholderText = match[0];
          // Skip if this placeholder text was already found in generated_content for this section
          if (
            !items.some(
              (i) => i.sectionId === section.id && i.text === placeholderText,
            )
          ) {
            items.push({
              id: `${section.id}-edited-${match.index}-${placeholderText}`,
              text: placeholderText,
              sectionId: section.id,
              sectionTitle: section.title,
              resolved: false,
            });
          }
        }
      }
    }
  }

  return items;
}

export function ReviewModeSidebar({
  sections,
  onNavigateToSection,
}: ReviewModeSidebarProps) {
  const placeholders = useMemo(
    () => markResolvedPlaceholders(sections),
    [sections],
  );

  const resolvedCount = placeholders.filter((p) => p.resolved).length;
  const totalCount = placeholders.length;
  const allResolved = totalCount > 0 && resolvedCount === totalCount;

  if (totalCount === 0) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <ListChecks className="h-4 w-4 text-[var(--foreground-muted)]" />
          <h3 className="text-sm font-bold text-[var(--foreground)]">
            Review Mode
          </h3>
        </div>
        <div className="flex flex-col items-center py-8 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
          <p className="text-sm font-medium text-[var(--foreground)]">
            All sections complete
          </p>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">
            No placeholders found in any section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <ListChecks className="h-4 w-4 text-[var(--foreground-muted)]" />
        <h3 className="text-sm font-bold text-[var(--foreground)]">
          Review Mode
        </h3>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
          <span>
            {resolvedCount}/{totalCount} actions completed
          </span>
          {allResolved && (
            <span className="text-emerald-500 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Done
            </span>
          )}
        </div>
        <div className="mt-1.5 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              allResolved ? "bg-emerald-500" : "bg-amber-500",
            )}
            style={{
              width: `${totalCount > 0 ? (resolvedCount / totalCount) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Unresolved items */}
      {placeholders.filter((p) => !p.resolved).length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wide mb-1">
            Needs Attention ({placeholders.filter((p) => !p.resolved).length})
          </p>
          <div className="space-y-0.5">
            {placeholders
              .filter((p) => !p.resolved)
              .map((item) => (
                <PlaceholderAction
                  key={item.id}
                  item={item}
                  onNavigate={onNavigateToSection}
                />
              ))}
          </div>
        </div>
      )}

      {/* Resolved items */}
      {resolvedCount > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wide mb-1">
            Completed ({resolvedCount})
          </p>
          <div className="space-y-0.5">
            {placeholders
              .filter((p) => p.resolved)
              .map((item) => (
                <PlaceholderAction
                  key={item.id}
                  item={item}
                  onNavigate={onNavigateToSection}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { extractPlaceholders, markResolvedPlaceholders };
