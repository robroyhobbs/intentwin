import { CollapsibleSection } from "./collapsible-section";
import { VerdictCard } from "../shared/verdict-card";
import { GapCard } from "../shared/gap-card";
import { StrengthCard } from "../shared/strength-card";
import { IntelStats } from "../shared/intel-stats";
import type { CoachContent } from "../create-types";
import type { BidIntelligenceContext } from "@/lib/ai/bid-scoring";

export function BidAnalysis({
  content,
  intelligence,
}: {
  content: CoachContent;
  intelligence?: BidIntelligenceContext | null;
}) {
  return (
    <div className="space-y-3">
      {content.verdict && <VerdictCard verdict={content.verdict} />}
      {content.gaps && content.gaps.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase">
            Gaps to Address
          </h4>
          {content.gaps.map((g) => (
            <GapCard
              key={g.id}
              factor={g.factor}
              rationale={g.rationale}
              score={g.score}
            />
          ))}
        </div>
      )}
      {content.strengths && content.strengths.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase">
            Your Strengths
          </h4>
          {content.strengths.map((s) => (
            <StrengthCard
              key={s.id}
              factor={s.factor}
              rationale={s.rationale}
            />
          ))}
        </div>
      )}
      {intelligence && (
        <CollapsibleSection title="Market Intelligence" defaultOpen={false}>
          <IntelStats intelligence={intelligence} />
        </CollapsibleSection>
      )}
    </div>
  );
}
