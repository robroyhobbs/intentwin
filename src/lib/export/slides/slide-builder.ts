/**
 * Slide builder — converts proposal sections into SlideContent[]
 *
 * Contains all content extraction/parsing helpers and the main
 * transformToSlides() orchestrator.
 */

import { NARRATIVE_MAP } from "./constants";
import type { ProposalData, ProposalSection, SlideContent } from "./types";

// ────────────────────────────────────────────────────────────────
// Content extraction helpers
// ────────────────────────────────────────────────────────────────

function _categorizeSection(section: ProposalSection): string {
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

// ────────────────────────────────────────────────────────────────
// Main builder
// ────────────────────────────────────────────────────────────────

/**
 * Converts proposal data into an ordered array of SlideContent objects.
 */
export function buildSlides(
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

  // 7b. RFP Task-Mirrored Sections (Phase 5)
  // When task mode is active, approach/methodology/understanding/timeline are replaced
  // by per-task sections. Each gets an approach-style slide.
  const taskSections = sections.filter(
    (s) => s.section_type.toLowerCase() === "rfp_task",
  );
  for (const taskSection of taskSections) {
    const items = extractItems(taskSection.content, 5);
    slides.push({
      type: "approach",
      title: taskSection.title,
      subtitle: "Task Response",
      items:
        items.length > 0
          ? items
          : ["Comprehensive response to RFP requirements"],
      phases: extractPhases(taskSection.content).length > 0
        ? extractPhases(taskSection.content)
        : undefined,
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
        metrics: metrics.length > 0 ? metrics : undefined,
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
      items: items.length > 0 ? items : undefined,
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
      items: items.length > 0 ? items : undefined,
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
      items: items.length > 0 ? items : undefined,
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
      items: items.length > 0 ? items : undefined,
    });
  }

  // 15. Next Steps / Closing
  // Try to extract real next-steps from a dedicated section if available
  const nextStepsSection = getSectionByType(sections, "next_steps");
  const closingItems = nextStepsSection
    ? extractItems(nextStepsSection.content, 4)
    : [];
  slides.push({
    type: "closing",
    title: "Next Steps",
    subtitle: `Partner with ${companyName}`,
    items: closingItems.length > 0 ? closingItems : undefined,
  });

  return slides;
}
