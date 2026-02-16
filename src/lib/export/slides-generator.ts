/**
 * Cinematic Executive Presentation Generator
 *
 * Design: Luxury editorial meets high-stakes consulting
 * Think McKinsey deck meets Apple keynote - dark, confident, sophisticated
 */

import { escapeHtml } from "@/lib/email/escape-html";

interface ProposalSection {
  title: string;
  content: string;
  section_type: string;
}

interface ProposalData {
  title: string;
  client_name: string;
  company_name?: string;
  date: string;
  sections: ProposalSection[];
}

interface SlideContent {
  type:
    | "hero"
    | "executive"
    | "understanding"
    | "challenge"
    | "solution"
    | "approach"
    | "methodology"
    | "team"
    | "case_study"
    | "timeline"
    | "investment"
    | "risk"
    | "metrics"
    | "differentiator"
    | "closing";
  title: string;
  subtitle?: string;
  items?: string[];
  metrics?: { value: string; label: string; description?: string }[];
  quote?: string;
  phases?: { name: string; description: string }[];
  caseStudyNumber?: number;
}

// Enhanced brand palette
const COLORS = {
  navy: "#0A1628",
  navyLight: "#1B365D",
  blue: "#0070AD",
  cyan: "#12ABDB",
  cyanGlow: "rgba(18, 171, 219, 0.4)",
  white: "#FFFFFF",
  offWhite: "#F0F4F8",
  gray: "#64748B",
  grayLight: "#94A3B8",
  grayDark: "#334155",
};

// SVG Icons (inline, no dependencies)
const ICONS = {
  lightning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
  lightbulb: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.9V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.1A7 7 0 0 0 12 2z"/></svg>`,
  target: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  chart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>`,
  trophy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  rocket: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>`,
};

// Narrative mapping
const NARRATIVE_MAP: Record<string, string> = {
  executive_summary: "context",
  current_state: "challenge",
  pain_points: "challenge",
  challenges: "challenge",
  problem_statement: "challenge",
  solution_overview: "solution",
  proposed_solution: "solution",
  approach: "approach",
  methodology: "approach",
  technical_approach: "approach",
  implementation: "approach",
  roadmap: "approach",
  case_studies: "metrics",
  case_study: "metrics",
  relevant_experience: "metrics",
  track_record: "metrics",
  outcomes: "metrics",
  benefits: "metrics",
  success_metrics: "metrics",
  why_capgemini: "differentiator",
  why_us: "differentiator",
  differentiators: "differentiator",
  value_proposition: "differentiator",
  team: "differentiator",
  next_steps: "closing",
  timeline: "closing",
  commercial: "closing",
};

function categorizeSection(section: ProposalSection): string {
  const type = section.section_type.toLowerCase().replace(/\s+/g, "_");
  const title = section.title.toLowerCase();

  if (NARRATIVE_MAP[type]) return NARRATIVE_MAP[type];

  for (const [key, category] of Object.entries(NARRATIVE_MAP)) {
    if (title.includes(key.replace(/_/g, " "))) return category;
  }

  if (
    title.includes("challenge") ||
    title.includes("problem") ||
    title.includes("pain")
  )
    return "challenge";
  if (title.includes("solution") || title.includes("propose"))
    return "solution";
  if (
    title.includes("approach") ||
    title.includes("method") ||
    title.includes("how")
  )
    return "approach";
  if (
    title.includes("case") ||
    title.includes("result") ||
    title.includes("metric") ||
    title.includes("success")
  )
    return "metrics";
  if (
    title.includes("why") ||
    title.includes("differ") ||
    title.includes("advantage")
  )
    return "differentiator";

  return "solution";
}

function extractItems(content: string, max: number = 4): string[] {
  const items: string[] = [];
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
    const numberedMatch = trimmed.match(/^\d+\.\s+(.+)$/);

    if (bulletMatch || numberedMatch) {
      let text = (bulletMatch?.[1] || numberedMatch?.[1] || "").trim();
      text = text.replace(/\*\*/g, "").replace(/\*/g, "").replace(/_/g, "");
      if (text.length > 10 && text.length < 200) {
        items.push(text.length > 120 ? text.substring(0, 117) + "..." : text);
      }
    }

    if (items.length >= max) break;
  }

  // Fallback: extract sentences
  if (items.length < 2) {
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
    for (const sentence of sentences) {
      const clean = sentence
        .trim()
        .replace(/^[-*#\d.]\s*/, "")
        .replace(/\*\*/g, "");
      if (clean.length > 30 && clean.length < 150 && !items.includes(clean)) {
        items.push(clean);
        if (items.length >= max) break;
      }
    }
  }

  return items;
}

function extractMetrics(
  content: string,
): { value: string; label: string; description?: string }[] {
  const metrics: { value: string; label: string; description?: string }[] = [];

  // Percentage patterns
  const percentMatches = content.matchAll(
    /(\d+(?:\.\d+)?)\s*%\s*(reduction|improvement|increase|decrease|faster|growth|savings?)/gi,
  );
  for (const match of percentMatches) {
    if (metrics.length < 4) {
      metrics.push({
        value: `${match[1]}%`,
        label: match[2].charAt(0).toUpperCase() + match[2].slice(1),
      });
    }
  }

  // Currency patterns
  const currencyMatches = content.matchAll(
    /(£|€|\$)\s*(\d+(?:\.\d+)?)\s*(m(?:illion)?|k|b(?:illion)?)?/gi,
  );
  for (const match of currencyMatches) {
    if (metrics.length < 4) {
      const suffix = match[3] ? match[3].charAt(0).toUpperCase() : "";
      metrics.push({
        value: `${match[1]}${match[2]}${suffix}`,
        label: "Value Delivered",
      });
    }
  }

  // Count patterns
  const countMatches = content.matchAll(
    /(\d{1,3}(?:,\d{3})*)\+?\s+(applications?|users?|systems?|employees?|customers?)/gi,
  );
  for (const match of countMatches) {
    if (metrics.length < 4) {
      metrics.push({
        value: match[1].replace(/,/g, ","),
        label: match[2].charAt(0).toUpperCase() + match[2].slice(1),
      });
    }
  }

  return metrics.slice(0, 4);
}

function getSectionByType(
  sections: ProposalSection[],
  type: string,
): ProposalSection | undefined {
  return sections.find(
    (s) => s.section_type.toLowerCase() === type.toLowerCase(),
  );
}

function extractPhases(
  content: string,
): { name: string; description: string }[] {
  const phases: { name: string; description: string }[] = [];
  const lines = content.split("\n");

  let currentPhase: { name: string; description: string } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    // Look for phase headers like "Phase 1:", "### Phase 1", "**Phase 1:**"
    const phaseMatch = trimmed.match(
      /^(?:#{1,3}\s*)?(?:\*\*)?(?:Phase|Stage|Step)\s*\d+[:\s]*(.+?)(?:\*\*)?$/i,
    );
    if (phaseMatch) {
      if (currentPhase) phases.push(currentPhase);
      currentPhase = {
        name: phaseMatch[1].replace(/\*\*/g, "").trim(),
        description: "",
      };
    } else if (currentPhase && trimmed && !trimmed.startsWith("#")) {
      const cleanText = trimmed.replace(/^[-*•]\s*/, "").replace(/\*\*/g, "");
      if (cleanText.length > 10 && cleanText.length < 150) {
        currentPhase.description = cleanText;
      }
    }
  }
  if (currentPhase) phases.push(currentPhase);

  return phases.slice(0, 5);
}

function extractCaseStudies(
  content: string,
): { title: string; items: string[] }[] {
  const studies: { title: string; items: string[] }[] = [];
  const sections = content.split(
    /(?=(?:###?\s*)?(?:Case Study|Client|Example)\s*\d?[:\s])/i,
  );

  for (const section of sections) {
    if (section.trim().length < 50) continue;

    const titleMatch = section.match(
      /^(?:###?\s*)?(?:Case Study|Client|Example)\s*\d?[:\s]*(.+?)(?:\n|$)/i,
    );
    const title = titleMatch
      ? titleMatch[1].replace(/\*\*/g, "").trim()
      : "Success Story";
    const items = extractItems(section, 4);

    if (items.length > 0) {
      studies.push({ title, items });
    }
  }

  return studies.slice(0, 2);
}

function transformToSlides(
  data: ProposalData,
  companyName: string,
): SlideContent[] {
  const slides: SlideContent[] = [];
  const sections = data.sections;

  // 1. Hero slide
  slides.push({
    type: "hero",
    title: data.title,
    subtitle: data.client_name,
  });

  // 2. Executive Summary
  const execSection = getSectionByType(sections, "executive_summary");
  if (execSection) {
    const items = extractItems(execSection.content, 4);
    slides.push({
      type: "executive",
      title: "Executive Summary",
      subtitle: "Strategic Partnership Proposal",
      items:
        items.length > 0
          ? items
          : [
              "Comprehensive solution designed for your specific needs",
              "Proven methodology with measurable outcomes",
              "Expert team with relevant industry experience",
            ],
    });
  }

  // 3. Understanding of Client Needs
  const understandingSection = getSectionByType(sections, "understanding");
  if (understandingSection) {
    const items = extractItems(understandingSection.content, 5);
    slides.push({
      type: "understanding",
      title: "Understanding Your Needs",
      subtitle: understandingSection.title,
      items:
        items.length > 0
          ? items
          : [
              "Deep analysis of your current challenges",
              "Clear alignment with your strategic objectives",
            ],
    });
  }

  // 4. Challenge slide - derived from understanding or pain points
  const challengeItems = understandingSection
    ? extractItems(understandingSection.content, 4).filter(
        (item) =>
          item.toLowerCase().includes("challenge") ||
          item.toLowerCase().includes("issue") ||
          item.toLowerCase().includes("need") ||
          item.toLowerCase().includes("require"),
      )
    : [];

  if (challengeItems.length > 0 || understandingSection) {
    slides.push({
      type: "challenge",
      title: "The Challenge",
      subtitle: "Key Issues to Address",
      items:
        challengeItems.length > 0
          ? challengeItems
          : extractItems(understandingSection?.content || "", 4),
    });
  }

  // 5. Solution Overview
  const approachSection = getSectionByType(sections, "approach");
  if (approachSection) {
    const items = extractItems(approachSection.content, 4);
    slides.push({
      type: "solution",
      title: "Our Solution",
      subtitle: approachSection.title,
      items:
        items.length > 0
          ? items
          : [
              "Tailored approach to meet your objectives",
              "Industry-proven methodologies",
              "End-to-end delivery capability",
            ],
    });
  }

  // 6. Approach Details
  if (approachSection) {
    const phases = extractPhases(approachSection.content);
    const items = extractItems(approachSection.content, 5);
    slides.push({
      type: "approach",
      title: "Our Approach",
      subtitle: "Delivery Framework",
      items:
        items.length > 0
          ? items
          : [
              "Discovery and assessment",
              "Solution design",
              "Implementation",
              "Testing and validation",
              "Deployment and support",
            ],
      phases: phases.length > 0 ? phases : undefined,
    });
  }

  // 7. Methodology
  const methodologySection = getSectionByType(sections, "methodology");
  if (methodologySection) {
    const items = extractItems(methodologySection.content, 5);
    slides.push({
      type: "methodology",
      title: "Methodology",
      subtitle: "Proven Framework",
      items:
        items.length > 0
          ? items
          : [
              "Industry best practices",
              "Agile delivery model",
              "Continuous improvement",
            ],
    });
  }

  // 8. Team & Qualifications
  const teamSection = getSectionByType(sections, "team");
  if (teamSection) {
    const items = extractItems(teamSection.content, 5);
    slides.push({
      type: "team",
      title: "Our Team",
      subtitle: "Expert Professionals",
      items:
        items.length > 0
          ? items
          : [
              "Experienced project leadership",
              "Technical specialists",
              "Industry domain experts",
            ],
    });
  }

  // 9-10. Case Studies (up to 2 slides)
  const caseStudiesSection = getSectionByType(sections, "case_studies");
  if (caseStudiesSection) {
    const studies = extractCaseStudies(caseStudiesSection.content);
    const metrics = extractMetrics(caseStudiesSection.content);

    if (studies.length > 0) {
      slides.push({
        type: "case_study",
        title: "Proven Success",
        subtitle: studies[0].title,
        items: studies[0].items,
        caseStudyNumber: 1,
        metrics: metrics.slice(0, 3),
      });

      if (studies.length > 1) {
        slides.push({
          type: "case_study",
          title: "Client Results",
          subtitle: studies[1].title,
          items: studies[1].items,
          caseStudyNumber: 2,
          metrics: metrics.slice(3, 6),
        });
      }
    } else {
      // Fallback: single case study slide with all content
      const items = extractItems(caseStudiesSection.content, 5);
      slides.push({
        type: "case_study",
        title: "Relevant Experience",
        subtitle: "Proven Track Record",
        items:
          items.length > 0
            ? items
            : ["Similar engagements with measurable outcomes"],
        caseStudyNumber: 1,
        metrics:
          metrics.length > 0
            ? metrics
            : [
                { value: "95%", label: "Client Satisfaction" },
                { value: "40%", label: "Cost Reduction" },
              ],
      });
    }
  }

  // 11. Timeline & Milestones
  const timelineSection = getSectionByType(sections, "timeline");
  if (timelineSection) {
    const items = extractItems(timelineSection.content, 6);
    const phases = extractPhases(timelineSection.content);
    slides.push({
      type: "timeline",
      title: "Timeline & Milestones",
      subtitle: "Project Roadmap",
      items:
        items.length > 0
          ? items
          : [
              "Phase 1: Discovery",
              "Phase 2: Design",
              "Phase 3: Build",
              "Phase 4: Deploy",
            ],
      phases: phases.length > 0 ? phases : undefined,
    });
  }

  // 12. Investment / Commercial Framework
  const pricingSection = getSectionByType(sections, "pricing");
  if (pricingSection) {
    const items = extractItems(pricingSection.content, 4);
    slides.push({
      type: "investment",
      title: "Investment Overview",
      subtitle: "Commercial Framework",
      items:
        items.length > 0
          ? items
          : [
              "Transparent pricing model",
              "Value-based engagement",
              "Flexible terms",
            ],
    });
  }

  // 13. Risk Mitigation
  const riskSection = getSectionByType(sections, "risk_mitigation");
  if (riskSection) {
    const items = extractItems(riskSection.content, 5);
    slides.push({
      type: "risk",
      title: "Risk Management",
      subtitle: "Mitigation Strategies",
      items:
        items.length > 0
          ? items
          : [
              "Proactive risk identification",
              "Comprehensive mitigation plans",
              "Continuous monitoring",
            ],
    });
  }

  // 14. Why Us / Differentiators
  const whyUsSection = getSectionByType(sections, "why_us");
  if (whyUsSection) {
    const items = extractItems(whyUsSection.content, 5);
    slides.push({
      type: "differentiator",
      title: `Why ${companyName}`,
      subtitle: `The ${companyName} Advantage`,
      items:
        items.length > 0
          ? items
          : [
              "Industry leadership",
              "Proven expertise",
              "Client-centric approach",
            ],
    });
  }

  // 15. Next Steps / Closing
  slides.push({
    type: "closing",
    title: "Next Steps",
    subtitle: "Ready to Transform?",
    items: [
      "Schedule discovery workshop",
      "Define success metrics together",
      "Finalize engagement terms",
      "Mobilize expert delivery team",
    ],
  });

  return slides;
}

// escapeHtml imported from @/lib/email/escape-html

// Additional SVG icons for new slide types
const ICONS_EXTENDED = {
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  dollar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  compass: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`,
  briefcase: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  star: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
};

function renderSlide(
  slide: SlideContent,
  index: number,
  companyName: string = "IntentWin",
): string {
  switch (slide.type) {
    case "hero":
      return `
        <section class="slide slide--hero" data-index="${index}">
          <div class="hero__bg">
            <div class="hero__gradient"></div>
            <div class="hero__noise"></div>
            <div class="hero__orb hero__orb--1"></div>
            <div class="hero__orb hero__orb--2"></div>
            <div class="hero__grid"></div>
          </div>
          <div class="hero__content">
            <div class="hero__badge">
              <span class="hero__badge-dot"></span>
              <span>${escapeHtml(companyName)}</span>
            </div>
            <h1 class="hero__title">${escapeHtml(slide.title)}</h1>
            <div class="hero__divider"></div>
            <p class="hero__client">Prepared for <strong>${escapeHtml(slide.subtitle || "")}</strong></p>
          </div>
          <div class="hero__footer">
            <span>Confidential</span>
            <span class="hero__footer-dot"></span>
            <span>${new Date().getFullYear()}</span>
          </div>
        </section>`;

    case "executive":
      return `
        <section class="slide slide--executive" data-index="${index}">
          <div class="executive__bg">
            <div class="executive__gradient"></div>
            <div class="executive__accent"></div>
          </div>
          <div class="executive__content">
            <div class="executive__header">
              <div class="executive__icon">${ICONS_EXTENDED.briefcase}</div>
              <div>
                <span class="executive__label">Overview</span>
                <h2 class="executive__title">${escapeHtml(slide.title)}</h2>
              </div>
            </div>
            <p class="executive__subtitle">${escapeHtml(slide.subtitle || "")}</p>
            <div class="executive__points">
              ${(slide.items || [])
                .map(
                  (item, i) => `
                <div class="executive__point" style="--delay: ${i * 0.1}s">
                  <div class="executive__point-marker">${String(i + 1).padStart(2, "0")}</div>
                  <p class="executive__point-text">${escapeHtml(item)}</p>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
        </section>`;

    case "understanding":
      return `
        <section class="slide slide--understanding" data-index="${index}">
          <div class="understanding__left">
            <div class="understanding__icon">${ICONS_EXTENDED.eye}</div>
            <span class="understanding__label">Client Focus</span>
            <h2 class="understanding__title">${escapeHtml(slide.title)}</h2>
            <p class="understanding__subtitle">${escapeHtml(slide.subtitle || "")}</p>
          </div>
          <div class="understanding__right">
            <div class="understanding__cards">
              ${(slide.items || [])
                .map(
                  (item, i) => `
                <div class="understanding__card" style="--delay: ${i * 0.12}s">
                  <div class="understanding__card-icon">${ICONS.check}</div>
                  <p class="understanding__card-text">${escapeHtml(item)}</p>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
        </section>`;

    case "methodology":
      return `
        <section class="slide slide--methodology" data-index="${index}">
          <div class="methodology__header">
            <div class="methodology__icon">${ICONS_EXTENDED.settings}</div>
            <div>
              <span class="methodology__label">Framework</span>
              <h2 class="methodology__title">${escapeHtml(slide.title)}</h2>
            </div>
          </div>
          <p class="methodology__subtitle">${escapeHtml(slide.subtitle || "")}</p>
          <div class="methodology__grid">
            ${(slide.items || [])
              .map(
                (item, i) => `
              <div class="methodology__item" style="--delay: ${i * 0.1}s">
                <div class="methodology__item-number">${i + 1}</div>
                <p class="methodology__item-text">${escapeHtml(item)}</p>
              </div>
            `,
              )
              .join("")}
          </div>
        </section>`;

    case "team":
      return `
        <section class="slide slide--team" data-index="${index}">
          <div class="team__bg">
            <div class="team__gradient"></div>
          </div>
          <div class="team__content">
            <div class="team__header">
              <div class="team__icon">${ICONS_EXTENDED.users}</div>
              <div>
                <span class="team__label">Your Team</span>
                <h2 class="team__title">${escapeHtml(slide.title)}</h2>
              </div>
            </div>
            <p class="team__subtitle">${escapeHtml(slide.subtitle || "")}</p>
            <div class="team__grid">
              ${(slide.items || [])
                .map(
                  (item, i) => `
                <div class="team__card" style="--delay: ${i * 0.1}s">
                  <div class="team__card-avatar">${ICONS_EXTENDED.users}</div>
                  <p class="team__card-text">${escapeHtml(item)}</p>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
        </section>`;

    case "case_study":
      return `
        <section class="slide slide--case-study" data-index="${index}">
          <div class="case-study__left">
            <div class="case-study__badge">Case Study ${slide.caseStudyNumber || 1}</div>
            <div class="case-study__icon">${ICONS_EXTENDED.star}</div>
            <h2 class="case-study__title">${escapeHtml(slide.title)}</h2>
            <p class="case-study__subtitle">${escapeHtml(slide.subtitle || "")}</p>
            ${
              slide.metrics && slide.metrics.length > 0
                ? `
              <div class="case-study__metrics">
                ${slide.metrics
                  .map(
                    (m, i) => `
                  <div class="case-study__metric" style="--delay: ${0.3 + i * 0.1}s">
                    <span class="case-study__metric-value">${escapeHtml(m.value)}</span>
                    <span class="case-study__metric-label">${escapeHtml(m.label)}</span>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            `
                : ""
            }
          </div>
          <div class="case-study__right">
            <div class="case-study__outcomes">
              ${(slide.items || [])
                .map(
                  (item, i) => `
                <div class="case-study__outcome" style="--delay: ${i * 0.12}s">
                  <div class="case-study__outcome-icon">${ICONS.arrow}</div>
                  <p class="case-study__outcome-text">${escapeHtml(item)}</p>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
        </section>`;

    case "timeline":
      return `
        <section class="slide slide--timeline" data-index="${index}">
          <div class="timeline-slide__header">
            <div class="timeline-slide__icon">${ICONS_EXTENDED.calendar}</div>
            <div>
              <span class="timeline-slide__label">Roadmap</span>
              <h2 class="timeline-slide__title">${escapeHtml(slide.title)}</h2>
            </div>
          </div>
          <p class="timeline-slide__subtitle">${escapeHtml(slide.subtitle || "")}</p>
          <div class="timeline-slide__track">
            <div class="timeline-slide__line"></div>
            ${(slide.items || [])
              .map(
                (item, i) => `
              <div class="timeline-slide__milestone" style="--delay: ${i * 0.15}s">
                <div class="timeline-slide__dot">${i + 1}</div>
                <p class="timeline-slide__milestone-text">${escapeHtml(item)}</p>
              </div>
            `,
              )
              .join("")}
          </div>
        </section>`;

    case "investment":
      return `
        <section class="slide slide--investment" data-index="${index}">
          <div class="investment__bg">
            <div class="investment__gradient"></div>
            <div class="investment__pattern"></div>
          </div>
          <div class="investment__content">
            <div class="investment__header">
              <div class="investment__icon">${ICONS_EXTENDED.dollar}</div>
              <div>
                <span class="investment__label">Commercial</span>
                <h2 class="investment__title">${escapeHtml(slide.title)}</h2>
              </div>
            </div>
            <p class="investment__subtitle">${escapeHtml(slide.subtitle || "")}</p>
            <div class="investment__points">
              ${(slide.items || [])
                .map(
                  (item, i) => `
                <div class="investment__point" style="--delay: ${i * 0.1}s">
                  <div class="investment__point-icon">${ICONS.check}</div>
                  <p class="investment__point-text">${escapeHtml(item)}</p>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
        </section>`;

    case "risk":
      return `
        <section class="slide slide--risk" data-index="${index}">
          <div class="risk__header">
            <div class="risk__icon">${ICONS_EXTENDED.shield}</div>
            <div>
              <span class="risk__label">Governance</span>
              <h2 class="risk__title">${escapeHtml(slide.title)}</h2>
            </div>
          </div>
          <p class="risk__subtitle">${escapeHtml(slide.subtitle || "")}</p>
          <div class="risk__grid">
            ${(slide.items || [])
              .map(
                (item, i) => `
              <div class="risk__card" style="--delay: ${i * 0.1}s">
                <div class="risk__card-number">${String(i + 1).padStart(2, "0")}</div>
                <p class="risk__card-text">${escapeHtml(item)}</p>
              </div>
            `,
              )
              .join("")}
          </div>
        </section>`;

    case "challenge":
      return `
        <section class="slide slide--split" data-index="${index}">
          <div class="split__left">
            <div class="split__icon split__icon--warning">
              ${ICONS.lightning}
            </div>
            <span class="split__label">The Challenge</span>
            <h2 class="split__title">${escapeHtml(slide.subtitle || slide.title)}</h2>
          </div>
          <div class="split__right">
            <div class="cards">
              ${(slide.items || [])
                .map(
                  (item, i) => `
                <div class="card card--challenge" style="--delay: ${i * 0.1}s">
                  <div class="card__number">${String(i + 1).padStart(2, "0")}</div>
                  <p class="card__text">${escapeHtml(item)}</p>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
        </section>`;

    case "solution":
      return `
        <section class="slide slide--split slide--split-reverse" data-index="${index}">
          <div class="split__right split__right--dark">
            <div class="cards cards--solution">
              ${(slide.items || [])
                .map(
                  (item, i) => `
                <div class="card card--solution" style="--delay: ${i * 0.1}s">
                  <div class="card__icon">${ICONS.check}</div>
                  <p class="card__text">${escapeHtml(item)}</p>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
          <div class="split__left split__left--accent">
            <div class="split__icon split__icon--glow">
              ${ICONS.lightbulb}
            </div>
            <span class="split__label split__label--light">Our Solution</span>
            <h2 class="split__title split__title--light">${escapeHtml(slide.subtitle || slide.title)}</h2>
          </div>
        </section>`;

    case "approach":
      return `
        <section class="slide slide--approach" data-index="${index}">
          <div class="approach__header">
            <div class="approach__icon">${ICONS.target}</div>
            <div>
              <span class="approach__label">Our Approach</span>
              <h2 class="approach__title">${escapeHtml(slide.subtitle || slide.title)}</h2>
            </div>
          </div>
          <div class="approach__timeline">
            ${(slide.items || [])
              .map(
                (item, i) => `
              <div class="timeline__item" style="--delay: ${i * 0.15}s">
                <div class="timeline__marker">
                  <span class="timeline__number">${i + 1}</span>
                  ${i < (slide.items?.length || 0) - 1 ? '<div class="timeline__line"></div>' : ""}
                </div>
                <div class="timeline__content">
                  <p class="timeline__text">${escapeHtml(item)}</p>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
        </section>`;

    case "metrics":
      return `
        <section class="slide slide--metrics" data-index="${index}">
          <div class="metrics__bg">
            <div class="metrics__gradient"></div>
            <div class="metrics__noise"></div>
          </div>
          <div class="metrics__content">
            <div class="metrics__header">
              <div class="metrics__icon">${ICONS.chart}</div>
              <span class="metrics__label">${escapeHtml(slide.title)}</span>
            </div>
            <div class="metrics__grid">
              ${(slide.metrics || [])
                .map(
                  (m, i) => `
                <div class="metric" style="--delay: ${i * 0.1}s">
                  <span class="metric__value">${escapeHtml(m.value)}</span>
                  <span class="metric__label">${escapeHtml(m.label)}</span>
                </div>
              `,
                )
                .join("")}
            </div>
            ${
              slide.items && slide.items.length > 0
                ? `
              <div class="metrics__details">
                ${slide.items
                  .map(
                    (item, i) => `
                  <div class="metrics__detail" style="--delay: ${0.4 + i * 0.1}s">
                    <span class="metrics__detail-icon">${ICONS.arrow}</span>
                    <span>${escapeHtml(item)}</span>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            `
                : ""
            }
          </div>
        </section>`;

    case "differentiator":
      return `
        <section class="slide slide--diff" data-index="${index}">
          <div class="diff__header">
            <div class="diff__icon">${ICONS.trophy}</div>
            <div>
              <span class="diff__label">Why ${escapeHtml(companyName)}</span>
              <h2 class="diff__title">${escapeHtml(slide.subtitle || `The ${companyName} Advantage`)}</h2>
            </div>
          </div>
          <div class="diff__grid">
            ${(slide.items || [])
              .map(
                (item, i) => `
              <div class="diff__card" style="--delay: ${i * 0.1}s">
                <div class="diff__card-icon">${ICONS.check}</div>
                <p class="diff__card-text">${escapeHtml(item)}</p>
              </div>
            `,
              )
              .join("")}
          </div>
        </section>`;

    case "closing":
      return `
        <section class="slide slide--closing" data-index="${index}">
          <div class="closing__bg">
            <div class="closing__gradient"></div>
            <div class="closing__noise"></div>
            <div class="closing__orb"></div>
          </div>
          <div class="closing__content">
            <div class="closing__icon">${ICONS.rocket}</div>
            <h2 class="closing__title">${escapeHtml(slide.title)}</h2>
            <p class="closing__subtitle">${escapeHtml(slide.subtitle || "")}</p>
            <div class="closing__steps">
              ${(slide.items || [])
                .map(
                  (item, i) => `
                <div class="closing__step" style="--delay: ${i * 0.1}s">
                  <span class="closing__step-num">${String(i + 1).padStart(2, "0")}</span>
                  <span class="closing__step-text">${escapeHtml(item)}</span>
                </div>
              `,
                )
                .join("")}
            </div>
            <div class="closing__cta">
              <span>Let's begin the conversation</span>
              <span class="closing__cta-arrow">${ICONS.arrow}</span>
            </div>
          </div>
        </section>`;

    default:
      return "";
  }
}

export async function generateSlides(data: ProposalData): Promise<string> {
  const companyName = data.company_name || "IntentWin";
  const slides = transformToSlides(data, companyName);
  const totalSlides = slides.length;
  const slidesHtml = slides
    .map((slide, idx) => renderSlide(slide, idx, companyName))
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(data.title)} | ${escapeHtml(companyName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Sora:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root {
  --navy: ${COLORS.navy};
  --navy-light: ${COLORS.navyLight};
  --blue: ${COLORS.blue};
  --cyan: ${COLORS.cyan};
  --cyan-glow: ${COLORS.cyanGlow};
  --white: ${COLORS.white};
  --off-white: ${COLORS.offWhite};
  --gray: ${COLORS.gray};
  --gray-light: ${COLORS.grayLight};
  --gray-dark: ${COLORS.grayDark};
}

* { margin: 0; padding: 0; box-sizing: border-box; }

html, body {
  width: 100%; height: 100%;
  overflow: hidden;
  font-family: 'Sora', sans-serif;
  background: var(--navy);
  color: var(--white);
  -webkit-font-smoothing: antialiased;
}

/* ═══════════════════════════════════════════════════════════════
   SLIDES CONTAINER
   ═══════════════════════════════════════════════════════════════ */
.slides { width: 100%; height: 100%; position: relative; }

.slide {
  position: absolute;
  inset: 0;
  display: flex;
  opacity: 0;
  visibility: hidden;
  transform: scale(0.98) translateY(20px);
  transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

.slide.active {
  opacity: 1;
  visibility: visible;
  transform: scale(1) translateY(0);
}

/* ═══════════════════════════════════════════════════════════════
   HERO SLIDE
   ═══════════════════════════════════════════════════════════════ */
.slide--hero {
  align-items: center;
  justify-content: center;
  text-align: center;
}

.hero__bg {
  position: absolute;
  inset: 0;
}

.hero__gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 100% 80% at 50% 100%, var(--cyan-glow), transparent 60%),
    radial-gradient(ellipse 80% 50% at 80% 20%, rgba(0, 112, 173, 0.2), transparent),
    linear-gradient(180deg, var(--navy) 0%, #0D1F35 100%);
}

.hero__noise {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity: 0.03;
  mix-blend-mode: overlay;
}

.hero__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  animation: float 8s ease-in-out infinite;
}

.hero__orb--1 {
  width: 600px; height: 600px;
  top: -200px; right: -100px;
  background: radial-gradient(circle, var(--cyan-glow), transparent 70%);
}

.hero__orb--2 {
  width: 400px; height: 400px;
  bottom: -100px; left: -50px;
  background: radial-gradient(circle, rgba(0, 112, 173, 0.3), transparent 70%);
  animation-delay: -4s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(20px, -30px) scale(1.05); }
}

.hero__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black, transparent);
}

.hero__content {
  position: relative;
  z-index: 2;
  max-width: 1000px;
  padding: 0 40px;
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 100px;
  padding: 10px 24px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin-bottom: 48px;
  backdrop-filter: blur(12px);
}

.hero__badge-dot {
  width: 8px; height: 8px;
  background: var(--cyan);
  border-radius: 50%;
  box-shadow: 0 0 20px var(--cyan), 0 0 40px var(--cyan);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.2); }
}

.hero__title {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(3rem, 7vw, 5.5rem);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.03em;
  margin-bottom: 32px;
  background: linear-gradient(135deg, var(--white) 0%, var(--gray-light) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero__divider {
  width: 80px;
  height: 4px;
  background: linear-gradient(90deg, var(--cyan), var(--blue));
  border-radius: 2px;
  margin: 0 auto 32px;
}

.hero__client {
  font-size: 1.25rem;
  font-weight: 300;
  color: var(--gray-light);
}

.hero__client strong {
  color: var(--white);
  font-weight: 600;
}

.hero__footer {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 0.75rem;
  color: var(--gray);
  text-transform: uppercase;
  letter-spacing: 0.15em;
}

.hero__footer-dot {
  width: 4px; height: 4px;
  background: var(--gray);
  border-radius: 50%;
}

/* ═══════════════════════════════════════════════════════════════
   EXECUTIVE SLIDE
   ═══════════════════════════════════════════════════════════════ */
.slide--executive {
  flex-direction: column;
  position: relative;
  padding: 80px 100px;
}

.executive__bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--navy) 0%, #0D1F35 100%);
}

.executive__gradient {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 60% 40% at 80% 20%, rgba(18, 171, 219, 0.15), transparent);
}

.executive__accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  background: linear-gradient(180deg, var(--cyan), var(--blue));
}

.executive__content {
  position: relative;
  z-index: 2;
  max-width: 1000px;
}

.executive__header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 16px;
}

.executive__icon {
  width: 56px; height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px;
  color: var(--cyan);
}

.executive__icon svg { width: 28px; height: 28px; }

.executive__label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--cyan);
  margin-bottom: 4px;
  display: block;
}

.executive__title {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.executive__subtitle {
  font-size: 1.1rem;
  color: var(--gray-light);
  margin-bottom: 48px;
  max-width: 700px;
}

.executive__points {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.executive__point {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 24px 28px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  opacity: 0;
  transform: translateX(-20px);
  animation: slideIn 0.5s ease forwards;
  animation-delay: var(--delay, 0s);
}

.slide.active .executive__point {
  opacity: 1;
  transform: translateX(0);
}

.executive__point-marker {
  font-family: 'Outfit', sans-serif;
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--cyan);
  background: rgba(18, 171, 219, 0.15);
  padding: 8px 12px;
  border-radius: 8px;
  flex-shrink: 0;
}

.executive__point-text {
  font-size: 1.05rem;
  line-height: 1.6;
  color: var(--gray-light);
}

/* ═══════════════════════════════════════════════════════════════
   UNDERSTANDING SLIDE
   ═══════════════════════════════════════════════════════════════ */
.slide--understanding {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.understanding__left {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 80px;
  background: linear-gradient(135deg, var(--blue) 0%, var(--navy-light) 100%);
  color: var(--white);
}

.understanding__icon {
  width: 64px; height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.1);
  border-radius: 16px;
  color: var(--cyan);
  margin-bottom: 32px;
}

.understanding__icon svg { width: 32px; height: 32px; }

.understanding__label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--cyan);
  margin-bottom: 12px;
}

.understanding__title {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 16px;
}

.understanding__subtitle {
  font-size: 1rem;
  color: rgba(255,255,255,0.7);
}

.understanding__right {
  display: flex;
  align-items: center;
  padding: 60px;
  background: var(--navy);
}

.understanding__cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.understanding__card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px 24px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeUp 0.5s ease forwards;
  animation-delay: var(--delay, 0s);
}

.slide.active .understanding__card {
  opacity: 1;
  transform: translateY(0);
}

.understanding__card-icon {
  width: 28px; height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--cyan);
  border-radius: 50%;
  flex-shrink: 0;
}

.understanding__card-icon svg {
  width: 14px; height: 14px;
  color: var(--navy);
}

.understanding__card-text {
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--gray-light);
}

/* ═══════════════════════════════════════════════════════════════
   METHODOLOGY SLIDE
   ═══════════════════════════════════════════════════════════════ */
.slide--methodology {
  flex-direction: column;
  padding: 80px 100px;
  background: var(--white);
  color: var(--navy);
}

.methodology__header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 8px;
}

.methodology__icon {
  width: 56px; height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--blue), var(--cyan));
  color: var(--white);
  border-radius: 14px;
}

.methodology__icon svg { width: 28px; height: 28px; }

.methodology__label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--blue);
  margin-bottom: 4px;
  display: block;
}

.methodology__title {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.methodology__subtitle {
  font-size: 1.1rem;
  color: var(--gray);
  margin-bottom: 48px;
}

.methodology__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.methodology__item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 24px;
  background: var(--off-white);
  border-radius: 14px;
  border: 1px solid rgba(0,0,0,0.04);
  opacity: 0;
  transform: translateY(20px);
  animation: fadeUp 0.5s ease forwards;
  animation-delay: var(--delay, 0s);
}

.slide.active .methodology__item {
  opacity: 1;
  transform: translateY(0);
}

.methodology__item-number {
  width: 36px; height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--blue), var(--cyan));
  color: var(--white);
  font-family: 'Outfit', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  border-radius: 50%;
  flex-shrink: 0;
}

.methodology__item-text {
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--gray-dark);
}

/* ═══════════════════════════════════════════════════════════════
   TEAM SLIDE
   ═══════════════════════════════════════════════════════════════ */
.slide--team {
  flex-direction: column;
  position: relative;
}

.team__bg {
  position: absolute;
  inset: 0;
}

.team__gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 50% 50% at 20% 80%, rgba(18, 171, 219, 0.1), transparent),
    linear-gradient(160deg, var(--navy) 0%, #0D1F35 100%);
}

.team__content {
  position: relative;
  z-index: 2;
  padding: 80px 100px;
}

.team__header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 8px;
}

.team__icon {
  width: 56px; height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px;
  color: var(--cyan);
}

.team__icon svg { width: 28px; height: 28px; }

.team__label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--cyan);
  margin-bottom: 4px;
  display: block;
}

.team__title {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.team__subtitle {
  font-size: 1.1rem;
  color: var(--gray-light);
  margin-bottom: 48px;
}

.team__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.team__card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 24px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeUp 0.5s ease forwards;
  animation-delay: var(--delay, 0s);
}

.slide.active .team__card {
  opacity: 1;
  transform: translateY(0);
}

.team__card-avatar {
  width: 44px; height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--blue), var(--cyan));
  color: var(--white);
  border-radius: 12px;
  flex-shrink: 0;
}

.team__card-avatar svg { width: 22px; height: 22px; }

.team__card-text {
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--gray-light);
}

/* ═══════════════════════════════════════════════════════════════
   CASE STUDY SLIDE
   ═══════════════════════════════════════════════════════════════ */
.slide--case-study {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.case-study__left {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 80px;
  background: var(--off-white);
  color: var(--navy);
}

.case-study__badge {
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--white);
  background: linear-gradient(135deg, var(--blue), var(--cyan));
  padding: 6px 14px;
  border-radius: 100px;
  margin-bottom: 24px;
  align-self: flex-start;
}

.case-study__icon {
  width: 56px; height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--navy);
  color: #FFD700;
  border-radius: 14px;
  margin-bottom: 24px;
}

.case-study__icon svg { width: 28px; height: 28px; }

.case-study__title {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 8px;
}

.case-study__subtitle {
  font-size: 1.1rem;
  color: var(--gray);
  margin-bottom: 32px;
}

.case-study__metrics {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.case-study__metric {
  opacity: 0;
  transform: scale(0.9);
  animation: scaleIn 0.4s ease forwards;
  animation-delay: var(--delay, 0s);
}

.slide.active .case-study__metric {
  opacity: 1;
  transform: scale(1);
}

.case-study__metric-value {
  display: block;
  font-family: 'Outfit', sans-serif;
  font-size: 2rem;
  font-weight: 800;
  color: var(--blue);
  letter-spacing: -0.02em;
}

.case-study__metric-label {
  font-size: 0.75rem;
  color: var(--gray);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.case-study__right {
  display: flex;
  align-items: center;
  padding: 60px;
  background: var(--navy);
}

.case-study__outcomes {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.case-study__outcome {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px 24px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  opacity: 0;
  transform: translateX(20px);
  animation: slideIn 0.5s ease forwards;
  animation-delay: var(--delay, 0s);
}

.slide.active .case-study__outcome {
  opacity: 1;
  transform: translateX(0);
}

.case-study__outcome-icon {
  width: 24px; height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--cyan);
  flex-shrink: 0;
}

.case-study__outcome-icon svg { width: 16px; height: 16px; }

.case-study__outcome-text {
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--gray-light);
}

/* ═══════════════════════════════════════════════════════════════
   TIMELINE SLIDE
   ═══════════════════════════════════════════════════════════════ */
.slide--timeline {
  flex-direction: column;
  padding: 80px 100px;
  background: var(--white);
  color: var(--navy);
}

.timeline-slide__header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 8px;
}

.timeline-slide__icon {
  width: 56px; height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--navy);
  color: var(--cyan);
  border-radius: 14px;
}

.timeline-slide__icon svg { width: 28px; height: 28px; }

.timeline-slide__label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--blue);
  margin-bottom: 4px;
  display: block;
}

.timeline-slide__title {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.timeline-slide__subtitle {
  font-size: 1.1rem;
  color: var(--gray);
  margin-bottom: 48px;
}

.timeline-slide__track {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-top: 40px;
}

.timeline-slide__line {
  position: absolute;
  top: 58px;
  left: 30px;
  right: 30px;
  height: 3px;
  background: linear-gradient(90deg, var(--cyan), var(--blue));
  border-radius: 2px;
}

.timeline-slide__milestone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  flex: 1;
  max-width: 160px;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeUp 0.5s ease forwards;
  animation-delay: var(--delay, 0s);
}

.slide.active .timeline-slide__milestone {
  opacity: 1;
  transform: translateY(0);
}

.timeline-slide__dot {
  width: 40px; height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--blue), var(--cyan));
  color: var(--white);
  font-family: 'Outfit', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  border-radius: 50%;
  position: relative;
  z-index: 2;
  box-shadow: 0 4px 20px rgba(18, 171, 219, 0.3);
}

.timeline-slide__milestone-text {
  font-size: 0.85rem;
  line-height: 1.4;
  color: var(--gray-dark);
  text-align: center;
}

/* ═══════════════════════════════════════════════════════════════
   INVESTMENT SLIDE
   ═══════════════════════════════════════════════════════════════ */
.slide--investment {
  flex-direction: column;
  position: relative;
}

.investment__bg {
  position: absolute;
  inset: 0;
}

.investment__gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 60% at 70% 30%, rgba(18, 171, 219, 0.12), transparent),
    linear-gradient(160deg, var(--navy) 0%, #0D1F35 100%);
}

.investment__pattern {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(ellipse 70% 50% at 50% 50%, black, transparent);
}

.investment__content {
  position: relative;
  z-index: 2;
  padding: 80px 100px;
}

.investment__header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 8px;
}

.investment__icon {
  width: 56px; height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #10B981, #059669);
  color: var(--white);
  border-radius: 14px;
}

.investment__icon svg { width: 28px; height: 28px; }

.investment__label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--cyan);
  margin-bottom: 4px;
  display: block;
}

.investment__title {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.investment__subtitle {
  font-size: 1.1rem;
  color: var(--gray-light);
  margin-bottom: 48px;
}

.investment__points {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
  max-width: 900px;
}

.investment__point {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 24px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeUp 0.5s ease forwards;
  animation-delay: var(--delay, 0s);
}

.slide.active .investment__point {
  opacity: 1;
  transform: translateY(0);
}

.investment__point-icon {
  width: 32px; height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #10B981, #059669);
  color: var(--white);
  border-radius: 50%;
  flex-shrink: 0;
}

.investment__point-icon svg { width: 16px; height: 16px; }

.investment__point-text {
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--gray-light);
}

/* ═══════════════════════════════════════════════════════════════
   RISK SLIDE
   ═══════════════════════════════════════════════════════════════ */
.slide--risk {
  flex-direction: column;
  padding: 80px 100px;
  background: var(--off-white);
  color: var(--navy);
}

.risk__header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 8px;
}

.risk__icon {
  width: 56px; height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #8B5CF6, #7C3AED);
  color: var(--white);
  border-radius: 14px;
}

.risk__icon svg { width: 28px; height: 28px; }

.risk__label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: #7C3AED;
  margin-bottom: 4px;
  display: block;
}

.risk__title {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.risk__subtitle {
  font-size: 1.1rem;
  color: var(--gray);
  margin-bottom: 48px;
}

.risk__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  max-width: 1000px;
}

.risk__card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 24px;
  background: var(--white);
  border-radius: 14px;
  border: 1px solid rgba(0,0,0,0.06);
  box-shadow: 0 4px 20px rgba(0,0,0,0.04);
  opacity: 0;
  transform: translateY(20px);
  animation: fadeUp 0.5s ease forwards;
  animation-delay: var(--delay, 0s);
}

.slide.active .risk__card {
  opacity: 1;
  transform: translateY(0);
}

.risk__card-number {
  font-family: 'Outfit', sans-serif;
  font-size: 0.7rem;
  font-weight: 800;
  color: #7C3AED;
  background: rgba(124, 58, 237, 0.1);
  padding: 8px 12px;
  border-radius: 8px;
  flex-shrink: 0;
}

.risk__card-text {
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--gray-dark);
}

/* ═══════════════════════════════════════════════════════════════
   SPLIT SLIDES
   ═══════════════════════════════════════════════════════════════ */
.slide--split {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.slide--split-reverse {
  direction: rtl;
}

.slide--split-reverse > * {
  direction: ltr;
}

.split__left, .split__right {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 80px;
}

.split__left {
  background: var(--off-white);
  color: var(--navy);
}

.split__left--accent {
  background: linear-gradient(135deg, var(--blue) 0%, var(--navy-light) 100%);
  color: var(--white);
}

.split__right {
  background: var(--white);
  color: var(--navy);
}

.split__right--dark {
  background: var(--navy);
  color: var(--white);
}

.split__icon {
  width: 64px; height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;
  border-radius: 16px;
  background: var(--navy);
  color: var(--cyan);
}

.split__icon svg {
  width: 32px; height: 32px;
}

.split__icon--warning {
  background: linear-gradient(135deg, #FF6B6B, #EE5A24);
  color: var(--white);
}

.split__icon--glow {
  background: rgba(255,255,255,0.1);
  color: var(--cyan);
  box-shadow: 0 0 40px var(--cyan-glow);
}

.split__label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--blue);
  margin-bottom: 16px;
}

.split__label--light {
  color: var(--cyan);
}

.split__title {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.split__title--light {
  color: var(--white);
}

/* Cards */
.cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card {
  padding: 24px 28px;
  border-radius: 16px;
  opacity: 0;
  transform: translateX(30px);
  animation: slideIn 0.6s ease forwards;
  animation-delay: var(--delay, 0s);
}

.slide.active .card {
  opacity: 1;
  transform: translateX(0);
}

@keyframes slideIn {
  to { opacity: 1; transform: translateX(0); }
}

.card--challenge {
  background: var(--white);
  border: 1px solid rgba(0,0,0,0.06);
  display: flex;
  align-items: flex-start;
  gap: 20px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.04);
}

.card__number {
  font-family: 'Outfit', sans-serif;
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--cyan);
  background: rgba(18, 171, 219, 0.1);
  padding: 6px 10px;
  border-radius: 6px;
  flex-shrink: 0;
}

.card__text {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--gray-dark);
}

.card--solution {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.card__icon {
  width: 28px; height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--cyan);
  border-radius: 50%;
  flex-shrink: 0;
}

.card__icon svg {
  width: 14px; height: 14px;
  color: var(--navy);
}

.card--solution .card__text {
  color: var(--gray-light);
}

/* ═══════════════════════════════════════════════════════════════
   APPROACH SLIDE
   ═══════════════════════════════════════════════════════════════ */
.slide--approach {
  flex-direction: column;
  padding: 80px 100px;
  background: var(--off-white);
  color: var(--navy);
}

.approach__header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 60px;
}

.approach__icon {
  width: 56px; height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--navy);
  color: var(--cyan);
  border-radius: 14px;
}

.approach__icon svg {
  width: 28px; height: 28px;
}

.approach__label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--blue);
  margin-bottom: 4px;
  display: block;
}

.approach__title {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.approach__timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
  max-width: 800px;
}

.timeline__item {
  display: flex;
  gap: 24px;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeUp 0.5s ease forwards;
  animation-delay: var(--delay, 0s);
}

.slide.active .timeline__item {
  opacity: 1;
  transform: translateY(0);
}

@keyframes fadeUp {
  to { opacity: 1; transform: translateY(0); }
}

.timeline__marker {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.timeline__number {
  width: 44px; height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--blue), var(--cyan));
  color: var(--white);
  font-family: 'Outfit', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 50%;
  flex-shrink: 0;
}

.timeline__line {
  width: 2px;
  flex: 1;
  min-height: 40px;
  background: linear-gradient(to bottom, var(--cyan), transparent);
  margin: 8px 0;
}

.timeline__content {
  padding: 8px 0 40px;
}

.timeline__text {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--gray-dark);
}

/* ═══════════════════════════════════════════════════════════════
   METRICS SLIDE
   ═══════════════════════════════════════════════════════════════ */
.slide--metrics {
  align-items: center;
  justify-content: center;
  position: relative;
}

.metrics__bg {
  position: absolute;
  inset: 0;
}

.metrics__gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 80% at 30% 20%, var(--cyan-glow), transparent 50%),
    radial-gradient(ellipse 50% 50% at 70% 80%, rgba(0, 112, 173, 0.2), transparent),
    linear-gradient(160deg, var(--navy) 0%, #0D1F35 100%);
}

.metrics__noise {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity: 0.03;
}

.metrics__content {
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 1100px;
  padding: 0 40px;
}

.metrics__header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 60px;
}

.metrics__icon {
  width: 48px; height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  color: var(--cyan);
}

.metrics__icon svg {
  width: 24px; height: 24px;
}

.metrics__label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--cyan);
}

.metrics__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 32px;
  margin-bottom: 48px;
}

.metric {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 24px;
  padding: 40px 32px;
  opacity: 0;
  transform: scale(0.9);
  animation: scaleIn 0.5s ease forwards;
  animation-delay: var(--delay, 0s);
  backdrop-filter: blur(12px);
}

.slide.active .metric {
  opacity: 1;
  transform: scale(1);
}

@keyframes scaleIn {
  to { opacity: 1; transform: scale(1); }
}

.metric__value {
  display: block;
  font-family: 'Outfit', sans-serif;
  font-size: clamp(3rem, 6vw, 4.5rem);
  font-weight: 900;
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, var(--white) 0%, var(--cyan) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
}

.metric__label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--gray);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.metrics__details {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px 32px;
}

.metrics__detail {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.95rem;
  color: var(--gray-light);
  opacity: 0;
  transform: translateY(10px);
  animation: fadeUp 0.4s ease forwards;
  animation-delay: var(--delay, 0s);
}

.slide.active .metrics__detail {
  opacity: 1;
  transform: translateY(0);
}

.metrics__detail-icon {
  width: 20px; height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--cyan);
}

.metrics__detail-icon svg {
  width: 14px; height: 14px;
}

/* ═══════════════════════════════════════════════════════════════
   DIFFERENTIATOR SLIDE
   ═══════════════════════════════════════════════════════════════ */
.slide--diff {
  flex-direction: column;
  padding: 80px 100px;
  background: var(--white);
  color: var(--navy);
}

.diff__header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 60px;
}

.diff__icon {
  width: 56px; height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: var(--navy);
  border-radius: 14px;
}

.diff__icon svg {
  width: 28px; height: 28px;
}

.diff__label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--blue);
  margin-bottom: 4px;
  display: block;
}

.diff__title {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.diff__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  max-width: 1100px;
}

.diff__card {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 28px 32px;
  background: var(--off-white);
  border-radius: 16px;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeUp 0.5s ease forwards;
  animation-delay: var(--delay, 0s);
  border: 1px solid rgba(0,0,0,0.04);
}

.slide.active .diff__card {
  opacity: 1;
  transform: translateY(0);
}

.diff__card-icon {
  width: 32px; height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--blue), var(--cyan));
  color: var(--white);
  border-radius: 50%;
  flex-shrink: 0;
}

.diff__card-icon svg {
  width: 16px; height: 16px;
}

.diff__card-text {
  font-size: 1.05rem;
  line-height: 1.6;
  color: var(--gray-dark);
}

/* ═══════════════════════════════════════════════════════════════
   CLOSING SLIDE
   ═══════════════════════════════════════════════════════════════ */
.slide--closing {
  align-items: center;
  justify-content: center;
  text-align: center;
}

.closing__bg {
  position: absolute;
  inset: 0;
}

.closing__gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 50% 100%, var(--cyan-glow), transparent 50%),
    linear-gradient(160deg, var(--navy-light) 0%, var(--navy) 100%);
}

.closing__noise {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity: 0.03;
}

.closing__orb {
  position: absolute;
  width: 500px; height: 500px;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(18, 171, 219, 0.15), transparent 70%);
  filter: blur(60px);
}

.closing__content {
  position: relative;
  z-index: 2;
  max-width: 700px;
  padding: 0 40px;
}

.closing__icon {
  width: 72px; height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  color: var(--cyan);
  margin: 0 auto 32px;
  backdrop-filter: blur(12px);
}

.closing__icon svg {
  width: 36px; height: 36px;
}

.closing__title {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  margin-bottom: 12px;
}

.closing__subtitle {
  font-size: 1.25rem;
  font-weight: 300;
  color: var(--gray-light);
  margin-bottom: 48px;
}

.closing__steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 48px;
  text-align: left;
}

.closing__step {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  opacity: 0;
  transform: translateX(-20px);
  animation: slideIn 0.5s ease forwards;
  animation-delay: var(--delay, 0s);
}

.slide.active .closing__step {
  opacity: 1;
  transform: translateX(0);
}

.closing__step-num {
  font-family: 'Outfit', sans-serif;
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--cyan);
}

.closing__step-text {
  font-size: 1rem;
  color: var(--gray-light);
}

.closing__cta {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 18px 36px;
  background: linear-gradient(135deg, var(--blue), var(--cyan));
  border-radius: 100px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 32px rgba(18, 171, 219, 0.3);
}

.closing__cta:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 40px rgba(18, 171, 219, 0.4);
}

.closing__cta-arrow {
  width: 20px; height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
}

.closing__cta-arrow svg {
  width: 16px; height: 16px;
}

.closing__cta:hover .closing__cta-arrow {
  transform: translateX(4px);
}

/* ═══════════════════════════════════════════════════════════════
   NAVIGATION
   ═══════════════════════════════════════════════════════════════ */
.nav {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 24px;
  z-index: 100;
  background: rgba(10, 22, 40, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 100px;
  padding: 12px 28px;
}

.nav__btn {
  width: 48px; height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.05);
  border: none;
  border-radius: 50%;
  color: var(--white);
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav__btn:hover:not(:disabled) {
  background: var(--cyan);
  color: var(--navy);
  transform: scale(1.08);
}

.nav__btn:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.nav__btn svg {
  width: 20px; height: 20px;
}

.nav__info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 80px;
}

.nav__text {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--white);
  letter-spacing: 0.05em;
}

.nav__bar {
  width: 100%;
  height: 3px;
  background: rgba(255,255,255,0.1);
  border-radius: 2px;
  overflow: hidden;
}

.nav__fill {
  height: 100%;
  background: linear-gradient(90deg, var(--cyan), var(--blue));
  border-radius: 2px;
  transition: width 0.4s ease;
}

.fullscreen-btn {
  position: fixed;
  top: 28px;
  right: 28px;
  width: 52px; height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 22, 40, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  color: var(--white);
  font-size: 1.25rem;
  cursor: pointer;
  z-index: 100;
  transition: all 0.2s ease;
}

.fullscreen-btn:hover {
  background: var(--cyan);
  color: var(--navy);
  transform: scale(1.05);
}

/* Responsive */
@media (max-width: 1024px) {
  .slide--split, .slide--understanding, .slide--case-study {
    grid-template-columns: 1fr;
  }

  .split__left, .split__right {
    padding: 60px 48px;
  }

  .slide--approach, .slide--diff, .slide--methodology, .slide--risk, .slide--timeline {
    padding: 60px 48px;
  }

  .slide--executive, .team__content, .investment__content {
    padding: 60px 48px;
  }

  .understanding__left, .understanding__right,
  .case-study__left, .case-study__right {
    padding: 60px 48px;
  }

  .timeline-slide__track {
    flex-wrap: wrap;
    gap: 24px;
    justify-content: center;
  }

  .timeline-slide__line {
    display: none;
  }

  .timeline-slide__milestone {
    max-width: 140px;
  }
}

@media (max-width: 768px) {
  .split__left, .split__right {
    padding: 48px 32px;
  }

  .slide--approach, .slide--diff, .slide--methodology, .slide--risk, .slide--timeline {
    padding: 48px 32px;
  }

  .slide--executive, .team__content, .investment__content {
    padding: 48px 32px;
  }

  .understanding__left, .understanding__right,
  .case-study__left, .case-study__right {
    padding: 48px 32px;
  }

  .metrics__grid {
    grid-template-columns: 1fr 1fr;
  }

  .diff__grid, .methodology__grid, .team__grid, .risk__grid, .investment__points {
    grid-template-columns: 1fr;
  }

  .case-study__metrics {
    flex-direction: column;
    gap: 16px;
  }

  .nav {
    padding: 10px 20px;
    gap: 16px;
  }

  .nav__btn {
    width: 40px; height: 40px;
  }
}

@media print {
  .slide {
    position: relative;
    page-break-after: always;
    opacity: 1;
    visibility: visible;
    transform: none;
  }
  .nav, .fullscreen-btn { display: none; }
}
</style>
</head>
<body>

<div class="slides" id="slides">
  ${slidesHtml}
</div>

<nav class="nav">
  <button class="nav__btn" id="prevBtn" aria-label="Previous">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
  </button>
  <div class="nav__info">
    <span class="nav__text"><span id="current">1</span> / <span id="total">${totalSlides}</span></span>
    <div class="nav__bar"><div class="nav__fill" id="fill"></div></div>
  </div>
  <button class="nav__btn" id="nextBtn" aria-label="Next">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
  </button>
</nav>

<button class="fullscreen-btn" id="fsBtn" aria-label="Fullscreen">⛶</button>

<script>
(function() {
  const slides = document.querySelectorAll('.slide');
  const total = slides.length;
  let idx = 0;

  const prev = document.getElementById('prevBtn');
  const next = document.getElementById('nextBtn');
  const current = document.getElementById('current');
  const fill = document.getElementById('fill');
  const fsBtn = document.getElementById('fsBtn');

  function update() {
    slides.forEach((s, i) => {
      s.classList.remove('active');
      if (i === idx) s.classList.add('active');
    });
    current.textContent = idx + 1;
    fill.style.width = ((idx + 1) / total * 100) + '%';
    prev.disabled = idx === 0;
    next.disabled = idx === total - 1;
    history.replaceState(null, null, '#' + (idx + 1));
  }

  function goNext() { if (idx < total - 1) { idx++; update(); } }
  function goPrev() { if (idx > 0) { idx--; update(); } }
  function goTo(i) { if (i >= 0 && i < total) { idx = i; update(); } }

  next.onclick = goNext;
  prev.onclick = goPrev;

  document.onkeydown = function(e) {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); goNext(); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); goPrev(); }
    else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
    else if (e.key === 'End') { e.preventDefault(); goTo(total - 1); }
    else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); toggleFs(); }
  };

  let tx = 0;
  document.ontouchstart = e => tx = e.changedTouches[0].screenX;
  document.ontouchend = e => {
    const d = tx - e.changedTouches[0].screenX;
    if (Math.abs(d) > 50) d > 0 ? goNext() : goPrev();
  };

  function toggleFs() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  }
  fsBtn.onclick = toggleFs;

  const hash = window.location.hash.match(/^#(\\d+)$/);
  if (hash) goTo(parseInt(hash[1], 10) - 1);
  update();
})();
</script>

</body>
</html>`;
}
