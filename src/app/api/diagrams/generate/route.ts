import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getUserContext } from "@/lib/supabase/auth-api";

const IMAGE_MODEL = "gemini-3-pro-image-preview";

export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { description, mermaidCode } = await request.json();

    if (!description && !mermaidCode) {
      return NextResponse.json(
        { error: "Either description or mermaidCode is required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 },
      );
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
      return NextResponse.json(
        { error: "No content generated" },
        { status: 500 },
      );
    }

    for (const part of parts) {
      if (part.inlineData) {
        const { mimeType, data } = part.inlineData;
        return NextResponse.json({
          image: `data:${mimeType};base64,${data}`,
          mimeType,
        });
      }
    }

    return NextResponse.json(
      { error: "No image was generated" },
      { status: 500 },
    );
  } catch (error) {
    console.error("Diagram generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate diagram" },
      { status: 500 },
    );
  }
}
