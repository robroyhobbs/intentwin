import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Intelligence — IntentBid",
  description:
    "Stop bidding blind. IntentBid Intelligence gives you federal award history, competitor analysis, GSA rate benchmarks, and FOIA automation — so you chase the right contracts at the right price.",
  openGraph: {
    title: "IntentBid Intelligence — Bid Smarter, Not Harder",
    description:
      "Federal awards, agency profiles, rate benchmarks, and FOIA automation. The market data you need before you write a word.",
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
    benefit: "Know where the money is going",
    desc: "See which agencies are awarding, how much, and to whom. Spot trends before your competitors do. Stop guessing which markets to pursue.",
    image: "/images/product/intel-market.jpeg",
    alt: "IntentBid Market Intelligence dashboard with award trends, competition breakdown, and set-aside distribution",
    accent: "#38bdf8",
  },
  {
    title: "Award Search",
    benefit: "Research any contract in seconds",
    desc: "Search federal awards by agency, awardee, or NAICS code. See dollar amounts, competition type, number of offers, and who won. Use real award data to benchmark your bids.",
    image: "/images/product/intel-awards.jpeg",
    alt: "IntentBid Award Search with results list and $24.9M BARDA contract detail panel",
    accent: "#818cf8",
  },
  {
    title: "Rate Benchmarks",
    benefit: "Price to win, not to lose",
    desc: "GSA CALC+ labor rates by role and business size. Know the median, the range, and when your rates will trigger cost realism scrutiny. Price competitively with data, not gut feel.",
    image: "/images/product/intel-rates.jpeg",
    alt: "IntentBid Rate Benchmarks showing project manager median rate at $66.96 with pricing model breakdown",
    accent: "#a78bfa",
  },
  {
    title: "FOIA & Public Records",
    benefit: "Get the documents others don't have",
    desc: "Generate legally compliant FOIA or Sunshine Law requests for any state. Correct statute citations, fee waiver language, and statutory deadlines. Copy, send, and get competitive intelligence others miss.",
    image: "/images/product/intel-foia.jpeg",
    alt: "IntentBid Public Records engine with state selection, agency input, and generated FOIA request",
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
        {/* Hero — benefit-led */}
        <div className="intel-hero">
          <p className="intel-label">IntentBid Intelligence</p>
          <h1 className="intel-title">
            Stop bidding blind.
            <br />
            <span className="intel-gradient">Start bidding smart.</span>
          </h1>
          <p className="intel-subtitle">
            Most companies bid on contracts with no data — no award
            history, no competitor analysis, no pricing benchmarks. They
            waste months chasing deals they were never going to win.
            IntentBid Intelligence puts federal procurement data at your
            fingertips so you pursue the right opportunities at the right
            price.
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

        {/* The cost of bidding blind */}
        <section className="intel-cost-section">
          <h2 className="intel-cost-heading">
            The cost of bidding without data
          </h2>
          <div className="intel-cost-grid">
            <div className="intel-cost-card">
              <span className="intel-cost-stat">70%</span>
              <p>
                of proposals are submitted to contracts the bidder was
                never competitive for. Without award history, you
                can&rsquo;t see the incumbents or the pricing floor.
              </p>
            </div>
            <div className="intel-cost-card">
              <span className="intel-cost-stat">$10-30K</span>
              <p>
                in staff time per proposal. When you pursue the wrong
                opportunities, that investment is wasted — and your team
                burns out on losses.
              </p>
            </div>
            <div className="intel-cost-card">
              <span className="intel-cost-stat">3-4 weeks</span>
              <p>
                spent researching agencies manually. Award history,
                evaluation criteria, and competitor data are scattered
                across dozens of government sites.
              </p>
            </div>
          </div>
        </section>

        {/* Capability cards */}
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
                  <p className="intel-feature-benefit">{cap.benefit}</p>
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
            Intelligence feeds directly into your proposals
          </h2>
          <p className="intel-flow-desc">
            This isn&rsquo;t a research tool you use separately.
            When you generate a proposal, IntentBid automatically pulls
            agency evaluation criteria, competitor data, and rate
            benchmarks into the AI generation prompts. Your proposals
            are informed by real market data — not assumptions.
          </p>
          <div className="intel-flow-points">
            <div className="intel-flow-point">
              <span className="intel-flow-num">01</span>
              <div>
                <strong>Agency-aware generation</strong>
                <p>
                  The AI knows how each agency evaluates and weights
                  proposals. Your response emphasizes what matters to
                  the specific evaluator.
                </p>
              </div>
            </div>
            <div className="intel-flow-point">
              <span className="intel-flow-num">02</span>
              <div>
                <strong>Competitive positioning</strong>
                <p>
                  Incumbent contractors, win counts, and market
                  segments inform how the AI differentiates you —
                  against real competitors, not guesses.
                </p>
              </div>
            </div>
            <div className="intel-flow-point">
              <span className="intel-flow-num">03</span>
              <div>
                <strong>Pricing guidance</strong>
                <p>
                  Rate benchmarks for matched labor categories are
                  injected into cost sections. Price to win without
                  triggering cost realism flags.
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
            we&rsquo;ll show you the intelligence dashboard with live
            data from your target agencies.
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
