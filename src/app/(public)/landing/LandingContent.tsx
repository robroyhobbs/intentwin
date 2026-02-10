"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

export default function LandingContent() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );

    document.querySelectorAll(".reveal").forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Syne:wght@400;500;600;700;800&display=swap");

        :root {
          --navy: #0a1628;
          --navy-light: #132039;
          --blue: #0070ad;
          --cyan: #12abdb;
          --cyan-glow: #40d9ff;
          --white: #ffffff;
          --gray-100: #f8fafc;
          --gray-200: #e2e8f0;
          --gray-400: #94a3b8;
          --gray-600: #475569;
          --font-display: "Instrument Serif", Georgia, serif;
          --font-sans: "Syne", system-ui, sans-serif;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          font-family: var(--font-sans);
          background: var(--navy);
          color: var(--white);
          overflow-x: hidden;
        }

        /* Reveal animations */
        .reveal {
          opacity: 0;
          transform: translateY(40px);
          transition: all 0.9s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .reveal.revealed {
          opacity: 1;
          transform: translateY(0);
        }

        .reveal-delay-1 {
          transition-delay: 0.1s;
        }
        .reveal-delay-2 {
          transition-delay: 0.2s;
        }
        .reveal-delay-3 {
          transition-delay: 0.3s;
        }
        .reveal-delay-4 {
          transition-delay: 0.4s;
        }
        .reveal-delay-5 {
          transition-delay: 0.5s;
        }

        /* Noise texture overlay */
        .noise::before {
          content: "";
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.03;
          pointer-events: none;
          z-index: 1000;
        }

        /* Hero Section */
        .hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          position: relative;
          padding: 120px 24px 80px;
          text-align: center;
        }

        .hero-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 800px;
          height: 800px;
          background: radial-gradient(
            circle,
            rgba(18, 171, 219, 0.15) 0%,
            transparent 70%
          );
          pointer-events: none;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 20px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 100px;
          font-size: 13px;
          font-weight: 500;
          color: var(--cyan-glow);
          margin-bottom: 32px;
          backdrop-filter: blur(10px);
        }

        .hero-title {
          font-family: var(--font-display);
          font-size: clamp(48px, 10vw, 96px);
          font-weight: 400;
          line-height: 1.05;
          letter-spacing: -0.02em;
          margin-bottom: 24px;
          max-width: 900px;
        }

        .hero-title em {
          font-style: italic;
          color: var(--cyan-glow);
        }

        .hero-subtitle {
          font-size: clamp(18px, 2vw, 22px);
          color: var(--gray-400);
          max-width: 640px;
          line-height: 1.6;
          margin-bottom: 48px;
        }

        .hero-cta {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          justify-content: center;
        }

        /* Buttons */
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 16px 32px;
          background: var(--cyan);
          color: var(--navy);
          font-weight: 600;
          font-size: 15px;
          border-radius: 8px;
          text-decoration: none;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
        }

        .btn-primary:hover {
          background: var(--cyan-glow);
          transform: translateY(-2px);
          box-shadow: 0 20px 40px rgba(18, 171, 219, 0.3);
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 16px 32px;
          background: transparent;
          color: var(--white);
          font-weight: 600;
          font-size: 15px;
          border-radius: 8px;
          text-decoration: none;
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.2);
          cursor: pointer;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.3);
        }

        /* Navigation */
        .nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: 20px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          backdrop-filter: blur(10px);
          background: rgba(10, 22, 40, 0.8);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .nav-logo {
          font-family: var(--font-display);
          font-size: 24px;
          color: var(--white);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .nav-logo-icon {
          width: 36px;
          height: 36px;
          background: var(--cyan);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nav-links {
          display: flex;
          gap: 40px;
          list-style: none;
        }

        .nav-links a {
          color: var(--gray-400);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: color 0.2s;
        }

        .nav-links a:hover {
          color: var(--white);
        }

        .nav-cta {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .nav-cta a {
          text-decoration: none;
        }

        /* Features Section */
        .features {
          padding: 120px 24px;
          background: linear-gradient(
            180deg,
            var(--navy) 0%,
            var(--navy-light) 100%
          );
        }

        .features-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .features-grid-secondary {
          max-width: 1200px;
          margin: 40px auto 0;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .feature-card {
          padding: 40px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          transition: all 0.3s ease;
        }

        .feature-card:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(18, 171, 219, 0.3);
          transform: translateY(-4px);
        }

        .feature-card.feature-primary {
          border-color: rgba(18, 171, 219, 0.2);
          background: rgba(18, 171, 219, 0.03);
        }

        .feature-card.feature-primary:hover {
          border-color: rgba(18, 171, 219, 0.5);
          background: rgba(18, 171, 219, 0.06);
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          background: rgba(18, 171, 219, 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          color: var(--cyan);
        }

        .feature-tag {
          display: inline-block;
          padding: 4px 12px;
          background: rgba(18, 171, 219, 0.15);
          color: var(--cyan-glow);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border-radius: 100px;
          margin-bottom: 16px;
        }

        .feature-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .feature-desc {
          color: var(--gray-400);
          font-size: 15px;
          line-height: 1.6;
        }

        /* Section Header */
        .section-header {
          text-align: center;
          max-width: 700px;
          margin: 0 auto 80px;
        }

        .section-label {
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--cyan);
          margin-bottom: 16px;
        }

        .section-title {
          font-family: var(--font-display);
          font-size: clamp(36px, 5vw, 56px);
          font-weight: 400;
          line-height: 1.1;
          margin-bottom: 20px;
        }

        .section-subtitle {
          color: var(--gray-400);
          font-size: 18px;
          line-height: 1.6;
        }

        /* Methodology Section (Intent Framework) */
        .methodology {
          padding: 120px 24px;
          background: var(--navy-light);
        }

        .layers-stack {
          max-width: 800px;
          margin: 0 auto 60px;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .layer {
          display: grid;
          grid-template-columns: 40px 1fr;
          gap: 20px;
          align-items: center;
          padding: 20px 28px;
          border: 1px solid rgba(18, 171, 219, 0.15);
          border-bottom: none;
          background: rgba(18, 171, 219, 0.02);
          transition: all 0.3s ease;
        }

        .layer:first-child {
          border-radius: 16px 16px 0 0;
        }

        .layer:last-child {
          border-bottom: 1px solid rgba(18, 171, 219, 0.15);
          border-radius: 0 0 16px 16px;
        }

        .layer:hover {
          background: rgba(18, 171, 219, 0.06);
        }

        .layer-number {
          font-family: var(--font-display);
          font-size: 24px;
          font-style: italic;
          color: var(--cyan);
          text-align: center;
        }

        .layer-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .layer-name {
          font-size: 16px;
          font-weight: 600;
          color: var(--white);
        }

        .layer-desc {
          font-size: 14px;
          color: var(--gray-400);
          line-height: 1.5;
        }

        .methodology-closing {
          max-width: 700px;
          margin: 0 auto;
          text-align: center;
          color: var(--gray-400);
          font-size: 17px;
          line-height: 1.7;
        }

        /* Competitive Positioning Section */
        .competitive {
          padding: 120px 24px;
          background: var(--navy);
        }

        .compare-grid {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .compare-col {
          padding: 36px 32px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
        }

        .compare-col.compare-highlight {
          border-color: var(--cyan);
          background: rgba(18, 171, 219, 0.05);
          position: relative;
        }

        .compare-col-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--cyan);
          color: var(--navy);
          font-size: 12px;
          font-weight: 600;
          padding: 6px 16px;
          border-radius: 100px;
          white-space: nowrap;
        }

        .compare-col-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .compare-list {
          list-style: none;
        }

        .compare-list li {
          padding: 10px 0;
          font-size: 14px;
          color: var(--gray-400);
          display: flex;
          align-items: flex-start;
          gap: 10px;
          line-height: 1.5;
        }

        .compare-list li::before {
          content: "x";
          color: var(--gray-600);
          font-weight: 600;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .compare-highlight .compare-list li {
          color: var(--gray-200);
        }

        .compare-highlight .compare-list li::before {
          content: "\\2713";
          color: var(--cyan);
        }

        /* Pricing Section */
        .pricing {
          padding: 120px 24px;
          background: linear-gradient(
            180deg,
            var(--navy-light) 0%,
            var(--navy) 100%
          );
        }

        .pricing-single {
          max-width: 540px;
          margin: 0 auto;
        }

        .pricing-card {
          padding: 48px;
          background: rgba(18, 171, 219, 0.05);
          border: 1px solid var(--cyan);
          border-radius: 16px;
          text-align: center;
          position: relative;
        }

        .pricing-name {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .pricing-desc {
          color: var(--gray-400);
          font-size: 16px;
          margin-bottom: 32px;
        }

        .pricing-price {
          font-family: var(--font-display);
          font-size: 64px;
          margin-bottom: 32px;
        }

        .pricing-price span {
          font-size: 18px;
          color: var(--gray-400);
        }

        .pricing-features {
          list-style: none;
          margin-bottom: 40px;
          text-align: left;
          max-width: 360px;
          margin-left: auto;
          margin-right: auto;
          margin-bottom: 40px;
        }

        .pricing-features li {
          padding: 8px 0;
          color: var(--gray-200);
          font-size: 15px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pricing-features li::before {
          content: "\\2713";
          color: var(--cyan);
          font-weight: 600;
        }

        .pricing-note {
          color: var(--gray-400);
          font-size: 14px;
          margin-top: 24px;
          line-height: 1.6;
        }

        /* CTA Section */
        .cta {
          padding: 120px 24px;
          background: var(--navy);
          text-align: center;
        }

        .cta-content {
          max-width: 600px;
          margin: 0 auto;
        }

        .cta-title {
          font-family: var(--font-display);
          font-size: clamp(36px, 5vw, 56px);
          font-weight: 400;
          margin-bottom: 20px;
        }

        .cta-title em {
          font-style: italic;
          color: var(--cyan-glow);
        }

        .cta-subtitle {
          color: var(--gray-400);
          font-size: 18px;
          margin-bottom: 40px;
          line-height: 1.6;
        }

        /* Footer */
        .footer {
          padding: 60px 24px;
          background: var(--navy);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 24px;
        }

        .footer-logo {
          font-family: var(--font-display);
          font-size: 20px;
          color: var(--white);
        }

        .footer-links {
          display: flex;
          gap: 32px;
          list-style: none;
        }

        .footer-links a {
          color: var(--gray-400);
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s;
        }

        .footer-links a:hover {
          color: var(--white);
        }

        .footer-copy {
          color: var(--gray-600);
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .nav-links {
            display: none;
          }
          .features-grid {
            grid-template-columns: 1fr;
          }
          .features-grid-secondary {
            grid-template-columns: 1fr;
          }
          .layer {
            grid-template-columns: 32px 1fr;
            padding: 16px 20px;
          }
          .compare-grid {
            grid-template-columns: 1fr;
          }
          .compare-col.compare-highlight {
            order: -1;
          }
          .footer-content {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>

      <div className="noise">
        {/* Navigation */}
        <nav className="nav">
          <Link href="/landing" className="nav-logo">
            <div className="nav-logo-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            IntentWin
          </Link>
          <ul className="nav-links">
            <li>
              <a href="#features">Features</a>
            </li>
            <li>
              <a href="#methodology">Intent Framework</a>
            </li>
            <li>
              <a href="#pricing">Pricing</a>
            </li>
            <li>
              <Link href="/blog">Blog</Link>
            </li>
          </ul>
          <div className="nav-cta">
            <Link
              href="/login"
              className="btn-secondary"
              style={{ padding: "10px 20px" }}
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="btn-primary"
              style={{ padding: "10px 20px" }}
            >
              Request Access
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="hero">
          <div className="hero-glow" />
          <div className="reveal hero-badge">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Invite-Only Access
          </div>
          <h1 className="reveal reveal-delay-1 hero-title">
            The proposal engine built to <em>win</em>
          </h1>
          <p className="reveal reveal-delay-2 hero-subtitle">
            IntentWin applies proven persuasion science to every section of your
            proposal. Not just AI — a systematic framework that turns good
            proposals into winning ones.
          </p>
          <div className="reveal reveal-delay-3 hero-cta">
            <Link href="/signup" className="btn-primary">
              Request Access
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <a href="#methodology" className="btn-secondary">
              See the Intent Framework
            </a>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="features">
          <div className="section-header reveal">
            <p className="section-label">Features</p>
            <h2 className="section-title">Everything you need to win</h2>
            <p className="section-subtitle">
              From RFP analysis to polished export, IntentWin handles the entire
              proposal lifecycle with persuasion intelligence built in
            </p>
          </div>

          {/* Primary Features (2x2 grid) */}
          <div className="features-grid">
            <div className="reveal feature-card feature-primary">
              <div className="feature-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="feature-tag">Core Differentiator</span>
              <h3 className="feature-title">
                Intent Framework (6-Layer Persuasion Engine)
              </h3>
              <p className="feature-desc">
                Our proprietary persuasion system applies the right psychological
                framework to every section. Executive summaries use AIDA. Case
                studies use STAR. Pricing uses value framing. Every word is
                engineered to persuade.
              </p>
            </div>
            <div className="reveal reveal-delay-1 feature-card feature-primary">
              <div className="feature-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <h3 className="feature-title">RFP Intelligence</h3>
              <p className="feature-desc">
                Upload any RFP and our AI extracts requirements, compliance
                needs, evaluation criteria, and deadlines automatically. Never
                miss a requirement again.
              </p>
            </div>
            <div className="reveal reveal-delay-2 feature-card feature-primary">
              <div className="feature-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="11" y1="8" x2="11" y2="14" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </div>
              <h3 className="feature-title">
                Knowledge Base (RAG-Powered)
              </h3>
              <p className="feature-desc">
                Upload your past wins, case studies, certifications, and
                methodologies. Our AI retrieves the most relevant evidence for
                each section, grounding every claim in your actual capabilities.
              </p>
            </div>
            <div className="reveal reveal-delay-3 feature-card feature-primary">
              <div className="feature-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M9 21V9" />
                </svg>
              </div>
              <h3 className="feature-title">Professional Export Suite</h3>
              <p className="feature-desc">
                Export to Word, PowerPoint, PDF with your branding applied.
                Generate presentation-ready slide decks automatically. Deliver
                polished proposals every time.
              </p>
            </div>
          </div>

          {/* Secondary Features */}
          <div className="features-grid-secondary">
            <div className="reveal reveal-delay-4 feature-card">
              <div className="feature-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 20V10M6 20V4M18 20v-6" />
                </svg>
              </div>
              <h3 className="feature-title">Win Analytics</h3>
              <p className="feature-desc">
                Track proposal outcomes, learn what works, and continuously
                improve your win rate with data-driven insights.
              </p>
            </div>
            <div className="reveal reveal-delay-5 feature-card">
              <div className="feature-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="feature-title">Team Collaboration</h3>
              <p className="feature-desc">
                Review, comment, and iterate together. Version history and
                approval workflows keep your team aligned.
              </p>
            </div>
          </div>
        </section>

        {/* Intent Framework Methodology */}
        <section id="methodology" className="methodology">
          <div className="section-header reveal">
            <p className="section-label">The Intent Framework</p>
            <h2 className="section-title">Six layers of persuasion science</h2>
          </div>
          <div className="reveal layers-stack">
            <div className="layer">
              <span className="layer-number">1</span>
              <div className="layer-content">
                <span className="layer-name">Brand Voice</span>
                <span className="layer-desc">
                  Your tone, terminology, and personality in every word
                </span>
              </div>
            </div>
            <div className="layer">
              <span className="layer-number">2</span>
              <div className="layer-content">
                <span className="layer-name">Section Best Practices</span>
                <span className="layer-desc">
                  Proven structure and length for each section type
                </span>
              </div>
            </div>
            <div className="layer">
              <span className="layer-number">3</span>
              <div className="layer-content">
                <span className="layer-name">Persuasion Frameworks</span>
                <span className="layer-desc">
                  AIDA, PAS, FAB, STAR assigned per section
                </span>
              </div>
            </div>
            <div className="layer">
              <span className="layer-number">4</span>
              <div className="layer-content">
                <span className="layer-name">Win Themes</span>
                <span className="layer-desc">
                  Your key differentiators woven throughout
                </span>
              </div>
            </div>
            <div className="layer">
              <span className="layer-number">5</span>
              <div className="layer-content">
                <span className="layer-name">Competitive Positioning</span>
                <span className="layer-desc">
                  Indirect framing that elevates without attacking
                </span>
              </div>
            </div>
            <div className="layer">
              <span className="layer-number">6</span>
              <div className="layer-content">
                <span className="layer-name">Evidence &amp; Context</span>
                <span className="layer-desc">
                  RAG-powered claims backed by your actual capabilities
                </span>
              </div>
            </div>
          </div>
          <p className="reveal methodology-closing">
            Every other AI tool dumps your RFP into a generic prompt. IntentWin
            applies a systematic, research-backed methodology to every section.
            The result: proposals that don&apos;t just inform — they persuade.
          </p>
        </section>

        {/* Competitive Positioning */}
        <section className="competitive">
          <div className="section-header reveal">
            <p className="section-label">Why IntentWin</p>
            <h2 className="section-title">Not another AI writing tool</h2>
          </div>
          <div className="compare-grid">
            <div className="reveal compare-col">
              <h3 className="compare-col-title">
                Generic AI (ChatGPT, etc.)
              </h3>
              <ul className="compare-list">
                <li>Paste and pray approach</li>
                <li>No proposal-specific methodology</li>
                <li>Generic output, no evidence grounding</li>
                <li>Zero quality verification</li>
              </ul>
            </div>
            <div className="reveal reveal-delay-1 compare-col">
              <h3 className="compare-col-title">
                Legacy Proposal Tools (Qvidian, RFPIO)
              </h3>
              <ul className="compare-list">
                <li>Content library search (no AI generation)</li>
                <li>Template-based, not adaptive</li>
                <li>No persuasion intelligence</li>
                <li>Expensive per-seat licensing</li>
              </ul>
            </div>
            <div className="reveal reveal-delay-2 compare-col compare-highlight">
              <span className="compare-col-badge">The IntentWin Difference</span>
              <h3 className="compare-col-title">IntentWin</h3>
              <ul className="compare-list">
                <li>6-layer Intent Framework</li>
                <li>Persuasion science per section</li>
                <li>RAG-powered evidence grounding</li>
                <li>Win theme integration throughout</li>
                <li>Quality verification built in</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="pricing">
          <div className="section-header reveal">
            <p className="section-label">Pricing</p>
            <h2 className="section-title">One plan. Everything included.</h2>
          </div>
          <div className="pricing-single">
            <div className="reveal pricing-card">
              <p className="pricing-name">IntentWin</p>
              <p className="pricing-desc">
                Everything you need to win. No limits, no surprises.
              </p>
              <p className="pricing-price">
                $999<span>/mo</span>
              </p>
              <ul className="pricing-features">
                <li>Unlimited proposals</li>
                <li>Unlimited documents &amp; knowledge base</li>
                <li>Intent Framework (6-layer persuasion engine)</li>
                <li>RFP Intelligence (auto-extract)</li>
                <li>All export formats (DOCX, PDF, PPTX)</li>
                <li>Win Analytics &amp; outcome tracking</li>
                <li>White-glove onboarding</li>
                <li>Dedicated support</li>
                <li>Quarterly strategy reviews</li>
              </ul>
              <Link
                href="/signup"
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
              >
                Request Access
              </Link>
              <p className="pricing-note">
                IntentWin is invite-only. Request access and we&apos;ll be in
                touch within 24 hours.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta">
          <div className="reveal cta-content">
            <h2 className="cta-title">
              Ready to <em>win more</em>?
            </h2>
            <p className="cta-subtitle">
              Join an exclusive group of teams using the Intent Framework to
              close more deals.
            </p>
            <Link href="/signup" className="btn-primary">
              Request Access
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-content">
            <p className="footer-logo">IntentWin</p>
            <ul className="footer-links">
              <li>
                <Link href="/about">About</Link>
              </li>
              <li>
                <Link href="/blog">Blog</Link>
              </li>
              <li>
                <a href="#pricing">Pricing</a>
              </li>
              <li>
                <a href="mailto:support@intentwin.com">Contact</a>
              </li>
            </ul>
            <p className="footer-copy">
              &copy; 2026 IntentWin. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
