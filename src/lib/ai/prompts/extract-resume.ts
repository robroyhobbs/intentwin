/**
 * Resume Extraction Prompt
 *
 * Parses an uploaded resume/CV into structured team_member fields.
 * Used when a user uploads a resume via the Team Members settings page.
 */

export function buildResumeExtractionPrompt(resumeContent: string): string {
  return `You are an expert HR analyst. Extract structured team member data from this resume/CV.

## Resume Content
<resume>
${resumeContent}
</resume>

## Required Output Format
Respond with a JSON object matching this exact structure:

\`\`\`json
{
  "name": "Full name of the person",
  "role": "Primary professional role/title (e.g., 'Cloud Architect', 'Program Manager')",
  "title": "Most recent formal job title (e.g., 'Senior Vice President of Engineering')",
  "email": "Email address if found, null otherwise",
  "skills": ["Skill 1", "Skill 2", "..."],
  "certifications": ["PMP", "CISSP", "AWS Solutions Architect Pro", "..."],
  "clearance_level": "Security clearance if mentioned (e.g., 'Secret', 'Top Secret/SCI', 'Public Trust'), null if not found",
  "years_experience": 15,
  "project_history": [
    {
      "title": "Project or engagement name",
      "client_industry": "government | healthcare | financial_services | technology | etc.",
      "scope": "Brief description of what was done",
      "results": "Measurable outcomes if mentioned",
      "dates": "Date range (e.g., '2023-2024')"
    }
  ],
  "bio": "2-3 sentence professional summary suitable for a proposal (written in third person)"
}
\`\`\`

## Extraction Guidelines

1. **Name**: Extract the full legal name. If multiple names appear (e.g., maiden name), use the most prominent one.

2. **Role**: Infer the primary professional role from the resume. Use standard consulting/IT titles:
   - Program Manager, Project Manager, Cloud Architect, Solutions Architect
   - Security Engineer, Data Analyst, DevOps Engineer, etc.
   - Choose the role that best represents their expertise, not just their last job title.

3. **Skills**: Extract specific technical and professional skills. Prefer specific over generic:
   - GOOD: "Terraform", "AWS Lambda", "Python", "Agile/Scrum"
   - BAD: "good communicator", "team player", "hard worker"
   - Limit to 15 most relevant skills.

4. **Certifications**: Extract formal certifications only (not training courses or workshops):
   - Include: PMP, CISSP, AWS certifications, Azure certifications, ITIL, Scrum Master, etc.
   - Exclude: Internal company training, webinar attendance, online course completions.

5. **Clearance**: Only include if explicitly stated. Common values:
   - "Public Trust", "Secret", "Top Secret", "Top Secret/SCI", "Q Clearance", "L Clearance"
   - If the resume mentions "clearable" but no active clearance, set to null.

6. **Project History**: Extract the 3-5 most relevant/impressive projects:
   - Focus on government and enterprise engagements.
   - Include measurable results when mentioned (cost savings, timeline improvements, etc.).
   - Infer client_industry from context if not explicitly stated.

7. **Bio**: Write a concise (2-3 sentence) third-person bio:
   - Highlight years of experience, key expertise, and notable achievements.
   - Suitable for inclusion in a formal proposal.
   - Do NOT include personal information (hobbies, interests).

8. **years_experience**: Calculate from the earliest professional role date to present. If dates are ambiguous, estimate conservatively.

Respond ONLY with the JSON object, no additional text.`;
}
