import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { getUserContext } from "@/lib/supabase/auth-api";

const SOURCES_DIR = join(process.cwd(), "sources");

function extractFrontMatter(content: string): {
  metadata: Record<string, string>;
  body: string;
} {
  const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!frontMatterMatch) {
    return { metadata: {}, body: content };
  }

  const metadata: Record<string, string> = {};
  const frontMatter = frontMatterMatch[1];
  const body = frontMatterMatch[2];

  for (const line of frontMatter.split("\n")) {
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (match) {
      metadata[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }

  return { metadata, body };
}

function extractTitle(content: string): string {
  const titleMatch = content.match(/^#\s+(.+)$/m);
  return titleMatch ? titleMatch[1] : "";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string; file: string }> }
) {
  try {
    // Require authentication
    const context = await getUserContext(request);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { category, file } = await params;
    const filePath = join(SOURCES_DIR, category, `${file}.md`);

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    const rawContent = readFileSync(filePath, "utf-8");
    const { metadata, body } = extractFrontMatter(rawContent);
    const title = extractTitle(body) || file.replace(/-/g, " ");

    return NextResponse.json({
      fileName: file,
      category,
      title,
      content: body,
      metadata,
    });
  } catch (error) {
    console.error("Failed to load source:", error);
    return NextResponse.json({ error: "Failed to load source" }, { status: 500 });
  }
}
