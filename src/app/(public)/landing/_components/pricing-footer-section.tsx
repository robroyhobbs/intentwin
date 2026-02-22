"use client";

import Link from "next/link";

export function PricingFooterSection() {
  return (
    <>
      {/* Pricing */}
      <section id="pricing" className="vf-pricing">
        <div className="vf-section-inner">
          <div className="vf-price-card">
            <span className="vf-label" style={{ textAlign: "center" }}>
              Pricing
            </span>
            <h2 className="vf-price-amount">
              $999<span className="vf-price-period">/month</span>
            </h2>
            <p className="vf-price-tagline">
              Everything included. No tiers. No upsells.
            </p>
            <div className="vf-price-grid">
              <ul className="vf-price-list">
                <li>Unlimited proposal generation</li>
                <li>All 6 Intent Framework layers</li>
                <li>Ingest PDF, DOCX, PPTX, TXT, MD, CSV</li>
                <li>Brand voice calibration</li>
              </ul>
              <ul className="vf-price-list">
                <li>Win theme &amp; differentiator engine</li>
                <li>Outcome tracking &amp; continuous learning</li>
                <li>Growing organizational knowledge base</li>
                <li>White-glove onboarding &amp; priority support</li>
              </ul>
            </div>
            <Link
              href="/request-access"
              className="vf-btn-primary vf-btn-full"
            >
              Request Access
            </Link>
            <p className="vf-price-note">Invite-only. Limited availability.</p>
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
