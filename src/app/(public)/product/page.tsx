import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product — IntentBid",
  description:
    "IntentBid replaces the expensive, slow process of writing proposals by hand. Upload an RFP, define your strategy, and generate a complete multi-section proposal in minutes.",
  openGraph: {
    title: "IntentBid — AI Proposal Engineering",
    description:
      "From RFP to finished proposal. No consultants, no templates, no guesswork.",
  },
};

const VALUE_PROPS = [
  {
    icon: "clock",
    title: "Hours, not weeks",
    desc: "A traditional proposal takes 40-80 hours of senior staff time. IntentBid generates a complete, multi-section proposal in minutes — then you refine it.",
  },
  {
    icon: "dollar",
    title: "Cut proposal costs by 90%",
    desc: "No proposal consultants at $200/hr. No outsourced writing teams. One platform handles extraction, strategy, generation, and export.",
  },
  {
    icon: "target",
    title: "Built to score, not just fill pages",
    desc: "Every section is driven by your win strategy, mapped to evaluator criteria, and backed by your evidence library. Proposals that are structured to win.",
  },
];

const PHASES = [
  {
    phase: "Intake & Qualify",
    items: [
      "Upload RFP (PDF, DOCX, PPTX)",
      "AI extracts scope, budget, timeline, NAICS",
      "Five-factor bid/no-bid scoring",
    ],
    image: "/images/product/step3-bid-scoring.jpeg",
    alt: "IntentBid bid evaluation showing 78.5/100 score with five factors",
  },
  {
    phase: "Strategy & Intent",
    items: [
      "Define client pain points and outcomes",
      "Set win themes and priority weighting",
      "Review and approve the full intent",
    ],
    image: "/images/product/step6-win-strategy.jpeg",
    alt: "IntentBid win strategy screen with win themes and prioritized outcomes",
  },
  {
    phase: "Generate & Export",
    items: [
      "AI generates 11 proposal sections",
      "Edit, regenerate, or refine any section",
      "Export as PPTX, DOCX, PDF, or web slides",
    ],
    image: "/images/product/step9-generate.jpeg",
    alt: "IntentBid proposal generation showing 11 completed sections",
  },
];

function IconClock() {
  return (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" strokeLinecap="round" />
    </svg>
  );
}

function IconDollar() {
  return (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconTarget() {
  return (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

const ICONS: Record<string, () => React.JSX.Element> = {
  clock: IconClock,
  dollar: IconDollar,
  target: IconTarget,
};

export default function ProductPage() {
  return (
    <div className="vf-page">
      <nav className="vf-nav">
        <div className="vf-nav-inner">
          <Link href="/" className="vf-logo">
            IntentBid
          </Link>
          <div className="vf-nav-links">
            <Link href="/">Home</Link>
            <Link href="/intelligence-overview">Intelligence</Link>
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
        <div className="prod-hero">
          <p className="prod-label">Product</p>
          <h1 className="prod-title">
            Stop losing deals to
            <br />
            <span className="prod-gradient">slow proposals.</span>
          </h1>
          <p className="prod-subtitle">
            Most teams pass on winnable contracts because proposals take too
            long, cost too much, and require expertise they don&rsquo;t
            have. IntentBid changes that. Upload an RFP, define your win
            strategy, and get a complete, persuasion-engineered proposal
            back in minutes.
          </p>
        </div>

        {/* Value pillars */}
        <section className="prod-value-section">
          <div className="prod-value-grid">
            {VALUE_PROPS.map((v) => {
              const Icon = ICONS[v.icon];
              return (
                <div key={v.title} className="prod-value-card">
                  <div className="prod-value-icon">
                    <Icon />
                  </div>
                  <h3 className="prod-value-title">{v.title}</h3>
                  <p className="prod-value-desc">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* The problem */}
        <section className="prod-problem">
          <h2 className="prod-problem-heading">
            The proposal process is broken
          </h2>
          <p className="prod-problem-desc">
            You find a contract you can win. Then you spend 2-4 weeks
            writing the response — pulling senior staff off billable work,
            hiring consultants, or stitching together recycled templates
            that sound generic. By the time you submit, you&rsquo;ve
            invested $10-30K in staff time alone.
            <br />
            <br />
            <strong style={{ color: "#e4e4e7" }}>
              IntentBid replaces that entire process with a structured
              pipeline:
            </strong>{" "}
            your company context, your evidence, your strategy — fed
            through AI that understands how proposals are evaluated and
            scored.
          </p>
        </section>

        {/* How it works — 3 phases */}
        <section className="prod-how">
          <h2 className="prod-how-heading">
            How it works
          </h2>
          <div className="prod-phases">
            {PHASES.map((p, i) => (
              <div key={p.phase} className="prod-phase">
                <div className="prod-phase-header">
                  <span className="prod-phase-num">0{i + 1}</span>
                  <h3 className="prod-phase-title">{p.phase}</h3>
                </div>
                <ul className="prod-phase-list">
                  {p.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <div className="prod-phase-thumb">
                  <Image
                    src={p.image}
                    alt={p.alt}
                    width={400}
                    height={267}
                    className="prod-phase-img"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Evidence + Analytics */}
        <section className="prod-extras">
          <h2 className="prod-extras-heading">
            Your knowledge, working for you
          </h2>
          <p className="prod-extras-desc">
            Proposals are only as strong as the evidence behind them.
            IntentBid stores your case studies, certifications, and past
            performance — then automatically matches the most relevant
            proof points to each section.
          </p>
          <div className="prod-extras-grid">
            <div className="prod-extra-card">
              <Image
                src="/images/product/knowledge-evidence.jpeg"
                alt="IntentBid Evidence Library with case studies, metrics, and certifications"
                width={400}
                height={267}
                className="prod-phase-img"
              />
              <h3>Evidence Library</h3>
              <p>
                Case studies, metrics, testimonials, and certifications —
                tagged and verified. AI matches the strongest evidence
                to each section automatically.
              </p>
            </div>
            <div className="prod-extra-card">
              <Image
                src="/images/product/analytics.jpeg"
                alt="IntentBid Win/Loss Analytics dashboard"
                width={400}
                height={267}
                className="prod-phase-img"
              />
              <h3>Win/Loss Analytics</h3>
              <p>
                Track outcomes across every proposal. Identify what
                wins, what loses, and why. The system learns from your
                results and improves over time.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="prod-cta-section">
          <h2>Ready to win more contracts?</h2>
          <p>
            IntentBid is currently invite-only. Request access and
            we&rsquo;ll walk you through a live demo with your own RFP.
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
