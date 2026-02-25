"use client";

import Link from "next/link";

export function PricingFooterSection() {
  return (
    <>
      {/* Pricing Teaser */}
      <section id="pricing" className="vf-pricing">
        <div className="vf-section-inner" style={{ textAlign: "center" }}>
          <span className="vf-label" style={{ textAlign: "center" }}>
            Pricing
          </span>
          <h2
            className="vf-gradient-text"
            style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, marginBottom: 16 }}
          >
            $999/month — everything included.
          </h2>
          <p style={{ color: "#a1a1aa", fontSize: 17, maxWidth: 540, margin: "0 auto 28px", lineHeight: 1.7 }}>
            One plan. Unlimited proposals. Full intelligence suite.
            No tiers, no upsells, no per-proposal fees.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/pricing"
              className="vf-btn-primary"
            >
              See Full Pricing
            </Link>
            <Link
              href="/request-access"
              className="vf-btn-primary"
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              Request Access
            </Link>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="vf-footer">
        <div className="vf-footer-glow" aria-hidden="true" />
        <div className="vf-section-inner vf-footer-inner">
          <h2 className="vf-footer-headline">
            Stop writing proposals.
            <br />
            Start winning them.
          </h2>
          <Link href="/request-access" className="vf-btn-primary">
            Request Access
          </Link>
          <p className="vf-footer-tag">
            IntentBid — Proposal intelligence, engineered to win.
          </p>
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
      </footer>
    </>
  );
}
