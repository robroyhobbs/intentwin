"use client";

interface CompareRow {
  label: string;
  old: string;
  new: string;
}

interface CompareSectionProps {
  oldWay: CompareRow[];
}

export function CompareSection({ oldWay }: CompareSectionProps) {
  return (
    <section id="compare" className="vf-compare">
      <div className="vf-section-inner">
        <span className="vf-label">The Old Way vs IntentWin</span>
        <h2 className="vf-section-heading">
          You&apos;re leaving wins on the table.
        </h2>
        <div className="vf-compare-table">
          <div className="vf-compare-header">
            <div className="vf-compare-col-label" />
            <div className="vf-compare-col-old">The Old Way</div>
            <div className="vf-compare-col-new">With IntentWin</div>
          </div>
          {oldWay.map((row, i) => (
            <div key={i} className="vf-compare-row">
              <div className="vf-compare-col-label">{row.label}</div>
              <div className="vf-compare-col-old">
                <span className="vf-compare-x">&#x2715;</span>
                {row.old}
              </div>
              <div className="vf-compare-col-new">
                <span className="vf-compare-check">&#x2713;</span>
                {row.new}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
