import { NextRequest } from "next/server";
import { getUserContext } from "@/lib/supabase/auth-api";
import { unauthorized, badRequest, ok, serverError } from "@/lib/api/response";
import { generateText } from "@/lib/ai/gemini";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

const FOIA_SYSTEM_PROMPT = `You are a legal expert specializing in US State Sunshine Laws and the Freedom of Information Act (FOIA). 
Your job is to draft a legally sound, highly effective public records request tailored to a specific state and agency.

You will receive the following details:
- State
- Agency Name
- Target Document(s) to request (e.g., incumbent winning proposal, pricing tabulation, contract)
- Sender Name & Company (from their IntentBid profile)

Guidelines for the drafted letter:
1. Cite the specific sunshine law/public records act for the given state (e.g., California Public Records Act (CPRA) Gov. Code § 7920.000, Texas Public Information Act (TPIA), Florida Sunshine Law, etc.).
2. Clearly identify the records being requested.
3. Include standard legal verbiage demanding a response within the statutory timeline for that state.
4. Include language requesting that fees be waived if applicable, but stating a willingness to pay up to a reasonable limit (e.g., $50) if necessary.
5. Format the output as a clean, ready-to-send email template.
6. Use placeholders like [Date], [Agency Email], etc., only where strictly necessary, but fill in as much as possible using the provided context.

Return ONLY the text of the email/letter. Do not wrap it in markdown code blocks unless it's just formatting the letter.`;

export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    if (!context) {
      return unauthorized();
    }

    const body = await request.json();
    const { state, agency_name, request_target } = body;

    if (!state || !agency_name || !request_target) {
      return badRequest("Missing required fields: state, agency_name, request_target");
    }

    // Get the user's company info to customize the letter
    const supabase = createAdminClient();
    const { data: orgData } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", context.organizationId)
      .single();

    const companyName = orgData?.name || "our company";

    const prompt = `Please draft a public records request with the following details:
- State: ${state}
- Agency Name: ${agency_name}
- Target Document(s): ${request_target}
- Requestor Company: ${companyName}`;

    const generatedLetter = await generateText(prompt, {
      systemPrompt: FOIA_SYSTEM_PROMPT,
      temperature: 0.4,
      maxTokens: 2048,
    });

    // Optionally save it to the new foia_requests table if the migration ran successfully,
    // but we can also just return it for a stateless MVP that doesn't break if the migration wasn't pushed.
    // Let's try to save it. If it fails, we still return the letter.
    try {
      await supabase.from("foia_requests").insert({
        organization_id: context.organizationId,
        state,
        agency_name,
        request_target,
        generated_letter: generatedLetter,
        status: "draft",
      });
    } catch (dbError) {
      // Ignore DB errors if the migration isn't fully active, just return the text
      console.warn("Could not save FOIA request to DB", dbError);
    }

    return ok({
      status: "success",
      letter: generatedLetter,
    });
  } catch (error) {
    return serverError("Failed to generate FOIA request. Please try again.", error);
  }
}
