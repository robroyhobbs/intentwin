# ProposalAI Priority Queue

> This file tracks the current priorities for compound engineering.
> Top priority gets picked up by auto-compound each night.
> Updated by owner weekly (Monday check-in) or as needed.

## Current Sprint: Week 1 - Foundation

### Priority 1: Multi-Tenancy Migration [CRITICAL]
**Branch:** `feat/multi-tenancy`
**Effort:** Large
**Impact:** Blocker for everything else

Tasks:
- [ ] Create organizations table migration
- [ ] Add organization_id to profiles table
- [ ] Add organization_id to proposals table
- [ ] Add organization_id to documents table
- [ ] Update RLS policies for organization scoping
- [ ] Fix company_context/evidence_library global access issue
- [ ] Update all API routes with organization context

### Priority 2: Stripe Integration [CRITICAL]
**Branch:** `feat/stripe-billing`
**Effort:** Large
**Impact:** Required for revenue

Tasks:
- [ ] Install Stripe SDK
- [ ] Create src/lib/stripe/client.ts
- [ ] Create checkout session API route
- [ ] Create webhook handler for subscription events
- [ ] Create customer portal redirect
- [ ] Add pricing page
- [ ] Add plan_tier and usage tracking to organizations

### Priority 3: Rebrand Landing Page [HIGH]
**Branch:** `feat/rebrand-proposalai`
**Effort:** Medium
**Impact:** Required for public launch

Tasks:
- [ ] Remove all Capgemini references
- [ ] Update hero section with ProposalAI branding
- [ ] Add pricing section with tier CTAs
- [ ] Add social proof section (testimonials placeholder)
- [ ] Add comparison table vs competitors
- [ ] Update meta tags for SEO

### Priority 4: Self-Service Signup [HIGH]
**Branch:** `feat/self-service-onboarding`
**Effort:** Medium
**Impact:** Enables autonomous customer acquisition

Tasks:
- [ ] Auto-create organization on signup
- [ ] Start 14-day trial automatically
- [ ] Create onboarding wizard component
- [ ] Add template selection for first proposal

### Priority 5: Content & SEO [MEDIUM]
**Branch:** `feat/content-seo`
**Effort:** Small per piece
**Impact:** Long-term organic growth

Tasks:
- [ ] Create /blog directory structure
- [ ] Write: "Ultimate Guide to AI Proposal Writing"
- [ ] Write: "How to Write Winning RFP Responses"
- [ ] Add sitemap.xml
- [ ] Add robots.txt
- [ ] Optimize meta descriptions

---

## Backlog

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

### 2025-01-29: Foundation Sprint
- [x] Compound engineering infrastructure (scripts, launchd, AGENTS.md)
- [x] Multi-tenancy migration (organizations table, RLS policies)
- [x] Stripe billing integration (checkout, webhooks, pricing page)
- [x] ProposalAI rebrand (layout, sidebar, auth pages, AI prompts)

---

## Notes

- Focus on revenue-generating features first
- Capgemini conversion is priority after basic infrastructure
- Product Hunt launch target: Week 6
- All work should be autonomous-friendly (clear PRDs, small PRs)
