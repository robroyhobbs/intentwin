"use client";

import Link from "next/link";

export default function PricingContent() {
  return (
    <>
      <div className="vf-page">
        {/* Navigation */}
        <nav className="vf-nav">
          <div className="vf-nav-inner">
            <Link href="/" className="vf-logo">
              IntentWin
            </Link>
            <div className="vf-nav-links">
              <Link href="/">Home</Link>
              <Link href="/request-access" className="vf-nav-cta">
                Request Access
              </Link>
            </div>
          </div>
        </nav>

        {/* Pricing Section */}
        <section className="vf-pricing-page">
          <div className="vf-section-inner">
            <span className="vf-label" style={{ textAlign: "center" }}>
              Pricing
            </span>
            <h1 className="vf-pricing-headline">
              One plan. Everything included.
            </h1>
            <p className="vf-pricing-sub">
              IntentWin is built for teams serious about winning. $999/month
              gets you unlimited access to our complete proposal intelligence
              platform.
            </p>

            <div className="vf-price-card">
              <h2 className="vf-price-amount">
                $999<span className="vf-price-period">/month</span>
              </h2>
              <p className="vf-price-tagline">
                Everything included. No tiers. No upsells.
              </p>

              <div className="vf-price-features">
                <div className="vf-price-feature-group">
                  <h3 className="vf-price-group-title">Proposal Generation</h3>
                  <ul className="vf-price-list">
                    <li>Unlimited proposal generation</li>
                    <li>All 6 Intent Framework layers</li>
                    <li>Ingest PDF, DOCX, PPTX, TXT, MD, CSV</li>
                    <li>Brand voice calibration</li>
                    <li>10 specialized section types</li>
                  </ul>
                </div>

                <div className="vf-price-feature-group">
                  <h3 className="vf-price-group-title">
                    Knowledge &amp; Evidence
                  </h3>
                  <ul className="vf-price-list">
                    <li>Unlimited knowledge base documents</li>
                    <li>RAG-powered evidence retrieval</li>
                    <li>Case study &amp; methodology library</li>
                    <li>Win theme &amp; differentiator engine</li>
                  </ul>
                </div>

                <div className="vf-price-feature-group">
                  <h3 className="vf-price-group-title">
                    Intelligence &amp; Learning
                  </h3>
                  <ul className="vf-price-list">
                    <li>Outcome tracking &amp; continuous learning</li>
                    <li>Growing organizational knowledge base</li>
                    <li>Win analytics &amp; insights</li>
                    <li>Competitive positioning engine</li>
                  </ul>
                </div>

                <div className="vf-price-feature-group">
                  <h3 className="vf-price-group-title">
                    Support &amp; Success
                  </h3>
                  <ul className="vf-price-list">
                    <li>White-glove onboarding</li>
                    <li>Priority support</li>
                    <li>Quarterly strategy reviews</li>
                    <li>Priority feature requests</li>
                  </ul>
                </div>
              </div>

              <Link
                href="/request-access"
                className="vf-btn-primary vf-btn-full"
              >
                Request Access
              </Link>
              <p className="vf-price-note">
                Invite-only. Limited availability.
              </p>
            </div>

            <div className="vf-back-link">
              <Link href="/" className="vf-btn-ghost">
                &larr; Back to Home
              </Link>
            </div>
            <div className="vf-footer-legal">
              <a href="/privacy" className="vf-footer-legal-link">
                Privacy Policy
              </a>
              <span className="vf-footer-legal-sep">|</span>
              <a href="/terms" className="vf-footer-legal-link">
                Terms of Service
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* Shared styles provided by @/styles/public.css */}
      <style jsx global>{`
        /* Pricing page-specific styles */
        .vf-pricing-page {
          padding: 160px 0 120px;
          text-align: center;
        }
        .vf-pricing-headline {
          font-size: clamp(32px, 5vw, 52px);
          font-weight: 900;
          line-height: 1.1;
          color: #fafafa;
          letter-spacing: -0.03em;
          margin: 0 0 20px;
        }
        .vf-pricing-sub {
          font-size: 17px;
          color: #71717a;
          max-width: 560px;
          margin: 0 auto 56px;
          line-height: 1.7;
          font-weight: 300;
        }
        .vf-price-card {
          max-width: 640px;
          margin: 0 auto;
          border-radius: 20px;
          padding: 48px 40px;
          border: 1px solid rgba(124, 58, 237, 0.15);
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(12px);
        }
        .vf-price-amount {
          margin: 0;
        }
        .vf-price-features {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px 24px;
          text-align: left;
          margin-bottom: 36px;
        }
        .vf-price-feature-group {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .vf-price-group-title {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #a78bfa;
          margin: 0 0 12px;
        }
        .vf-back-link {
          margin-top: 48px;
          text-align: center;
        }

        @media (max-width: 768px) {
          .vf-pricing-page {
            padding: 140px 0 80px;
          }
          .vf-price-card {
            padding: 36px 24px;
          }
          .vf-price-features {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
      `}</style>
    </>
  );
}
