import Link from "next/link";
import type { Metadata } from "next";
import { PublicNav } from "../_components/public-nav";

export const metadata: Metadata = {
  title: "Pricing — IntentBid",
  description:
    "IntentBid pricing for AI-powered proposal generation. One plan, everything included. Unlimited proposals, full intelligence suite, white-glove onboarding.",
  openGraph: {
    title: "IntentBid Pricing — Everything Included",
    description:
      "One plan. Unlimited proposals. Full intelligence suite. No tiers, no upsells.",
  },
};

const INCLUDED = [
  {
    category: "Proposal Generation",
    items: [
      "Unlimited proposal generation",
      "Full Intent Framework (6 layers of persuasion)",
      "11-section proposals with AI copilot editing",
      "Export to PPTX, DOCX, PDF, web slides",
      "Evidence library with auto-matching",
      "Version history and rollback",
    ],
  },
  {
    category: "Intelligence & Scoring",
    items: [
      "AI bid/no-bid scoring (5-factor)",
      "Market intelligence dashboard",
      "Federal award search (9,500+ awards)",
      "GSA rate benchmarks (1,000+ rates)",
      "Agency profiles and evaluation criteria",
      "FOIA & public records engine (50 states)",
    ],
  },
  {
    category: "Team & Process",
    items: [
      "Color team review gates (Pink → White)",
      "Compliance matrix generation",
      "Win/loss analytics and outcome tracking",
      "Multi-user collaboration",
      "White-glove onboarding",
      "Priority support",
    ],
  },
];

const FAQ = [
  {
    q: "Why one plan instead of tiers?",
    a: "Proposal quality shouldn't depend on which plan you're on. Every team gets the full platform — intelligence, generation, and review tools. We'd rather compete on value than nickel-and-dime features.",
  },
  {
    q: "What does \"unlimited proposals\" mean?",
    a: "Generate as many proposals as you need. No per-proposal fees, no token limits, no throttling. Your monthly subscription covers all usage.",
  },
  {
    q: "Is there a free trial?",
    a: "We offer a guided demo with your own RFP so you can see real output before committing. Request access and we'll set it up.",
  },
  {
    q: "Do you offer annual pricing?",
    a: "Yes. Contact us for annual pricing with a meaningful discount. We also offer custom arrangements for teams bidding on high volumes.",
  },
  {
    q: "What about government pricing or volume discounts?",
    a: "We work with government contractors of all sizes. Contact us at gov@intentbid.com for government-specific pricing and procurement vehicle options.",
  },
];

export default function PricingPage() {
  return (
    <div className="vf-page">
      <PublicNav />

      <main style={{ paddingTop: 120, paddingBottom: 80 }}>
        {/* Hero */}
        <div className="pricing-hero">
          <p className="prod-label">Pricing</p>
          <h1 className="prod-title">
            One plan.
            <br />
            <span className="prod-gradient">Everything included.</span>
          </h1>
          <p className="prod-subtitle">
            No tiers. No upsells. No per-proposal fees. Every team gets the
            full platform — intelligence, generation, and review tools.
          </p>
        </div>

        {/* Price card */}
        <section className="pricing-card-section">
          <div className="pricing-card">
            <div className="pricing-card-header">
              <span className="pricing-plan-name">IntentBid Pro</span>
              <div className="pricing-amount">
                $999<span className="pricing-period">/month</span>
              </div>
              <p className="pricing-tagline">
                For teams serious about winning more contracts
              </p>
            </div>
            <Link href="/request-access" className="pricing-card-cta">
              Request Access
            </Link>
            <p className="pricing-invite-note">
              Invite-only. Limited availability.
            </p>
          </div>
        </section>

        {/* What's included */}
        <section className="pricing-included">
          <h2 className="pricing-included-heading">
            Everything in one plan
          </h2>
          <div className="pricing-included-grid">
            {INCLUDED.map((group) => (
              <div key={group.category} className="pricing-included-group">
                <h3 className="pricing-group-title">{group.category}</h3>
                <ul className="pricing-group-list">
                  {group.items.map((item) => (
                    <li key={item}>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        className="pricing-check"
                      >
                        <path
                          d="M3 8L6.5 11.5L13 5"
                          stroke="#a78bfa"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="pricing-faq">
          <h2 className="pricing-faq-heading">Frequently asked questions</h2>
          <div className="pricing-faq-list">
            {FAQ.map((f) => (
              <div key={f.q} className="pricing-faq-item">
                <h3>{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="prod-cta-section">
          <h2>Ready to win more contracts?</h2>
          <p>
            Request access and we&rsquo;ll walk you through a live demo
            with your own RFP.
          </p>
          <Link href="/request-access" className="prod-cta">
            Request Access
          </Link>
        </section>
      </main>

      <footer className="about-footer">
        <p>IntentBid &mdash; Proposal intelligence, engineered to win.</p>
        <div className="about-footer-links">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/">Home</Link>
        </div>
      </footer>
    </div>
  );
}
