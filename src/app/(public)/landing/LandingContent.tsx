'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

export default function LandingContent() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.reveal').forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Syne:wght@400;500;600;700;800&display=swap');

        :root {
          --navy: #0a1628;
          --navy-light: #132039;
          --blue: #0070AD;
          --cyan: #12ABDB;
          --cyan-glow: #40d9ff;
          --white: #ffffff;
          --gray-100: #f8fafc;
          --gray-200: #e2e8f0;
          --gray-400: #94a3b8;
          --gray-600: #475569;
          --font-display: 'Instrument Serif', Georgia, serif;
          --font-sans: 'Syne', system-ui, sans-serif;
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

        .reveal-delay-1 { transition-delay: 0.1s; }
        .reveal-delay-2 { transition-delay: 0.2s; }
        .reveal-delay-3 { transition-delay: 0.3s; }
        .reveal-delay-4 { transition-delay: 0.4s; }
        .reveal-delay-5 { transition-delay: 0.5s; }

        /* Noise texture overlay */
        .noise::before {
          content: '';
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
          background: radial-gradient(circle, rgba(18, 171, 219, 0.15) 0%, transparent 70%);
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
          max-width: 600px;
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
          background: linear-gradient(180deg, var(--navy) 0%, var(--navy-light) 100%);
        }

        .features-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
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

        /* How it works */
        .how-it-works {
          padding: 120px 24px;
          background: var(--navy-light);
        }

        .steps {
          max-width: 1000px;
          margin: 0 auto;
          display: grid;
          gap: 60px;
        }

        .step {
          display: grid;
          grid-template-columns: 80px 1fr;
          gap: 40px;
          align-items: start;
        }

        .step-number {
          width: 80px;
          height: 80px;
          background: rgba(18, 171, 219, 0.1);
          border: 1px solid rgba(18, 171, 219, 0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 32px;
          font-style: italic;
          color: var(--cyan);
        }

        .step-content h3 {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .step-content p {
          color: var(--gray-400);
          font-size: 16px;
          line-height: 1.7;
        }

        /* Pricing Section */
        .pricing {
          padding: 120px 24px;
          background: var(--navy);
        }

        .pricing-grid {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }

        .pricing-card {
          padding: 40px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          position: relative;
        }

        .pricing-card.featured {
          border-color: var(--cyan);
          background: rgba(18, 171, 219, 0.05);
        }

        .pricing-badge {
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
        }

        .pricing-name {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .pricing-desc {
          color: var(--gray-400);
          font-size: 14px;
          margin-bottom: 24px;
        }

        .pricing-price {
          font-family: var(--font-display);
          font-size: 48px;
          margin-bottom: 24px;
        }

        .pricing-price span {
          font-size: 16px;
          color: var(--gray-400);
        }

        .pricing-features {
          list-style: none;
          margin-bottom: 32px;
        }

        .pricing-features li {
          padding: 8px 0;
          color: var(--gray-200);
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pricing-features li::before {
          content: '✓';
          color: var(--cyan);
        }

        /* CTA Section */
        .cta {
          padding: 120px 24px;
          background: linear-gradient(180deg, var(--navy-light) 0%, var(--navy) 100%);
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
          .step {
            grid-template-columns: 1fr;
            text-align: center;
          }
          .step-number {
            margin: 0 auto;
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            ProposalAI
          </Link>
          <ul className="nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#how-it-works">How it Works</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><Link href="/blog">Blog</Link></li>
          </ul>
          <div className="nav-cta">
            <Link href="/login" className="btn-secondary" style={{ padding: '10px 20px' }}>
              Sign In
            </Link>
            <Link href="/signup" className="btn-primary" style={{ padding: '10px 20px' }}>
              Start Free Trial
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="hero">
          <div className="hero-glow" />
          <div className="reveal hero-badge">
            <span>✨</span>
            Introducing Intent-Driven Development
          </div>
          <h1 className="reveal reveal-delay-1 hero-title">
            Win more deals with <em>AI-powered</em> proposals
          </h1>
          <p className="reveal reveal-delay-2 hero-subtitle">
            Generate professional proposals in hours, not weeks. Our AI learns your company's voice and creates compelling, client-specific content that wins.
          </p>
          <div className="reveal reveal-delay-3 hero-cta">
            <Link href="/signup" className="btn-primary">
              Start Free Trial
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <a href="#how-it-works" className="btn-secondary">
              See How It Works
            </a>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="features">
          <div className="section-header reveal">
            <p className="section-label">Features</p>
            <h2 className="section-title">Everything you need to win</h2>
            <p className="section-subtitle">
              From intake to export, we handle the entire proposal lifecycle with AI-powered automation
            </p>
          </div>
          <div className="features-grid">
            <div className="reveal feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3v18M3 12h18" />
                </svg>
              </div>
              <h3 className="feature-title">Smart Intake</h3>
              <p className="feature-desc">
                Define client needs, outcomes, and constraints. Our AI extracts key requirements automatically from RFPs.
              </p>
            </div>
            <div className="reveal reveal-delay-1 feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <h3 className="feature-title">AI Generation</h3>
              <p className="feature-desc">
                Generate complete proposals grounded in your company's knowledge base. Every claim is verifiable.
              </p>
            </div>
            <div className="reveal reveal-delay-2 feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M9 21V9" />
                </svg>
              </div>
              <h3 className="feature-title">Rich Exports</h3>
              <p className="feature-desc">
                Export to Word, PowerPoint, PDF with your branding. Generate presentation slides automatically.
              </p>
            </div>
            <div className="reveal reveal-delay-3 feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="feature-title">Team Collaboration</h3>
              <p className="feature-desc">
                Review, comment, and iterate together. Track changes and manage approvals in one place.
              </p>
            </div>
            <div className="reveal reveal-delay-4 feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <h3 className="feature-title">Knowledge Base</h3>
              <p className="feature-desc">
                Upload past proposals, case studies, and capabilities. AI retrieves relevant content automatically.
              </p>
            </div>
            <div className="reveal reveal-delay-5 feature-card">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20V10M6 20V4M18 20v-6" />
                </svg>
              </div>
              <h3 className="feature-title">Win Analytics</h3>
              <p className="feature-desc">
                Track proposal performance. Learn what works and continuously improve your win rate.
              </p>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="how-it-works">
          <div className="section-header reveal">
            <p className="section-label">How It Works</p>
            <h2 className="section-title">Three steps to winning proposals</h2>
          </div>
          <div className="steps">
            <div className="reveal step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Define the Opportunity</h3>
                <p>
                  Enter client details, project scope, and desired outcomes. Upload the RFP and our AI will extract key requirements, compliance needs, and evaluation criteria automatically.
                </p>
              </div>
            </div>
            <div className="reveal reveal-delay-1 step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>AI Generates Your Proposal</h3>
                <p>
                  Our AI creates a complete proposal tailored to the client. Every section draws from your knowledge base—case studies, methodologies, team credentials—ensuring accuracy and consistency.
                </p>
              </div>
            </div>
            <div className="reveal reveal-delay-2 step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Review, Refine, and Win</h3>
                <p>
                  Collaborate with your team to polish the proposal. Export to professional formats, track client engagement, and close the deal. Learn from each win to improve future proposals.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="pricing">
          <div className="section-header reveal">
            <p className="section-label">Pricing</p>
            <h2 className="section-title">Plans that scale with you</h2>
            <p className="section-subtitle">
              Start free, upgrade when you're ready. All plans include a 14-day trial.
            </p>
          </div>
          <div className="pricing-grid">
            <div className="reveal pricing-card">
              <p className="pricing-name">Starter</p>
              <p className="pricing-desc">For freelancers and solopreneurs</p>
              <p className="pricing-price">$29<span>/mo</span></p>
              <ul className="pricing-features">
                <li>5 proposals per month</li>
                <li>1 user</li>
                <li>10 knowledge base docs</li>
                <li>Export to all formats</li>
                <li>Email support</li>
              </ul>
              <Link href="/signup" className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                Start Free Trial
              </Link>
            </div>
            <div className="reveal reveal-delay-1 pricing-card featured">
              <span className="pricing-badge">Most Popular</span>
              <p className="pricing-name">Pro</p>
              <p className="pricing-desc">For growing sales teams</p>
              <p className="pricing-price">$79<span>/mo</span></p>
              <ul className="pricing-features">
                <li>20 proposals per month</li>
                <li>5 users</li>
                <li>50 knowledge base docs</li>
                <li>Team collaboration</li>
                <li>Priority support</li>
              </ul>
              <Link href="/signup" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Start Free Trial
              </Link>
            </div>
            <div className="reveal reveal-delay-2 pricing-card">
              <p className="pricing-name">Business</p>
              <p className="pricing-desc">For established companies</p>
              <p className="pricing-price">$199<span>/mo</span></p>
              <ul className="pricing-features">
                <li>Unlimited proposals</li>
                <li>15 users</li>
                <li>Unlimited documents</li>
                <li>Custom templates</li>
                <li>API access</li>
              </ul>
              <Link href="/signup" className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                Start Free Trial
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta">
          <div className="reveal cta-content">
            <h2 className="cta-title">Ready to <em>win more</em>?</h2>
            <p className="cta-subtitle">
              Join hundreds of teams using ProposalAI to close deals faster.
            </p>
            <Link href="/signup" className="btn-primary">
              Start Your Free Trial
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-content">
            <p className="footer-logo">ProposalAI</p>
            <ul className="footer-links">
              <li><Link href="/about">About</Link></li>
              <li><Link href="/blog">Blog</Link></li>
              <li><Link href="/pricing">Pricing</Link></li>
              <li><a href="mailto:support@proposalai.com">Contact</a></li>
            </ul>
            <p className="footer-copy">© 2026 ProposalAI. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
