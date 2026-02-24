# IntentBid Full UI/UX Audit

> Generated 2026-02-24. Covers all 31 pages, 19 sidebar items, 4 sections.

---

## Executive Summary

IntentBid has strong core functionality -- the proposal creation pipeline, intelligence integration, and export system all work end-to-end. The individual features are well-built. The problem is **cohesion**: the app feels like 4 separate products stitched together. Navigation is overwhelming (19 sidebar items), there are 3 overlapping knowledge management systems, loading/error patterns are inconsistent across sections, and new users have no guided path.

**Current UX Score: 6/10**

The path to 10/10 requires:
1. Simplifying navigation (19 items -> 12)
2. Eliminating redundancy (3 knowledge systems -> 1 unified section)
3. Adding a guided experience for new users
4. Standardizing interaction patterns across all sections
5. Connecting passive features (analytics, intelligence) to actionable workflows

---

## Page-by-Page Audit

### Page Inventory (31 total)

| # | Route | Section | Lines | Score | Status |
|---|-------|---------|-------|-------|--------|
| 1 | `/` | Public | 62 | 8/10 | Good -- smart auth redirect + SEO landing |
| 2 | `/demo-login` | Public | 71 | 7/10 | Functional demo gate |
| 3 | `/login` | Auth | 221 | 8/10 | Clean split-screen design |
| 4 | `/signup` | Auth | 517 | 7/10 | Multi-step with waitlist -- functional but long |
| 5 | `/landing` | Public | 7 | N/A | Just a redirect |
| 6 | `/request-access` | Public | 638 | 6/10 | Overlong for a waitlist form (638 lines!) |
| 7 | `/privacy` | Legal | 260 | 7/10 | Complete, standard |
| 8 | `/terms` | Legal | 339 | 7/10 | Complete, standard |
| 9 | `/proposals` | Dashboard | 267 | 8/10 | Strong dashboard with stats + filters |
| 10 | `/proposals/new` | Proposals | 692 | 7/10 | Powerful wizard, but no draft save |
| 11 | `/proposals/[id]` | Proposals | 682 | 8/10 | Rich editor with review/quality/compliance |
| 12 | `/proposals/[id]/export` | Proposals | 410 | 7/10 | 5 formats with live preview, but CLI deploy instructions |
| 13 | `/intelligence` | Intel | 125 | 6/10 | Good charts, no interactivity |
| 14 | `/intelligence/opportunities` | Intel | 311 | 8/10 | New, well-built with debounced filters |
| 15 | `/intelligence/rates` | Intel | 253 | 7/10 | Functional lookup tool |
| 16 | `/intelligence/awards` | Intel | 282 | 7/10 | Good search with detail panels |
| 17 | `/intelligence/about` | Intel | 193 | 6/10 | Informational, no actions |
| 18 | `/intelligence/foia` | Intel | 204 | 4/10 | No persistence, dead end |
| 19 | `/intelligence/agencies` | Intel | 144 | 6/10 | No pagination, in-page nav breaks back button |
| 20 | `/intelligence/naics/[code]` | Intel | 210 | 8/10 | Rich data, good cross-links |
| 21 | `/analytics` | Analytics | 230 | 6/10 | Strong visuals, zero interactivity |
| 22 | `/knowledge-base` | Knowledge | 224 | 5/10 | Basic list, no preview/sort/filter |
| 23 | `/knowledge-base/sources` | Knowledge | 349 | 5/10 | Read-only, fragile renderer |
| 24 | `/knowledge-base/search` | Knowledge | 178 | 4/10 | Bare minimum |
| 25 | `/knowledge-base/upload` | Knowledge | 304 | 5/10 | Single-file only |
| 26 | `/evidence-library` | Knowledge | 369 | 7/10 | Solid CRUD with filters |
| 27 | `/settings` | Settings | 309 | 6/10 | Billing works, naming confusion |
| 28 | `/settings/company` | Settings | 549 | 7/10 | Feature-rich but overloaded (5 tabs) |
| 29 | `/settings/brand-voice` | Settings | 320 | 6/10 | Functional, no preview |
| 30 | `/settings/branding` | Settings | 554 | 9/10 | Best settings page (live preview) |
| 31 | `/onboarding` | Onboarding | 260 | 7/10 | Good wizard, exit trap in step 4 |

---

## Critical Issues (Must Fix)

### 1. No Draft Auto-Save in Proposal Wizard
**Location:** `/proposals/new` (all phases)
**Impact:** A user who spends 5+ minutes filling out context, pain points, outcomes, and win strategy loses EVERYTHING on page refresh. No `beforeunload` warning.
**Fix:** Save wizard state to sessionStorage on every field change. Restore on mount. Add `beforeunload` listener when dirty.
**Effort:** Medium (2-3 hours)
**Priority:** P0

### 2. Sidebar Has 19 Navigation Items
**Location:** `src/components/layout/sidebar.tsx`
**Impact:** New users are overwhelmed. Cannot quickly find what they need. The Information Architecture (IA) does not reflect user mental models.
**Current structure (19 items):**
```
Proposals (3): Dashboard, New Proposal, Analytics
Knowledge (5): L1 Sources, Evidence Library, Uploaded Docs, Upload, Search
Intelligence (7): Market Overview, FOIA, Agency Explorer, Rate Benchmarks, Opportunities, Award Search, About Data
Settings (4): Company Profile, Brand Voice, Branding, Billing & Plan
```
**Proposed structure (12 items):**
```
Proposals (3): Dashboard, New Proposal, Analytics
Knowledge (3): Knowledge Base (consolidate Upload/Search/Docs), Evidence Library, Company Data (merge L1+Company Profile)
Intelligence (4): Dashboard, Opportunities, Awards & Agencies, FOIA
Settings (2): Branding & Voice, Billing
```
**Effort:** Medium (3-4 hours for sidebar + route adjustments)
**Priority:** P0

### 3. Developer-Facing "Not Configured" Message
**Location:** `src/app/(dashboard)/intelligence/_components/not-configured-view.tsx`
**Impact:** SaaS customers see `.env.local` instructions. Completely wrong for a production product.
**Fix:** Replace with user-facing empty state: explain the feature, show sample data, provide CTA (contact sales / upgrade plan / enable in settings).
**Effort:** Small (30 min)
**Priority:** P0

### 4. Onboarding Step 4 Navigation Trap
**Location:** `/onboarding` step 4 "Knowledge" step
**Impact:** Clicking "Go to Knowledge Base" navigates away from onboarding with no way back. User must manually return and loses their progress context.
**Fix:** Either open upload in a modal/drawer, or remove the link and add it to a post-onboarding checklist.
**Effort:** Small (30 min)
**Priority:** P1

---

## High-Priority Issues

### 5. Three Overlapping Knowledge Management Systems
**Locations:** Evidence Library, L1 Sources, Settings > Company Profile
**Issue:** Certifications exist in both Evidence Library and Settings > Company > Certifications tab. Company data is edited in Settings but viewed in L1 Sources. These feel like separate products.
**Fix:** Long-term: Unified "Company Knowledge" section. Short-term: Add cross-links between pages with clear "edit this in..." guidance.
**Effort:** Large (for unification) / Small (for cross-links)
**Priority:** P1

### 6. Win Strategy Themes Cannot Be Added
**Location:** `/proposals/new` Phase 2 (WinStrategyPhase)
**Issue:** Users can delete AI-generated win themes but cannot add custom ones. If they delete all themes, they're stuck.
**Fix:** Add an "Add theme" input/button alongside the existing theme pills.
**Effort:** Small (1 hour)
**Priority:** P1

### 7. No Opportunity Bookmarking
**Location:** `/intelligence/opportunities`
**Issue:** Users can browse opportunities but the only action is "Start Proposal." There's no way to save/bookmark an opportunity for later review.
**Fix:** Add a "Save for Later" action that stores bookmarked opportunities in a user-scoped list.
**Effort:** Medium (new DB table + UI)
**Priority:** P2

### 8. Review Phase Missing Data Summary
**Location:** `/proposals/new` Phase 3 (ReviewPhase)
**Issue:** The approval screen shows pain points and outcomes but omits: client name, industry, solicitation type, budget, timeline, scope description, competitive intel, and bid evaluation summary.
**Fix:** Add a comprehensive summary grid showing all entered data.
**Effort:** Small (1-2 hours)
**Priority:** P1

---

## Medium-Priority Issues

### 9. Analytics and Intelligence Dashboards Are Read-Only
**Issue:** Charts cannot be filtered by date range, industry, or any dimension. Users can look but not explore.
**Fix:** Add date range picker and category filters to both dashboards.
**Priority:** P2

### 10. FOIA Generator Is a Dead End
**Issue:** No request persistence, no tracking, no history. Generated letters are lost on navigation.
**Fix:** Save requests to DB, add history list, track lifecycle.
**Priority:** P2

### 11. Knowledge Base Has No Document Preview
**Issue:** Users can only see metadata and delete. Cannot view document content from the list.
**Fix:** Add click-to-expand preview or detail panel.
**Priority:** P2

### 12. Single-File Upload
**Issue:** Uploading 20 past proposals requires 20 separate page visits.
**Fix:** Support multi-file upload with batch processing.
**Priority:** P2

### 13. Agency Explorer Breaks Back Button
**Issue:** Agency detail renders in-page without URL change. Back button goes to previous page, not back to agency list.
**Fix:** Use URL-based navigation (query param or route) for agency detail.
**Priority:** P2

---

## Low-Priority Issues (Polish)

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 14 | "Skip This Opportunity" label is misleading | Bid evaluation | Rename to "Skip Evaluation" |
| 15 | "Total Chunks" is developer jargon | Knowledge Base stats | Rename to "Search Index Coverage" |
| 16 | ~~Brand name inconsistency~~ (RESOLVED) | All files | Standardized all references to "IntentBid" |
| 17 | Onboarding differentiators fixed at 3 slots | Onboarding step 3 | Make dynamic (add/remove) |
| 18 | Onboarding save failure is silent | Onboarding step 5 | Add error toast |
| 19 | Deploy instructions reference CLI tool | Export page | Replace with in-app instructions or hosting |
| 20 | "Regenerate Strategy" has no confirmation | Win Strategy phase | Add confirmation dialog |
| 21 | Loading states inconsistent across sections | All sections | Standardize to one loading component |
| 22 | No breadcrumb navigation | Intelligence sub-pages | Add breadcrumbs |
| 23 | No dirty-state warnings on settings pages | All settings | Add beforeunload when dirty |
| 24 | Color picker hex inputs lack validation | Branding settings | Validate hex format |

---

## Consistency Audit

### Data Fetching Patterns (4 different approaches)
| Pattern | Used By |
|---------|---------|
| `useAuthFetch()` hook | Evidence Library, Upload, FOIA, Proposals |
| `createClient()` server-side | Knowledge Base, Proposals Dashboard |
| `createClient()` client-side | Settings pages, Login/Signup |
| `useIntelligence()` hook | All intelligence pages |

**Recommendation:** Standardize. Server components use `createClient()` server. Client components use `useAuthFetch()` or `useIntelligence()`. Remove direct `createClient()` usage in client components.

### Loading States (5 different patterns)
| Pattern | Used By |
|---------|---------|
| `IntelligenceLoading` (icon + label) | Intelligence pages |
| Pulsing icon | Analytics |
| `Loader2` spinner | Settings, Evidence Library |
| `Sparkles` animation | L1 Sources |
| No loading state | Some server-rendered pages |

**Recommendation:** Create a shared `<PageLoading icon={...} label="..." />` component. Use it everywhere.

### Empty States (3 quality levels)
| Quality | Example |
|---------|---------|
| Good | Knowledge Base (dashed border, CTA to upload) |
| Acceptable | Evidence Library (centered text, add button) |
| Bad | Intelligence Not Configured (shows `.env.local` instructions) |

**Recommendation:** Create a shared `<EmptyState icon={...} title="..." description="..." cta={{ label, href }} />` component. Use it everywhere.

### Error Handling (inconsistent)
| Pattern | Used By |
|---------|---------|
| Toast notification | FOIA, Upload, Settings |
| Inline text error | Intelligence pages |
| `console.error` only | Onboarding |
| Error with retry button | L1 Sources |

**Recommendation:** Always show toast for transient errors, inline for persistent errors. Never swallow errors silently.

---

## Redundancy Analysis

### Pages That Could Be Consolidated

| Current Pages | Proposed | Rationale |
|---------------|----------|-----------|
| `/knowledge-base` + `/knowledge-base/upload` + `/knowledge-base/search` | Single `/knowledge-base` page with tabs or modals for upload/search | Upload and Search are actions, not destinations. They don't warrant sidebar items. |
| `/knowledge-base/sources` + `/settings/company` | Single `/company` page with view/edit modes | Both manage the same L1 data. Currently you edit in one place, view in another. |
| `/settings` + `/settings/brand-voice` + `/settings/branding` | Single `/settings` page with tabs | Brand Voice and Branding are small enough to be tabs, not pages. |
| `/intelligence/about` | Fold into Intelligence dashboard footer | "About Data" is static informational content. Doesn't warrant a sidebar item. |

### Features That Overlap

| Feature A | Feature B | Overlap |
|-----------|-----------|---------|
| Evidence Library > Certifications | Settings > Company > Certifications tab | Same data type, different UIs |
| L1 Sources viewer | Settings > Company Profile | Same data, one is read-only, one is editable |
| Knowledge Base > Uploaded Docs | L1 Sources > Source categories | Documents vs. structured content -- user doesn't understand the distinction |

---

## Scoring Summary

| Section | Current Score | Path to 10/10 |
|---------|-------------|----------------|
| **Proposals** | 7.5/10 | Add draft auto-save, improve review phase, fix win theme editing |
| **Intelligence** | 6/10 | Fix Not Configured view, add interactivity to dashboards, connect to proposals |
| **Knowledge** | 5/10 | Consolidate 3 systems, add preview/multi-upload, improve search |
| **Analytics** | 6/10 | Add filtering, connect insights to actions |
| **Settings** | 7/10 | Consolidate pages, add brand voice preview |
| **Navigation** | 5/10 | Reduce sidebar, add breadcrumbs, improve new user guidance |
| **Consistency** | 5/10 | Standardize loading/error/empty states and data fetching |
| **Overall** | **6/10** | Focus on consolidation, guided experience, and consistency |

---

## Implementation Priority Matrix

| Priority | Issue | Effort | Impact | Do When |
|----------|-------|--------|--------|---------|
| P0 | Draft auto-save in proposal wizard | Medium | Critical | This sprint |
| P0 | Simplify sidebar (19 -> 12 items) | Medium | High | This sprint |
| P0 | Fix Not Configured view | Small | High | This sprint |
| P1 | Add win theme editing | Small | Medium | This sprint |
| P1 | Fix onboarding nav trap | Small | Medium | This sprint |
| P1 | Improve review phase summary | Small | Medium | This sprint |
| P1 | Cross-link knowledge systems | Small | Medium | This sprint |
| P2 | Add date range filters to dashboards | Medium | Medium | Next sprint |
| P2 | FOIA request persistence | Medium | Medium | Next sprint |
| P2 | Document preview in KB | Medium | Medium | Next sprint |
| P2 | Multi-file upload | Medium | Medium | Next sprint |
| P2 | Opportunity bookmarking | Medium | Medium | Next sprint |
| P3 | Standardize loading/error/empty states | Medium | Low | Next sprint |
| P3 | Add breadcrumbs | Small | Low | Next sprint |
| P3 | Brand name standardization | Small | Low | This sprint |
