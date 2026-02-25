import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Intelligence — IntentBid",
  description:
    "Market intelligence that informs every bid. Federal award search, agency profiles, GSA rate benchmarks, and AI-powered FOIA requests — powered by live government data.",
  openGraph: {
    title: "IntentBid Intelligence — Market Data for Smarter Bids",
    description:
      "Federal awards, agency profiles, rate benchmarks, and FOIA automation. See how IntentBid Intelligence gives you an unfair advantage.",
  },
};

const STATS = [
  { value: "9,500+", label: "Federal awards tracked" },
  { value: "1,000+", label: "Labor rates indexed" },
  { value: "36", label: "Agency profiles" },
  { value: "50", label: "State FOIA statutes" },
];

const CAPABILITIES = [
  {
    title: "Market Intelligence",
    desc: "Awards over time, competition type breakdowns, set-aside distribution, top agencies, and NAICS analysis — all from live USAspending.gov data.",
    image: "/images/product/intel-market.jpeg",
    alt: "IntentBid Market Intelligence dashboard showing award stats, trend chart, competition and set-aside pie charts",
    accent: "#38bdf8",
  },
  {
    title: "Award Search",
    desc: "Search federal contract awards by agency, awardee, and NAICS code. Full detail on every award: dollar amount, competition, set-aside, and period of performance.",
    image: "/images/product/intel-awards.jpeg",
    alt: "IntentBid Award Search showing results list and detail panel with $24.9M BARDA contract details",
    accent: "#818cf8",
  },
  {
    title: "Rate Benchmarks",
    desc: "GSA CALC+ labor rates by category and business size. Median rates, ranges, data point counts, and cost realism flags when your rates may trigger scrutiny.",
    image: "/images/product/intel-rates.jpeg",
    alt: "IntentBid Rate Benchmarks showing project manager rate at $66.96 median with common pricing model breakdown",
    accent: "#a78bfa",
  },
  {
    title: "FOIA & Public Records",
    desc: "Select a state, enter an agency, describe what you need. IntentBid generates a legally compliant request citing the correct statute, with fee waiver language.",
    image: "/images/product/intel-foia.jpeg",
    alt: "IntentBid Public Records engine with state selection, agency input, target documents, and generate request button",
    accent: "#f472b6",
  },
];

export default function IntelligenceOverviewPage() {
  return (
    <div className="vf-page">
      <nav className="vf-nav">
        <div className="vf-nav-inner">
          <Link href="/" className="vf-logo">
            IntentBid
          </Link>
          <div className="vf-nav-links">
            <Link href="/">Home</Link>
            <Link href="/product">Product</Link>
            <Link href="/about">About</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/request-access" className="vf-nav-cta">
              Request Access
            </Link>
          </div>
        </div>
      </nav>

      <main style={{ paddingTop: 120, paddingBottom: 80 }}>
        {/* Hero */}
        <div className="intel-hero">
          <p className="intel-label">IntentBid Intelligence</p>
          <h1 className="intel-title">
            Know the market
            <br />
            <span className="intel-gradient">before you bid.</span>
          </h1>
          <p className="intel-subtitle">
            Live federal procurement data from USAspending.gov and GSA
            CALC+. Find the right deals, understand the competition, and
            price competitively — before you write a word.
          </p>
        </div>

        {/* Stats bar */}
        <div className="intel-stats">
          {STATS.map((s) => (
            <div key={s.label} className="intel-stat">
              <span className="intel-stat-value">{s.value}</span>
              <span className="intel-stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Capability cards — stacked full-width feature sections */}
        <div className="intel-features">
          {CAPABILITIES.map((cap, i) => (
            <section key={cap.title} className="intel-feature">
              <div
                className="intel-feature-accent"
                style={{ background: cap.accent }}
              />
              <div
                className={`intel-feature-inner ${i % 2 === 1 ? "intel-feature-inner--reverse" : ""}`}
              >
                <div className="intel-feature-text">
                  <h2 className="intel-feature-title">{cap.title}</h2>
                  <p className="intel-feature-desc">{cap.desc}</p>
                </div>
                <div className="intel-feature-img">
                  <Image
                    src={cap.image}
                    alt={cap.alt}
                    width={480}
                    height={320}
                    className="intel-feature-screenshot"
                  />
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* How intelligence flows into proposals */}
        <section className="intel-flow-section">
          <h2 className="intel-flow-heading">
            Intelligence flows into every proposal
          </h2>
          <p className="intel-flow-desc">
            When you generate a proposal, IntentBid automatically fetches
            agency evaluation criteria, competitive landscape data, and rate
            benchmarks. This intelligence is injected directly into the AI
            generation prompts.
          </p>
          <div className="intel-flow-points">
            <div className="intel-flow-point">
              <span className="intel-flow-num">01</span>
              <div>
                <strong>Agency-aware generation</strong>
                <p>
                  The AI knows how each agency evaluates proposals and
                  weights its criteria. Your proposal emphasizes what
                  matters to the specific evaluator.
                </p>
              </div>
            </div>
            <div className="intel-flow-point">
              <span className="intel-flow-num">02</span>
              <div>
                <strong>Competitive positioning</strong>
                <p>
                  Top competitors, win counts, and market segment data
                  inform generation. The AI differentiates against real
                  competitors, not assumptions.
                </p>
              </div>
            </div>
            <div className="intel-flow-point">
              <span className="intel-flow-num">03</span>
              <div>
                <strong>Pricing guidance</strong>
                <p>
                  GSA rate benchmarks for matched labor categories are
                  included in cost section prompts. Price competitively
                  without triggering scrutiny.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="prod-cta-section">
          <h2>See the data behind the wins</h2>
          <p>
            IntentBid is currently invite-only. Request access and
            we&rsquo;ll show you the intelligence dashboard live.
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
