"use client";

export function GovSection() {
  return (
    <section id="gov" className="vf-gov">
      <div className="vf-gov-glow" aria-hidden="true" />
      <div className="vf-section-inner vf-gov-inner">
        <div className="vf-gov-badge-row">
          <span className="vf-gov-badge">IntentWin Gov</span>
        </div>
        <h2 className="vf-gov-headline">
          Purpose-built for
          <br />
          <span className="vf-gradient-text">government contractors.</span>
        </h2>
        <p className="vf-gov-sub">
          Everything in IntentWin Pro, plus specialized capabilities for federal,
          state, and local government procurement.
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
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="vf-gov-card-title">Auto-Teaming Engine</h3>
            <p className="vf-gov-card-desc">
              Automatically identify teaming gaps and suggest subcontractor
              partners based on required NAICS codes, set-asides, and past
              performance requirements. Build winning teams before you write a
              word.
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
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3 className="vf-gov-card-title">
              Classification &amp; Compliance
            </h3>
            <p className="vf-gov-card-desc">
              Automatic NAICS code mapping, set-aside identification (8(a),
              HUBZone, WOSB, SDVOSB), and compliance matrix generation. Ensure
              Section L/M requirements are addressed point-by-point.
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
              Contract Vehicle Intelligence
            </h3>
            <p className="vf-gov-card-desc">
              Align proposals to GSA Schedule, GWACs, BPAs, and IDIQs.
              Auto-detect vehicle requirements from solicitation documents and
              tailor responses to specific ordering guides and evaluation
              criteria.
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
            <h3 className="vf-gov-card-title">Past Performance Library</h3>
            <p className="vf-gov-card-desc">
              Centralized repository of CPARS data, past performance narratives,
              and project references. Automatically match the most relevant past
              performance to each new opportunity&apos;s evaluation criteria.
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
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <h3 className="vf-gov-card-title">
              SAM.gov &amp; GovWin Integration
            </h3>
            <p className="vf-gov-card-desc">
              Pull opportunity details directly from SAM.gov. Cross-reference
              with your CAGE code, entity registrations, and certifications to
              ensure eligibility before you invest in a response.
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
              Capture Management Workflow
            </h3>
            <p className="vf-gov-card-desc">
              Gate reviews, bid/no-bid decision frameworks, color team reviews
              (Pink, Red, Gold), and Shipley-aligned processes built into every
              proposal lifecycle.
            </p>
          </div>
        </div>

        <div className="vf-gov-cta">
          <p className="vf-gov-cta-text">
            IntentWin Gov is available to qualified government contractors.
          </p>
          <a href="mailto:gov@intentwin.com" className="vf-btn-gov">
            Contact Us for Gov Edition
          </a>
        </div>
      </div>
    </section>
  );
}
