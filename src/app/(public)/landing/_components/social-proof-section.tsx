"use client";

export function SocialProofSection() {
  return (
    <section className="vf-proof">
      <div className="vf-section-inner">
        <span className="vf-label">Trusted by Teams That Win</span>
        <div className="vf-proof-stats">
          <div className="vf-proof-stat">
            <span className="vf-proof-num">10x</span>
            <span className="vf-proof-desc">
              More proposals
              <br />
              submitted per month
            </span>
          </div>
          <div className="vf-proof-divider" />
          <div className="vf-proof-stat">
            <span className="vf-proof-num">2x</span>
            <span className="vf-proof-desc">
              Higher win rate
              <br />
              vs. industry average
            </span>
          </div>
          <div className="vf-proof-divider" />
          <div className="vf-proof-stat">
            <span className="vf-proof-num">85%</span>
            <span className="vf-proof-desc">
              Reduction in
              <br />
              proposal creation time
            </span>
          </div>
          <div className="vf-proof-divider" />
          <div className="vf-proof-stat">
            <span className="vf-proof-num">100%</span>
            <span className="vf-proof-desc">
              Human-reviewed
              <br />
              before submission
            </span>
          </div>
        </div>

        <div className="vf-proof-quotes">
          <div className="vf-proof-quote">
            <p className="vf-proof-text">
              &ldquo;We went from 3 proposals a month to 30. Our pipeline
              tripled in the first quarter. The Intent Framework doesn&apos;t
              just generate text — it structures arguments the way evaluators
              think.&rdquo;
            </p>
            <div className="vf-proof-author">
              <div className="vf-proof-avatar">VP</div>
              <div>
                <span className="vf-proof-name">
                  VP of Business Development
                </span>
                <span className="vf-proof-role">
                  Federal Consulting Firm, 200+ employees
                </span>
              </div>
            </div>
          </div>
          <div className="vf-proof-quote">
            <p className="vf-proof-text">
              &ldquo;What I love is the human-in-the-loop approach. Our SMEs
              still own every section, but now they start from an 80% draft
              instead of a blank page. We ship better proposals in a fraction of
              the time.&rdquo;
            </p>
            <div className="vf-proof-author">
              <div className="vf-proof-avatar">BD</div>
              <div>
                <span className="vf-proof-name">
                  Director of Capture Management
                </span>
                <span className="vf-proof-role">
                  Mid-Market Defense Contractor
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
