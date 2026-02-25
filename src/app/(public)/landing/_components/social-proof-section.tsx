"use client";

export function SocialProofSection() {
  return (
    <section className="vf-proof">
      <div className="vf-section-inner">
        <span className="vf-label">Built for Real Results</span>
        <div className="vf-proof-stats">
          <div className="vf-proof-stat">
            <span className="vf-proof-num">11</span>
            <span className="vf-proof-desc">
              Proposal sections
              <br />
              generated per RFP
            </span>
          </div>
          <div className="vf-proof-divider" />
          <div className="vf-proof-stat">
            <span className="vf-proof-num">6</span>
            <span className="vf-proof-desc">
              Layers of intent
              <br />
              in every section
            </span>
          </div>
          <div className="vf-proof-divider" />
          <div className="vf-proof-stat">
            <span className="vf-proof-num">9,500+</span>
            <span className="vf-proof-desc">
              Federal awards
              <br />
              in intelligence database
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
              IntentBid is in early access with select government contractors
              and professional services firms. We&rsquo;re building alongside
              our first customers — every feature ships because a real team
              needed it, not because a roadmap said so.
            </p>
            <div className="vf-proof-author">
              <div className="vf-proof-avatar" style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)", fontSize: 12, fontWeight: 600 }}>EA</div>
              <div>
                <span className="vf-proof-name">
                  Early Access Program
                </span>
                <span className="vf-proof-role">
                  Now accepting qualified teams &mdash; limited spots available
                </span>
              </div>
            </div>
          </div>
          <div className="vf-proof-quote">
            <p className="vf-proof-text">
              Our founders have 30+ years of combined experience in IT,
              cybersecurity, and business development. We built IntentBid
              because we lived the pain of manual proposals &mdash; and knew
              AI could do better than templates and cut-and-paste.
            </p>
            <div className="vf-proof-author">
              <div className="vf-proof-avatar" style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)", fontSize: 12, fontWeight: 600 }}>IB</div>
              <div>
                <span className="vf-proof-name">
                  Founded in Seattle, 2026
                </span>
                <span className="vf-proof-role">
                  Built by proposal practitioners, not just engineers
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
