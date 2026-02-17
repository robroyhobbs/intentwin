"use client";

export function HumanLoopSection() {
  return (
    <section className="vf-human">
      <div className="vf-section-inner">
        <div className="vf-human-grid">
          <div className="vf-human-content">
            <span className="vf-label">Human-in-the-Loop</span>
            <h2 className="vf-section-heading" style={{ marginBottom: 24 }}>
              AI-powered.
              <br />
              Human-guided.
            </h2>
            <p className="vf-human-body">
              IntentWin is never autopilot. Every proposal flows through your
              team — review, refine, and approve at every stage. The AI
              accelerates your expertise. It doesn&apos;t replace it.
            </p>
            <div className="vf-human-points">
              <div className="vf-human-point">
                <span className="vf-human-icon">01</span>
                <div>
                  <strong>You set the strategy.</strong> Define win themes, brand
                  voice, and competitive positioning before generation begins.
                </div>
              </div>
              <div className="vf-human-point">
                <span className="vf-human-icon">02</span>
                <div>
                  <strong>You review every section.</strong> Approve, edit, or
                  regenerate any part. Nothing ships without your sign-off.
                </div>
              </div>
              <div className="vf-human-point">
                <span className="vf-human-icon">03</span>
                <div>
                  <strong>You teach the system.</strong> Mark wins and losses.
                  The AI learns from your judgment, not the other way around.
                </div>
              </div>
            </div>
          </div>
          <div className="vf-human-visual">
            <div className="vf-human-flow">
              <div className="vf-flow-step vf-flow-human">
                <span className="vf-flow-label">You</span>
                <span className="vf-flow-action">Define Strategy</span>
              </div>
              <div className="vf-flow-arrow">&#x2193;</div>
              <div className="vf-flow-step vf-flow-ai">
                <span className="vf-flow-label">IntentWin</span>
                <span className="vf-flow-action">Generate Draft</span>
              </div>
              <div className="vf-flow-arrow">&#x2193;</div>
              <div className="vf-flow-step vf-flow-human">
                <span className="vf-flow-label">You</span>
                <span className="vf-flow-action">Review &amp; Refine</span>
              </div>
              <div className="vf-flow-arrow">&#x2193;</div>
              <div className="vf-flow-step vf-flow-ai">
                <span className="vf-flow-label">IntentWin</span>
                <span className="vf-flow-action">Apply 6 Layers</span>
              </div>
              <div className="vf-flow-arrow">&#x2193;</div>
              <div className="vf-flow-step vf-flow-human">
                <span className="vf-flow-label">You</span>
                <span className="vf-flow-action">Approve &amp; Submit</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
