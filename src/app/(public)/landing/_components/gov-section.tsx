"use client";

export function GovSection() {
  return (
    <section id="gov" className="vf-gov">
      <div className="vf-gov-glow" aria-hidden="true" />
      <div className="vf-section-inner vf-gov-inner">
        <div className="vf-gov-badge-row">
          <span className="vf-gov-badge">IntentBid Gov</span>
        </div>
        <h2 className="vf-gov-headline">
          Purpose-built for
          <br />
          <span className="vf-gradient-text">government contractors.</span>
        </h2>
        <p className="vf-gov-sub">
          Everything in IntentBid, plus specialized capabilities for federal,
          state, and local procurement &mdash; built on live government data.
        </p>

        <div className="vf-gov-grid">
          <div className="vf-gov-card">
            <div className="vf-gov-card-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3 className="vf-gov-card-title">
              Classification &amp; Compliance
            </h3>
            <p className="vf-gov-card-desc">
              Automatic NAICS code analysis, set-aside identification (8(a),
              HUBZone, WOSB, SDVOSB), and compliance matrix generation. Section
              L/M requirements mapped point-by-point.
            </p>
          </div>

          <div className="vf-gov-card">
            <div className="vf-gov-card-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
            </div>
            <h3 className="vf-gov-card-title">
              Agency Evaluation Intelligence
            </h3>
            <p className="vf-gov-card-desc">
              Know how each agency evaluates before you write. Preferred
              evaluation methods, estimated criteria weights, competition
              levels, and recent award patterns &mdash; injected directly into
              your generation prompts.
            </p>
          </div>

          <div className="vf-gov-card">
            <div className="vf-gov-card-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <h3 className="vf-gov-card-title">GSA Rate Benchmarking</h3>
            <p className="vf-gov-card-desc">
              Price competitively with GSA CALC+ labor rate data. Median rates,
              ranges, and cost realism guidance so your pricing passes
              scrutiny without leaving money on the table.
            </p>
          </div>

          <div className="vf-gov-card">
            <div className="vf-gov-card-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <h3 className="vf-gov-card-title">Past Performance Matching</h3>
            <p className="vf-gov-card-desc">
              Centralized evidence library with past performance narratives and
              project references. The system automatically matches your most
              relevant work to each opportunity&apos;s evaluation criteria.
            </p>
          </div>

          <div className="vf-gov-card">
            <div className="vf-gov-card-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <h3 className="vf-gov-card-title">
              FOIA &amp; Public Records
            </h3>
            <p className="vf-gov-card-desc">
              Generate state-specific Sunshine Law and FOIA requests with one
              click. AI-drafted letters cite the correct statute, include fee
              waiver language, and are ready to send.
            </p>
          </div>

          <div className="vf-gov-card">
            <div className="vf-gov-card-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
              </svg>
            </div>
            <h3 className="vf-gov-card-title">
              Color Team Reviews
            </h3>
            <p className="vf-gov-card-desc">
              Built-in Pink, Red, Gold, and White team review gates. Structured
              bid/no-bid decision frameworks and quality checkpoints at every
              stage of the proposal lifecycle.
            </p>
          </div>
        </div>

        <div className="vf-gov-cta">
          <p className="vf-gov-cta-text">
            IntentBid Gov is available to qualified government contractors.
          </p>
          <a href="mailto:gov@intentbid.com" className="vf-btn-gov">
            Contact Us for Gov Edition
          </a>
        </div>
      </div>
    </section>
  );
}
