# Capgemini Conversion Playbook

> Priority: CRITICAL - First enterprise customer
> Target: $500-1,000 MRR + 3 referrals + case study

## Current Situation

### What We Know
- Capgemini is a free pilot customer
- They have access to the proposal generation platform
- The platform was originally built for them (hence "capgemini-proposal-generator")
- No current revenue from this relationship

### Strategic Value
- **Revenue:** $500-1,000/month enterprise tier
- **Social Proof:** "Trusted by Capgemini" is powerful positioning
- **Case Study:** Detailed ROI story for marketing
- **Referrals:** Access to their network of consulting firms
- **Product Feedback:** Enterprise requirements inform roadmap

## Conversion Strategy

### Phase 1: Data Collection (Days 1-3)

**Objective:** Build irrefutable ROI case

**Metrics to Gather:**
1. **Usage Data** (from Supabase)
   - Proposals created
   - Users active
   - Sections generated
   - Documents exported
   - Time in app (session data)

2. **Qualitative Data** (from pilot contacts)
   - Which proposals used the tool?
   - Did any win?
   - What saved the most time?
   - What's still painful?

**SQL Queries:**
```sql
-- Proposals created by Capgemini org
SELECT COUNT(*) as proposals_created,
       COUNT(DISTINCT created_by) as active_users,
       SUM(CASE WHEN status = 'exported' THEN 1 ELSE 0 END) as exported
FROM proposals
WHERE organization_id = '[capgemini_org_id]';

-- Sections generated
SELECT COUNT(*) as sections_generated,
       SUM(token_count) as total_tokens
FROM proposal_sections
WHERE proposal_id IN (
  SELECT id FROM proposals WHERE organization_id = '[capgemini_org_id]'
);

-- Timeline
SELECT DATE(created_at) as date, COUNT(*) as proposals
FROM proposals
WHERE organization_id = '[capgemini_org_id]'
GROUP BY DATE(created_at)
ORDER BY date;
```

### Phase 2: ROI Presentation (Days 4-5)

**Objective:** Quantify value in their language

**ROI Calculation Framework:**
```
Time Saved = (Manual Hours per Proposal - AI Hours per Proposal) × Proposals Created

Manual Hours Estimate: 40 hours/proposal (industry average)
AI Hours Estimate: 12 hours/proposal (our claim: 70% reduction)

If 10 proposals created:
  Time Saved = (40 - 12) × 10 = 280 hours

Consultant Rate: $200/hour (conservative for Capgemini)
Value Created = 280 × $200 = $56,000

ROI = $56,000 / (Annual Cost of $6,000) = 933% ROI
```

**Presentation Structure:**
1. **Opening** (2 min)
   - Thank them for pilot participation
   - Acknowledge their feedback shaped the product

2. **Usage Summary** (5 min)
   - Proposals created: X
   - Users engaged: Y
   - Sections generated: Z

3. **ROI Analysis** (10 min)
   - Time saved calculation
   - Quality improvements (if measurable)
   - Win rate impact (if trackable)

4. **Product Evolution** (5 min)
   - Features added during pilot
   - Roadmap items relevant to them
   - Multi-tenancy and enterprise features

5. **Partnership Proposal** (10 min)
   - Pricing options
   - Case study request
   - Referral program

### Phase 3: Pricing Negotiation (Days 6-10)

**Pricing Options to Present:**

| Option | Price | Includes | Positioning |
|--------|-------|----------|-------------|
| Enterprise Annual | $500/mo ($5,400/year paid annually) | 15 users, unlimited proposals, priority support | Best value |
| Enterprise Monthly | $650/mo | Same as above | Flexibility |
| Business | $199/mo | 5 users, 50 proposals/mo | Starter option |

**Negotiation Levers:**
1. **Discount for case study:** 25% off first year
2. **Discount for annual commitment:** 20% off
3. **Referral credit:** $100 off per referred customer
4. **Extended features:** Early access to roadmap items

**Decision Matrix:**
```
If they say YES:
  → Sign annual contract
  → Schedule case study interview
  → Request 3 referral intros

If they say MAYBE/need more time:
  → Offer 30-day trial extension
  → Schedule follow-up in 2 weeks
  → Keep providing value

If they say NO to paid:
  → Ask why (budget, value, timing?)
  → Offer Business tier ($199/mo)
  → Request case study anyway (free PR for them)
  → Request referrals (costs them nothing)
  → Maintain relationship for future
```

### Phase 4: Referral Extraction (Days 11-14)

**Objective:** Regardless of conversion, get 3 warm intros

**Ask Script:**
```
"Regardless of whether [Capgemini] continues with ProposalAI,
we'd love to expand to other consulting firms facing similar
proposal challenges.

Who in your network runs proposal or BD teams at firms like
[similar companies]? A quick intro email would be incredibly
valuable to us as we grow.

We're happy to offer [their referrals] the same pilot program
you received, and you'd get credit toward your subscription
for each that converts."
```

**Target Referral Profile:**
- Title: VP of Sales, BD Director, Proposal Manager
- Company: Professional services, consulting, system integrator
- Size: 50-500 employees
- Pain: RFP response time, quality consistency

**Referral Follow-up:**
1. Send thank you note immediately
2. Warm email intro within 48 hours
3. Include: brief context, no hard sell, offer demo
4. Follow up 1 week later if no response

## Objection Handling

### "We don't have budget right now"
**Response:**
"I understand budget cycles. A few options:
1. We could start with Business tier ($199/mo) and scale up later
2. Push start date to Q2 when budget refreshes
3. Frame as R&D expense vs. operational cost

What would work best for your approval process?"

### "We're evaluating other tools"
**Response:**
"That makes sense - it's a big decision.

Which tools are you comparing? I'd be happy to share how we
compare on [their key criteria].

Also, unlike [AutogenAI/Responsive], we have transparent
pricing and you've already seen the product work for your
team's actual proposals."

### "The pilot users haven't adopted it fully"
**Response:**
"Adoption is often about change management, not the tool.

What if we did a focused onboarding session with your team?
We'll identify 2-3 power users and build momentum from there.

Most teams see 80% adoption within 30 days of proper setup."

### "We can build this internally"
**Response:**
"You could - Capgemini has excellent engineering teams.

The question is opportunity cost. Consider:
- Our annual cost: $6,000
- One senior consultant week: ~$10,000
- Time to build equivalent: 6-12 months

Plus, AI models improve weekly. Keeping up is our full-time job.
Would your team want to maintain AI infrastructure?"

### "We're not sure about AI accuracy"
**Response:**
"Valid concern - AI hallucinations are real.

That's why we built transparency features:
- Source citations on every claim
- Confidence scoring
- Human-in-the-loop editing

Your team controls the final output. AI accelerates; humans verify."

## Case Study Framework

### Interview Questions
1. What was your proposal process like before ProposalAI?
2. What specific pain points were you trying to solve?
3. How has the tool impacted your workflow?
4. Can you quantify time savings or quality improvements?
5. Have any proposals using the tool won? (Even correlation is useful)
6. What features do you use most?
7. What would you tell other proposal teams about ProposalAI?

### Case Study Structure
```
[Company Logo] + [ProposalAI Logo]

HEADLINE: "How [Capgemini] Cut Proposal Time by 70% with ProposalAI"

THE CHALLENGE:
- Volume: X proposals/month
- Pain: Manual process, inconsistent quality, team coordination

THE SOLUTION:
- ProposalAI implementation
- Key features used

THE RESULTS:
- Time saved: X hours/month
- Proposals generated: Y
- Win rate: Z% (if available)

QUOTE:
"[Specific quote from stakeholder]"

CALL TO ACTION:
Start your free trial at proposalai.com
```

## Timeline Summary

| Day | Action | Owner | Status |
|-----|--------|-------|--------|
| 1-3 | Gather usage data | System | [ ] |
| 3 | Send data request to pilot contact | Owner | [ ] |
| 4-5 | Build ROI presentation | System | [ ] |
| 6 | Schedule presentation meeting | Owner | [ ] |
| 7-10 | Present and negotiate | Owner | [ ] |
| 10-14 | Follow up and close | Owner | [ ] |
| 14+ | Case study interview | System | [ ] |
| 14+ | Referral outreach | System | [ ] |

## Success Criteria

### Ideal Outcome
- Converted to Enterprise: $500/mo
- Case study approved
- 3 referral intros made
- Relationship strengthened

### Acceptable Outcome
- Converted to Business: $199/mo
- Case study approved
- 1-2 referral intros

### Minimum Outcome
- Not converted (yet)
- Case study/testimonial obtained
- 3 referral intros
- Clear timeline for future conversion

### Failure Scenario
- No conversion
- No case study
- No referrals
- Relationship damaged

**If failure scenario occurs:**
- Document lessons learned
- Identify what went wrong (timing, value, fit)
- Maintain friendly contact for future
- Move on - don't let one prospect block pipeline
