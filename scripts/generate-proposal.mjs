import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const PROPOSAL_ID = "c5d6280a-4d00-427f-94df-7ed11f846909";

const supabase = createClient(
  "https://fsqwisdumwubctdwgpyi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzcXdpc2R1bXd1YmN0ZHdncHlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUzMTkxMSwiZXhwIjoyMDg1MTA3OTExfQ.lIWueTPRLureFTVESuc6sYGCJauvqBAHVtyI-btbyjw"
);

const anthropic = new Anthropic({
  apiKey: "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"
});

const SECTIONS = [
  { type: "executive_summary", title: "Executive Summary", order: 1 },
  { type: "understanding", title: "Understanding of Client Needs", order: 2 },
  { type: "approach", title: "Proposed Approach", order: 3 },
  { type: "methodology", title: "Methodology", order: 4 },
  { type: "team", title: "Proposed Team & Qualifications", order: 5 },
  { type: "case_studies", title: "Relevant Experience & Case Studies", order: 6 },
  { type: "timeline", title: "Timeline & Milestones", order: 7 },
  { type: "pricing", title: "Commercial Framework", order: 8 },
  { type: "risk_mitigation", title: "Risk Mitigation", order: 9 },
  { type: "why_us", title: "Why Us", order: 10 },
];

async function generateSection(sectionType, sectionTitle, intakeData) {
  const clientName = intakeData.client_name || "the client";
  const industry = intakeData.client_industry || "government";
  const scope = intakeData.scope_description || "cloud migration services";
  const requirements = (intakeData.key_requirements || []).join(", ");
  const timeline = intakeData.timeline_expectation || "as specified";

  const prompts = {
    executive_summary: `Write a compelling executive summary for a proposal to ${clientName} in the ${industry} sector.
The project scope is: ${scope}
Key requirements: ${requirements}
Timeline: ${timeline}

Write 2-3 paragraphs that capture the essence of our proposal, highlighting our understanding of their needs and our value proposition.`,

    understanding: `Write the "Understanding of Client Needs" section for a proposal to ${clientName}.
Their industry: ${industry}
Project scope: ${scope}
Requirements: ${requirements}

Demonstrate deep understanding of their challenges, goals, and the context of this project. Use 3-4 paragraphs.`,

    approach: `Write the "Proposed Approach" section for ${clientName}'s ${scope} project.
Industry: ${industry}
Requirements: ${requirements}

Describe our technical approach, methodology, and how we'll deliver value. Include specific phases or workstreams.`,

    methodology: `Write a "Methodology" section for a ${scope} project.
Client: ${clientName}
Industry: ${industry}

Describe our proven methodology, frameworks, and best practices we'll apply. Be specific but concise.`,

    team: `Write a "Proposed Team & Qualifications" section for ${clientName}'s project.
Project type: ${scope}
Industry: ${industry}

Describe the team structure, key roles, and relevant qualifications. Don't use specific names - use role titles.`,

    case_studies: `Write a "Relevant Experience & Case Studies" section for a proposal to ${clientName}.
Project type: ${scope}
Industry: ${industry}

Provide 2-3 relevant case studies (use realistic but fictional examples) showing similar successful projects with measurable outcomes.`,

    timeline: `Write a "Timeline & Milestones" section for ${clientName}'s project.
Scope: ${scope}
Expected timeline: ${timeline}

Provide a realistic project timeline with key phases and milestones. Use a clear structure.`,

    pricing: `Write a "Commercial Framework" section for ${clientName}'s ${scope} project.
Industry: ${industry}

Describe pricing approach, value-based considerations, and commercial terms. Don't include specific dollar amounts - focus on the framework and value delivery.`,

    risk_mitigation: `Write a "Risk Mitigation" section for ${clientName}'s project.
Scope: ${scope}
Industry: ${industry}

Identify 4-5 key risks and our mitigation strategies. Be specific and practical.`,

    why_us: `Write a compelling "Why Choose Us" section for ${clientName}'s ${scope} project.
Industry: ${industry}

Highlight 3-5 key differentiators, our unique value proposition, and why we're the best partner for this engagement.`
  };

  const prompt = prompts[sectionType];
  if (!prompt) return "Section content not available.";

  console.log(`  Generating ${sectionTitle}...`);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
    system: "You are an expert proposal writer for a technology consulting firm. Write professional, compelling proposal content. Use markdown formatting for headers and bullet points. Be specific and value-focused."
  });

  return message.content[0].text;
}

async function main() {
  console.log("Starting proposal generation...\n");

  // Get proposal data
  const { data: proposal, error: fetchError } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", PROPOSAL_ID)
    .single();

  if (fetchError || !proposal) {
    console.error("Failed to fetch proposal:", fetchError);
    return;
  }

  console.log(`Proposal: ${proposal.title}`);
  console.log(`Client: ${proposal.intake_data?.client_name}\n`);

  // Update status to generating
  await supabase
    .from("proposals")
    .update({ status: "generating" })
    .eq("id", PROPOSAL_ID);

  // Delete existing sections
  await supabase
    .from("proposal_sections")
    .delete()
    .eq("proposal_id", PROPOSAL_ID);

  // Generate each section
  for (const section of SECTIONS) {
    try {
      const content = await generateSection(
        section.type,
        section.title,
        proposal.intake_data
      );

      // Insert section
      const { error: insertError } = await supabase
        .from("proposal_sections")
        .insert({
          proposal_id: PROPOSAL_ID,
          section_type: section.type,
          section_order: section.order,
          title: section.title,
          generated_content: content,
          generation_status: "completed"
        });

      if (insertError) {
        console.error(`  Failed to save ${section.title}:`, insertError.message);
      } else {
        console.log(`  ✓ ${section.title} complete`);
      }
    } catch (err) {
      console.error(`  ✗ ${section.title} failed:`, err.message);

      await supabase
        .from("proposal_sections")
        .insert({
          proposal_id: PROPOSAL_ID,
          section_type: section.type,
          section_order: section.order,
          title: section.title,
          generation_status: "failed",
          generation_error: err.message
        });
    }
  }

  // Update proposal status
  await supabase
    .from("proposals")
    .update({
      status: "review",
      generation_completed_at: new Date().toISOString()
    })
    .eq("id", PROPOSAL_ID);

  console.log("\n✓ Proposal generation complete!");
  console.log(`View at: http://localhost:3001/proposals/${PROPOSAL_ID}`);
}

main().catch(console.error);
