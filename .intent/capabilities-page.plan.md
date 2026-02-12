# Execution Plan: capabilities-page

## Overview

Create a sales-ready `/capabilities` page showcasing IntentWin's IDD methodology, multi-model AI architecture, quality oversight, and evidence-based generation. 9 sections, reusing the `.vf-` design system from the existing landing page.

## Prerequisites

- Existing landing page at `src/app/(public)/landing/LandingContent.tsx` with `.vf-` CSS system
- Animation utilities in `src/styles/public.css` (`.animate-fadeInUp`, `.animate-fadeIn`, etc.)
- No external package dependencies beyond what's already installed

---

## Phase 0: Page Scaffold + Hero + Problem Sections (§1-§2)

### Description

Create the page routing structure, server component with SEO metadata, client component shell, navigation link from landing page, and the first two sections: Hero and Problem cards.

**Deliverables:**

- `src/app/(public)/capabilities/page.tsx` — Server component with metadata + JSON-LD
- `src/app/(public)/capabilities/CapabilitiesContent.tsx` — Client component with §1 Hero + §2 Problem
- Navigation "Capabilities" link added to `LandingContent.tsx`
- New `.vf-cap-*` CSS classes in `public.css`

### Tests

#### Happy Path

- [x] `/capabilities` route returns 200 status
- [x] Page renders Hero section with heading "Proposals Engineered, Not Prompted"
- [x] Page renders "Request Access" CTA button in hero
- [x] Page renders 3 problem cards (Generic AI, No Quality Control, No Evidence Trail)
- [x] "Capabilities" link appears in landing page navigation
- [x] Clicking nav link navigates to `/capabilities`
- [x] Hero badge displays "THE INTENTWIN PLATFORM"
- [x] Problem cards have icons and body text

#### Bad Path

- [x] Page renders without errors when accessed directly (no referrer)
- [x] Page handles window resize without layout breakage
- [x] Navigation link doesn't break existing landing page layout

#### Edge Cases

- [x] Page renders correctly at 320px mobile width
- [x] Page renders correctly at 1920px desktop width
- [x] Hero heading wraps properly on small screens
- [x] Problem cards stack vertically on mobile (single column)

#### Security

- [x] No inline event handlers that could enable XSS
- [x] "Request Access" link uses safe href (internal route or mailto)
- [x] No sensitive data (API keys, internal URLs) in page source

#### Data Leak

- [x] Page source does not expose internal API endpoints
- [x] No environment variables rendered in client-side HTML
- [x] Meta tags contain only public marketing content

#### Data Damage

- [x] Adding capabilities page does not break existing landing page
- [x] Adding nav link does not alter other nav links' behavior
- [x] `next build` completes successfully with new page

### E2E Gate

```bash
# Build succeeds
npx next build 2>&1 | grep -E "Compiled|error"

# Dev server check (start dev, check route, stop)
npx next dev --port 3099 &
DEV_PID=$!
sleep 8
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3099/capabilities)
kill $DEV_PID 2>/dev/null
[ "$HTTP_STATUS" = "200" ] && echo "✓ /capabilities returns 200" || echo "✗ Got $HTTP_STATUS"
```

### Acceptance Criteria

- [x] All 6 test categories pass
- [x] `/capabilities` renders Hero + Problem sections
- [x] Navigation link visible on landing page
- [x] Mobile responsive (320px-1920px)
- [x] Code committed and pushed

---

## Phase 1: IDD Methodology + Workflow Walkthrough (§3-§4)

### Description

Build the centerpiece IDD methodology section (deep-dive 6-layer interactive visualization) and the 5-step workflow walkthrough (technical pipeline focus). These differentiate from the landing page by going deeper into how IntentWin actually works.

**Deliverables:**

- §3: Interactive 6-layer IDD visualization with hover/click expand
- §4: 5-step numbered workflow with alternating left/right layout
- CSS animations reusing existing `.animate-*` utilities

### Tests

#### Happy Path

- [x] IDD section renders 6 layers with names and descriptions
- [x] Clicking/hovering a layer reveals its detailed description
- [x] Active layer is visually highlighted (purple glow)
- [x] Only one layer expanded at a time
- [x] Workflow section renders 5 steps with numbered indicators (01-05)
- [x] Steps display correct text: Define Intent, Set Win Strategy, Generate with Evidence, Quality Overseer Reviews, Export & Win
- [x] Steps have alternating left/right layout on desktop

#### Bad Path

- [x] Rapid clicking between layers doesn't cause visual glitches
- [x] Clicking same layer twice collapses it (toggle behavior)
- [x] Workflow renders properly even if animations are disabled (prefers-reduced-motion)

#### Edge Cases

- [x] Layers render correctly with very long description text
- [x] Layer descriptions don't overflow container on mobile
- [x] Workflow steps stack vertically on mobile (no left/right alternation)
- [x] Section renders without JavaScript (SSR fallback shows all layers expanded)

#### Security

- [x] Layer descriptions don't render raw HTML (text-only)
- [x] No dangerouslySetInnerHTML usage

#### Data Leak

- [x] No internal methodology details beyond what's publicly marketable
- [x] No references to internal code paths or architecture

#### Data Damage

- [x] Adding §3-§4 doesn't break existing §1-§2 sections
- [x] State management (activeLayer) doesn't leak into other components

### E2E Gate

```bash
# Build succeeds
npx next build 2>&1 | grep -E "Compiled|error"

# Check page renders with new sections
npx next dev --port 3099 &
DEV_PID=$!
sleep 8
PAGE_HTML=$(curl -s http://localhost:3099/capabilities)
kill $DEV_PID 2>/dev/null

echo "$PAGE_HTML" | grep -q "Strategic Intent" && echo "✓ IDD layers present" || echo "✗ IDD layers missing"
echo "$PAGE_HTML" | grep -q "Define Intent" && echo "✓ Workflow steps present" || echo "✗ Workflow steps missing"
echo "$PAGE_HTML" | grep -q "Quality Overseer" && echo "✓ Overseer step present" || echo "✗ Overseer step missing"
```

### Acceptance Criteria

- [x] All 6 test categories pass
- [x] IDD section is interactive (click to expand layers)
- [x] Workflow shows 5 distinct steps
- [x] Both sections responsive at all breakpoints
- [x] Code committed and pushed

---

## Phase 2: Architecture + Evidence + Quality Sections (§5-§7)

### Description

Build the technical showcase sections: Multi-Model AI Architecture diagram, Evidence-Based Generation (L1/L2 visual), and Quality Guarantee (Overseer with scoring bars).

**Deliverables:**

- §5: 3-model architecture diagram (Claude/GPT-4o/Gemini → Proposal)
- §6: Two-tier L1/L2 knowledge system visual with evidence library
- §7: Quality Overseer with 4 animated scoring dimension bars

### Tests

#### Happy Path

- [x] Architecture section renders 3 model cards (Claude, GPT-4o, Gemini)
- [x] Each model card shows role and key stats
- [x] Model cards have connecting visual leading to "Your Proposal"
- [x] Evidence section renders L1 (Company Truth) and L2 (Reference Docs) side by side
- [x] L1 shows 5 items (Brand & Values, Certifications, Products, Partnerships, Legal)
- [x] L2 shows 4 items (Past Proposals, Case Studies, RFP Responses, Technical Docs)
- [x] Evidence Library section shows tags (Case Studies, Metrics, Testimonials, Awards, Certifications)
- [x] Quality section renders heading "The Quality Overseer"
- [x] 4 scoring bars displayed (Content Quality, Client Fit, Evidence Level, Brand Voice)
- [x] Scoring bars have visual fill with purple gradient

#### Bad Path

- [x] Sections render without errors if CSS animations fail to load
- [x] Scoring bars handle edge values (0, 10) without visual overflow

#### Edge Cases

- [x] L1/L2 cards stack vertically on mobile
- [x] Architecture model cards wrap to 2+1 or stack on mobile
- [x] Scoring bars are readable at 320px width
- [x] Very long evidence item text wraps properly

#### Security

- [x] No executable JavaScript in rendered content
- [x] Model names and descriptions are hardcoded (no dynamic injection)

#### Data Leak

- [x] No actual API endpoints or model configuration exposed
- [x] Scoring threshold (8.5) is the only number shown — no internal scores

#### Data Damage

- [x] Adding §5-§7 doesn't break §1-§4 sections
- [x] No CSS class conflicts with existing `.vf-` classes

### E2E Gate

```bash
# Build succeeds
npx next build 2>&1 | grep -E "Compiled|error"

# Check all 3 sections render
npx next dev --port 3099 &
DEV_PID=$!
sleep 8
PAGE_HTML=$(curl -s http://localhost:3099/capabilities)
kill $DEV_PID 2>/dev/null

echo "$PAGE_HTML" | grep -q "CLAUDE" && echo "✓ Architecture models present" || echo "✗ Architecture models missing"
echo "$PAGE_HTML" | grep -q "Company Truth" && echo "✓ Evidence L1 present" || echo "✗ Evidence L1 missing"
echo "$PAGE_HTML" | grep -q "Quality Overseer" && echo "✓ Quality section present" || echo "✗ Quality section missing"
echo "$PAGE_HTML" | grep -q "Content Quality" && echo "✓ Scoring dimensions present" || echo "✗ Scoring dimensions missing"
```

### Acceptance Criteria

- [x] All 6 test categories pass
- [x] Architecture diagram clearly shows 3 models and their roles
- [x] Evidence section distinguishes L1 vs L2 knowledge
- [x] Quality bars are visually polished with gradient fill
- [x] All sections responsive
- [x] Code committed and pushed

---

## Phase 3: Capability Grid + Footer CTA + Polish (§8-§9)

### Description

Build the 6-card capability grid, footer CTA, and final responsive/visual polish pass across all 9 sections.

**Deliverables:**

- §8: 3×2 card grid (Persuasion Frameworks, Export, Compliance, Brand Voice, Version History, Review)
- §9: Footer CTA with "Stop prompting. Start winning." heading
- Responsive polish for all breakpoints
- Final animation timing and visual consistency pass

### Tests

#### Happy Path

- [x] Capability grid renders 6 cards in 3×2 layout on desktop
- [x] Each card has icon, title, and description text
- [x] Cards have hover effect (border glow + slight lift)
- [x] Footer CTA shows "Stop prompting. Start winning." heading
- [x] Footer shows "Request Early Access" button
- [x] Footer shows trust statement (No credit card, Setup in minutes, SOC 2)
- [x] Full page scrolls smoothly through all 9 sections
- [x] All animations trigger correctly during scroll

#### Bad Path

- [x] Grid cards render readable even if CSS hover effects fail
- [x] Footer CTA button works even without JavaScript
- [x] Page handles rapid scrolling without animation jank

#### Edge Cases

- [x] Grid becomes 2×3 on tablet and 1×6 on mobile
- [x] Footer CTA is visible and clickable on all viewports
- [x] Page total height is reasonable (not excessively long)
- [x] All 9 sections visible in correct order on mobile

#### Security

- [x] "Request Early Access" button links to safe internal route
- [x] Trust statement doesn't make unverifiable claims (check SOC 2 claim)
- [x] No external tracking scripts or third-party resources loaded

#### Data Leak

- [x] Footer doesn't expose internal build version or environment
- [x] No analytics identifiers in page source

#### Data Damage

- [x] Complete page doesn't impact existing landing page performance
- [x] Shared CSS changes don't alter existing pages' appearance
- [x] Navigation updates don't break mobile hamburger menu (if exists)

### E2E Gate

```bash
# Build succeeds
npx next build 2>&1 | grep -E "Compiled|error"

# Full page verification
npx next dev --port 3099 &
DEV_PID=$!
sleep 8
PAGE_HTML=$(curl -s http://localhost:3099/capabilities)
kill $DEV_PID 2>/dev/null

# Verify all 9 sections present
echo "$PAGE_HTML" | grep -q "Proposals Engineered" && echo "✓ §1 Hero" || echo "✗ §1 missing"
echo "$PAGE_HTML" | grep -q "Generic AI" && echo "✓ §2 Problem" || echo "✗ §2 missing"
echo "$PAGE_HTML" | grep -q "Strategic Intent" && echo "✓ §3 IDD" || echo "✗ §3 missing"
echo "$PAGE_HTML" | grep -q "Define Intent" && echo "✓ §4 Workflow" || echo "✗ §4 missing"
echo "$PAGE_HTML" | grep -q "CLAUDE" && echo "✓ §5 Architecture" || echo "✗ §5 missing"
echo "$PAGE_HTML" | grep -q "Company Truth" && echo "✓ §6 Evidence" || echo "✗ §6 missing"
echo "$PAGE_HTML" | grep -q "Quality Overseer" && echo "✓ §7 Quality" || echo "✗ §7 missing"
echo "$PAGE_HTML" | grep -q "Persuasion Frameworks" && echo "✓ §8 Grid" || echo "✗ §8 missing"
echo "$PAGE_HTML" | grep -q "Stop prompting" && echo "✓ §9 CTA" || echo "✗ §9 missing"

# Verify landing page nav link
LANDING_HTML=$(curl -s http://localhost:3099/)
echo "$LANDING_HTML" | grep -q 'capabilities' && echo "✓ Nav link present" || echo "✗ Nav link missing"
```

### Acceptance Criteria

- [x] All 6 test categories pass
- [x] All 9 sections render correctly
- [x] Responsive at 320px, 768px, 1024px, 1920px
- [x] Page loads in under 3 seconds
- [x] No console errors
- [x] Code committed and pushed

---

## Final E2E Verification

```bash
# Full build
npx next build 2>&1 | grep -E "Compiled|error"

# Start server and verify both pages
npx next dev --port 3099 &
DEV_PID=$!
sleep 8

# Capabilities page
CAP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3099/capabilities)
echo "Capabilities: $CAP_STATUS"

# Landing page still works
LAND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3099/)
echo "Landing: $LAND_STATUS"

# Both should be 200
kill $DEV_PID 2>/dev/null
[ "$CAP_STATUS" = "200" ] && [ "$LAND_STATUS" = "200" ] && echo "✓ ALL PASS" || echo "✗ FAIL"
```

## Risk Mitigation

| Risk                                            | Mitigation                                            | Contingency                              |
| ----------------------------------------------- | ----------------------------------------------------- | ---------------------------------------- |
| Page too long for execs                         | Each section scannable: bold heading + 2-line summary | Add section anchors + mini-nav           |
| CSS conflicts with existing `.vf-`              | Use `.vf-cap-` prefix for new classes                 | Namespace all new styles                 |
| Animation performance on mobile                 | CSS-only animations, no JS animation libs             | Add `prefers-reduced-motion` media query |
| Large file size (all sections in one component) | Split into sub-components if > 800 lines              | Extract section components               |

## References

- [Intent](./capabilities-page.intent.md)
- [Existing Landing](<../src/app/(public)/landing/LandingContent.tsx>)
- [CSS System](../src/styles/public.css)
