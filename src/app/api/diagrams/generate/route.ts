import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getUserContext } from "@/lib/supabase/auth-api";
import { unauthorized, badRequest, ok, serverError } from "@/lib/api/response";

/** AI image generation can be slow */
export const maxDuration = 120;

const IMAGE_MODEL = "gemini-3.1-flash-image-preview";

export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    if (!context) {
      return unauthorized();
    }

    const { description, mermaidCode } = await request.json();

    if (!description && !mermaidCode) {
      return badRequest("Either description or mermaidCode is required");
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return serverError("GEMINI_API_KEY is not configured");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: IMAGE_MODEL,
      generationConfig: {
        // @ts-expect-error -- Gemini image generation uses responseModalities
        responseModalities: ["image", "text"],
      },
    });

    // Build prompt from either Mermaid code or description
    const diagramPrompt = mermaidCode
      ? `Create a clean, professional technical diagram based on this Mermaid diagram definition.
Use a modern, minimal style with a white background, clean lines, rounded rectangles for nodes, and a professional blue/gray color scheme.
Make it look like a high-quality consulting deliverable diagram.

Mermaid definition:
${mermaidCode}`
      : `Create a clean, professional technical diagram: ${description}
Use a modern, minimal style with a white background, clean lines, rounded rectangles for nodes, and a professional blue/gray color scheme.
Make it look like a high-quality consulting deliverable diagram.`;

    const result = await model.generateContent(diagramPrompt);
    const response = result.response;

    // Extract image data from response
    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) {
      return serverError("No content generated");
    }

    for (const part of parts) {
      if (part.inlineData) {
        const { mimeType, data } = part.inlineData;
        return ok({
          image: `data:${mimeType};base64,${data}`,
          mimeType,
        });
      }
    }

    return serverError("No image was generated");
  } catch (error) {
    return serverError("Failed to generate diagram", error);
  }
}
