"use client";

import { useState } from "react";

import { HeroSection } from "./_components/hero-section";
import { CompareSection } from "./_components/compare-section";
import { HumanLoopSection } from "./_components/human-loop-section";
import { FrameworkSection } from "./_components/framework-section";
import { BenefitsSection } from "./_components/benefits-section";
import { CalculatorSection } from "./_components/calculator-section";
import { SocialProofSection } from "./_components/social-proof-section";
import { IntelligenceSection } from "./_components/intelligence-section";
import { CompetitorSection } from "./_components/competitor-section";
import { PricingFooterSection } from "./_components/pricing-footer-section";
import { LandingStyles } from "./_components/landing-styles";

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
    new: "Dramatically more output, same team",
  },
];

export default function LandingContent() {
  const [activeLayer, setActiveLayer] = useState<number | null>(null);

  return (
    <>
      <div className="vf-page">
        <HeroSection />
        <CompareSection oldWay={oldWay} />
        <HumanLoopSection />
        <FrameworkSection
          layers={layers}
          activeLayer={activeLayer}
          setActiveLayer={setActiveLayer}
        />
        <BenefitsSection />
        <IntelligenceSection />
        <CalculatorSection />
        <SocialProofSection />
        <CompetitorSection />
        <PricingFooterSection />
      </div>

      {/* Shared styles provided by @/styles/public.css */}
      <LandingStyles />
    </>
  );
}
