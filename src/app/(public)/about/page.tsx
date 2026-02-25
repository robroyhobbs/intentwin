import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { PublicNav } from "../_components/public-nav";

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
    photo: "/images/matt-mckinney.jpeg",
    linkedin: "https://www.linkedin.com/in/mtmckinney/",
    x: "https://x.com/robroyhobbs",
    bio: "Growth and product leader with experience scaling AI and SaaS platforms. Previously led growth at AIGNE (ArcBlock). Seattle University alum based in the Pacific Northwest.",
  },
  {
    name: "Charles Chen",
    role: "Co-founder",
    photo: "/images/charles-chen.jpeg",
    linkedin: "https://www.linkedin.com/in/voipchuck/",
    bio: "Strategic technologist with 30+ years in enterprise IT and cybersecurity. Background in executive advisory and technical architecture. Northwestern University alum based in Los Angeles.",
  },
];

export default function AboutPage() {
  return (
    <div className="vf-page">
      <PublicNav />

      {/* Hero */}
      <main style={{ paddingTop: 120, paddingBottom: 80 }}>
        <div className="about-hero">
          <p className="about-label">About IntentBid</p>
          <h1 className="about-title">
            We build the tool we
            <br />
            <span className="about-gradient">wished existed.</span>
          </h1>
          <p className="about-subtitle">
            Every proposal we watched go out the door could have been better.
            So we built IntentBid &mdash; proposals engineered like software,
            repeatable by design, and optimized for how evaluators actually
            score.
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
                  <Image
                    src={founder.photo}
                    alt={founder.name}
                    width={80}
                    height={80}
                    className="about-founder-photo"
                  />
                  <div>
                    <h3 className="about-founder-name">{founder.name}</h3>
                    <p className="about-founder-role">{founder.role}</p>
                    <p className="about-founder-bio">{founder.bio}</p>
                    <div className="about-founder-links">
                      <a
                        href={founder.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${founder.name} on LinkedIn`}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </a>
                      {"x" in founder && founder.x && (
                        <a
                          href={founder.x}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${founder.name} on X`}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                        </a>
                      )}
                    </div>
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
              Join the Early Access Program
            </Link>
            <p className="prod-cta-micro">
              Limited spots available. We respond within 24 hours.
            </p>
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
