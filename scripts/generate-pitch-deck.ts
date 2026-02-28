/**
 * IntentBid Investor Pitch Deck Generator
 * Generates a polished, brand-matched PPTX pitch deck.
 *
 * Run: npx tsx scripts/generate-pitch-deck.ts
 * Output: intentbid-pitch-deck.pptx
 */

import PptxGenJS from "pptxgenjs";
import * as path from "path";

// ─── Brand Palette (matches v2 website globals.css) ──────────────────────────
const B = {
  purple:      "7C3AED",
  purpleLight: "A78BFA",
  purpleDark:  "6D28D9",
  indigo:      "6366F1",
  pink:        "F472B6",
  ink:         "09090B",
  inkSecond:   "52525B",
  inkMuted:    "A1A1AA",
  surface:     "FAFAF9",
  surfaceAlt:  "F5F5F4",
  card:        "FFFFFF",
  white:       "FFFFFF",
  // Dark slide backgrounds
  dark:        "09090B",
  darkCard:    "141416",
  darkAlt:     "111113",
  // Gradient stops — used for gradient fills
  gradStart:   "7C3AED",
  gradMid:     "6366F1",
  gradEnd:     "A78BFA",
};

// ─── Layout ──────────────────────────────────────────────────────────────────
const SLIDE_W = 13.33; // inches (widescreen 16:9)
const SLIDE_H = 7.5;
const FONT = "Inter";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Full-bleed dark gradient background */
function darkBg(slide: PptxGenJS.Slide) {
  slide.addShape("rect", {
    x: 0, y: 0, w: SLIDE_W, h: SLIDE_H,
    fill: { type: "solid", color: B.dark },
    line: { type: "none" },
  });
  // Subtle purple glow top-right
  slide.addShape("ellipse", {
    x: 8.5, y: -1.5, w: 5, h: 5,
    fill: { type: "solid", color: "7C3AED" },
    line: { type: "none" },
    transparency: 88,
  });
  // Subtle indigo glow bottom-left
  slide.addShape("ellipse", {
    x: -1, y: 5, w: 4, h: 4,
    fill: { type: "solid", color: "6366F1" },
    line: { type: "none" },
    transparency: 90,
  });
}

/** Light background */
function lightBg(slide: PptxGenJS.Slide) {
  slide.addShape("rect", {
    x: 0, y: 0, w: SLIDE_W, h: SLIDE_H,
    fill: { type: "solid", color: B.surface },
    line: { type: "none" },
  });
  slide.addShape("ellipse", {
    x: 9, y: -1, w: 4.5, h: 4.5,
    fill: { type: "solid", color: B.purple },
    line: { type: "none" },
    transparency: 93,
  });
}

/** Gradient left panel (used on section divider slides) */
function gradientPanel(slide: PptxGenJS.Slide, w = 5.2) {
  slide.addShape("rect", {
    x: 0, y: 0, w, h: SLIDE_H,
    fill: { type: "solid", color: B.purple },
    line: { type: "none" },
  });
  // Subtle pattern overlay
  slide.addShape("ellipse", {
    x: -0.5, y: 4, w: 3.5, h: 3.5,
    fill: { type: "solid", color: B.indigo },
    line: { type: "none" },
    transparency: 70,
  });
  slide.addShape("ellipse", {
    x: 2, y: -1, w: 3, h: 3,
    fill: { type: "solid", color: B.pink },
    line: { type: "none" },
    transparency: 80,
  });
}

/** Small pill badge */
function badge(slide: PptxGenJS.Slide, text: string, x: number, y: number, dark = true) {
  const color = dark ? B.white : B.purple;
  const bg = dark ? "7C3AED" : "EDE9FE";
  slide.addShape("roundRect", {
    x, y, w: 1.8, h: 0.28,
    fill: { type: "solid", color: bg },
    line: { type: "none" },
    rectRadius: 0.14,
  });
  slide.addText(text.toUpperCase(), {
    x, y, w: 1.8, h: 0.28,
    fontSize: 7, bold: true, color,
    fontFace: FONT, align: "center", valign: "middle",
    charSpacing: 1.5,
  });
}

/** Section number — large faint background numeral */
function sectionNum(slide: PptxGenJS.Slide, num: string, dark = true) {
  slide.addText(num, {
    x: SLIDE_W - 2.2, y: SLIDE_H - 2,
    w: 2, h: 2,
    fontSize: 120, bold: true,
    color: dark ? "FFFFFF" : B.purple,
    fontFace: FONT, align: "right", valign: "bottom",
    transparency: dark ? 94 : 96,
  });
}

/** Horizontal rule */
function rule(slide: PptxGenJS.Slide, x: number, y: number, w: number, color = B.purple) {
  slide.addShape("line", {
    x, y, w, h: 0,
    line: { color, width: 1.5 },
  });
}

/** Metric card — used in trios */
function metricCard(
  slide: PptxGenJS.Slide,
  value: string, label: string, sub: string,
  x: number, y: number, dark = true,
) {
  const bg = dark ? B.darkCard : B.white;
  const border = dark ? "FFFFFF" : B.purple;
  const textColor = dark ? B.white : B.ink;
  const subColor = dark ? B.inkMuted : B.inkSecond;

  slide.addShape("roundRect", {
    x, y, w: 3.6, h: 1.9,
    fill: { type: "solid", color: bg },
    line: { color: border, width: 0.5, transparency: dark ? 88 : 80 },
    rectRadius: 0.12,
  });
  slide.addText(value, {
    x: x + 0.2, y: y + 0.2, w: 3.2, h: 0.7,
    fontSize: 36, bold: true, color: B.purple,
    fontFace: FONT, align: "left",
  });
  slide.addText(label, {
    x: x + 0.2, y: y + 0.9, w: 3.2, h: 0.35,
    fontSize: 13, bold: true, color: textColor,
    fontFace: FONT, align: "left",
  });
  slide.addText(sub, {
    x: x + 0.2, y: y + 1.25, w: 3.2, h: 0.45,
    fontSize: 10, color: subColor,
    fontFace: FONT, align: "left",
  });
}

/** Numbered list item */
function listItem(
  slide: PptxGenJS.Slide,
  num: string, title: string, body: string,
  x: number, y: number, dark = true,
) {
  const titleColor = dark ? B.white : B.ink;
  const bodyColor  = dark ? B.inkMuted : B.inkSecond;

  slide.addText(num, {
    x, y, w: 0.45, h: 0.45,
    fontSize: 12, bold: true, color: B.white,
    fontFace: FONT, align: "center", valign: "middle",
    fill: { type: "solid", color: B.purple },
    shape: "ellipse",
  });
  slide.addText(title, {
    x: x + 0.55, y: y + 0.02, w: 5.5, h: 0.28,
    fontSize: 12, bold: true, color: titleColor,
    fontFace: FONT,
  });
  slide.addText(body, {
    x: x + 0.55, y: y + 0.3, w: 5.5, h: 0.35,
    fontSize: 10, color: bodyColor,
    fontFace: FONT,
  });
}

/** Check row for comparison tables */
function checkRow(
  slide: PptxGenJS.Slide,
  label: string, before: string, after: string,
  x: number, y: number,
) {
  // Row background alt
  slide.addText(label, {
    x, y, w: 3, h: 0.38,
    fontSize: 11, bold: true, color: B.ink,
    fontFace: FONT, valign: "middle",
  });
  // Before (red ✕)
  slide.addText("✕  " + before, {
    x: x + 3, y, w: 3.4, h: 0.38,
    fontSize: 10, color: "EF4444",
    fontFace: FONT, valign: "middle",
  });
  // After (green ✓)
  slide.addText("✓  " + after, {
    x: x + 6.5, y, w: 3.4, h: 0.38,
    fontSize: 10, color: "10B981",
    fontFace: FONT, valign: "middle",
  });
  rule(slide, x, y + 0.38, 10, "E5E7EB");
}

/** Feature pill */
function featurePill(
  slide: PptxGenJS.Slide,
  icon: string, text: string,
  x: number, y: number, dark = true,
) {
  const bg = dark ? "1A1A24" : "EDE9FE";
  const color = dark ? B.white : B.purple;
  slide.addShape("roundRect", {
    x, y, w: 2.9, h: 0.42,
    fill: { type: "solid", color: bg },
    line: { type: "none" },
    rectRadius: 0.21,
  });
  slide.addText(`${icon}  ${text}`, {
    x: x + 0.12, y, w: 2.66, h: 0.42,
    fontSize: 10.5, color,
    fontFace: FONT, valign: "middle",
  });
}

/** Pricing tier card */
function pricingCard(
  slide: PptxGenJS.Slide,
  tier: string, price: string, period: string, features: string[],
  x: number, y: number, featured = false,
) {
  const bg = featured ? B.purple : B.white;
  const textColor = featured ? B.white : B.ink;
  const subColor = featured ? "C4B5FD" : B.inkSecond;
  const borderColor = featured ? B.purple : "E5E7EB";

  slide.addShape("roundRect", {
    x, y, w: 2.85, h: 3.5,
    fill: { type: "solid", color: bg },
    line: { color: borderColor, width: featured ? 0 : 1 },
    rectRadius: 0.14,
    shadow: featured ? { type: "outer", color: B.purple, blur: 20, offset: 8, angle: 270, transparency: 60 } : undefined,
  });
  if (featured) {
    slide.addShape("roundRect", {
      x: x + 0.5, y: y - 0.18, w: 1.85, h: 0.3,
      fill: { type: "solid", color: B.pink },
      line: { type: "none" },
      rectRadius: 0.15,
    });
    slide.addText("MOST POPULAR", {
      x: x + 0.5, y: y - 0.18, w: 1.85, h: 0.3,
      fontSize: 7, bold: true, color: B.white,
      fontFace: FONT, align: "center", valign: "middle",
      charSpacing: 1,
    });
  }
  slide.addText(tier, {
    x: x + 0.2, y: y + 0.22, w: 2.45, h: 0.3,
    fontSize: 13, bold: true, color: textColor,
    fontFace: FONT,
  });
  slide.addText(price, {
    x: x + 0.2, y: y + 0.58, w: 2.45, h: 0.55,
    fontSize: 30, bold: true, color: featured ? B.white : B.purple,
    fontFace: FONT,
  });
  slide.addText(period, {
    x: x + 0.2, y: y + 1.1, w: 2.45, h: 0.25,
    fontSize: 9.5, color: subColor,
    fontFace: FONT,
  });
  rule(slide, x + 0.2, y + 1.42, 2.45, featured ? "FFFFFF" : "E5E7EB");
  features.forEach((f, i) => {
    slide.addText(`✓  ${f}`, {
      x: x + 0.2, y: y + 1.55 + i * 0.32, w: 2.45, h: 0.3,
      fontSize: 9.5, color: featured ? "D4B9FD" : B.inkSecond,
      fontFace: FONT,
    });
  });
}

// ─── SLIDE BUILDERS ──────────────────────────────────────────────────────────

/** SLIDE 1 — Cover */
function slide01Cover(prs: PptxGenJS) {
  const slide = prs.addSlide();
  darkBg(slide);

  // Logo mark — IB monogram in purple circle
  slide.addShape("roundRect", {
    x: 0.65, y: 0.6, w: 0.75, h: 0.75,
    fill: { type: "solid", color: B.purple },
    line: { type: "none" },
    rectRadius: 0.18,
  });
  slide.addText("IB", {
    x: 0.65, y: 0.6, w: 0.75, h: 0.75,
    fontSize: 18, bold: true, color: B.white,
    fontFace: FONT, align: "center", valign: "middle",
  });
  slide.addText("IntentBid", {
    x: 1.5, y: 0.68, w: 3, h: 0.58,
    fontSize: 18, bold: true, color: B.white,
    fontFace: FONT, valign: "middle",
  });

  // Headline
  slide.addText("Stop writing proposals.", {
    x: 0.65, y: 2.0, w: 10, h: 0.85,
    fontSize: 52, bold: true, color: B.white,
    fontFace: FONT,
  });
  slide.addText("Start engineering wins.", {
    x: 0.65, y: 2.82, w: 10, h: 0.85,
    fontSize: 52, bold: true, color: B.purpleLight,
    fontFace: FONT,
  });

  // Subhead
  slide.addText("AI-powered proposal generation for government contractors — from RFP to first draft in hours.", {
    x: 0.65, y: 3.85, w: 8.5, h: 0.6,
    fontSize: 16, color: B.inkMuted,
    fontFace: FONT,
  });

  rule(slide, 0.65, 4.65, 4, B.purple);

  // Metadata row
  slide.addText("Seed Round  ·  2026  ·  Seattle, WA  ·  intentbid.com", {
    x: 0.65, y: 4.85, w: 8, h: 0.35,
    fontSize: 11, color: B.inkMuted,
    fontFace: FONT,
  });

  // Right side decorative grid
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      slide.addShape("ellipse", {
        x: 9.8 + c * 0.48, y: 1.2 + r * 0.48,
        w: 0.08, h: 0.08,
        fill: { type: "solid", color: B.purple },
        line: { type: "none" },
        transparency: 70,
      });
    }
  }

  sectionNum(slide, "01");
}

/** SLIDE 2 — Problem */
function slide02Problem(prs: PptxGenJS) {
  const slide = prs.addSlide();
  darkBg(slide);
  badge(slide, "The Problem", 0.65, 0.55);
  sectionNum(slide, "02");

  slide.addText("Proposals are assembled,\nnot engineered.", {
    x: 0.65, y: 1.0, w: 8.5, h: 1.6,
    fontSize: 42, bold: true, color: B.white,
    fontFace: FONT,
  });

  slide.addText("Most teams build proposals the same broken way:", {
    x: 0.65, y: 2.75, w: 9, h: 0.4,
    fontSize: 14, color: B.inkMuted,
    fontFace: FONT,
  });

  const problems = [
    ["$50B+", "Lost annually in govcon bids\ndue to compliance failures alone"],
    ["40%", "Of proposals eliminated\nbefore technical scoring begins"],
    ["80–120 hrs", "Average effort per proposal\nat $125/hr blended rate"],
  ];

  problems.forEach(([val, label], i) => {
    const x = 0.65 + i * 4.1;
    slide.addShape("roundRect", {
      x, y: 3.25, w: 3.8, h: 2.2,
      fill: { type: "solid", color: B.darkCard },
      line: { color: "FFFFFF", width: 0.5, transparency: 90 },
      rectRadius: 0.14,
    });
    slide.addText(val, {
      x: x + 0.25, y: 3.45, w: 3.3, h: 0.72,
      fontSize: 38, bold: true, color: "F472B6",
      fontFace: FONT,
    });
    slide.addText(label, {
      x: x + 0.25, y: 4.2, w: 3.3, h: 0.9,
      fontSize: 11, color: B.inkMuted,
      fontFace: FONT,
    });
  });

  slide.addText("The difference between winning and losing isn't capability — it's how you present it.", {
    x: 0.65, y: 5.75, w: 10.5, h: 0.5,
    fontSize: 13, italic: true, color: B.purpleLight,
    fontFace: FONT,
  });
}

/** SLIDE 3 — Solution */
function slide03Solution(prs: PptxGenJS) {
  const slide = prs.addSlide();
  lightBg(slide);
  badge(slide, "The Solution", 0.65, 0.55, false);
  sectionNum(slide, "03", false);

  slide.addText("IntentBid turns your RFP\ninto a winning proposal.", {
    x: 0.65, y: 1.0, w: 9, h: 1.5,
    fontSize: 40, bold: true, color: B.ink,
    fontFace: FONT,
  });

  slide.addText("Upload your RFP → set your win strategy → get a structured first draft in hours — not weeks.", {
    x: 0.65, y: 2.65, w: 9, h: 0.5,
    fontSize: 14, color: B.inkSecond,
    fontFace: FONT,
  });

  // Flow arrows
  const steps = [
    { icon: "📄", label: "Upload RFP" },
    { icon: "🎯", label: "Set Win Strategy" },
    { icon: "⚡", label: "AI Generates Draft" },
    { icon: "✅", label: "Team Refines & Wins" },
  ];

  steps.forEach((step, i) => {
    const x = 0.65 + i * 3.1;
    slide.addShape("roundRect", {
      x, y: 3.3, w: 2.75, h: 2.0,
      fill: { type: "solid", color: B.white },
      line: { color: B.purple, width: 1, transparency: 80 },
      rectRadius: 0.14,
      shadow: { type: "outer", color: "000000", blur: 8, offset: 2, angle: 270, transparency: 90 },
    });
    slide.addText(step.icon, {
      x, y: 3.45, w: 2.75, h: 0.55,
      fontSize: 26, align: "center",
      fontFace: FONT,
    });
    slide.addText(`0${i + 1}`, {
      x: x + 0.15, y: 3.42, w: 0.45, h: 0.3,
      fontSize: 9, bold: true, color: B.purple,
      fontFace: FONT,
    });
    slide.addText(step.label, {
      x: x + 0.15, y: 4.05, w: 2.45, h: 0.5,
      fontSize: 12, bold: true, color: B.ink,
      fontFace: FONT, align: "center",
    });
    // Arrow between steps
    if (i < steps.length - 1) {
      slide.addText("→", {
        x: x + 2.8, y: 4.15, w: 0.28, h: 0.4,
        fontSize: 16, color: B.purple,
        fontFace: FONT, align: "center",
      });
    }
  });

  // Trust badges
  ["Human-in-the-loop", "Market intelligence built in", "AI bid/no-bid scoring"].forEach((t, i) => {
    featurePill(slide, "✓", t, 0.65 + i * 3.2, 5.6, false);
  });
}

/** SLIDE 4 — Product (How It Works) */
function slide04Product(prs: PptxGenJS) {
  const slide = prs.addSlide();
  darkBg(slide);
  badge(slide, "How It Works", 0.65, 0.55);
  sectionNum(slide, "04");

  slide.addText("Every section is built\nto score.", {
    x: 0.65, y: 1.0, w: 5.5, h: 1.4,
    fontSize: 38, bold: true, color: B.white,
    fontFace: FONT,
  });

  slide.addText("Six layers ensure every proposal section is persuasive,\ncompliant, and differentiated.", {
    x: 0.65, y: 2.55, w: 5.5, h: 0.65,
    fontSize: 12.5, color: B.inkMuted,
    fontFace: FONT,
  });

  const layers = [
    { n: "01", title: "Brand Voice", body: "Your tone in every word — no generic AI-speak" },
    { n: "02", title: "Section Best Practices", body: "Proven structure for each section type" },
    { n: "03", title: "Narrative Structure", body: "STAR for past performance, problem-solution for tech" },
    { n: "04", title: "Win Themes", body: "Your differentiators baked in, not bolted on" },
    { n: "05", title: "Competitive Ghosting", body: "Position strengths against weaknesses — standard govcon" },
    { n: "06", title: "Evidence & Context", body: "Every claim backed by your actual data and case studies" },
  ];

  layers.forEach((layer, i) => {
    const col = i < 3 ? 0 : 1;
    const row = i % 3;
    const x = 6.5 + col * 3.35;
    const y = 1.0 + row * 1.5;

    slide.addShape("roundRect", {
      x, y, w: 3.1, h: 1.3,
      fill: { type: "solid", color: B.darkCard },
      line: { color: B.purple, width: 0.75, transparency: 80 },
      rectRadius: 0.1,
    });
    slide.addText(layer.n, {
      x: x + 0.18, y: y + 0.15, w: 0.4, h: 0.35,
      fontSize: 9, bold: true, color: B.purple,
      fontFace: FONT,
    });
    slide.addText(layer.title, {
      x: x + 0.18, y: y + 0.42, w: 2.7, h: 0.3,
      fontSize: 12, bold: true, color: B.white,
      fontFace: FONT,
    });
    slide.addText(layer.body, {
      x: x + 0.18, y: y + 0.72, w: 2.7, h: 0.42,
      fontSize: 9.5, color: B.inkMuted,
      fontFace: FONT,
    });
  });
}

/** SLIDE 5 — Intelligence */
function slide05Intelligence(prs: PptxGenJS) {
  const slide = prs.addSlide();
  lightBg(slide);
  badge(slide, "Intelligence", 0.65, 0.55, false);
  sectionNum(slide, "05", false);

  slide.addText("Your city is spending money.\nFind out where.", {
    x: 0.65, y: 1.0, w: 9, h: 1.5,
    fontSize: 40, bold: true, color: B.ink,
    fontFace: FONT,
  });

  slide.addText("IntentBid is a lead generation system for government contracts — surfacing local, state, and federal opportunities matched to your business.", {
    x: 0.65, y: 2.65, w: 11, h: 0.45,
    fontSize: 13, color: B.inkSecond,
    fontFace: FONT,
  });

  const cards = [
    { icon: "🏙️", title: "Local Contract Discovery", body: "Active and upcoming contracts from your city, county, and state — matched to your business type and location before the deadline." },
    { icon: "📈", title: "Opportunity Pipeline", body: "A live feed of government procurement notices. Stop searching procurement portals every day — start receiving matched opportunities." },
    { icon: "🔍", title: "Incumbent & Spend Intelligence", body: "See who holds the contract, what they were paid, and when it expires. Know whether you can compete — and exactly how to position against them." },
    { icon: "📁", title: "Sunshine Law & FOIA Engine", body: "Automatically generate public records requests to surface competitor pricing from all 50 states. Level the playing field against entrenched incumbents." },
  ];

  cards.forEach((card, i) => {
    const x = 0.65 + (i % 2) * 6.2;
    const y = 3.25 + Math.floor(i / 2) * 1.85;
    slide.addShape("roundRect", {
      x, y, w: 5.8, h: 1.65,
      fill: { type: "solid", color: B.white },
      line: { color: B.purple, width: 0.75, transparency: 85 },
      rectRadius: 0.12,
      shadow: { type: "outer", color: "000000", blur: 6, offset: 2, angle: 270, transparency: 93 },
    });
    slide.addText(card.icon, {
      x: x + 0.25, y: y + 0.3, w: 0.6, h: 0.6,
      fontSize: 22, align: "center",
      fontFace: FONT,
    });
    slide.addText(card.title, {
      x: x + 1.0, y: y + 0.2, w: 4.5, h: 0.38,
      fontSize: 13, bold: true, color: B.ink,
      fontFace: FONT,
    });
    slide.addText(card.body, {
      x: x + 1.0, y: y + 0.6, w: 4.5, h: 0.75,
      fontSize: 10.5, color: B.inkSecond,
      fontFace: FONT,
    });
  });
}

/** SLIDE 6 — Before vs After */
function slide06BeforeAfter(prs: PptxGenJS) {
  const slide = prs.addSlide();
  lightBg(slide);
  badge(slide, "The Shift", 0.65, 0.5, false);
  sectionNum(slide, "06", false);

  slide.addText("Stop losing deals to slow proposals.", {
    x: 0.65, y: 0.95, w: 11, h: 0.65,
    fontSize: 36, bold: true, color: B.ink,
    fontFace: FONT,
  });

  // Column headers
  slide.addText("BEFORE", {
    x: 3.65, y: 1.75, w: 3.4, h: 0.35,
    fontSize: 10, bold: true, color: "EF4444",
    fontFace: FONT, align: "center", charSpacing: 2,
  });
  slide.addText("WITH INTENTBID", {
    x: 6.5, y: 1.75, w: 4, h: 0.35,
    fontSize: 10, bold: true, color: "10B981",
    fontFace: FONT, align: "center", charSpacing: 2,
  });
  rule(slide, 0.65, 2.1, 11.8, "E5E7EB");

  const rows: [string, string, string][] = [
    ["Timeline",        "2–4 weeks per proposal",             "First draft in hours"],
    ["Quality",         "Inconsistent across writers",         "Consistent methodology every time"],
    ["Personalization", "Generic templates, copy-paste",       "Tailored to evaluator criteria"],
    ["Knowledge",       "Tribal knowledge lost with turnover", "Win themes carry forward"],
    ["Scalability",     "Limited by headcount",                "More proposals, same team size"],
  ];

  rows.forEach(([label, before, after], i) => {
    const y = 2.2 + i * 0.72;
    if (i % 2 === 0) {
      slide.addShape("rect", {
        x: 0.65, y, w: 11.8, h: 0.72,
        fill: { type: "solid", color: "F9F9F8" },
        line: { type: "none" },
      });
    }
    checkRow(slide, label, before, after, 0.65, y + 0.17);
  });
}

/** SLIDE 7 — Market Opportunity */
function slide07Market(prs: PptxGenJS) {
  const slide = prs.addSlide();
  darkBg(slide);
  badge(slide, "Market Opportunity", 0.65, 0.55);
  sectionNum(slide, "07");

  slide.addText("A massive market\nwaiting for a system.", {
    x: 0.65, y: 1.0, w: 9, h: 1.45,
    fontSize: 40, bold: true, color: B.white,
    fontFace: FONT,
  });

  const metrics = [
    { val: "$700B+", label: "U.S. Federal Contract Spending", sub: "Annual procurement market" },
    { val: "450K+",  label: "Active Government Contractors", sub: "Potential customers in the U.S. alone" },
    { val: "$20K",   label: "Avg. Cost of a Human Proposal", sub: "At $125/hr × 80–120 hours" },
  ];

  metrics.forEach((m, i) => {
    metricCard(slide, m.val, m.label, m.sub, 0.65 + i * 4.18, 2.65);
  });

  slide.addText("IntentBid targets the $4.5B+ proposal management software and services market — a segment historically underserved by modern AI tooling.", {
    x: 0.65, y: 5.05, w: 11.5, h: 0.55,
    fontSize: 12.5, color: B.inkMuted,
    fontFace: FONT,
  });

  // Market segments
  const segs = ["Federal / DoD", "State & Local (SLED)", "A&E / Architecture", "IT Consulting & MSPs", "Blue-Collar Services"];
  segs.forEach((seg, i) => {
    featurePill(slide, "→", seg, 0.65 + (i % 3) * 4.0, 5.8 + Math.floor(i / 3) * 0.55);
  });
}

/** SLIDE 8 — Business Model */
function slide08BusinessModel(prs: PptxGenJS) {
  const slide = prs.addSlide();
  lightBg(slide);
  badge(slide, "Business Model", 0.65, 0.55, false);
  sectionNum(slide, "08", false);

  slide.addText("Invest in winning.\nNot in trying.", {
    x: 0.65, y: 1.0, w: 9, h: 1.4,
    fontSize: 40, bold: true, color: B.ink,
    fontFace: FONT,
  });

  slide.addText("Three paid tiers. No free tier. Every plan includes opportunity discovery + proposal generation.", {
    x: 0.65, y: 2.55, w: 11, h: 0.4,
    fontSize: 13.5, color: B.inkSecond,
    fontFace: FONT,
  });

  // 3 tiers — centered with more breathing room
  pricingCard(slide, "Starter",    "$79",   "/mo · 5 proposals",   ["City, county & state leads", "Bid/no-bid scoring", "DOCX + PDF", "25 knowledge docs"],          1.3,  3.1);
  pricingCard(slide, "Growth",     "$199",  "/mo · Unlimited",     ["Full opportunity pipeline", "Incumbent intelligence", "FOIA engine", "Win/loss analytics"],    5.0,  3.1, true);
  pricingCard(slide, "Enterprise", "Custom", "· Unlimited users",  ["White-label exports", "Custom integrations", "Win probability engine", "Dedicated support"],   8.7,  3.1);
}

/** SLIDE 9 — Traction */
function slide09Traction(prs: PptxGenJS) {
  const slide = prs.addSlide();
  darkBg(slide);
  badge(slide, "Traction", 0.65, 0.55);
  sectionNum(slide, "09");

  slide.addText("Early signals.\nStrong foundation.", {
    x: 0.65, y: 1.0, w: 9, h: 1.4,
    fontSize: 40, bold: true, color: B.white,
    fontFace: FONT,
  });

  const metrics = [
    { val: "1,537",  label: "Automated Tests",       sub: "0 failures — production-grade" },
    { val: "5",      label: "Export Formats",         sub: "DOCX, PDF, PPTX, Google Slides, HTML" },
    { val: "3",      label: "Go-to-Market Verticals", sub: "Federal, SLED, Blue-collar services" },
  ];

  metrics.forEach((m, i) => {
    metricCard(slide, m.val, m.label, m.sub, 0.65 + i * 4.18, 2.65);
  });

  // Milestones
  slide.addText("PRODUCT MILESTONES", {
    x: 0.65, y: 4.75, w: 4, h: 0.3,
    fontSize: 9, bold: true, color: B.purpleLight,
    fontFace: FONT, charSpacing: 2,
  });

  const milestones = [
    "Full proposal pipeline live — intake → generate → export",
    "Intelligence layer: SAM.gov, GSA CALC+, FOIA engine",
    "Multi-tenant SaaS architecture with Stripe billing",
    "Invite-only early access program launched",
  ];

  milestones.forEach((m, i) => {
    slide.addText(`✓  ${m}`, {
      x: 0.65, y: 5.1 + i * 0.38, w: 8, h: 0.35,
      fontSize: 11.5, color: B.inkMuted,
      fontFace: FONT,
    });
  });

  slide.addText("Target: $10K MRR in 90 days from first paying customer.", {
    x: 7.5, y: 5.1, w: 5.2, h: 1.6,
    fontSize: 22, bold: true, color: B.purpleLight,
    fontFace: FONT, align: "center", valign: "middle",
  });
}

/** SLIDE 10 — Competitive Advantage */
function slide10Moat(prs: PptxGenJS) {
  const slide = prs.addSlide();
  lightBg(slide);
  badge(slide, "Why We Win", 0.65, 0.55, false);
  sectionNum(slide, "10", false);

  slide.addText("Built for govcon.\nNot adapted for it.", {
    x: 0.65, y: 1.0, w: 9.5, h: 1.4,
    fontSize: 40, bold: true, color: B.ink,
    fontFace: FONT,
  });

  const advantages = [
    {
      n: "01",
      title: "Anti-Fluff Enforcement",
      body: "Evaluators want precision. Our engine prohibits marketing jargon — substituting adjectives with hard metrics, named technologies, and verified past-performance artifacts.",
    },
    {
      n: "02",
      title: "Weaponized Agency Intelligence",
      body: "Profile the target agency's scoring preferences, competitor history, and procurement pain points — then rewrite your entire pitch to mirror them exactly.",
    },
    {
      n: "03",
      title: "Zero-Defect Compliance Mapping",
      body: "Up to 30% of bids are disqualified for missing sub-bullets. IntentBid generates a micro-compliance matrix for every section — automatically.",
    },
    {
      n: "04",
      title: "Visual Density by Design",
      body: "Mermaid diagrams for methodology, timeline, and architecture. Evaluators score documents that look expensive — we generate them in seconds.",
    },
  ];

  advantages.forEach((a, i) => {
    listItem(slide, a.n, a.title, a.body, 0.65 + (i % 2) * 6.2, 2.7 + Math.floor(i / 2) * 1.55, false);
  });
}

/** SLIDE 11 — Go-To-Market */
function slide11GTM(prs: PptxGenJS) {
  const slide = prs.addSlide();
  darkBg(slide);
  badge(slide, "Go-To-Market", 0.65, 0.55);
  sectionNum(slide, "11");

  slide.addText("Start local.\nScale everywhere.", {
    x: 0.65, y: 1.0, w: 9, h: 1.4,
    fontSize: 40, bold: true, color: B.white,
    fontFace: FONT,
  });

  slide.addText("We enter through the underserved small business market — where the ROI is immediate and the incumbents are complacent.", {
    x: 0.65, y: 2.55, w: 11.5, h: 0.45,
    fontSize: 12.5, color: B.inkMuted,
    fontFace: FONT,
  });

  const wedges = [
    {
      title: "Local & Small Business",
      icon: "🏙️",
      points: [
        "City, county & state contracts first",
        "Landscaping, janitorial, IT, security, catering",
        "Businesses with no proposal capability today",
        "Fastest path to first dollar — highest pain point",
      ],
    },
    {
      title: "State & Regional Scale",
      icon: "🗺️",
      points: [
        "50-state Sunshine Law coverage",
        "SLED agencies: schools, utilities, transit",
        "Teams graduating from local to statewide",
        "Higher ACV as volume grows",
      ],
    },
    {
      title: "Federal & Enterprise",
      icon: "🏛️",
      points: [
        "Federal contracts — established contractors",
        "DoD, civilian agencies, GSA schedules",
        "Enterprise white-label & team features",
        "Highest LTV — deepest switching cost",
      ],
    },
  ];

  wedges.forEach((w, i) => {
    const x = 0.65 + i * 4.18;
    slide.addShape("roundRect", {
      x, y: 3.1, w: 3.85, h: 3.8,
      fill: { type: "solid", color: B.darkCard },
      line: { color: B.purple, width: 0.75, transparency: 75 },
      rectRadius: 0.14,
    });
    slide.addText(w.icon, {
      x, y: 3.25, w: 3.85, h: 0.55,
      fontSize: 26, align: "center",
      fontFace: FONT,
    });
    slide.addText(w.title, {
      x: x + 0.2, y: 3.88, w: 3.45, h: 0.4,
      fontSize: 13, bold: true, color: B.white,
      fontFace: FONT, align: "center",
    });
    rule(slide, x + 0.3, 4.35, 3.25, B.purple);
    w.points.forEach((p, j) => {
      slide.addText(`·  ${p}`, {
        x: x + 0.25, y: 4.45 + j * 0.55, w: 3.35, h: 0.5,
        fontSize: 10, color: B.inkMuted,
        fontFace: FONT,
      });
    });
  });
}

/** SLIDE 12 — Use of Funds */
function slide12UseOfFunds(prs: PptxGenJS) {
  const slide = prs.addSlide();
  lightBg(slide);
  badge(slide, "Use of Funds", 0.65, 0.55, false);
  sectionNum(slide, "12", false);

  slide.addText("$1M seed round.\nPurpose-built deployment.", {
    x: 0.65, y: 1.0, w: 9, h: 1.4,
    fontSize: 40, bold: true, color: B.ink,
    fontFace: FONT,
  });

  const allocations = [
    { pct: "40%", label: "Product & Engineering",    body: "Intelligence service expansion, mobile app, Google Slides live sync, white-label platform" },
    { pct: "30%", label: "Sales & Marketing",         body: "GTM team, govcon conference presence, content marketing, early customer success" },
    { pct: "20%", label: "Operations & Compliance",   body: "SOC2 Type II audit, FedRAMP readiness, legal, finance infrastructure" },
    { pct: "10%", label: "Reserve",                   body: "12-month runway buffer, opportunistic hires, unforeseen compliance costs" },
  ];

  allocations.forEach((a, i) => {
    const x = 0.65 + (i % 2) * 6.2;
    const y = 2.65 + Math.floor(i / 2) * 1.75;

    slide.addShape("roundRect", {
      x, y, w: 5.85, h: 1.55,
      fill: { type: "solid", color: B.white },
      line: { color: B.purple, width: 0.75, transparency: 82 },
      rectRadius: 0.12,
      shadow: { type: "outer", color: "000000", blur: 6, offset: 2, angle: 270, transparency: 93 },
    });

    // Percent pill
    slide.addShape("roundRect", {
      x: x + 0.2, y: y + 0.2, w: 0.72, h: 0.35,
      fill: { type: "solid", color: B.purple },
      line: { type: "none" },
      rectRadius: 0.08,
    });
    slide.addText(a.pct, {
      x: x + 0.2, y: y + 0.2, w: 0.72, h: 0.35,
      fontSize: 11, bold: true, color: B.white,
      fontFace: FONT, align: "center", valign: "middle",
    });

    slide.addText(a.label, {
      x: x + 1.05, y: y + 0.2, w: 4.6, h: 0.38,
      fontSize: 13, bold: true, color: B.ink,
      fontFace: FONT,
    });
    slide.addText(a.body, {
      x: x + 0.2, y: y + 0.7, w: 5.45, h: 0.6,
      fontSize: 10.5, color: B.inkSecond,
      fontFace: FONT,
    });
  });

  slide.addText("18-month runway  ·  Target: $500K ARR by month 12", {
    x: 0.65, y: 6.55, w: 11, h: 0.4,
    fontSize: 12.5, color: B.purple, bold: true,
    fontFace: FONT,
  });
}

/** SLIDE 13 — Team */
function slide13Team(prs: PptxGenJS) {
  const slide = prs.addSlide();
  darkBg(slide);
  badge(slide, "Team", 0.65, 0.55);
  sectionNum(slide, "13");

  slide.addText("Founded in Seattle by two people\nwho saw the gap from different sides.", {
    x: 0.65, y: 1.0, w: 11.5, h: 1.4,
    fontSize: 36, bold: true, color: B.white,
    fontFace: FONT,
  });

  const founders = [
    {
      initials: "MM",
      name: "Matt McKinney",
      role: "Co-Founder",
      bio: "Growth and product leader who scaled AI/SaaS platforms. Previously at AIGNE (ArcBlock). Seattle University.",
      links: "linkedin.com/in/mtmckinney",
    },
    {
      initials: "CC",
      name: "Charles Chen",
      role: "Co-Founder",
      bio: "Strategic technologist with 30+ years in enterprise IT and cybersecurity. Northwestern University. Los Angeles.",
      links: "linkedin.com/in/voipchuck",
    },
  ];

  founders.forEach((f, i) => {
    const x = 0.65 + i * 6.2;

    slide.addShape("roundRect", {
      x, y: 2.65, w: 5.85, h: 3.7,
      fill: { type: "solid", color: B.darkCard },
      line: { color: B.purple, width: 0.75, transparency: 75 },
      rectRadius: 0.14,
    });

    // Avatar circle
    slide.addShape("ellipse", {
      x: x + 0.3, y: 2.9, w: 0.9, h: 0.9,
      fill: { type: "solid", color: B.purple },
      line: { type: "none" },
    });
    slide.addText(f.initials, {
      x: x + 0.3, y: 2.9, w: 0.9, h: 0.9,
      fontSize: 16, bold: true, color: B.white,
      fontFace: FONT, align: "center", valign: "middle",
    });

    slide.addText(f.name, {
      x: x + 1.35, y: 2.9, w: 4.3, h: 0.42,
      fontSize: 16, bold: true, color: B.white,
      fontFace: FONT,
    });
    slide.addText(f.role, {
      x: x + 1.35, y: 3.3, w: 4.3, h: 0.3,
      fontSize: 11, color: B.purple,
      fontFace: FONT,
    });

    rule(slide, x + 0.3, 3.75, 5.25, B.purple);

    slide.addText(f.bio, {
      x: x + 0.3, y: 3.9, w: 5.25, h: 1.2,
      fontSize: 11.5, color: B.inkMuted,
      fontFace: FONT,
    });
    slide.addText(f.links, {
      x: x + 0.3, y: 5.15, w: 5.25, h: 0.3,
      fontSize: 10, color: B.purpleLight,
      fontFace: FONT, underline: true,
    });
  });
}

/** SLIDE 14 — Vision & Roadmap */
function slide14Roadmap(prs: PptxGenJS) {
  const slide = prs.addSlide();
  lightBg(slide);
  badge(slide, "Vision & Roadmap", 0.65, 0.55, false);
  sectionNum(slide, "14", false);

  slide.addText("The proposal is just\nthe beginning.", {
    x: 0.65, y: 1.0, w: 9, h: 1.4,
    fontSize: 40, bold: true, color: B.ink,
    fontFace: FONT,
  });

  slide.addText("IntentBid becomes the operating system for every government contract — from opportunity discovery to award.", {
    x: 0.65, y: 2.55, w: 11, h: 0.5,
    fontSize: 13, color: B.inkSecond,
    fontFace: FONT,
  });

  const phases = [
    {
      phase: "Now",
      label: "Proposal Engine",
      items: ["RFP intake & AI generation", "Intelligence layer live", "Multi-format export", "Early access customers"],
      color: B.purple,
    },
    {
      phase: "6 Mo",
      label: "Win Intelligence",
      items: ["Win probability scoring", "Competitive analysis AI", "FOIA inbound tracking", "Self-serve checkout"],
      color: B.indigo,
    },
    {
      phase: "12 Mo",
      label: "Platform",
      items: ["CRM & pipeline integration", "FedRAMP readiness", "Agency marketplace listings", "White-label enterprise"],
      color: "818CF8",
    },
    {
      phase: "18 Mo",
      label: "Category Leader",
      items: ["$500K ARR milestone", "Series A positioning", "API partner ecosystem", "International expansion"],
      color: B.pink,
    },
  ];

  phases.forEach((p, i) => {
    const x = 0.65 + i * 3.15;
    slide.addShape("roundRect", {
      x, y: 3.2, w: 2.9, h: 3.75,
      fill: { type: "solid", color: B.white },
      line: { color: p.color, width: 1.5, transparency: 0 },
      rectRadius: 0.12,
      shadow: { type: "outer", color: "000000", blur: 8, offset: 2, angle: 270, transparency: 91 },
    });
    // Phase badge
    slide.addShape("roundRect", {
      x: x + 0.2, y: 3.35, w: 0.9, h: 0.32,
      fill: { type: "solid", color: p.color },
      line: { type: "none" },
      rectRadius: 0.06,
    });
    slide.addText(p.phase, {
      x: x + 0.2, y: 3.35, w: 0.9, h: 0.32,
      fontSize: 9, bold: true, color: B.white,
      fontFace: FONT, align: "center", valign: "middle",
    });
    slide.addText(p.label, {
      x: x + 0.2, y: 3.78, w: 2.5, h: 0.42,
      fontSize: 14, bold: true, color: B.ink,
      fontFace: FONT,
    });
    rule(slide, x + 0.2, 4.28, 2.5, p.color);
    p.items.forEach((item, j) => {
      slide.addText(`→  ${item}`, {
        x: x + 0.2, y: 4.38 + j * 0.55, w: 2.5, h: 0.5,
        fontSize: 10, color: B.inkSecond,
        fontFace: FONT,
      });
    });
  });
}

/** SLIDE 15 — Closing / Ask */
function slide15Closing(prs: PptxGenJS) {
  const slide = prs.addSlide();
  darkBg(slide);

  // Big decorative dot grid
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 12; c++) {
      slide.addShape("ellipse", {
        x: 0.5 + c * 1.06, y: 0.3 + r * 0.9,
        w: 0.07, h: 0.07,
        fill: { type: "solid", color: B.purple },
        line: { type: "none" },
        transparency: 78,
      });
    }
  }

  // Centered card
  slide.addShape("roundRect", {
    x: 1.8, y: 1.2, w: 9.7, h: 5.2,
    fill: { type: "solid", color: B.darkCard },
    line: { color: B.purple, width: 1, transparency: 70 },
    rectRadius: 0.2,
    shadow: { type: "outer", color: B.purple, blur: 30, offset: 0, angle: 270, transparency: 80 },
  });

  slide.addText("IB", {
    x: 1.8, y: 1.35, w: 9.7, h: 0.7,
    fontSize: 13, bold: true, color: B.purpleLight,
    fontFace: FONT, align: "center",
  });

  slide.addText("Ready to win more?", {
    x: 2.0, y: 2.15, w: 9.3, h: 0.8,
    fontSize: 44, bold: true, color: B.white,
    fontFace: FONT, align: "center",
  });

  slide.addText("We're raising $1M to become the operating system\nfor government contract proposals.", {
    x: 2.5, y: 3.1, w: 8.3, h: 0.85,
    fontSize: 16, color: B.inkMuted,
    fontFace: FONT, align: "center",
  });

  rule(slide, 4.5, 4.1, 4.3, B.purple);

  const contacts = [
    { label: "Website", val: "intentbid.com" },
    { label: "App",     val: "app.intentbid.com" },
    { label: "Email",   val: "gov@intentbid.com" },
  ];
  contacts.forEach((c, i) => {
    slide.addText(`${c.label}:  ${c.val}`, {
      x: 2.5, y: 4.3 + i * 0.35, w: 8.3, h: 0.32,
      fontSize: 12, color: B.purpleLight,
      fontFace: FONT, align: "center",
    });
  });

  slide.addText("IntentBid  ·  Seed 2026  ·  Seattle, WA", {
    x: 2.5, y: 5.8, w: 8.3, h: 0.35,
    fontSize: 10, color: B.inkMuted,
    fontFace: FONT, align: "center",
  });
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  const prs = new PptxGenJS();

  // Presentation metadata
  prs.layout = "LAYOUT_WIDE"; // 13.33" × 7.5" (16:9)
  prs.author = "IntentBid";
  prs.company = "IntentBid";
  prs.subject = "IntentBid Seed Round Pitch Deck — 2026";
  prs.title = "IntentBid — Stop Writing Proposals. Start Engineering Wins.";

  console.log("Building pitch deck...");

  slide01Cover(prs);          console.log("  01 Cover ✓");
  slide02Problem(prs);        console.log("  02 Problem ✓");
  slide03Solution(prs);       console.log("  03 Solution ✓");
  slide04Product(prs);        console.log("  04 Product ✓");
  slide05Intelligence(prs);   console.log("  05 Intelligence ✓");
  slide06BeforeAfter(prs);    console.log("  06 Before/After ✓");
  slide07Market(prs);         console.log("  07 Market ✓");
  slide08BusinessModel(prs);  console.log("  08 Business Model ✓");
  slide09Traction(prs);       console.log("  09 Traction ✓");
  slide10Moat(prs);           console.log("  10 Competitive Moat ✓");
  slide11GTM(prs);            console.log("  11 Go-To-Market ✓");
  slide12UseOfFunds(prs);     console.log("  12 Use of Funds ✓");
  slide13Team(prs);           console.log("  13 Team ✓");
  slide14Roadmap(prs);        console.log("  14 Roadmap ✓");
  slide15Closing(prs);        console.log("  15 Closing / Ask ✓");

  const outPath = path.join(process.cwd(), "intentbid-pitch-deck.pptx");
  await prs.writeFile({ fileName: outPath });

  console.log(`\nDone! Saved to: ${outPath}`);
  console.log(`Slides: 15 | Format: 16:9 widescreen`);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
