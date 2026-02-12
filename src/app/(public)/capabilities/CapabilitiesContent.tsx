"use client";

import Link from "next/link";
import { useState } from "react";

export default function CapabilitiesContent() {
  const [activeLayer, setActiveLayer] = useState<number | null>(null);

  const iddLayers = [
    {
      name: "Strategic Intent",
      brief: "Define before you write",
      detail:
        "Win themes, target outcomes, and competitive positioning are defined before a single word is generated. This isn't brainstorming — it's structured strategy extraction that becomes the north star for every section.",
    },
    {
      name: "Evidence Engine",
      brief: "Claims backed by proof",
      detail:
        "L1 company truth (verified facts about your org) and L2 reference docs (past proposals, case studies) feed real proof points into every section. No hallucinated claims — only evidence from your knowledge base.",
    },
    {
      name: "Persuasion Frameworks",
      brief: "The right framework for each section",
      detail:
        "15 section-specific persuasion frameworks — AIDA, PAS, STAR, FAB, and more — are automatically matched to content type. An executive summary gets different treatment than a technical approach.",
    },
    {
      name: "Multi-Model Generation",
      brief: "Best model for each job",
      detail:
        "Claude generates section content. GPT-4o independently reviews and scores. Gemini renders diagrams and provides fallback generation. Three models, each doing what it does best.",
    },
    {
      name: "Quality Overseer",
      brief: "Every section scored and verified",
      detail:
        "Every section is independently scored on 4 dimensions: content quality, client fit, evidence level, and brand voice. Sections below 8.5 are automatically rewritten with specific feedback, then re-reviewed.",
    },
    {
      name: "Compliance & Export",
      brief: "Requirements tracked, gaps flagged",
      detail:
        "RFP requirements are extracted and mapped to proposal sections. Gaps are flagged automatically. Export to PPTX, DOCX, PDF, HTML, or Google Slides — one click, branded, ready to send.",
    },
  ];

  const workflowSteps = [
    {
      num: "01",
      title: "Define Intent",
      text: "Upload RFPs, paste requirements, or describe the opportunity. AI extracts structured data and generates client research.",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    },
    {
      num: "02",
      title: "Set Win Strategy",
      text: "AI suggests win themes, target outcomes, and differentiators. You refine. This becomes the north star for every section.",
      icon: "M13 10V3L4 14h7v7l9-11h-7z",
    },
    {
      num: "03",
      title: "Generate with Evidence",
      text: "15 sections generated simultaneously, each using the right persuasion framework with evidence from your knowledge base.",
      icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
    },
    {
      num: "04",
      title: "Quality Overseer Reviews",
      text: "GPT-4o independently scores every section on 4 dimensions. Content below 8.5 is auto-rewritten and re-reviewed. No weak content ships.",
      icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    },
    {
      num: "05",
      title: "Export & Win",
      text: "One click to export in any format. Version history tracks every change. Compliance board ensures nothing is missed.",
      icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
    },
  ];

  const models = [
    {
      name: "CLAUDE",
      role: "Generate",
      stats: "15 section types, persuasion frameworks, evidence integration",
      color: "#a78bfa",
    },
    {
      name: "GPT-4o",
      role: "Review",
      stats: "4-dimension scoring, auto-remediation, quality threshold",
      color: "#6366f1",
    },
    {
      name: "GEMINI",
      role: "Diagrams & Fallback",
      stats: "Visual generation, image creation, model redundancy",
      color: "#7c3aed",
    },
  ];

  const capabilities = [
    {
      title: "15 Persuasion Frameworks",
      desc: "AIDA, PAS, STAR, FAB — each section uses the right framework for its content type.",
      icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    },
    {
      title: "5-Format Export",
      desc: "PPTX, DOCX, PDF, HTML, Google Slides — one click, branded, ready to send.",
      icon: "M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    },
    {
      title: "Compliance Tracking",
      desc: "Requirements extracted from RFP, mapped to sections, gaps flagged automatically.",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
    },
    {
      title: "Brand Voice",
      desc: "Your tone, your terminology, your language — enforced across every section.",
      icon: "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z",
    },
    {
      title: "Version History",
      desc: "Full snapshot on every change. Compare, diff, restore with one click.",
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      title: "Review & Annotations",
      desc: "Add comments, flag issues, AI auto-fixes addressed sections.",
      icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    },
  ];

  const scoreDimensions = [
    { name: "Content Quality", target: 8.5, fill: 85 },
    { name: "Client Fit", target: 9.0, fill: 90 },
    { name: "Evidence Level", target: 8.5, fill: 85 },
    { name: "Brand Voice", target: 9.0, fill: 90 },
  ];

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
              <a href="#methodology">Methodology</a>
              <a href="#workflow">How It Works</a>
              <a href="#quality">Quality</a>
              <a href="#features">Features</a>
              <Link href="/request-access" className="vf-nav-cta">
                Request Access
              </Link>
            </div>
          </div>
        </nav>

        {/* §1 Hero */}
        <section className="vf-hero">
          <div className="vf-hero-glow" aria-hidden="true" />
          <div className="vf-hero-inner">
            <span className="vf-badge">THE INTENTWIN PLATFORM</span>
            <h1 className="vf-hero-headline">
              Proposals
              <br />
              <span className="vf-gradient-text">Engineered,</span>
              <br />
              Not Prompted
            </h1>
            <p className="vf-hero-sub">
              A multi-model AI system with built-in quality oversight,
              <br />
              evidence-based generation, and a methodology that turns
              <br />
              every proposal into a competitive weapon.
            </p>
            <div className="vf-hero-actions">
              <Link href="/request-access" className="vf-btn-primary">
                Request Access
              </Link>
            </div>
          </div>
        </section>

        {/* §2 The Problem */}
        <section className="vf-cap-section">
          <div className="vf-section-inner">
            <span className="vf-label">THE PROBLEM</span>
            <h2 className="vf-section-heading">
              Why most AI proposals <span className="vf-gradient-text">fail</span>
            </h2>
            <div className="vf-cap-problem-grid">
              {[
                {
                  icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
                  title: "Generic AI Output",
                  body: "ChatGPT doesn't know your company, your client, or your win themes. Every proposal starts from zero.",
                },
                {
                  icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
                  title: "No Quality Control",
                  body: "AI-generated content ships without review. One weak section kills the entire proposal's credibility.",
                },
                {
                  icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
                  title: "No Evidence Trail",
                  body: "Claims without proof points. Case studies cited from memory, not from your verified evidence library.",
                },
              ].map((card, i) => (
                <div
                  key={i}
                  className="vf-cap-problem-card animate-fadeInUp"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="vf-cap-problem-icon">
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
                      <path d={card.icon} />
                    </svg>
                  </div>
                  <h3 className="vf-cap-problem-title">{card.title}</h3>
                  <p className="vf-cap-problem-body">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* §3 IDD Methodology — Deep Dive */}
        <section id="methodology" className="vf-cap-section vf-cap-section--dark">
          <div className="vf-section-inner">
            <span className="vf-label">THE METHODOLOGY</span>
            <h2 className="vf-section-heading">
              Six layers of <span className="vf-gradient-text">Intent</span>
            </h2>
            <p className="vf-cap-subtitle">
              Every section is built through six engineered layers. Not
              prompts — structured intelligence that compounds.
            </p>
            <div className="vf-cap-layers">
              {iddLayers.map((layer, i) => (
                <div
                  key={i}
                  className={`vf-cap-layer ${activeLayer === i ? "vf-cap-layer--active" : ""}`}
                  onClick={() =>
                    setActiveLayer(activeLayer === i ? null : i)
                  }
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setActiveLayer(activeLayer === i ? null : i);
                    }
                  }}
                >
                  <div className="vf-cap-layer-header">
                    <span className="vf-cap-layer-num">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="vf-cap-layer-name">{layer.name}</span>
                    <span className="vf-cap-layer-brief">{layer.brief}</span>
                    <svg
                      className={`vf-cap-layer-chevron ${activeLayer === i ? "vf-cap-layer-chevron--open" : ""}`}
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M4 6l4 4 4-4" />
                    </svg>
                  </div>
                  {activeLayer === i && (
                    <div className="vf-cap-layer-detail">
                      <p>{layer.detail}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* §4 Workflow Walkthrough */}
        <section id="workflow" className="vf-cap-section">
          <div className="vf-section-inner">
            <span className="vf-label">HOW IT WORKS</span>
            <h2 className="vf-section-heading">
              From RFP to <span className="vf-gradient-text">winning proposal</span>
            </h2>
            <div className="vf-cap-workflow">
              {workflowSteps.map((step, i) => (
                <div
                  key={i}
                  className={`vf-cap-step ${i % 2 === 1 ? "vf-cap-step--right" : ""} animate-fadeInUp`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="vf-cap-step-num">{step.num}</div>
                  <div className="vf-cap-step-content">
                    <div className="vf-cap-step-icon">
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
                        <path d={step.icon} />
                      </svg>
                    </div>
                    <h3 className="vf-cap-step-title">{step.title}</h3>
                    <p className="vf-cap-step-text">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* §5 Multi-Model Architecture */}
        <section className="vf-cap-section vf-cap-section--dark">
          <div className="vf-section-inner">
            <span className="vf-label">AI ARCHITECTURE</span>
            <h2 className="vf-section-heading">
              Three models. <span className="vf-gradient-text">One system.</span>
            </h2>
            <p className="vf-cap-subtitle">
              Best model for each job. No single point of failure.
            </p>
            <div className="vf-cap-models">
              {models.map((model, i) => (
                <div key={i} className="vf-cap-model-card">
                  <div
                    className="vf-cap-model-accent"
                    style={{ backgroundColor: model.color }}
                  />
                  <h3 className="vf-cap-model-name">{model.name}</h3>
                  <span className="vf-cap-model-role">{model.role}</span>
                  <p className="vf-cap-model-stats">{model.stats}</p>
                </div>
              ))}
            </div>
            <div className="vf-cap-models-connector">
              <div className="vf-cap-models-line" />
              <div className="vf-cap-models-result">
                <span className="vf-cap-models-result-label">YOUR PROPOSAL</span>
                <span className="vf-cap-models-result-score">9.0+ quality</span>
              </div>
            </div>
          </div>
        </section>

        {/* §6 Evidence-Based Generation */}
        <section className="vf-cap-section">
          <div className="vf-section-inner">
            <span className="vf-label">KNOWLEDGE SYSTEM</span>
            <h2 className="vf-section-heading">
              Evidence-based <span className="vf-gradient-text">generation</span>
            </h2>
            <div className="vf-cap-evidence-grid">
              <div className="vf-cap-evidence-card">
                <h3 className="vf-cap-evidence-title">L1: Company Truth</h3>
                <p className="vf-cap-evidence-desc">
                  Verified. Locked. Your single source of truth.
                </p>
                <ul className="vf-cap-evidence-list">
                  <li>Brand &amp; Values</li>
                  <li>Certifications</li>
                  <li>Products &amp; Services</li>
                  <li>Partnerships</li>
                  <li>Legal Structure</li>
                </ul>
              </div>
              <div className="vf-cap-evidence-card">
                <h3 className="vf-cap-evidence-title">L2: Reference Docs</h3>
                <p className="vf-cap-evidence-desc">
                  Semantic search finds relevant context for every section.
                </p>
                <ul className="vf-cap-evidence-list">
                  <li>Past Proposals</li>
                  <li>Case Studies</li>
                  <li>RFP Responses</li>
                  <li>Technical Docs</li>
                </ul>
              </div>
            </div>
            <div className="vf-cap-evidence-library">
              <span className="vf-cap-evidence-library-label">
                EVIDENCE LIBRARY
              </span>
              <div className="vf-cap-evidence-tags">
                {[
                  "Case Studies",
                  "Metrics",
                  "Testimonials",
                  "Awards",
                  "Certifications",
                ].map((tag) => (
                  <span key={tag} className="vf-cap-evidence-tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* §7 Quality Guarantee */}
        <section id="quality" className="vf-cap-section vf-cap-section--dark">
          <div className="vf-section-inner">
            <span className="vf-label">QUALITY GUARANTEE</span>
            <h2 className="vf-section-heading">
              The <span className="vf-gradient-text">Quality Overseer</span>
            </h2>
            <p className="vf-cap-subtitle">
              Every section independently reviewed. Automatically.
            </p>
            <div className="vf-cap-scores">
              {scoreDimensions.map((dim) => (
                <div key={dim.name} className="vf-cap-score-row">
                  <span className="vf-cap-score-label">{dim.name}</span>
                  <div className="vf-cap-score-bar">
                    <div
                      className="vf-cap-score-fill"
                      style={{ width: `${dim.fill}%` }}
                    />
                    <div
                      className="vf-cap-score-threshold"
                      style={{ left: "85%" }}
                    />
                  </div>
                  <span className="vf-cap-score-target">{dim.target}+</span>
                </div>
              ))}
            </div>
            <p className="vf-cap-score-note">
              Sections scoring below 8.5 are automatically rewritten with
              specific feedback, then re-reviewed. The cycle continues until
              quality passes.
            </p>
          </div>
        </section>

        {/* §8 Capability Grid */}
        <section id="features" className="vf-cap-section">
          <div className="vf-section-inner">
            <span className="vf-label">CAPABILITIES</span>
            <h2 className="vf-section-heading">
              Everything you need to{" "}
              <span className="vf-gradient-text">win</span>
            </h2>
            <div className="vf-cap-grid">
              {capabilities.map((cap, i) => (
                <div
                  key={i}
                  className="vf-cap-card animate-fadeInUp"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className="vf-cap-card-icon">
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
                      <path d={cap.icon} />
                    </svg>
                  </div>
                  <h3 className="vf-cap-card-title">{cap.title}</h3>
                  <p className="vf-cap-card-desc">{cap.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* §9 Footer CTA */}
        <section className="vf-cap-section vf-cap-section--cta">
          <div className="vf-section-inner" style={{ textAlign: "center" }}>
            <h2
              className="vf-section-heading"
              style={{ fontSize: "clamp(36px, 6vw, 56px)" }}
            >
              Stop prompting.
              <br />
              <span className="vf-gradient-text">Start winning.</span>
            </h2>
            <p className="vf-cap-subtitle">
              IntentWin is available for early access.
            </p>
            <div style={{ marginTop: 40 }}>
              <Link href="/request-access" className="vf-btn-primary">
                Request Early Access
              </Link>
            </div>
            <p className="vf-cap-trust-line">
              No credit card required &middot; Setup in minutes &middot; SOC 2
              compliant
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="vf-footer">
          <div className="vf-footer-inner">
            <div className="vf-footer-brand">
              <Link href="/" className="vf-footer-logo">
                IntentWin
              </Link>
              <p className="vf-footer-tagline">
                Proposals engineered to win.
              </p>
            </div>
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

      <style jsx global>{`
        /* ===================================================
           Capabilities Page Styles (.vf-cap-*)
           =================================================== */

        .vf-cap-section {
          padding: 100px 0;
          position: relative;
        }
        .vf-cap-section--dark {
          background: #0f0f11;
        }
        .vf-cap-section--cta {
          padding: 120px 0;
          background: linear-gradient(
            180deg,
            #09090b 0%,
            #0f0f11 50%,
            #09090b 100%
          );
        }
        .vf-cap-subtitle {
          font-size: 17px;
          color: #71717a;
          line-height: 1.7;
          max-width: 600px;
          margin: 0 auto 48px;
          text-align: center;
        }

        /* §2 Problem Cards */
        .vf-cap-problem-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-top: 48px;
        }
        .vf-cap-problem-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 32px;
          transition: border-color 0.3s;
        }
        .vf-cap-problem-card:hover {
          border-color: rgba(124, 58, 237, 0.2);
        }
        .vf-cap-problem-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(124, 58, 237, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #a78bfa;
          margin-bottom: 20px;
        }
        .vf-cap-problem-title {
          font-size: 18px;
          font-weight: 700;
          color: #fafafa;
          margin: 0 0 12px;
        }
        .vf-cap-problem-body {
          font-size: 14px;
          color: #71717a;
          line-height: 1.7;
          margin: 0;
        }

        /* §3 IDD Layers */
        .vf-cap-layers {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-top: 48px;
          max-width: 720px;
          margin-left: auto;
          margin-right: auto;
        }
        .vf-cap-layer {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .vf-cap-layer:hover {
          border-color: rgba(124, 58, 237, 0.2);
        }
        .vf-cap-layer--active {
          border-color: rgba(124, 58, 237, 0.4);
          background: rgba(124, 58, 237, 0.05);
          box-shadow: 0 0 30px rgba(124, 58, 237, 0.08);
        }
        .vf-cap-layer-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
        }
        .vf-cap-layer-num {
          font-size: 12px;
          font-weight: 700;
          color: #7c3aed;
          font-variant-numeric: tabular-nums;
          min-width: 24px;
        }
        .vf-cap-layer-name {
          font-size: 15px;
          font-weight: 600;
          color: #fafafa;
          flex-shrink: 0;
        }
        .vf-cap-layer-brief {
          font-size: 13px;
          color: #52525b;
          flex: 1;
          text-align: right;
        }
        .vf-cap-layer-chevron {
          color: #52525b;
          transition: transform 0.3s;
          flex-shrink: 0;
        }
        .vf-cap-layer-chevron--open {
          transform: rotate(180deg);
        }
        .vf-cap-layer-detail {
          padding: 0 20px 20px 60px;
        }
        .vf-cap-layer-detail p {
          font-size: 14px;
          color: #a1a1aa;
          line-height: 1.7;
          margin: 0;
        }

        /* §4 Workflow */
        .vf-cap-workflow {
          display: flex;
          flex-direction: column;
          gap: 32px;
          margin-top: 48px;
          max-width: 720px;
          margin-left: auto;
          margin-right: auto;
          position: relative;
        }
        .vf-cap-workflow::before {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          left: 28px;
          width: 1px;
          background: linear-gradient(
            180deg,
            rgba(124, 58, 237, 0.3) 0%,
            rgba(99, 102, 241, 0.1) 100%
          );
        }
        .vf-cap-step {
          display: flex;
          gap: 24px;
          align-items: flex-start;
          position: relative;
        }
        .vf-cap-step-num {
          font-size: 14px;
          font-weight: 700;
          color: #7c3aed;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 1px solid rgba(124, 58, 237, 0.3);
          background: #09090b;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          position: relative;
          z-index: 2;
        }
        .vf-cap-step-content {
          flex: 1;
          padding-top: 4px;
        }
        .vf-cap-step-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: rgba(124, 58, 237, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #a78bfa;
          margin-bottom: 12px;
        }
        .vf-cap-step-title {
          font-size: 17px;
          font-weight: 700;
          color: #fafafa;
          margin: 0 0 8px;
        }
        .vf-cap-step-text {
          font-size: 14px;
          color: #71717a;
          line-height: 1.7;
          margin: 0;
        }

        /* §5 Models */
        .vf-cap-models {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-top: 48px;
        }
        .vf-cap-model-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 32px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .vf-cap-model-accent {
          height: 3px;
          width: 100%;
          position: absolute;
          top: 0;
          left: 0;
        }
        .vf-cap-model-name {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.15em;
          color: #fafafa;
          margin: 8px 0 4px;
        }
        .vf-cap-model-role {
          font-size: 20px;
          font-weight: 700;
          color: #a78bfa;
          display: block;
          margin-bottom: 12px;
        }
        .vf-cap-model-stats {
          font-size: 13px;
          color: #71717a;
          line-height: 1.6;
          margin: 0;
        }
        .vf-cap-models-connector {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 32px;
        }
        .vf-cap-models-line {
          width: 1px;
          height: 40px;
          background: linear-gradient(180deg, #7c3aed, #6366f1);
        }
        .vf-cap-models-result {
          border: 1px solid rgba(124, 58, 237, 0.3);
          background: rgba(124, 58, 237, 0.06);
          border-radius: 12px;
          padding: 16px 32px;
          text-align: center;
        }
        .vf-cap-models-result-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.15em;
          color: #a1a1aa;
        }
        .vf-cap-models-result-score {
          font-size: 20px;
          font-weight: 700;
          color: #a78bfa;
        }

        /* §6 Evidence */
        .vf-cap-evidence-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          margin-top: 48px;
        }
        .vf-cap-evidence-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 32px;
        }
        .vf-cap-evidence-title {
          font-size: 17px;
          font-weight: 700;
          color: #fafafa;
          margin: 0 0 8px;
        }
        .vf-cap-evidence-desc {
          font-size: 13px;
          color: #71717a;
          margin: 0 0 16px;
        }
        .vf-cap-evidence-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .vf-cap-evidence-list li {
          font-size: 14px;
          color: #a1a1aa;
          padding: 6px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .vf-cap-evidence-list li::before {
          content: "\\2713";
          color: #7c3aed;
          font-size: 12px;
        }
        .vf-cap-evidence-library {
          margin-top: 24px;
          text-align: center;
        }
        .vf-cap-evidence-library-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.15em;
          color: #52525b;
          margin-bottom: 12px;
        }
        .vf-cap-evidence-tags {
          display: flex;
          gap: 8px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .vf-cap-evidence-tag {
          font-size: 12px;
          color: #a78bfa;
          border: 1px solid rgba(124, 58, 237, 0.2);
          background: rgba(124, 58, 237, 0.06);
          padding: 4px 14px;
          border-radius: 100px;
        }

        /* §7 Quality Scores */
        .vf-cap-scores {
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-width: 560px;
          margin: 48px auto 32px;
        }
        .vf-cap-score-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .vf-cap-score-label {
          font-size: 14px;
          font-weight: 600;
          color: #a1a1aa;
          width: 140px;
          flex-shrink: 0;
        }
        .vf-cap-score-bar {
          flex: 1;
          height: 8px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.06);
          position: relative;
          overflow: visible;
        }
        .vf-cap-score-fill {
          height: 100%;
          border-radius: 4px;
          background: linear-gradient(90deg, #7c3aed, #6366f1);
          transition: width 1s ease;
        }
        .vf-cap-score-threshold {
          position: absolute;
          top: -4px;
          width: 2px;
          height: 16px;
          background: #ef4444;
          border-radius: 1px;
        }
        .vf-cap-score-target {
          font-size: 13px;
          font-weight: 700;
          color: #a78bfa;
          font-variant-numeric: tabular-nums;
          width: 36px;
        }
        .vf-cap-score-note {
          font-size: 14px;
          color: #71717a;
          text-align: center;
          line-height: 1.7;
          max-width: 560px;
          margin: 0 auto;
        }

        /* §8 Capability Grid */
        .vf-cap-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 48px;
        }
        .vf-cap-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 28px;
          transition: all 0.3s ease;
        }
        .vf-cap-card:hover {
          border-color: rgba(124, 58, 237, 0.2);
          transform: translateY(-2px);
        }
        .vf-cap-card-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(124, 58, 237, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #a78bfa;
          margin-bottom: 16px;
        }
        .vf-cap-card-title {
          font-size: 16px;
          font-weight: 700;
          color: #fafafa;
          margin: 0 0 8px;
        }
        .vf-cap-card-desc {
          font-size: 13px;
          color: #71717a;
          line-height: 1.6;
          margin: 0;
        }

        /* §9 CTA */
        .vf-cap-trust-line {
          font-size: 13px;
          color: #52525b;
          margin-top: 24px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .vf-cap-problem-grid {
            grid-template-columns: 1fr;
          }
          .vf-cap-models {
            grid-template-columns: 1fr;
          }
          .vf-cap-evidence-grid {
            grid-template-columns: 1fr;
          }
          .vf-cap-grid {
            grid-template-columns: 1fr;
          }
          .vf-cap-layer-brief {
            display: none;
          }
          .vf-cap-layer-detail {
            padding-left: 20px;
          }
          .vf-cap-score-label {
            width: 100px;
            font-size: 12px;
          }
        }
        @media (max-width: 480px) {
          .vf-cap-section {
            padding: 64px 0;
          }
          .vf-cap-workflow::before {
            left: 20px;
          }
          .vf-cap-step-num {
            width: 40px;
            height: 40px;
            font-size: 12px;
          }
        }
      `}</style>
    </>
  );
}
