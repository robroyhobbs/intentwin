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
    avatarClass: "about-founder-avatar--mm",
    bio: "Growth and product leader with experience scaling AI and SaaS platforms. Previously led growth at AIGNE (ArcBlock). Seattle University alum based in the Pacific Northwest.",
  },
  {
    name: "Charles Chen",
    role: "Co-founder",
    linkedin: "https://www.linkedin.com/in/voipchuck/",
    initials: "CC",
    avatarClass: "about-founder-avatar--cc",
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
            We build proposals like software engineers build apps &mdash;
            repeatable, user-friendly, and designed with the evaluator in mind.
            Because the best capability in the world doesn&rsquo;t matter if
            your proposal doesn&rsquo;t communicate it.
          </p>
        </div>

        {/* Story */}
        <section className="about-section">
          <div className="about-content">
            <h2 className="about-h2">The problem we solve</h2>
            <p>
              Most proposals are assembled, not engineered. Institutional
              knowledge lives in people&rsquo;s heads. Win themes get diluted
              across reviewers. Persuasion frameworks are applied
              inconsistently, if at all. The result: proposals that check every
              compliance box but fail to differentiate.
            </p>
            <p>
              We think proposals should be built the way great software is
              built &mdash; as repeatable experiences, designed for the end
              user. In this case, the end user is the evaluator reading your
              proposal at 10 PM with a scoring rubric and a stack of
              competitors on their desk.
            </p>
            <p>
              IntentBid applies a structured, 6-layer methodology to every
              section of every proposal &mdash; automatically. Not generic AI
              text. A repeatable system that encodes your brand voice, win
              themes, competitive positioning, and evidence into every
              paragraph. The same way a well-architected app delivers a
              consistent experience to every user, IntentBid delivers a
              consistent standard of persuasion to every evaluator.
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
              dedicated capture team. Repeatable. User-friendly. Built with the
              evaluator in mind, every time.
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
                  <div
                    className={`about-founder-avatar ${founder.avatarClass}`}
                  >
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
            <h2 className="about-h2">Proposals as products</h2>
            <p>
              We treat every proposal like a product release. It has an
              audience (evaluators), a user experience (how it reads and
              scores), and a success metric (win rate). IntentBid applies the
              same rigor &mdash; structured architecture, repeatable patterns,
              and relentless focus on the end user &mdash; that the best
              software teams bring to product development.
            </p>
            <p>
              Under the hood, we build IntentBid using a methodology we call
              Intent-Driven Development &mdash; the same outcome-first thinking
              we embed in your proposals. Every feature starts with a clear
              intent: what does this produce for the user? We don&rsquo;t ship
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
