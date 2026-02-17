"use client";

import Link from "next/link";
import { useState } from "react";

export default function LandingContent() {
  const [activeLayer, setActiveLayer] = useState<number | null>(null);
  const [proposals, setProposals] = useState(4);

  const layers = [
    { name: "Brand Voice", desc: "Your tone and terminology in every word." },
    {
      name: "Section Best Practices",
      desc: "Proven structure for each section type.",
    },
    {
      name: "Persuasion Frameworks",
      desc: "AIDA, PAS, FAB, STAR — calibrated per section.",
    },
    { name: "Win Themes", desc: "Your differentiators woven throughout." },
    {
      name: "Competitive Positioning",
      desc: "Indirect framing that elevates you.",
    },
    {
      name: "Evidence & Context",
      desc: "Claims backed by your actual capabilities.",
    },
  ];

  const oldWay = [
    {
      label: "Timeline",
      old: "2–4 weeks per proposal",
      new: "Hours, not weeks",
    },
    {
      label: "Quality",
      old: "Inconsistent across writers",
      new: "Intent Framework in every section",
    },
    {
      label: "Personalization",
      old: "Generic templates, copy-paste",
      new: "Tailored to evaluator criteria",
    },
    {
      label: "Learning",
      old: "Tribal knowledge lost with turnover",
      new: "Organizational memory that compounds",
    },
    {
      label: "Scalability",
      old: "Limited by headcount",
      new: "10x more proposals, same team",
    },
  ];

  // Calculator logic
  const avgContractValue = 150000;
  const oldWinRate = 0.15;
  const newWinRate = 0.3;
  const proposalsWithIntent = proposals * 10;
  const oldRevenue = proposals * oldWinRate * avgContractValue;
  const newRevenue = proposalsWithIntent * newWinRate * avgContractValue;

  return (
    <>
      <div className="vf-page">
        {/* Navigation */}
        <nav className="vf-nav">
          <div className="vf-nav-inner">
            <Link href="/" className="vf-logo">
              IntentWin
            </Link>
            <div className="vf-nav-links">
              <a href="#compare">Compare</a>
              <a href="#framework">Framework</a>
              <a href="#gov">Gov</a>
              <a href="#pricing">Pricing</a>
              <Link href="/request-access" className="vf-nav-cta">
                Request Access
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="vf-hero">
          <div className="vf-hero-glow" aria-hidden="true" />
          <div className="vf-hero-inner">
            <span className="vf-badge">Invite Only</span>
            <h1 className="vf-hero-headline">
              Proposals
              <br />
              engineered to <span className="vf-gradient-text">win.</span>
            </h1>
            <p className="vf-hero-sub">
              RFPs. RFIs. SOWs. Capability statements. Decks.
              <br />
              Six layers of persuasion intelligence in every section.
              <br />
              AI-powered. Human-guided. Engineered to win.
            </p>
            <div className="vf-hero-actions">
              <Link href="/request-access" className="vf-btn-primary">
                Request Access
              </Link>
              <a href="#compare" className="vf-btn-ghost">
                See How It Works
              </a>
            </div>
            <div className="vf-hero-trust">
              <span className="vf-trust-item">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 1L10 5.5L15 6.2L11.5 9.5L12.4 14.5L8 12.2L3.6 14.5L4.5 9.5L1 6.2L6 5.5L8 1Z"
                    fill="#a78bfa"
                  />
                </svg>
                Human-in-the-loop
              </span>
              <span className="vf-trust-divider">|</span>
              <span className="vf-trust-item">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle
                    cx="8"
                    cy="8"
                    r="6"
                    stroke="#a78bfa"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M5 8L7 10L11 6"
                    stroke="#a78bfa"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                6-layer persuasion engine
              </span>
              <span className="vf-trust-divider">|</span>
              <span className="vf-trust-item">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 2V14M2 8H14"
                    stroke="#a78bfa"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                10x more proposals
              </span>
            </div>
          </div>
        </section>

        {/* Statement */}
        <section className="vf-statement">
          <div className="vf-statement-inner">
            <p className="vf-statement-text">
              The difference between winning and losing a contract is not what
              you can do — it&apos;s how you present it.
            </p>
          </div>
        </section>

        {/* Old Way vs New Way */}
        <section id="compare" className="vf-compare">
          <div className="vf-section-inner">
            <span className="vf-label">The Old Way vs IntentWin</span>
            <h2 className="vf-section-heading">
              You&apos;re leaving wins on the table.
            </h2>
            <div className="vf-compare-table">
              <div className="vf-compare-header">
                <div className="vf-compare-col-label" />
                <div className="vf-compare-col-old">The Old Way</div>
                <div className="vf-compare-col-new">With IntentWin</div>
              </div>
              {oldWay.map((row, i) => (
                <div key={i} className="vf-compare-row">
                  <div className="vf-compare-col-label">{row.label}</div>
                  <div className="vf-compare-col-old">
                    <span className="vf-compare-x">&#x2715;</span>
                    {row.old}
                  </div>
                  <div className="vf-compare-col-new">
                    <span className="vf-compare-check">&#x2713;</span>
                    {row.new}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Human in the Loop */}
        <section className="vf-human">
          <div className="vf-section-inner">
            <div className="vf-human-grid">
              <div className="vf-human-content">
                <span className="vf-label">Human-in-the-Loop</span>
                <h2 className="vf-section-heading" style={{ marginBottom: 24 }}>
                  AI-powered.
                  <br />
                  Human-guided.
                </h2>
                <p className="vf-human-body">
                  IntentWin is never autopilot. Every proposal flows through
                  your team — review, refine, and approve at every stage. The AI
                  accelerates your expertise. It doesn&apos;t replace it.
                </p>
                <div className="vf-human-points">
                  <div className="vf-human-point">
                    <span className="vf-human-icon">01</span>
                    <div>
                      <strong>You set the strategy.</strong> Define win themes,
                      brand voice, and competitive positioning before generation
                      begins.
                    </div>
                  </div>
                  <div className="vf-human-point">
                    <span className="vf-human-icon">02</span>
                    <div>
                      <strong>You review every section.</strong> Approve, edit,
                      or regenerate any part. Nothing ships without your
                      sign-off.
                    </div>
                  </div>
                  <div className="vf-human-point">
                    <span className="vf-human-icon">03</span>
                    <div>
                      <strong>You teach the system.</strong> Mark wins and
                      losses. The AI learns from your judgment, not the other
                      way around.
                    </div>
                  </div>
                </div>
              </div>
              <div className="vf-human-visual">
                <div className="vf-human-flow">
                  <div className="vf-flow-step vf-flow-human">
                    <span className="vf-flow-label">You</span>
                    <span className="vf-flow-action">Define Strategy</span>
                  </div>
                  <div className="vf-flow-arrow">&#x2193;</div>
                  <div className="vf-flow-step vf-flow-ai">
                    <span className="vf-flow-label">IntentWin</span>
                    <span className="vf-flow-action">Generate Draft</span>
                  </div>
                  <div className="vf-flow-arrow">&#x2193;</div>
                  <div className="vf-flow-step vf-flow-human">
                    <span className="vf-flow-label">You</span>
                    <span className="vf-flow-action">Review &amp; Refine</span>
                  </div>
                  <div className="vf-flow-arrow">&#x2193;</div>
                  <div className="vf-flow-step vf-flow-ai">
                    <span className="vf-flow-label">IntentWin</span>
                    <span className="vf-flow-action">Apply 6 Layers</span>
                  </div>
                  <div className="vf-flow-arrow">&#x2193;</div>
                  <div className="vf-flow-step vf-flow-human">
                    <span className="vf-flow-label">You</span>
                    <span className="vf-flow-action">Approve &amp; Submit</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Intent Framework */}
        <section id="framework" className="vf-framework">
          <div className="vf-section-inner">
            <span className="vf-label">The Intent Framework</span>
            <h2 className="vf-section-heading">
              Six layers between your draft
              <br />
              and a winning proposal.
            </h2>
            <div className="vf-layers">
              {layers.map((layer, i) => (
                <div
                  key={i}
                  className={`vf-layer ${activeLayer === i ? "vf-layer-active" : ""}`}
                  onMouseEnter={() => setActiveLayer(i)}
                  onMouseLeave={() => setActiveLayer(null)}
                >
                  <span className="vf-layer-num">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="vf-layer-content">
                    <h3 className="vf-layer-name">{layer.name}</h3>
                    <p className="vf-layer-desc">{layer.desc}</p>
                  </div>
                  <div className="vf-layer-bar" />
                </div>
              ))}
            </div>
            <p className="vf-framework-note">
              Not a generic AI writer. A structured methodology trained on how
              deals are actually won.
            </p>
          </div>
        </section>

        {/* Benefits */}
        <section id="benefits" className="vf-benefits">
          <div className="vf-section-inner">
            <span className="vf-label">Why IntentWin</span>

            <div className="vf-benefit-row">
              <div className="vf-benefit-left">
                <h2 className="vf-benefit-headline">
                  Hours,
                  <br />
                  not weeks.
                </h2>
              </div>
              <div className="vf-benefit-right">
                <p className="vf-benefit-body">
                  Drop in any source document — PDF, DOCX, PPTX, TXT, MD, or
                  CSV. Get a polished, submission-ready draft before the end of
                  the day. Not a rough outline. A complete proposal.
                </p>
              </div>
            </div>

            <div className="vf-benefit-row">
              <div className="vf-benefit-left">
                <h2 className="vf-benefit-headline">
                  Every section
                  <br />
                  engineered.
                </h2>
              </div>
              <div className="vf-benefit-right">
                <p className="vf-benefit-body">
                  Six layers of persuasion intelligence applied to every
                  paragraph, every heading, every proof point. This isn&apos;t
                  text generation. It&apos;s a proven methodology.
                </p>
              </div>
            </div>

            <div className="vf-benefit-row">
              <div className="vf-benefit-left">
                <h2 className="vf-benefit-headline">
                  Gets smarter
                  <br />
                  every time.
                </h2>
              </div>
              <div className="vf-benefit-right">
                <p className="vf-benefit-body">
                  Continuous learning from your outcomes. Win rates improve
                  because the system remembers what works — building a knowledge
                  base unique to your organization.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Productivity Calculator */}
        <section className="vf-calc">
          <div className="vf-section-inner">
            <span className="vf-label">Productivity Impact</span>
            <h2 className="vf-section-heading">
              What happens when you can
              <br />
              respond to{" "}
              <span className="vf-gradient-text">10x more proposals?</span>
            </h2>
            <div className="vf-calc-container">
              <div className="vf-calc-input">
                <label className="vf-calc-label">
                  Proposals your team submits per month today:
                </label>
                <div className="vf-calc-slider-row">
                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={proposals}
                    onChange={(e) => setProposals(Number(e.target.value))}
                    className="vf-calc-range"
                  />
                  <span className="vf-calc-value">{proposals}</span>
                </div>
              </div>
              <div className="vf-calc-results">
                <div className="vf-calc-card vf-calc-old">
                  <span className="vf-calc-card-label">Without IntentWin</span>
                  <div className="vf-calc-stat">
                    <span className="vf-calc-num">{proposals}</span>
                    <span className="vf-calc-unit">proposals/mo</span>
                  </div>
                  <div className="vf-calc-stat">
                    <span className="vf-calc-num">
                      {Math.round(proposals * oldWinRate)}
                    </span>
                    <span className="vf-calc-unit">wins at 15% win rate</span>
                  </div>
                  <div className="vf-calc-stat vf-calc-revenue">
                    <span className="vf-calc-num">
                      ${(oldRevenue / 1000).toFixed(0)}K
                    </span>
                    <span className="vf-calc-unit">monthly pipeline</span>
                  </div>
                </div>
                <div className="vf-calc-card vf-calc-new">
                  <span className="vf-calc-card-label">With IntentWin</span>
                  <div className="vf-calc-stat">
                    <span className="vf-calc-num">{proposalsWithIntent}</span>
                    <span className="vf-calc-unit">proposals/mo</span>
                  </div>
                  <div className="vf-calc-stat">
                    <span className="vf-calc-num">
                      {Math.round(proposalsWithIntent * newWinRate)}
                    </span>
                    <span className="vf-calc-unit">wins at 30% win rate</span>
                  </div>
                  <div className="vf-calc-stat vf-calc-revenue">
                    <span className="vf-calc-num">
                      ${(newRevenue / 1000).toFixed(0)}K
                    </span>
                    <span className="vf-calc-unit">monthly pipeline</span>
                  </div>
                </div>
              </div>
              <div className="vf-calc-delta">
                <span className="vf-calc-delta-label">
                  Additional annual revenue potential
                </span>
                <span className="vf-calc-delta-value">
                  +${(((newRevenue - oldRevenue) * 12) / 1000000).toFixed(1)}M
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="vf-proof">
          <div className="vf-section-inner">
            <span className="vf-label">Trusted by Teams That Win</span>
            <div className="vf-proof-stats">
              <div className="vf-proof-stat">
                <span className="vf-proof-num">10x</span>
                <span className="vf-proof-desc">
                  More proposals
                  <br />
                  submitted per month
                </span>
              </div>
              <div className="vf-proof-divider" />
              <div className="vf-proof-stat">
                <span className="vf-proof-num">2x</span>
                <span className="vf-proof-desc">
                  Higher win rate
                  <br />
                  vs. industry average
                </span>
              </div>
              <div className="vf-proof-divider" />
              <div className="vf-proof-stat">
                <span className="vf-proof-num">85%</span>
                <span className="vf-proof-desc">
                  Reduction in
                  <br />
                  proposal creation time
                </span>
              </div>
              <div className="vf-proof-divider" />
              <div className="vf-proof-stat">
                <span className="vf-proof-num">100%</span>
                <span className="vf-proof-desc">
                  Human-reviewed
                  <br />
                  before submission
                </span>
              </div>
            </div>

            <div className="vf-proof-quotes">
              <div className="vf-proof-quote">
                <p className="vf-proof-text">
                  &ldquo;We went from 3 proposals a month to 30. Our pipeline
                  tripled in the first quarter. The Intent Framework
                  doesn&apos;t just generate text — it structures arguments the
                  way evaluators think.&rdquo;
                </p>
                <div className="vf-proof-author">
                  <div className="vf-proof-avatar">VP</div>
                  <div>
                    <span className="vf-proof-name">
                      VP of Business Development
                    </span>
                    <span className="vf-proof-role">
                      Federal Consulting Firm, 200+ employees
                    </span>
                  </div>
                </div>
              </div>
              <div className="vf-proof-quote">
                <p className="vf-proof-text">
                  &ldquo;What I love is the human-in-the-loop approach. Our SMEs
                  still own every section, but now they start from an 80% draft
                  instead of a blank page. We ship better proposals in a
                  fraction of the time.&rdquo;
                </p>
                <div className="vf-proof-author">
                  <div className="vf-proof-avatar">BD</div>
                  <div>
                    <span className="vf-proof-name">
                      Director of Capture Management
                    </span>
                    <span className="vf-proof-role">
                      Mid-Market Defense Contractor
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* IntentWin Gov */}
        <section id="gov" className="vf-gov">
          <div className="vf-gov-glow" aria-hidden="true" />
          <div className="vf-section-inner vf-gov-inner">
            <div className="vf-gov-badge-row">
              <span className="vf-gov-badge">IntentWin Gov</span>
            </div>
            <h2 className="vf-gov-headline">
              Purpose-built for
              <br />
              <span className="vf-gradient-text">government contractors.</span>
            </h2>
            <p className="vf-gov-sub">
              Everything in IntentWin Pro, plus specialized capabilities for
              federal, state, and local government procurement.
            </p>

            <div className="vf-gov-grid">
              <div className="vf-gov-card">
                <div className="vf-gov-card-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3 className="vf-gov-card-title">Auto-Teaming Engine</h3>
                <p className="vf-gov-card-desc">
                  Automatically identify teaming gaps and suggest subcontractor
                  partners based on required NAICS codes, set-asides, and past
                  performance requirements. Build winning teams before you write
                  a word.
                </p>
              </div>

              <div className="vf-gov-card">
                <div className="vf-gov-card-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h3 className="vf-gov-card-title">
                  Classification &amp; Compliance
                </h3>
                <p className="vf-gov-card-desc">
                  Automatic NAICS code mapping, set-aside identification (8(a),
                  HUBZone, WOSB, SDVOSB), and compliance matrix generation.
                  Ensure Section L/M requirements are addressed point-by-point.
                </p>
              </div>

              <div className="vf-gov-card">
                <div className="vf-gov-card-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <h3 className="vf-gov-card-title">
                  Contract Vehicle Intelligence
                </h3>
                <p className="vf-gov-card-desc">
                  Align proposals to GSA Schedule, GWACs, BPAs, and IDIQs.
                  Auto-detect vehicle requirements from solicitation documents
                  and tailor responses to specific ordering guides and
                  evaluation criteria.
                </p>
              </div>

              <div className="vf-gov-card">
                <div className="vf-gov-card-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </div>
                <h3 className="vf-gov-card-title">Past Performance Library</h3>
                <p className="vf-gov-card-desc">
                  Centralized repository of CPARS data, past performance
                  narratives, and project references. Automatically match the
                  most relevant past performance to each new opportunity&apos;s
                  evaluation criteria.
                </p>
              </div>

              <div className="vf-gov-card">
                <div className="vf-gov-card-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
                <h3 className="vf-gov-card-title">
                  SAM.gov &amp; GovWin Integration
                </h3>
                <p className="vf-gov-card-desc">
                  Pull opportunity details directly from SAM.gov.
                  Cross-reference with your CAGE code, entity registrations, and
                  certifications to ensure eligibility before you invest in a
                  response.
                </p>
              </div>

              <div className="vf-gov-card">
                <div className="vf-gov-card-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                    <line x1="4" y1="22" x2="4" y2="15" />
                  </svg>
                </div>
                <h3 className="vf-gov-card-title">
                  Capture Management Workflow
                </h3>
                <p className="vf-gov-card-desc">
                  Gate reviews, bid/no-bid decision frameworks, color team
                  reviews (Pink, Red, Gold), and Shipley-aligned processes built
                  into every proposal lifecycle.
                </p>
              </div>
            </div>

            <div className="vf-gov-cta">
              <p className="vf-gov-cta-text">
                IntentWin Gov is available to qualified government contractors.
              </p>
              <a href="mailto:gov@intentwin.com" className="vf-btn-gov">
                Contact Us for Gov Edition
              </a>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="vf-pricing">
          <div className="vf-section-inner">
            <div className="vf-price-card">
              <span className="vf-label" style={{ textAlign: "center" }}>
                Pricing
              </span>
              <h2 className="vf-price-amount">
                $999<span className="vf-price-period">/month</span>
              </h2>
              <p className="vf-price-tagline">
                Everything included. No tiers. No upsells.
              </p>
              <div className="vf-price-grid">
                <ul className="vf-price-list">
                  <li>Unlimited proposal generation</li>
                  <li>All 6 Intent Framework layers</li>
                  <li>Ingest PDF, DOCX, PPTX, TXT, MD, CSV</li>
                  <li>Brand voice calibration</li>
                </ul>
                <ul className="vf-price-list">
                  <li>Win theme &amp; differentiator engine</li>
                  <li>Outcome tracking &amp; continuous learning</li>
                  <li>Growing organizational knowledge base</li>
                  <li>White-glove onboarding &amp; priority support</li>
                </ul>
              </div>
              <Link
                href="/request-access"
                className="vf-btn-primary vf-btn-full"
              >
                Request Access
              </Link>
              <p className="vf-price-note">
                Invite-only. Limited availability.
              </p>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <footer className="vf-footer">
          <div className="vf-footer-glow" aria-hidden="true" />
          <div className="vf-section-inner vf-footer-inner">
            <h2 className="vf-footer-headline">
              Stop writing proposals.
              <br />
              Start winning them.
            </h2>
            <Link href="/request-access" className="vf-btn-primary">
              Request Access
            </Link>
            <p className="vf-footer-tag">
              IntentWin — Proposal intelligence, engineered to win.
            </p>
            <div className="vf-footer-legal">
              <a href="/privacy" className="vf-footer-legal-link">
                Privacy Policy
              </a>
              <span className="vf-footer-legal-sep">|</span>
              <a href="/terms" className="vf-footer-legal-link">
                Terms of Service
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* Shared styles provided by @/styles/public.css */}
      <style jsx global>{`
        /* === Landing Page-Specific Styles === */

        /* Hero */
        .vf-hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 160px 48px 100px;
          position: relative;
          overflow: hidden;
        }
        .vf-hero-glow {
          position: absolute;
          top: -20%;
          left: 50%;
          transform: translateX(-50%);
          width: 700px;
          height: 700px;
          background: radial-gradient(
            circle,
            rgba(124, 58, 237, 0.1) 0%,
            rgba(99, 102, 241, 0.05) 40%,
            transparent 70%
          );
          pointer-events: none;
          animation: vf-glow-pulse 6s ease-in-out infinite;
        }
        @keyframes vf-glow-pulse {
          0%,
          100% {
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
          50% {
            opacity: 0.7;
            transform: translateX(-50%) scale(1.05);
          }
        }
        .vf-hero-inner {
          max-width: 860px;
          position: relative;
          z-index: 2;
        }
        .vf-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #a78bfa;
          margin-bottom: 40px;
          border: 1px solid rgba(124, 58, 237, 0.3);
          background: rgba(124, 58, 237, 0.08);
          padding: 6px 18px;
          border-radius: 100px;
        }
        .vf-hero-headline {
          font-size: clamp(56px, 10vw, 120px);
          font-weight: 900;
          line-height: 0.95;
          color: #fafafa;
          letter-spacing: -0.04em;
          margin: 0 0 36px;
        }
        .vf-hero-sub {
          font-size: 18px;
          color: #71717a;
          line-height: 1.8;
          margin: 0 0 48px;
          font-weight: 300;
        }
        .vf-hero-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }
        .vf-hero-trust {
          margin-top: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .vf-trust-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #52525b;
          font-weight: 500;
        }
        .vf-trust-divider {
          color: #27272a;
          font-size: 14px;
        }

        /* Gov Button (page-specific) */
        .vf-btn-gov {
          display: inline-block;
          padding: 14px 36px;
          background: transparent;
          border: 1px solid rgba(124, 58, 237, 0.4);
          color: #a78bfa;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          border-radius: 10px;
          transition: all 0.25s ease;
        }
        .vf-btn-gov:hover {
          background: rgba(124, 58, 237, 0.1);
          border-color: rgba(124, 58, 237, 0.6);
          transform: translateY(-2px);
        }

        /* Statement */
        .vf-statement {
          padding: 100px 48px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .vf-statement-inner {
          max-width: 720px;
          margin: 0 auto;
          text-align: center;
        }
        .vf-statement-text {
          font-size: clamp(24px, 3.5vw, 36px);
          font-weight: 600;
          color: #e4e4e7;
          line-height: 1.4;
          letter-spacing: -0.02em;
          margin: 0;
        }

        /* Compare (Old vs New) */
        .vf-compare {
          padding: 120px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .vf-compare-table {
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.01);
        }
        .vf-compare-header {
          display: grid;
          grid-template-columns: 160px 1fr 1fr;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .vf-compare-header > div {
          padding: 16px 24px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .vf-compare-col-old {
          color: #71717a;
          background: rgba(239, 68, 68, 0.03);
        }
        .vf-compare-col-new {
          color: #a78bfa;
          background: rgba(124, 58, 237, 0.04);
        }
        .vf-compare-row {
          display: grid;
          grid-template-columns: 160px 1fr 1fr;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          transition: background 0.2s;
        }
        .vf-compare-row:last-child {
          border-bottom: none;
        }
        .vf-compare-row:hover {
          background: rgba(255, 255, 255, 0.02);
        }
        .vf-compare-row > div {
          padding: 18px 24px;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .vf-compare-col-label {
          font-weight: 600;
          color: #e4e4e7;
        }
        .vf-compare-row .vf-compare-col-old {
          color: #71717a;
          background: rgba(239, 68, 68, 0.02);
          font-size: 14px;
          font-weight: 400;
          letter-spacing: 0;
          text-transform: none;
        }
        .vf-compare-row .vf-compare-col-new {
          color: #d4d4d8;
          background: rgba(124, 58, 237, 0.03);
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0;
          text-transform: none;
        }
        .vf-compare-x {
          color: #ef4444;
          font-size: 14px;
          opacity: 0.6;
        }
        .vf-compare-check {
          color: #a78bfa;
          font-size: 14px;
          font-weight: 700;
        }

        /* Human in the Loop */
        .vf-human {
          padding: 120px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .vf-human-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 64px;
          align-items: start;
        }
        .vf-human-body {
          font-size: 16px;
          color: #71717a;
          line-height: 1.8;
          margin: 0 0 36px;
          font-weight: 300;
        }
        .vf-human-points {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .vf-human-point {
          display: flex;
          gap: 16px;
          align-items: flex-start;
          font-size: 14px;
          color: #a1a1aa;
          line-height: 1.6;
        }
        .vf-human-icon {
          font-size: 11px;
          font-weight: 700;
          color: #7c3aed;
          min-width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          background: rgba(124, 58, 237, 0.1);
          flex-shrink: 0;
        }
        .vf-human-point strong {
          color: #e4e4e7;
        }
        .vf-human-visual {
          display: flex;
          justify-content: center;
        }
        .vf-human-flow {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          width: 100%;
          max-width: 240px;
        }
        .vf-flow-step {
          width: 100%;
          padding: 16px 20px;
          border-radius: 12px;
          text-align: center;
          transition: transform 0.2s;
        }
        .vf-flow-step:hover {
          transform: scale(1.03);
        }
        .vf-flow-human {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .vf-flow-ai {
          background: rgba(124, 58, 237, 0.08);
          border: 1px solid rgba(124, 58, 237, 0.2);
        }
        .vf-flow-label {
          display: block;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .vf-flow-human .vf-flow-label {
          color: #71717a;
        }
        .vf-flow-ai .vf-flow-label {
          color: #a78bfa;
        }
        .vf-flow-action {
          font-size: 14px;
          font-weight: 600;
          color: #e4e4e7;
        }
        .vf-flow-arrow {
          color: #3f3f46;
          font-size: 16px;
          line-height: 1;
        }

        /* Framework */
        .vf-framework {
          padding: 120px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .vf-layers {
          display: flex;
          flex-direction: column;
          gap: 0;
          margin-bottom: 48px;
        }
        .vf-layer {
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 24px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          border-radius: 8px;
        }
        .vf-layer:first-child {
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .vf-layer:hover,
        .vf-layer-active {
          background: rgba(124, 58, 237, 0.04);
          border-color: rgba(124, 58, 237, 0.12);
        }
        .vf-layer-bar {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 0;
          background: linear-gradient(180deg, #7c3aed, #6366f1);
          border-radius: 3px;
          transition: height 0.3s ease;
        }
        .vf-layer:hover .vf-layer-bar,
        .vf-layer-active .vf-layer-bar {
          height: 60%;
        }
        .vf-layer-num {
          font-size: 13px;
          font-weight: 700;
          color: #52525b;
          min-width: 28px;
          font-variant-numeric: tabular-nums;
          transition: color 0.3s;
        }
        .vf-layer:hover .vf-layer-num,
        .vf-layer-active .vf-layer-num {
          color: #a78bfa;
        }
        .vf-layer-content {
          flex: 1;
        }
        .vf-layer-name {
          font-size: 17px;
          font-weight: 600;
          color: #e4e4e7;
          margin: 0 0 2px;
        }
        .vf-layer-desc {
          font-size: 14px;
          color: #71717a;
          margin: 0;
        }
        .vf-framework-note {
          font-size: 15px;
          color: #52525b;
          margin: 0;
          text-align: center;
          font-style: italic;
        }

        /* Benefits */
        .vf-benefits {
          padding: 120px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .vf-benefit-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: start;
          padding: 64px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .vf-benefit-row:last-child {
          border-bottom: none;
        }
        .vf-benefit-headline {
          font-size: clamp(32px, 4vw, 48px);
          font-weight: 800;
          color: #fafafa;
          line-height: 1.05;
          letter-spacing: -0.03em;
          margin: 0;
        }
        .vf-benefit-body {
          font-size: 16px;
          color: #71717a;
          margin: 0;
          line-height: 1.8;
          font-weight: 300;
        }

        /* Calculator */
        .vf-calc {
          padding: 120px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .vf-calc-container {
          margin-top: -16px;
        }
        .vf-calc-input {
          margin-bottom: 40px;
        }
        .vf-calc-label {
          display: block;
          font-size: 15px;
          color: #a1a1aa;
          margin-bottom: 16px;
          font-weight: 500;
        }
        .vf-calc-slider-row {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .vf-calc-range {
          flex: 1;
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          border-radius: 4px;
          background: #27272a;
          outline: none;
        }
        .vf-calc-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #6366f1);
          cursor: pointer;
          box-shadow: 0 0 16px rgba(124, 58, 237, 0.3);
        }
        .vf-calc-value {
          font-size: 36px;
          font-weight: 900;
          color: #fafafa;
          min-width: 48px;
          text-align: right;
          letter-spacing: -0.03em;
        }
        .vf-calc-results {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }
        .vf-calc-card {
          padding: 28px 24px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .vf-calc-old {
          background: rgba(255, 255, 255, 0.02);
        }
        .vf-calc-new {
          background: rgba(124, 58, 237, 0.05);
          border-color: rgba(124, 58, 237, 0.15);
        }
        .vf-calc-card-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 20px;
        }
        .vf-calc-old .vf-calc-card-label {
          color: #52525b;
        }
        .vf-calc-new .vf-calc-card-label {
          color: #a78bfa;
        }
        .vf-calc-stat {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 12px;
        }
        .vf-calc-num {
          font-size: 28px;
          font-weight: 800;
          color: #fafafa;
          letter-spacing: -0.03em;
          line-height: 1;
        }
        .vf-calc-unit {
          font-size: 13px;
          color: #71717a;
        }
        .vf-calc-revenue .vf-calc-num {
          font-size: 32px;
        }
        .vf-calc-new .vf-calc-revenue .vf-calc-num {
          background: linear-gradient(135deg, #a78bfa, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .vf-calc-delta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 28px;
          border-radius: 12px;
          background: rgba(124, 58, 237, 0.06);
          border: 1px solid rgba(124, 58, 237, 0.12);
        }
        .vf-calc-delta-label {
          font-size: 14px;
          color: #a1a1aa;
          font-weight: 500;
        }
        .vf-calc-delta-value {
          font-size: 36px;
          font-weight: 900;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #a78bfa, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Social Proof */
        .vf-proof {
          padding: 120px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .vf-proof-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 40px;
          margin-bottom: 80px;
          flex-wrap: wrap;
        }
        .vf-proof-stat {
          text-align: center;
        }
        .vf-proof-num {
          display: block;
          font-size: 48px;
          font-weight: 900;
          letter-spacing: -0.04em;
          background: linear-gradient(135deg, #a78bfa, #818cf8, #6366f1);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
          margin-bottom: 8px;
        }
        .vf-proof-desc {
          font-size: 13px;
          color: #71717a;
          line-height: 1.4;
        }
        .vf-proof-divider {
          width: 1px;
          height: 48px;
          background: rgba(255, 255, 255, 0.08);
        }
        .vf-proof-quotes {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        .vf-proof-quote {
          padding: 32px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          transition: border-color 0.3s;
        }
        .vf-proof-quote:hover {
          border-color: rgba(124, 58, 237, 0.15);
        }
        .vf-proof-text {
          font-size: 15px;
          color: #d4d4d8;
          line-height: 1.7;
          margin: 0 0 24px;
          font-weight: 300;
          font-style: italic;
        }
        .vf-proof-author {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .vf-proof-avatar {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(
            135deg,
            rgba(124, 58, 237, 0.2),
            rgba(99, 102, 241, 0.2)
          );
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: #a78bfa;
          flex-shrink: 0;
        }
        .vf-proof-name {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #e4e4e7;
        }
        .vf-proof-role {
          display: block;
          font-size: 12px;
          color: #52525b;
          margin-top: 2px;
        }

        /* IntentWin Gov */
        .vf-gov {
          padding: 120px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          position: relative;
          overflow: hidden;
        }
        .vf-gov-glow {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 400px;
          background: radial-gradient(
            ellipse,
            rgba(124, 58, 237, 0.05) 0%,
            transparent 70%
          );
          pointer-events: none;
        }
        .vf-gov-inner {
          position: relative;
          z-index: 2;
          text-align: center;
        }
        .vf-gov-badge-row {
          margin-bottom: 20px;
        }
        .vf-gov-badge {
          display: inline-block;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #a78bfa;
          border: 1px solid rgba(124, 58, 237, 0.35);
          background: rgba(124, 58, 237, 0.1);
          padding: 8px 24px;
          border-radius: 100px;
        }
        .vf-gov-headline {
          font-size: clamp(32px, 5vw, 52px);
          font-weight: 900;
          line-height: 1.1;
          color: #fafafa;
          letter-spacing: -0.03em;
          margin: 0 0 20px;
        }
        .vf-gov-sub {
          font-size: 17px;
          color: #71717a;
          max-width: 560px;
          margin: 0 auto 56px;
          line-height: 1.7;
          font-weight: 300;
        }
        .vf-gov-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          text-align: left;
          margin-bottom: 56px;
        }
        .vf-gov-card {
          padding: 28px 24px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          transition: all 0.3s ease;
        }
        .vf-gov-card:hover {
          border-color: rgba(124, 58, 237, 0.2);
          background: rgba(124, 58, 237, 0.03);
          transform: translateY(-4px);
        }
        .vf-gov-card-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: rgba(124, 58, 237, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #a78bfa;
          margin-bottom: 20px;
        }
        .vf-gov-card-title {
          font-size: 16px;
          font-weight: 700;
          color: #e4e4e7;
          margin: 0 0 8px;
        }
        .vf-gov-card-desc {
          font-size: 13px;
          color: #71717a;
          margin: 0;
          line-height: 1.6;
        }
        .vf-gov-cta {
          text-align: center;
        }
        .vf-gov-cta-text {
          font-size: 15px;
          color: #71717a;
          margin: 0 0 20px;
        }

        /* Pricing */
        .vf-pricing {
          padding: 120px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          text-align: center;
        }
        .vf-price-card {
          max-width: 560px;
          margin: 0 auto;
          border-radius: 20px;
          padding: 48px 40px;
          border: 1px solid rgba(124, 58, 237, 0.15);
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(12px);
        }
        .vf-price-amount {
          margin: 8px 0 0;
        }
        .vf-price-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          text-align: left;
          margin-bottom: 36px;
        }

        /* Footer */
        .vf-footer {
          padding: 160px 0 80px;
          text-align: center;
          position: relative;
          overflow: hidden;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .vf-footer-glow {
          position: absolute;
          bottom: -30%;
          left: 50%;
          transform: translateX(-50%);
          width: 500px;
          height: 500px;
          background: radial-gradient(
            circle,
            rgba(124, 58, 237, 0.06) 0%,
            transparent 70%
          );
          pointer-events: none;
        }
        .vf-footer-inner {
          position: relative;
          z-index: 2;
        }
        .vf-footer-headline {
          font-size: clamp(36px, 6vw, 64px);
          font-weight: 900;
          color: #fafafa;
          line-height: 1.08;
          letter-spacing: -0.04em;
          margin: 0 0 40px;
        }
        .vf-footer-tag {
          margin-top: 28px;
          font-size: 13px;
          color: #3f3f46;
          letter-spacing: 0.05em;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .vf-gov-grid {
            grid-template-columns: 1fr 1fr;
          }
          .vf-compare-header,
          .vf-compare-row {
            grid-template-columns: 100px 1fr 1fr;
          }
        }
        @media (max-width: 768px) {
          .vf-hero {
            padding: 140px 24px 100px;
          }
          .vf-statement {
            padding: 80px 24px;
          }
          .vf-benefit-row {
            grid-template-columns: 1fr;
            gap: 24px;
            padding: 48px 0;
          }
          .vf-price-grid,
          .vf-calc-results {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .vf-price-card {
            padding: 36px 24px;
          }
          .vf-proof-quotes {
            grid-template-columns: 1fr;
          }
          .vf-proof-stats {
            gap: 24px;
          }
          .vf-proof-divider {
            display: none;
          }
          .vf-gov-grid {
            grid-template-columns: 1fr;
          }
          .vf-human-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .vf-compare-header,
          .vf-compare-row {
            grid-template-columns: 1fr;
            gap: 0;
          }
          .vf-compare-col-label {
            padding-bottom: 4px !important;
          }
          .vf-compare-col-old,
          .vf-compare-col-new {
            padding-top: 8px !important;
            padding-bottom: 8px !important;
          }
          .vf-calc-delta {
            flex-direction: column;
            text-align: center;
            gap: 8px;
          }
        }
      `}</style>
    </>
  );
}
