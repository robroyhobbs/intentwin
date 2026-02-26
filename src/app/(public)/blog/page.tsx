import Link from "next/link";
import type { Metadata } from "next";
import { PublicNav } from "../_components/public-nav";

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
    slug: "blue-collar-rfp-professionalism",
    title: "You're Losing on Perception, Not Price: The Blue-Collar RFP Problem",
    date: "February 26, 2026",
    readTime: "7 min read",
    excerpt:
      "Landscapers, janitors, and snow removal contractors lose local government contracts every year — not because of price, but because a three-page Word doc loses to a 12-page professional proposal every time. Here's what that gap actually costs you.",
    tag: "Strategy",
  },
  {
    slug: "bid-no-bid-decision-framework",
    title:
      "The Bid/No-Bid Decision Framework: Stop Chasing Every RFP",
    date: "February 24, 2026",
    readTime: "8 min read",
    excerpt:
      "The average government proposal costs $20K-$75K to produce. A practical 5-factor scoring framework for bid/no-bid decisions so you stop wasting resources on opportunities you won't win.",
    tag: "Strategy",
  },
  {
    slug: "why-we-built-intentbid",
    title: "Why We Built IntentBid",
    date: "February 20, 2026",
    readTime: "7 min read",
    excerpt:
      "We built IntentBid because great companies lose contracts they should win. The proposal process is broken — we're fixing it with intent-driven generation, bid scoring, and real intelligence.",
    tag: "Company",
  },
  {
    slug: "smb-government-contracts",
    title:
      "How Small and Mid-Market Firms Can Compete for Government Contracts",
    date: "February 18, 2026",
    readTime: "8 min read",
    excerpt:
      "The government awarded $178B to small businesses in FY2024. A practical guide with real set-aside programs, contract vehicles, and strategies for SMBs breaking into federal.",
    tag: "Strategy",
  },
  {
    slug: "problem-with-proposal-templates",
    title: "The Problem with Proposal Templates",
    date: "February 14, 2026",
    readTime: "6 min read",
    excerpt:
      "Templates promise efficiency but deliver mediocrity. See a real side-by-side comparison of template-based vs. intent-driven proposal content.",
    tag: "Insights",
  },
  {
    slug: "intent-driven-proposals",
    title: "Intent-Driven Proposals: Strategy Before Writing",
    date: "February 10, 2026",
    readTime: "8 min read",
    excerpt:
      "Most proposal tools start with a blank page. IntentBid starts with intent. See a worked example of how strategy-first proposals outperform template-first ones.",
    tag: "Product",
  },
];

export default function BlogPage() {
  return (
    <div className="vf-page">
      <PublicNav />

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
