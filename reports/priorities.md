# ProposalAI Priority Queue

> This file tracks the current priorities for compound engineering.
> Top priority gets picked up by auto-compound each night.
> Updated by owner weekly (Monday check-in) or as needed.

## Current Sprint: Week 2 - Launch Ready

### Priority 1: Enhanced Onboarding & Company Setup [MOSTLY COMPLETE]
**Branch:** `feat/onboarding-v2`
**Effort:** Medium
**Impact:** Users can't create good proposals without their company context

Tasks:
- [x] Add "Company Profile" step to onboarding (name, description, differentiators)
- [x] Create /settings/company page for L1 context management (profile, differentiators, certifications)
- [x] Add guided knowledge base upload link in onboarding flow
- [x] Add "Getting Started" checklist on dashboard (auto-dismisses when complete)
- [x] Show progress indicator for setup completion (in checklist)
- [ ] Create interactive tutorial/walkthrough (first proposal guide) - defer to later

### Priority 2: Branding & Templates [MOSTLY COMPLETE]
**Branch:** `feat/branding-templates`
**Effort:** Medium
**Impact:** Customers need their branding on outputs

Tasks:
- [x] Add branding settings to organization (logo URL, primary/secondary colors, fonts)
- [x] Create /settings/branding page with logo upload and color picker
- [x] Update PPTX generator to use organization branding
- [x] Allow custom header/footer text
- [x] Add live preview of branding on settings page
- [ ] Update DOCX generator to use organization branding (deferred - complex template)
- [ ] Update PDF generator to use organization branding (deferred - complex template)
- [ ] Add template preview before export (deferred)

### Priority 3: Security Audit [MOSTLY COMPLETE]
**Branch:** `feat/security-audit`
**Effort:** Medium
**Impact:** Prevents data breaches, required for production

Tasks:
- [x] Audit ALL API routes for proper authentication (getUserContext not getAuthUser)
- [x] Audit ALL API routes for organization scoping (no cross-tenant data access)
- [x] Review all database queries for SQL injection vulnerabilities (using parameterized queries via Supabase client)
- [x] Check all user inputs are sanitized (XSS prevention) - CSP headers added
- [x] Audit file upload handling (type validation, size limits, path traversal) - validated
- [x] Review environment variable usage (no secrets in client code) - verified
- [x] Verify CORS and CSP headers are properly configured - added CSP + Permissions-Policy
- [x] Run `npm audit` and fix vulnerabilities - fixed high severity, moderate remain in mermaid (dev dep)
- [x] Verify RLS policies cover all tables and operations - verified migrations 00014-00016
- [ ] Check for sensitive data in logs (no passwords, tokens, PII) - 55 console statements to review
- [ ] Add rate limiting to API routes (defer to production)
- [ ] Review authentication flow (session handling, token expiry) - working correctly via Supabase

### Priority 4: Code Cleanup & Optimization [IN PROGRESS]
**Branch:** `feat/code-cleanup`
**Effort:** Medium
**Impact:** Maintainability, performance, reduced bugs

Tasks:
- [x] Remove unused imports and dead code across all files (13 files cleaned)
- [x] Fix all TypeScript strict mode errors (passed `tsc --noEmit`)
- [x] Remove console.log statements (replace with proper logging) - created logger utility
- [x] Fix unescaped entities in React components (JSX lint errors)
- [x] Set up ESLint rules for code consistency (underscore prefix for unused vars)
- [ ] Consolidate duplicate code into shared utilities
- [ ] Add proper error boundaries to React components
- [ ] Optimize database queries (add missing indexes, reduce N+1 queries)
- [ ] Review and optimize bundle size (lazy loading, code splitting)
- [ ] Add proper loading states and error handling to all pages
- [ ] Standardize API response formats
- [ ] Clean up CSS (remove unused styles, consolidate variables)
- [ ] Add JSDoc comments to key functions

### Priority 5: Stripe Live Setup [CRITICAL]
**Branch:** `main`
**Effort:** Small
**Impact:** Required for revenue

Tasks:
- [ ] MANUAL: Create Stripe products (Starter, Pro, Business) in dashboard
- [ ] MANUAL: Create monthly and annual prices for each tier
- [ ] Add STRIPE_*_PRICE_ID env vars to .env.production.example
- [ ] Update checkout route to use pre-created price IDs (not dynamic creation)
- [ ] MANUAL: Configure webhook endpoint in Stripe dashboard
- [ ] Test checkout flow with Stripe test mode

### Priority 6: Production Deployment [CRITICAL]
**Branch:** `main`
**Effort:** Small
**Impact:** Required to accept customers

Tasks:
- [x] Create vercel.json configuration file for deployment settings
- [x] Create .env.production.example with all required env vars documented
- [ ] MANUAL: Deploy to Vercel (connect GitHub repo via vercel.com)
- [ ] MANUAL: Configure production environment variables in Vercel dashboard
- [ ] MANUAL: Run Supabase migrations on production database
- [ ] Test full signup → trial → upgrade flow in production

### Priority 7: Customer Acquisition [ONGOING]
**Branch:** N/A (manual + content)
**Effort:** Ongoing
**Impact:** Revenue generation

Tasks:
- [ ] Convert Capgemini pilot to paid enterprise ($500+/mo)
- [ ] LinkedIn outreach: 20 connections/day to Proposal Managers
- [ ] Cold email campaign to consulting firms (50-500 employees)
- [ ] Get 3 referral intros from Capgemini contact
- [ ] Publish one blog post per week

---

## Completed: Week 1 - Foundation

### Multi-Tenancy Migration [COMPLETE]
**Branch:** `feat/multi-tenancy`
**Effort:** Large
**Impact:** Blocker for everything else

Tasks:
- [x] Create organizations table migration (00014)
- [x] Add organization_id to profiles table
- [x] Add organization_id to proposals table
- [x] Add organization_id to documents table
- [x] Update RLS policies for organization scoping (00014, 00015)
- [x] Fix company_context/evidence_library global access issue (00015)
- [x] Update all API routes with organization context
- [x] Add organization-scoped search functions (00016)

### Priority 2: Stripe Integration [COMPLETE]
**Branch:** `feat/stripe-billing`
**Effort:** Large
**Impact:** Required for revenue

Tasks:
- [x] Install Stripe SDK
- [x] Create src/lib/stripe/client.ts
- [x] Create checkout session API route
- [x] Create webhook handler for subscription events
- [x] Create customer portal redirect
- [x] Add pricing page with SEO metadata
- [x] Add plan_tier and usage tracking to organizations

### Priority 3: Rebrand Landing Page [MOSTLY COMPLETE]
**Branch:** `feat/rebrand-proposalai`
**Effort:** Medium
**Impact:** Required for public launch

Tasks:
- [x] Remove all Capgemini references
- [x] Update hero section with ProposalAI branding
- [x] Add pricing section with tier CTAs
- [ ] Add social proof section (testimonials placeholder)
- [ ] Add comparison table vs competitors
- [x] Update meta tags for SEO

### Priority 4: Self-Service Signup [COMPLETE]
**Branch:** `feat/self-service-onboarding`
**Effort:** Medium
**Impact:** Enables autonomous customer acquisition

Tasks:
- [x] Auto-create organization on signup (database trigger in 00014 migration)
- [x] Start 14-day trial automatically (trial_ends_at default)
- [x] Create onboarding wizard component (/onboarding/page.tsx)
- [ ] Add template selection for first proposal (deferred - basic flow works)

### Priority 5: Content & SEO [COMPLETE]
**Branch:** `feat/content-seo`
**Effort:** Small per piece
**Impact:** Long-term organic growth

Tasks:
- [x] Create /blog directory structure
- [x] Write: "Ultimate Guide to AI Proposal Writing"
- [x] Write: "How to Write Winning RFP Responses"
- [x] Write: "AutogenAI vs ProposalAI" comparison
- [x] Add sitemap.ts (Next.js dynamic sitemap)
- [x] Add robots.txt
- [x] Optimize meta descriptions (landing, pricing, blog pages)

### Priority 6: Capgemini Conversion [CRITICAL]
**Branch:** N/A (business development)
**Effort:** Medium
**Impact:** First revenue + case study

Tasks:
- [ ] Gather usage data from pilot
- [ ] Build ROI presentation
- [ ] Schedule conversion meeting
- [ ] Request case study permission
- [ ] Secure 3 referral introductions

---

## Backlog

### Product Hunt Launch (Deferred)
- Create 60-second demo video (Loom)
- Prepare 5 product screenshots
- Write maker comment
- Line up 20+ supporters
- Create launch day discount (50% off first year)
- Prepare follow-up email sequence

### Product Features
- Real-time collaboration (WebSocket)
- Team member invitations
- Role-based access control (viewer/editor/admin)
- RFP upload and auto-parsing
- Approval workflows
- Slack/email notifications

### Integrations
- Salesforce CRM
- HubSpot CRM
- Google Drive import
- Microsoft 365 integration

### Analytics
- Win/loss tracking dashboard
- Proposal quality metrics
- Team performance analytics
- Usage and billing dashboard

---

## Completed

### 2026-01-31: Code Cleanup Sprint
- [x] Created `/src/lib/utils/logger.ts` - environment-aware logging utility
- [x] Updated Stripe webhook to use structured event logging
- [x] Updated AI pipeline to suppress debug logs in production
- [x] Fixed unused imports in 13 files (sidebar, header, analytics, etc.)
- [x] Fixed unescaped JSX entities (apostrophes, quotes) in 6 files
- [x] Removed unused variables and type imports
- [x] Build passes with no TypeScript errors

### 2026-01-31: Security Audit + Onboarding + Branding Sprint
- [x] Create /settings/company page for L1 context management
- [x] Enhanced onboarding with company profile step (name, description, differentiators)
- [x] Add "Getting Started" checklist to dashboard with auto-dismiss
- [x] Create /settings/branding page with logo upload, colors, fonts
- [x] Update PPTX generator to use organization branding
- [x] Add branding live preview
- [x] Update sidebar navigation with Company Profile and Branding links

### 2026-01-31: Security Audit Sprint
- [x] **SECURITY**: Fix documents/[id] route - add org verification via verifyDocumentAccess
- [x] **SECURITY**: Fix proposals/[id]/reviews route - add org verification
- [x] **SECURITY**: Fix proposals/[id]/outcome route - add org verification
- [x] **SECURITY**: Fix proposals/[id]/outcomes route - add org verification
- [x] **SECURITY**: Fix proposals/[id]/versions route - add org verification
- [x] **SECURITY**: Fix proposals/[id]/versions/[versionId] route - add org verification
- [x] **SECURITY**: Fix proposals/[id]/versions/[versionId]/restore route - add org verification
- [x] **SECURITY**: Fix proposals/[id]/auto-fix route - add org verification
- [x] **SECURITY**: Fix intake/extract route - add org verification for documents
- [x] **SECURITY**: Add authentication to sources routes (was NO AUTH)
- [x] **SECURITY**: Fix analytics/outcomes route - add explicit org filtering
- [x] **SECURITY**: Fix intake/research route - use getUserContext
- [x] **SECURITY**: Fix proposals/temp/outcomes route - use getUserContext
- [x] Run npm audit fix - fixed high severity tar vulnerability
- [x] Add Content-Security-Policy header to vercel.json
- [x] Add Permissions-Policy header to vercel.json
- [x] Verify all API routes use getUserContext with org scoping
- [x] Verify file upload has type validation and size limits

### 2026-01-30 (cont.): Build Fixes & Security
- [x] Fix export route to pass company_name from organization to all generators
- [x] Install missing framer-motion dependency
- [x] Update Stripe API version to 2026-01-28.clover (match installed types)
- [x] Fix Stripe webhook type errors for subscription periods (API changes)
- [x] Fix Stripe invoice type errors
- [x] Make Stripe client lazy-initialize for builds without env vars
- [x] **SECURITY**: Fix document search route - was allowing cross-organization access
- [x] Create migration 00016 for organization-scoped search functions
- [x] **SECURITY**: Add verifyProposalAccess helper for multi-tenancy security
- [x] **SECURITY**: Fix proposals/[id] route - add organization verification
- [x] **SECURITY**: Fix proposals/[id]/generate route - add organization verification
- [x] **SECURITY**: Fix proposals/[id]/export route - add organization verification
- [x] Verify full build succeeds with `npm run build`

### 2026-01-30: Strategy & Content Sprint
- [x] Deep competitor analysis (AutogenAI, Responsive, Arphie, DeepRFP, Qwilr, Proposify)
- [x] Go-to-market strategy for first 10 customers
- [x] SEO content strategy and keyword research
- [x] Blog infrastructure (index page, article template)
- [x] First pillar article: "Ultimate Guide to AI Proposal Writing"
- [x] Second pillar article: "How to Write Winning RFP Responses"
- [x] Comparison article: "AutogenAI vs ProposalAI"
- [x] Capgemini conversion playbook
- [x] Remove Capgemini branding from landing, about, login, signup pages
- [x] Add sitemap.ts and robots.txt for SEO
- [x] Make AI prompts dynamic for multi-tenancy (all prompt builders, export generators)
- [x] Add 'why_us' section type alongside legacy 'why_capgemini' for backwards compatibility
- [x] SEO optimization: Add rich metadata to landing, pricing, and blog pages
- [x] Fix root URL for SEO: Landing page now shows at '/' for unauthenticated users
- [x] Implement Settings page with billing management, usage stats, and plan upgrades

### 2026-01-29: Foundation Sprint
- [x] Compound engineering infrastructure (scripts, launchd, AGENTS.md)
- [x] Multi-tenancy migration (organizations table, RLS policies)
- [x] Stripe billing integration (checkout, webhooks, pricing page)
- [x] ProposalAI rebrand (layout, sidebar, auth pages, AI prompts)

---

## Future Considerations

### Teaming & Government Partners
Government proposals often involve teaming arrangements — prime/sub relationships, joint ventures, and partner capabilities. At some point, IntentBid should support:
- Defining teaming partners (name, role, capabilities, past performance)
- Incorporating partner strengths into bid evaluation scoring (e.g., a weak capability_alignment score could be mitigated by a teaming partner)
- Injecting partner context into proposal generation (team section, past performance, org chart)
- Partner-specific compliance tracking (small business set-asides, mentor-protege, 8(a), HUBZone, etc.)
- Shared proposal workspaces where partners can contribute their sections

This is not urgent but becomes important as users pursue larger government contracts where teaming is the norm.

## Notes

- Focus on revenue-generating features first
- Capgemini conversion is priority after basic infrastructure
- Product Hunt launch target: Week 6
- All work should be autonomous-friendly (clear PRDs, small PRs)
