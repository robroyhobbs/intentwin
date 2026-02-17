"use client";

import Link from "next/link";

export function HeroSection() {
  return (
    <>
      {/* Navigation */}
      <nav className="vf-nav">
        <div className="vf-nav-inner">
          <Link href="/" className="vf-logo">
            IntentWin
          </Link>
          <div className="vf-nav-links">
            <a href="#compare">Compare</a>
            <a href="#framework">Framework</a>
            <a href="#gov">Gov</a>
            <a href="#pricing">Pricing</a>
            <Link href="/request-access" className="vf-nav-cta">
              Request Access
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="vf-hero">
        <div className="vf-hero-glow" aria-hidden="true" />
        <div className="vf-hero-inner">
          <span className="vf-badge">Invite Only</span>
          <h1 className="vf-hero-headline">
            Proposals
            <br />
            engineered to <span className="vf-gradient-text">win.</span>
          </h1>
          <p className="vf-hero-sub">
            RFPs. RFIs. SOWs. Capability statements. Decks.
            <br />
            Six layers of persuasion intelligence in every section.
            <br />
            AI-powered. Human-guided. Engineered to win.
          </p>
          <div className="vf-hero-actions">
            <Link href="/request-access" className="vf-btn-primary">
              Request Access
            </Link>
            <a href="#compare" className="vf-btn-ghost">
              See How It Works
            </a>
          </div>
          <div className="vf-hero-trust">
            <span className="vf-trust-item">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 1L10 5.5L15 6.2L11.5 9.5L12.4 14.5L8 12.2L3.6 14.5L4.5 9.5L1 6.2L6 5.5L8 1Z"
                  fill="#a78bfa"
                />
              </svg>
              Human-in-the-loop
            </span>
            <span className="vf-trust-divider">|</span>
            <span className="vf-trust-item">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle
                  cx="8"
                  cy="8"
                  r="6"
                  stroke="#a78bfa"
                  strokeWidth="1.5"
                />
                <path
                  d="M5 8L7 10L11 6"
                  stroke="#a78bfa"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              6-layer persuasion engine
            </span>
            <span className="vf-trust-divider">|</span>
            <span className="vf-trust-item">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 2V14M2 8H14"
                  stroke="#a78bfa"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              10x more proposals
            </span>
          </div>
        </div>
      </section>

      {/* Statement */}
      <section className="vf-statement">
        <div className="vf-statement-inner">
          <p className="vf-statement-text">
            The difference between winning and losing a contract is not what you
            can do — it&apos;s how you present it.
          </p>
        </div>
      </section>
    </>
  );
}
