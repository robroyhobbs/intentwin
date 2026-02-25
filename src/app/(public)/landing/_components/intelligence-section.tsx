"use client";

export function IntelligenceSection() {
  return (
    <section id="intelligence" className="vf-intel">
      <div className="vf-intel-glow" aria-hidden="true" />
      <div className="vf-section-inner vf-intel-inner">
        <span className="vf-label">IntentBid Intelligence</span>
        <h2 className="vf-section-heading">
          Know which deals to chase
          <br />
          <span className="vf-gradient-text">before you write a word.</span>
        </h2>
        <p
          className="vf-section-sub"
          style={{ maxWidth: 640, margin: "0 auto 56px" }}
        >
          Proposal writing is only half the battle. IntentBid Intelligence gives
          you the market data, scoring, and competitive analysis to pursue the
          right opportunities with the right strategy.
        </p>

        <div className="vf-intel-grid">
          {/* Opportunity Discovery */}
          <div className="vf-intel-card">
            <div className="vf-intel-card-icon">
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
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h3 className="vf-intel-card-title">Opportunity Discovery</h3>
            <p className="vf-intel-card-desc">
              Search live solicitations across agencies. Filter by NAICS,
              set-aside type, deadline, and estimated value. When you find a
              match, start a proposal with one click &mdash; client details
              pre-filled.
            </p>
          </div>

          {/* AI Bid Scoring */}
          <div className="vf-intel-card">
            <div className="vf-intel-card-icon">
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
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <h3 className="vf-intel-card-title">AI Bid/No-Bid Scoring</h3>
            <p className="vf-intel-card-desc">
              Every opportunity is scored across five factors &mdash; requirement
              match, past performance, capability alignment, timeline
              feasibility, and strategic value. Get a data-backed
              recommendation before you commit resources.
            </p>
          </div>

          {/* Agency & Market Intelligence */}
          <div className="vf-intel-card">
            <div className="vf-intel-card-icon">
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
            <h3 className="vf-intel-card-title">Agency Win Patterns</h3>
            <p className="vf-intel-card-desc">
              See who wins with each agency and why. Historical win rates by
              NAICS, incumbent patterns, and seasonal award trends&mdash;so you
              know which agencies favor your profile.
            </p>
          </div>

          {/* Win Probability */}
          <div className="vf-intel-card">
            <div className="vf-intel-card-icon">
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
                <path d="M12 20V10" />
                <path d="M18 20V4" />
                <path d="M6 20v-4" />
              </svg>
            </div>
            <h3 className="vf-intel-card-title">Win Probability Engine</h3>
            <p className="vf-intel-card-desc">
              Historical award data powers a statistical win probability for
              every opportunity. See which factors help or hurt your chances,
              with comparable awards as evidence.
            </p>
          </div>

          {/* Competitive Landscape */}
          <div className="vf-intel-card">
            <div className="vf-intel-card-icon">
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
            <h3 className="vf-intel-card-title">Competitive Landscape</h3>
            <p className="vf-intel-card-desc">
              See who wins in your market. Top competitors by win count and
              total value, average award sizes, and set-aside distribution
              &mdash; so you position against real competitors, not assumptions.
            </p>
          </div>

          {/* Rate Benchmarks */}
          <div className="vf-intel-card">
            <div className="vf-intel-card-icon">
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
            <h3 className="vf-intel-card-title">Market Rate Intelligence</h3>
            <p className="vf-intel-card-desc">
              Understand competitive pricing in your market. See rate
              distributions by labor category, geographic variance, and where
              your pricing sits against recent winners.
            </p>
          </div>
        </div>

        <p className="vf-intel-footnote">
          Powered by USAspending.gov and GSA CALC+ data. All intelligence is
          automatically injected into your proposals during generation.
        </p>
      </div>
    </section>
  );
}
