"use client";

import Link from "next/link";
import { Sparkles, Clock, ArrowRight } from "lucide-react";

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  category: string;
  featured?: boolean;
}

const BLOG_POSTS: BlogPost[] = [
  {
    slug: "ai-proposal-writing-guide",
    title: "The Ultimate Guide to AI Proposal Writing in 2026",
    description:
      "Learn how AI is transforming proposal writing, from RFP responses to client pitches. Discover best practices, tools, and strategies for winning more deals.",
    date: "2026-01-30",
    readTime: "15 min read",
    category: "Guides",
    featured: true,
  },
  {
    slug: "rfp-response-best-practices",
    title: "How to Write Winning RFP Responses: Complete Guide",
    description:
      "Master the art of RFP responses with our comprehensive guide. Includes templates, checklists, and expert tips for increasing your win rate.",
    date: "2026-01-28",
    readTime: "12 min read",
    category: "Guides",
  },
  {
    slug: "autogenai-vs-intentwin",
    title: "AutogenAI vs IntentWin: Which AI Proposal Tool is Right for You?",
    description:
      "An honest comparison of AutogenAI and IntentWin. We break down features, pricing, and use cases to help you make the right choice.",
    date: "2026-01-25",
    readTime: "8 min read",
    category: "Comparisons",
  },
];

export default function BlogContent() {
  const featuredPost = BLOG_POSTS.find((post) => post.featured);
  const regularPosts = BLOG_POSTS.filter((post) => !post.featured);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-[var(--foreground)]">
                IntentWin
              </span>
            </Link>
            <div className="flex items-center gap-6">
              <Link
                href="/pricing"
                className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              >
                Pricing
              </Link>
              <Link
                href="/login"
                className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              >
                Sign in
              </Link>
              <Link href="/signup" className="btn-primary text-sm">
                Start Free Trial
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-4">
            IntentWin Blog
          </h1>
          <p className="text-lg text-[var(--foreground-muted)] max-w-2xl mx-auto">
            Expert insights on proposal writing, RFP strategy, and AI-powered
            sales enablement. Learn how to win more deals with less effort.
          </p>
        </div>

        {/* Featured Post */}
        {featuredPost && (
          <div className="mb-16">
            <Link href={`/blog/${featuredPost.slug}`} className="block group">
              <div className="card p-8 hover:border-[var(--accent)] transition-colors">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-[var(--accent-subtle)] text-[var(--accent)] text-xs font-medium rounded-full">
                    Featured
                  </span>
                  <span className="text-sm text-[var(--foreground-muted)]">
                    {featuredPost.category}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-[var(--foreground)] mb-3 group-hover:text-[var(--accent)] transition-colors">
                  {featuredPost.title}
                </h2>
                <p className="text-[var(--foreground-muted)] mb-4 max-w-3xl">
                  {featuredPost.description}
                </p>
                <div className="flex items-center gap-4 text-sm text-[var(--foreground-subtle)]">
                  <span>{featuredPost.date}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {featuredPost.readTime}
                  </span>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* All Posts */}
        <div>
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">
            All Articles
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block group"
              >
                <div className="card p-6 h-full hover:border-[var(--accent)] transition-colors">
                  <span className="text-xs text-[var(--foreground-muted)] uppercase tracking-wide">
                    {post.category}
                  </span>
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mt-2 mb-3 group-hover:text-[var(--accent)] transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-[var(--foreground-muted)] mb-4 line-clamp-2">
                    {post.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-[var(--foreground-subtle)]">
                    <span>{post.date}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="card p-8 bg-gradient-to-br from-[var(--accent-subtle)] to-[var(--background)]">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-3">
              Ready to transform your proposal process?
            </h2>
            <p className="text-[var(--foreground-muted)] mb-6 max-w-xl mx-auto">
              Join teams using AI to write better proposals in a fraction of the
              time. Start your free 14-day trial today.
            </p>
            <Link href="/signup" className="btn-primary inline-flex">
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] mt-16">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-[var(--foreground)]">
                IntentWin
              </span>
            </div>
            <p className="text-sm text-[var(--foreground-subtle)]">
              2026 IntentWin. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
