# Interview Decisions: IntentBid Realism Enhancements

> Anchor: Transform IntentBid from generating marketing-heavy, fabricated proposals into a grounded system that explicitly requires and utilizes verified company truth (personnel, tech stacks, evidence) and compliance structures.

## Decisions

### 1. Evidence Handling (L1)
- **Problem**: System fabricates case studies when none are available.
- **Decision**: Introduce strict evidence enforcement. If `evidence_library` lacks a match, output a structured placeholder: `[CASE STUDY NEEDED: Client Name, Scope, Results]` instead of hallucinating.
- **Rationale**: Fabrication is an instant disqualifier in real proposals. Placeholders force the user to provide real data.

### 2. Personnel Management (L1)
- **Problem**: Roles are proposed without naming actual individuals.
- **Decision**: Add a `team_members` table to L1 (resumes, certs, project history). Generator will select real people and append "Why This Matters" context to them.
- **Rationale**: Real RFPs require named key personnel with verifiable credentials.

### 3. Technology Stack (L1)
- **Problem**: Vague descriptions of tools instead of specific names.
- **Decision**: Enhance `product_contexts` to require specific tool names (e.g., "ShareGate" instead of "enterprise tools").
- **Rationale**: Evaluators look for concrete methodologies and recognizable industry-standard tools.

### 4. Brand Consistency (L1)
- **Problem**: Inconsistent brand names ("COM Systems Inc", "Trellex").
- **Decision**: Enforce a single `primary_brand_name` in `company_context` that the LLM must use exclusively.
- **Rationale**: Brand confusion looks unprofessional.

### 5. Assumptions & Legal Boundaries (L2)
- **Problem**: Missing assumptions and legal protections.
- **Decision**: When parsing the RFP, auto-generate project-specific assumptions for human review and inclusion.
- **Rationale**: Assumptions protect the vendor legally and are standard compliance requirements.

### 6. Audience Calibration (L2)
- **Problem**: Over-engineered language not suited for the audience.
- **Decision**: Add an `Audience` field to L2 to instruct the generator to adjust technical depth and tone.
- **Rationale**: Calibrating language to the evaluator (e.g., small county vs. Fortune 500) improves win rates.

### 7. Pricing Structure (L2/L3)
- **Problem**: Missing actual pricing numbers.
- **Decision**: Ensure the budget envelope translates to a line-item table in L3, even with placeholders if needed.
- **Rationale**: Evaluators need to see costs; descriptive prose is insufficient.

### 8. Boilerplate & Compliance (L3)
- **Problem**: Missing mandatory government compliance sections.
- **Decision**: Add templates for a Cover Letter, Compliance Matrix, and Exceptions to Terms.
- **Rationale**: Missing these sections often causes immediate disqualification.

### 9. Repetition Management (L3)
- **Problem**: Repetitive use of differentiators throughout the document.
- **Decision**: Explicitly instruct the generation pipeline to state differentiators strongly in the Executive Summary, but *demonstrate* them in subsequent sections.
- **Rationale**: Improves readability and professional tone.

### 10. Proactive Gap Analysis (Pre-Flight)
- **Problem**: System silently proceeds when missing critical data.
- **Decision**: Implement a "What's Missing" report after parsing the RFP and comparing to L1, explicitly prompting the user for missing case studies, resumes, etc.
- **Rationale**: Transforms the system into an intelligent coordinator that guides the user to provide necessary information *before* generating a flawed proposal.

### 11. Targeted Data Ingestion
- **Problem**: Difficult to add missing data.
- **Decision**: Provide context-specific UI upload zones (e.g., "Drop resume here") to easily fulfill gaps identified in the Pre-Flight check, extracting and saving to L1.
- **Rationale**: Lowers the barrier to entry for providing verified L1 data.

### 12. Fill-in-the-Blanks Review Mode
- **Problem**: Placeholders are hard to find and complete.
- **Decision**: If generated with missing data, provide a sidebar of "Required Human Actions" to jump to and complete placeholders.
- **Rationale**: Streamlines the final polish process and ensures no placeholders are left in the final document.

## Open Items
- How exactly will the UI integrate these new gap analysis and upload workflows?
- What specific schema updates are needed for the Supabase database to support these new features?

## Out of Scope
- Real-time collaboration.
- Automated contract generation.