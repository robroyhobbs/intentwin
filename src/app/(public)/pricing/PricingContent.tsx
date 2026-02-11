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

      <style jsx global>{`
        .vf-page {
          background: #09090b;
          color: #a1a1aa;
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            sans-serif;
          font-weight: 400;
          line-height: 1.7;
          -webkit-font-smoothing: antialiased;
          min-height: 100vh;
        }

        /* Nav */
        .vf-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: rgba(9, 9, 11, 0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .vf-nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 18px 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .vf-logo {
          font-size: 17px;
          font-weight: 700;
          color: #fff;
          text-decoration: none;
          letter-spacing: -0.03em;
        }
        .vf-nav-links {
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .vf-nav-links a {
          color: #71717a;
          text-decoration: none;
          font-size: 13px;
          transition: color 0.2s;
        }
        .vf-nav-links a:hover {
          color: #fff;
        }
        .vf-nav-cta {
          background: linear-gradient(135deg, #7c3aed, #6366f1) !important;
          color: #fff !important;
          padding: 8px 22px;
          border-radius: 8px;
          font-weight: 600 !important;
          font-size: 13px !important;
          transition: all 0.2s;
        }
        .vf-nav-cta:hover {
          opacity: 0.9;
        }

        /* Pricing Page */
        .vf-pricing-page {
          padding: 160px 0 120px;
          text-align: center;
        }
        .vf-section-inner {
          max-width: 960px;
          margin: 0 auto;
          padding: 0 48px;
        }
        .vf-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          background: linear-gradient(90deg, #a78bfa, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 16px;
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

        /* Price Card */
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
          font-size: clamp(48px, 8vw, 72px);
          font-weight: 900;
          color: #fafafa;
          letter-spacing: -0.04em;
          margin: 0;
          line-height: 1;
        }
        .vf-price-period {
          font-size: 20px;
          color: #52525b;
          font-weight: 400;
          margin-left: 2px;
        }
        .vf-price-tagline {
          font-size: 16px;
          color: #71717a;
          margin: 16px 0 36px;
        }

        /* Feature Groups */
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
        .vf-price-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .vf-price-list li {
          padding: 10px 0;
          font-size: 14px;
          color: #a1a1aa;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          padding-left: 20px;
          position: relative;
        }
        .vf-price-list li::before {
          content: "";
          position: absolute;
          left: 0;
          top: 50%;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #6366f1);
          transform: translateY(-50%);
        }
        .vf-price-list li:last-child {
          border-bottom: none;
        }
        .vf-price-note {
          margin-top: 16px;
          font-size: 13px;
          color: #52525b;
        }

        /* Buttons */
        .vf-btn-primary {
          display: inline-block;
          padding: 14px 36px;
          background: linear-gradient(135deg, #7c3aed, #6366f1);
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          border-radius: 10px;
          transition: all 0.25s ease;
          box-shadow: 0 4px 24px rgba(124, 58, 237, 0.2);
        }
        .vf-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 32px rgba(124, 58, 237, 0.3);
        }
        .vf-btn-full {
          width: 100%;
          text-align: center;
        }
        .vf-btn-ghost {
          display: inline-block;
          padding: 14px 36px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #a1a1aa;
          font-size: 15px;
          font-weight: 500;
          text-decoration: none;
          border-radius: 10px;
          transition: all 0.2s;
        }
        .vf-btn-ghost:hover {
          border-color: rgba(255, 255, 255, 0.25);
          color: #fff;
        }

        /* Back link */
        .vf-back-link {
          margin-top: 48px;
          text-align: center;
        }

        /* Legal links */
        .vf-footer-legal {
          margin-top: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        .vf-footer-legal-link {
          font-size: 13px;
          color: #3f3f46;
          text-decoration: none;
          transition: color 0.2s;
        }
        .vf-footer-legal-link:hover {
          color: #52525b;
        }
        .vf-footer-legal-sep {
          font-size: 13px;
          color: #3f3f46;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .vf-pricing-page {
            padding: 140px 0 80px;
          }
          .vf-section-inner {
            padding: 0 24px;
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
