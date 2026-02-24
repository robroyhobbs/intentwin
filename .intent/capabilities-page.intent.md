# IntentBid Capabilities Landing Page

## 1. Overview

**Product positioning:** A separate, sales-ready `/capabilities` page that serves as the deep-dive product showcase for C-suite decision makers evaluating IntentBid. Positioned as the "how it actually works" counterpart to the conversion-focused main landing page.

**Core concept:** Visually walk executives through IntentBid's proprietary IDD methodology and multi-model AI architecture, proving this is not "another ChatGPT wrapper" but an engineered proposal system.

**Target user:** VP/Director-level decision makers who care about ROI, risk reduction, competitive advantage, and defensible process.

**Priority:** High — needed now for active sales conversations.

**Project scope:** Single new page at `/capabilities`, reusing the existing `.vf-` design system from `LandingContent.tsx`, with CSS-only scroll animations and a "Request Access" CTA.

---

## 2. Architecture

### Page Structure (Top to Bottom)

```
┌──────────────────────────────────────────────┐
│  SHARED NAV (from existing landing)          │
├──────────────────────────────────────────────┤
│  §1  HERO                                    │
│      "Proposals Engineered, Not Prompted"    │
│      Subtitle + Request Access CTA           │
├──────────────────────────────────────────────┤
│  §2  THE PROBLEM                             │
│      3-column pain point cards               │
│      (Generic AI / No QA / No Evidence)      │
├──────────────────────────────────────────────┤
│  §3  IDD METHODOLOGY (Centerpiece)           │
│      Interactive 6-layer visualization        │
│      Each layer: name + one-line + expand    │
│      Reuse existing Intent Framework design  │
├──────────────────────────────────────────────┤
│  §4  ANIMATED WORKFLOW WALKTHROUGH           │
│      5-step scroll animation:                │
│      Intake → Win Strategy → Generate →      │
│      Quality Overseer → Export               │
│      Each step fades in on scroll            │
├──────────────────────────────────────────────┤
│  §5  MULTI-MODEL AI ARCHITECTURE             │
│      Visual showing 3 models + their roles:  │
│      Claude (generate) / GPT-4o (review) /   │
│      Gemini (diagrams + fallback)            │
│      "Best model for each job"               │
├──────────────────────────────────────────────┤
│  §6  EVIDENCE-BASED GENERATION               │
│      L1/L2 knowledge system visual           │
│      L1: Company Truth (verified facts)      │
│      L2: Reference Docs (RAG search)         │
│      Evidence Library (case studies, metrics) │
├──────────────────────────────────────────────┤
│  §7  QUALITY GUARANTEE                       │
│      The Overseer section                    │
│      "Every section scored. Weak content     │
│       auto-remediated. 8.5+ threshold."      │
│      4-dimension scoring visual              │
├──────────────────────────────────────────────┤
│  §8  CAPABILITY GRID                         │
│      6-card grid of additional features:     │
│      - 15 Persuasion Frameworks              │
│      - 5-Format Export                       │
│      - Compliance Tracking                   │
│      - Brand Voice                           │
│      - Version History                       │
│      - Review & Annotations                  │
├──────────────────────────────────────────────┤
│  §9  FOOTER CTA                              │
│      "Ready to win more?"                    │
│      Request Access button                   │
│      Trust statement                         │
├──────────────────────────────────────────────┤
│  SHARED FOOTER                               │
└──────────────────────────────────────────────┘
```

### File Structure

```
src/app/(public)/capabilities/
├── page.tsx                    # Server component wrapper (metadata, JSON-LD)
└── CapabilitiesContent.tsx     # Client component (all sections)

src/styles/public.css           # Extend with new .vf-cap-* classes
```

### Design System

Reuse existing `.vf-` design system:

- **Background:** `#09090b` (near black)
- **Text:** `#a1a1aa` (light gray), `#fafafa` (white headings)
- **Primary gradient:** `linear-gradient(135deg, #7c3aed, #6366f1)` (purple→indigo)
- **Accent:** `#a78bfa` (light purple)
- **Borders:** `rgba(255, 255, 255, 0.06)`
- **Fonts:** Space Grotesk (body) + Playfair Display (display headings)

---

## 3. Detailed Section Specs

### §1 Hero

```
Badge: "THE INTENTWIN PLATFORM"
H1: "Proposals Engineered, Not Prompted"
Subtitle: "A multi-model AI system with built-in quality oversight,
           evidence-based generation, and a methodology that turns
           every proposal into a competitive weapon."
CTA: [Request Access] (primary purple)
```

- Radial gradient glow behind heading (reuse `.vf-hero` glow effect)
- Fade-in-up animation on load
- Single CTA only — no "Watch Demo" until video content exists

### §2 The Problem (3 cards)

```
Card 1: "Generic AI Output"
  Icon: 🎲 (dice)
  Body: "ChatGPT doesn't know your company, your client, or your
         win themes. Every proposal starts from zero."

Card 2: "No Quality Control"
  Icon: 🔍 (missing)
  Body: "AI-generated content ships without review. One weak section
         kills the entire proposal's credibility."

Card 3: "No Evidence Trail"
  Icon: 📎 (broken)
  Body: "Claims without proof points. Case studies cited from memory,
         not from your verified evidence library."
```

- Cards appear with staggered fade-in on scroll
- Dark card backgrounds with subtle border glow

### §3 IDD Methodology (Centerpiece — Deep Dive)

**Note:** The main landing page has a brief "Intent Framework" section. This version goes DEEPER — showing methodology details, real examples, and process breakdowns that the landing page overview doesn't cover. This is the "how it actually works" version.

Expand the 6-layer design with detailed descriptions per layer:

| Layer | Name                   | Description                                                                           |
| ----- | ---------------------- | ------------------------------------------------------------------------------------- |
| 1     | Strategic Intent       | Win themes, target outcomes, competitive positioning defined before a word is written |
| 2     | Evidence Engine        | L1 company truth + L2 reference docs feed verified proof points into every section    |
| 3     | Persuasion Frameworks  | 15 section-specific frameworks (AIDA, PAS, STAR, FAB...) matched to content type      |
| 4     | Multi-Model Generation | Claude generates. GPT-4o reviews. Gemini renders diagrams. Best model for each job    |
| 5     | Quality Overseer       | Every section scored on 4 dimensions. Below 8.5? Auto-remediated and re-reviewed      |
| 6     | Compliance & Export    | Requirements tracked, gaps flagged, exported to PPTX/DOCX/PDF/HTML/Slides             |

- Hover/click each layer to reveal description
- Active layer highlighted with purple glow
- CSS transitions between layers

### §4 Animated Workflow Walkthrough (Technical Pipeline Focus)

**Note:** The main landing page has a "Human-in-the-Loop" section showing user collaboration. This version focuses on the TECHNICAL PIPELINE — what happens under the hood at each step. Different angle, complementary content.

5 steps, using existing animation patterns from `LandingContent.tsx`:

```
Step 1: "Define Intent"
  Visual: Intake form mockup
  Text: "Upload RFPs, paste requirements, or describe the opportunity.
         AI extracts structured data and generates client research."

Step 2: "Set Win Strategy"
  Visual: Win themes + outcomes cards
  Text: "AI suggests win themes, target outcomes, and differentiators.
         You refine. This becomes the north star for every section."

Step 3: "Generate with Evidence"
  Visual: Section cards being created with evidence badges
  Text: "15 sections generated simultaneously, each using the right
         persuasion framework with evidence from your knowledge base."

Step 4: "Quality Overseer Reviews"
  Visual: Scoring dashboard (4 dimensions, 8.5+ threshold)
  Text: "GPT-4o independently scores every section. Content below 8.5
         is auto-rewritten and re-reviewed. No weak content ships."

Step 5: "Export & Win"
  Visual: 5 format icons (PPTX, DOCX, PDF, HTML, Slides)
  Text: "One click to export in any format. Version history tracks
         every change. Compliance board ensures nothing is missed."
```

- Each step has a numbered indicator (01-05) with connecting line
- Steps alternate left/right layout
- Reuse existing animation CSS from `LandingContent.tsx` (no custom IntersectionObserver hook)

### §5 Multi-Model Architecture

Visual diagram showing three AI models:

```
┌─────────────────────────────────────────────┐
│          INTENTWIN AI ARCHITECTURE           │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ CLAUDE   │  │ GPT-4o   │  │ GEMINI   │  │
│  │          │  │          │  │          │  │
│  │ Generate │  │ Review   │  │ Diagrams │  │
│  │ 15 types │  │ Score    │  │ Images   │  │
│  │ of       │  │ 4 dims   │  │ Fallback │  │
│  │ sections │  │ Fix <8.5 │  │ gen      │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│       │              │              │        │
│       └──────────────┼──────────────┘        │
│                      │                       │
│              ┌───────┴───────┐               │
│              │  YOUR PROPOSAL │               │
│              │  9.0+ quality  │               │
│              └───────────────┘               │
└─────────────────────────────────────────────┘
```

- Rendered as styled divs (not ASCII in production)
- Each model card has icon, role, and key stats
- Connecting lines rendered with CSS borders/pseudo-elements
- Subtle animation: data "flowing" between models (pulse effect)

### §6 Evidence-Based Generation

Two-tier visual:

```
┌─────────────────────────┬─────────────────────────┐
│  L1: COMPANY TRUTH      │  L2: REFERENCE DOCS     │
│                         │                         │
│  ✓ Brand & Values       │  📄 Past Proposals      │
│  ✓ Certifications       │  📄 Case Studies        │
│  ✓ Products & Services  │  📄 RFP Responses       │
│  ✓ Partnerships         │  📄 Technical Docs      │
│  ✓ Legal Structure      │                         │
│                         │  Semantic search via     │
│  Verified. Locked.      │  Voyage AI embeddings    │
│  Your single source     │  finds relevant context  │
│  of truth.              │  for every section.      │
└────────────┬────────────┴────────────┬────────────┘
             │     EVIDENCE LIBRARY    │
             │  Case Studies · Metrics │
             │  Testimonials · Awards  │
             │  Certifications         │
             └─────────────────────────┘
```

- Two cards side by side with center merge
- Icons for each item type
- Bottom section shows evidence types as tags

### §7 Quality Guarantee

```
Heading: "The Quality Overseer"
Subheading: "Every section independently reviewed. Automatically."

4 scoring dimensions displayed as meter bars:
  Content Quality  ████████░░  8.5+
  Client Fit       █████████░  9.0+
  Evidence Level   ████████░░  8.5+
  Brand Voice      █████████░  9.0+

Below threshold text: "Sections scoring below 8.5 are automatically
rewritten with specific feedback, then re-reviewed. The cycle
continues until quality passes."
```

- Animated meter bars that fill on scroll
- Purple gradient fill for the bars
- Threshold line at 8.5 shown as red dashed line

### §8 Capability Grid

6 cards in a 3×2 grid:

| Card | Title                    | Detail                                                                             |
| ---- | ------------------------ | ---------------------------------------------------------------------------------- |
| 1    | 15 Persuasion Frameworks | AIDA, PAS, STAR, FAB... each section uses the right framework for its content type |
| 2    | 5-Format Export          | PPTX, DOCX, PDF, HTML, Google Slides — one click, branded, ready to send           |
| 3    | Compliance Tracking      | Requirements extracted from RFP, mapped to sections, gaps flagged automatically    |
| 4    | Brand Voice              | Your tone, your terminology, your language — enforced across every section         |
| 5    | Version History          | Full snapshot on every change. Compare, diff, restore with one click               |
| 6    | Review & Annotations     | Add comments, flag issues, AI auto-fixes addressed sections                        |

- Cards with subtle hover effect (border glow + slight lift)
- Icon + title + 1-2 line description
- Staggered fade-in on scroll

### §9 Footer CTA

```
Heading: "Stop prompting. Start winning."
Subtitle: "IntentBid is available for early access."
CTA: [Request Early Access] (large, primary)
Trust: "No credit card required · Setup in minutes · SOC 2 compliant"
```

---

## 4. Technical Implementation

### Scroll Animation System

**Reuse existing animation patterns from `LandingContent.tsx`** — do not create a parallel animation system. The existing landing page already has CSS animations and transition classes that should be adopted for consistency.

### Page Metadata

```typescript
export const metadata: Metadata = {
  title: "How IntentBid Works | AI Proposal Generation Platform",
  description:
    "See how IntentBid's Intent-Driven methodology, multi-model AI, and quality oversight create proposals that win.",
  openGraph: {
    title: "IntentBid Capabilities",
    description: "Proposals engineered, not prompted.",
  },
};
```

### Navigation Update

Add "Capabilities" link to the existing nav in `LandingContent.tsx`:

```tsx
<a href="/capabilities">Capabilities</a>
```

---

## 5. Decisions Summary

| Decision                 | Choice                                     | Rationale                                                                     |
| ------------------------ | ------------------------------------------ | ----------------------------------------------------------------------------- |
| Separate page vs. extend | Separate `/capabilities`                   | Keeps main landing as conversion funnel, this as deep-dive                    |
| Animation approach       | Reuse existing LandingContent.tsx patterns | No parallel system; consistency with main landing                             |
| IDD positioning          | Centerpiece — deeper than landing page     | Landing has overview; capabilities goes into methodology detail               |
| Workflow angle           | Technical pipeline focus                   | Landing covers human-in-loop; capabilities covers what happens under the hood |
| Social proof level       | Light — product stats only                 | Provable from product (15 frameworks, 5 formats, etc.)                        |
| CTA                      | Request Access only                        | Single CTA — no "Watch Demo" until video exists                               |
| Design system            | Reuse `.vf-` classes                       | Visual consistency with main landing                                          |
| Audience                 | C-suite / Decision Makers                  | Executive language, outcome-focused                                           |

---

## 6. MVP Scope

### Included

- All 9 sections as specified
- CSS scroll-reveal animations (fade-in, from-left, from-right)
- Interactive IDD layer visualization (reuse from existing landing)
- Responsive design (mobile breakpoints)
- SEO metadata + JSON-LD
- Navigation link from main landing
- "Request Access" form (can be mailto: or Typeform embed initially)

### Excluded

- Video/Lottie animations (future enhancement)
- Live product demo embed
- A/B testing variants
- Analytics event tracking (beyond Vercel Analytics)
- Pricing section (separate page already exists)
- Blog/resource links

---

## 7. Risks

| Risk                    | Mitigation                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| Page too long for execs | Each section is scannable with bold heading + 2-line summary. Full detail on expand/scroll |
| Claims without evidence | All stats are provable from product code (15 frameworks, 5 exports, 8.5 threshold)         |
| Design inconsistency    | Strict reuse of `.vf-` classes and existing color palette                                  |
| Mobile performance      | CSS-only animations, no heavy libraries, lazy image loading                                |

---

## 8. Critique Log

<!-- critique: 2026-02-11 -->

| #   | Finding                                     | Decision                           | Action Taken                                 |
| --- | ------------------------------------------- | ---------------------------------- | -------------------------------------------- |
| 1   | Scope: separate page vs inline              | Keep separate `/capabilities` page | Confirmed — no change needed                 |
| 2   | §3 + §4 duplicate existing landing sections | Go deeper on capabilities          | Updated §3 and §4 with differentiation notes |
| 3   | Custom animation system parallels existing  | Reuse existing patterns            | Removed custom `useScrollReveal` hook spec   |
| 4   | 9 sections for MVP is ambitious             | Build all 9                        | No scope reduction                           |
| 5   | "Watch Demo" CTA has no video               | Request Access only                | Removed Watch Demo from §1                   |
