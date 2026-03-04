import { CollapsibleSection } from "./collapsible-section";
import { AlertCard } from "../shared/alert-card";
import type { CoachContent } from "../create-types";

export function RisksSection({
  flags,
}: {
  flags: CoachContent["riskFlags"];
}) {
  if (flags.length === 0) return null;
  return (
    <CollapsibleSection title="Attention needed" defaultOpen={true}>
      <div className="space-y-2">
        {flags.map((flag) => (
          <AlertCard key={flag.id} severity={flag.severity} text={flag.label} />
        ))}
      </div>
    </CollapsibleSection>
  );
}
