"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics/track";

const competitors = [
  {
    name: "Template Tools",
    examples: "PandaDoc, Proposify, Qwilr",
    price: "$19–65/user/mo",
    approach: "Template-driven",
    weakness: "Formats documents. Doesn't help you win.",
  },
  {
    name: "Enterprise RFP",
    examples: "Loopio, Responsive",
    price: "$20K–100K+/yr",
    approach: "Content library + search",
    weakness: "AI bolted onto legacy architecture. 6-month onboarding.",
  },
  {
    name: "AI Copilots",
    examples: "ChatGPT, Jasper, generic AI",
    price: "$20–100/mo",
    approach: "General-purpose generation",
    weakness: "No proposal methodology. No quality review. No win strategy.",
  },
];

const differentiators = [
  {
    label: "AI Architecture",
    them: "Single model, one-shot generation",
    us: "Multi-model pipeline with 3-judge quality council",
  },
  {
    label: "Quality Assurance",
    them: "Manual review only",
    us: "AI judges score every section before you see it",
  },
  {
    label: "Persuasion",
    them: "Templates and fill-in-the-blank",
    us: "6-layer framework: AIDA, PAS, FAB, STAR per section",
  },
  {
    label: "Learning",
    them: "Starts from zero every time",
    us: "Compounds from your wins, losses, and evidence library",
  },
  {
    label: "Speed",
    them: "Days to weeks",
    us: "Hours. 10x more proposals, same team.",
  },
  {
    label: "Compliance",
    them: "Generic checklists",
    us: "FedRAMP, FISMA, NIST-aware. Section L/M mapping.",
  },
];

export function CompetitorSection() {
  return (
    <section id="why-intentwin" className="vf-competitor">
      <div className="vf-section-inner">
        <span className="vf-label">Why IntentWin</span>
        <h2 className="vf-section-heading">
          Not another document builder.
        </h2>
        <p className="vf-section-sub" style={{ maxWidth: 640, margin: "0 auto 48px" }}>
          Most proposal tools format documents. IntentWin engineers wins.
          Here&apos;s how we&apos;re different from everything else on the market.
        </p>

        {/* Competitor categories */}
        <div className="vf-comp-categories">
          {competitors.map((c, i) => (
            <div key={i} className="vf-comp-card">
              <div className="vf-comp-card-header">
                <span className="vf-comp-card-name">{c.name}</span>
                <span className="vf-comp-card-price">{c.price}</span>
              </div>
              <p className="vf-comp-card-examples">{c.examples}</p>
              <p className="vf-comp-card-approach">{c.approach}</p>
              <p className="vf-comp-card-weakness">{c.weakness}</p>
            </div>
          ))}
        </div>

        {/* Feature-by-feature comparison */}
        <div className="vf-comp-table">
          <div className="vf-comp-table-header">
            <div className="vf-comp-table-label" />
            <div className="vf-comp-table-them">Everyone Else</div>
            <div className="vf-comp-table-us">IntentWin</div>
          </div>
          {differentiators.map((d, i) => (
            <div key={i} className="vf-comp-table-row">
              <div className="vf-comp-table-label">{d.label}</div>
              <div className="vf-comp-table-them">
                <span className="vf-compare-x">&#x2715;</span>
                {d.them}
              </div>
              <div className="vf-comp-table-us">
                <span className="vf-compare-check">&#x2713;</span>
                {d.us}
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 40 }}>
          <Link
            href="/request-access"
            className="vf-cta-primary"
            onClick={() => trackEvent("cta_click", { location: "competitor-section", label: "Request Access" })}
          >
            Request Access
          </Link>
        </div>
      </div>
    </section>
  );
}
