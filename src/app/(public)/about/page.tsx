import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About IntentBid",
  description:
    "IntentBid is an AI-powered proposal intelligence platform built in Seattle. Meet the team behind the 6-layer Intent Framework.",
  openGraph: {
    title: "About IntentBid",
    description:
      "Meet the team building the future of proposal intelligence.",
  },
};

const FOUNDERS = [
  {
    name: "Matt McKinney",
    role: "Co-founder",
    linkedin: "https://www.linkedin.com/in/mtmckinney/",
    initials: "MM",
    bio: "Growth and product leader with experience scaling AI and SaaS platforms. Previously led growth at AIGNE (ArcBlock). Seattle University alum based in the Pacific Northwest.",
  },
  {
    name: "Charles Chen",
    role: "Co-founder",
    linkedin: "https://www.linkedin.com/in/voipchuck/",
    initials: "CC",
    bio: "Strategic technologist with 30+ years in enterprise IT and cybersecurity. Background in executive advisory and technical architecture. Northwestern University alum based in Los Angeles.",
  },
];

export default function AboutPage() {
  return (
    <div className="vf-page">
      {/* Nav */}
      <nav className="vf-nav">
        <div className="vf-nav-inner">
          <Link href="/" className="vf-logo">
            IntentBid
          </Link>
          <div className="vf-nav-links">
            <Link href="/">Home</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/request-access" className="vf-nav-cta">
              Request Access
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main style={{ paddingTop: 120, paddingBottom: 80 }}>
        <div className="about-hero">
          <p className="about-label">About IntentBid</p>
          <h1 className="about-title">
            Proposal intelligence,
            <br />
            <span className="about-gradient">engineered to win.</span>
          </h1>
          <p className="about-subtitle">
            We started IntentBid because we watched too many great companies lose
            contracts they should have won &mdash; not because they lacked
            capability, but because their proposals didn&rsquo;t communicate it.
          </p>
        </div>

        {/* Story */}
        <section className="about-section">
          <div className="about-content">
            <h2 className="about-h2">The problem we solve</h2>
            <p>
              Professional services firms and government contractors spend weeks
              writing proposals that read like they were assembled by committee
              &mdash; because they were. Institutional knowledge lives in
              people&rsquo;s heads. Win themes get diluted across reviewers.
              Persuasion frameworks are applied inconsistently, if at all.
            </p>
            <p>
              The result: proposals that check every compliance box but fail to
              differentiate. Companies with the best capabilities lose to
              competitors who simply present better.
            </p>
            <p>
              IntentBid fixes this by applying a structured, 6-layer
              methodology to every section of every proposal &mdash;
              automatically. Not generic AI text. A repeatable system that
              encodes your brand voice, win themes, competitive positioning, and
              evidence into every paragraph.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="about-section">
          <div className="about-content">
            <h2 className="about-h2">Our mission</h2>
            <p className="about-mission-text">
              Give every company &mdash; from 10-person shops to enterprise
              contractors &mdash; the proposal capability that used to require a
              dedicated capture team.
            </p>
          </div>
        </section>

        {/* Founders */}
        <section className="about-section">
          <div className="about-content">
            <h2 className="about-h2">Founded in Seattle</h2>
            <p>
              IntentBid was founded in 2026 in Seattle, WA by two people who saw
              the same gap from different sides of the table &mdash; one from
              growth and product, one from enterprise technology and
              cybersecurity. We&rsquo;re building the tool we wished existed
              every time we watched a proposal go out the door and knew it
              could have been better.
            </p>

            <div className="about-founders">
              {FOUNDERS.map((founder) => (
                <div key={founder.name} className="about-founder-card">
                  <div className="about-founder-avatar">
                    <span>{founder.initials}</span>
                  </div>
                  <div>
                    <h3 className="about-founder-name">
                      <a
                        href={founder.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {founder.name}
                      </a>
                    </h3>
                    <p className="about-founder-role">{founder.role}</p>
                    <p className="about-founder-bio">{founder.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Built with */}
        <section className="about-section">
          <div className="about-content">
            <h2 className="about-h2">How we build</h2>
            <p>
              IntentBid is built on a methodology we call Intent-Driven
              Development &mdash; the same structured, outcome-first thinking
              we apply to proposals. Every feature starts with a clear intent:
              what outcome does this produce for the user? We don&rsquo;t ship
              features. We ship wins.
            </p>
            <div className="about-stats">
              <div className="about-stat">
                <span className="about-stat-number">6</span>
                <span className="about-stat-label">
                  Layers in the Intent Framework
                </span>
              </div>
              <div className="about-stat">
                <span className="about-stat-number">60+</span>
                <span className="about-stat-label">API endpoints</span>
              </div>
              <div className="about-stat">
                <span className="about-stat-number">1,300+</span>
                <span className="about-stat-label">Automated tests</span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="about-section" style={{ textAlign: "center" }}>
          <div className="about-content">
            <h2 className="about-h2">Ready to win more?</h2>
            <p>
              IntentBid is currently invite-only. Request access and we&rsquo;ll
              get you set up.
            </p>
            <Link href="/request-access" className="about-cta">
              Request Access
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
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
