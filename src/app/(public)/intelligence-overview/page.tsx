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

const CAPABILITIES = [
  {
    title: "Market Intelligence Dashboard",
    desc: "9,500+ federal awards tracked. 1,000+ labor rates indexed. 36 agency profiles built. See awards over time, competition type breakdowns, set-aside distribution, top agencies, and top NAICS codes \u2014 all from live USAspending.gov data.",
    image: "/images/product/intel-market.jpeg",
    alt: "IntentBid Market Intelligence dashboard showing award stats, trend chart, competition and set-aside pie charts",
  },
  {
    title: "Federal Award Search",
    desc: "Search 9,400+ federal contract awards by agency, awardee, and NAICS code. Open any award to see the full detail: dollar amount, competition type, number of offers, set-aside, period of performance, and a direct link to USAspending.gov.",
    image: "/images/product/intel-awards.jpeg",
    alt: "IntentBid Award Search showing results list and detail panel with $24.9M BARDA contract details",
  },
  {
    title: "GSA Rate Benchmarks",
    desc: "Look up GSA CALC+ labor rates by category and business size. See median rates, ranges, and data point counts. Common pricing model breakdown included. Cost realism notes flag when your rates may trigger scrutiny.",
    image: "/images/product/intel-rates.jpeg",
    alt: "IntentBid Rate Benchmarks showing project manager rate at $66.96 median with common pricing model breakdown",
  },
  {
    title: "FOIA & Public Records Engine",
    desc: "Select a state, enter an agency, describe what you want. IntentBid generates a legally compliant Sunshine Law or FOIA request citing the correct statute, with fee waiver language and statutory deadlines. Ready to copy and send.",
    image: "/images/product/intel-foia.jpeg",
    alt: "IntentBid Public Records engine with state selection, agency input, target documents, and generate request button",
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
        <div className="intel-hero">
          <p className="intel-label">IntentBid Intelligence</p>
          <h1 className="intel-title">
            Market intelligence that
            <br />
            <span className="intel-gradient">informs every bid.</span>
          </h1>
          <p className="intel-subtitle">
            Before you write a word, know which deals to chase, what the
            competition looks like, and how to price competitively. Powered by
            live federal procurement data from USAspending.gov and GSA CALC+.
          </p>
        </div>

        {/* Capability sections */}
        <div className="intel-capabilities">
          {CAPABILITIES.map((cap, i) => (
            <section
              key={cap.title}
              className={`intel-cap ${i % 2 === 1 ? "intel-cap--reverse" : ""}`}
            >
              <div className="intel-cap-text">
                <h2 className="intel-cap-title">{cap.title}</h2>
                <p className="intel-cap-desc">{cap.desc}</p>
              </div>
              <div className="intel-cap-img">
                <Image
                  src={cap.image}
                  alt={cap.alt}
                  width={720}
                  height={480}
                  className="prod-screenshot"
                />
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
            benchmarks for the opportunity. This intelligence is injected
            directly into the AI generation prompts &mdash; so your proposals
            are informed by real market data, not guesswork.
          </p>
          <div className="intel-flow-points">
            <div className="intel-flow-point">
              <span className="intel-flow-num">01</span>
              <div>
                <strong>Agency-aware generation</strong>
                <p>
                  The AI knows how each agency evaluates and weights its
                  criteria. Your proposal emphasizes what matters most to the
                  specific evaluator.
                </p>
              </div>
            </div>
            <div className="intel-flow-point">
              <span className="intel-flow-num">02</span>
              <div>
                <strong>Competitive positioning</strong>
                <p>
                  Top competitors, win counts, and market segment data are
                  available during generation. The AI differentiates against
                  real competitors, not assumptions.
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
                  without triggering cost realism concerns.
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
