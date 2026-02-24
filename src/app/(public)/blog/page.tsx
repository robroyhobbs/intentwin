import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | IntentBid",
  description:
    "Insights on proposal intelligence, AI-powered RFP responses, and winning government contracts. From the IntentBid team.",
  openGraph: {
    title: "IntentBid Blog",
    description:
      "Insights on proposal intelligence and winning more contracts.",
  },
};

const POSTS = [
  {
    slug: "why-we-built-intentbid",
    title: "Why We Built IntentBid",
    date: "February 20, 2026",
    readTime: "5 min read",
    excerpt:
      "The proposal process is broken. Great companies lose contracts they should win because their proposals don't communicate their capability. We built IntentBid to fix that.",
    tag: "Company",
  },
  {
    slug: "smb-government-contracts",
    title: "How Small and Mid-Market Firms Can Compete for Government Contracts",
    date: "February 18, 2026",
    readTime: "6 min read",
    excerpt:
      "You don't need a 50-person capture team to win federal contracts. Here's how AI-powered proposal intelligence levels the playing field for SMBs.",
    tag: "Strategy",
  },
  {
    slug: "problem-with-proposal-templates",
    title: "The Problem with Proposal Templates",
    date: "February 14, 2026",
    readTime: "4 min read",
    excerpt:
      "Templates promise efficiency but deliver mediocrity. Why the most popular approach to proposal writing is costing you wins.",
    tag: "Insights",
  },
  {
    slug: "intent-driven-proposals",
    title: "Intent-Driven Proposals: Strategy Before Writing",
    date: "February 10, 2026",
    readTime: "5 min read",
    excerpt:
      "Most proposal tools start with a blank page. IntentBid starts with intent — a structured definition of what needs to be true for the evaluator to say yes.",
    tag: "Product",
  },
];

export default function BlogPage() {
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
            <Link href="/about">About</Link>
            <Link href="/request-access" className="vf-nav-cta">
              Request Access
            </Link>
          </div>
        </div>
      </nav>

      <main style={{ paddingTop: 120, paddingBottom: 80 }}>
        <div className="blog-hero">
          <p className="about-label">Blog</p>
          <h1 className="about-title">
            Insights on winning
            <br />
            <span className="about-gradient">more proposals.</span>
          </h1>
          <p className="about-subtitle">
            Strategy, product updates, and lessons from the front lines of
            proposal intelligence.
          </p>
        </div>

        <div className="blog-grid">
          {POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="blog-card"
            >
              <div className="blog-card-tag">{post.tag}</div>
              <h2 className="blog-card-title">{post.title}</h2>
              <p className="blog-card-excerpt">{post.excerpt}</p>
              <div className="blog-card-meta">
                <span>{post.date}</span>
                <span>{post.readTime}</span>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="about-footer">
        <p>IntentBid &mdash; Proposal intelligence, engineered to win.</p>
        <div className="about-footer-links">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/about">About</Link>
          <Link href="/">Home</Link>
        </div>
      </footer>
    </div>
  );
}
