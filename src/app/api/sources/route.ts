import { NextRequest, NextResponse } from "next/server";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, basename } from "path";
import { getUserContext } from "@/lib/supabase/auth-api";

const SOURCES_DIR = join(process.cwd(), "sources");

const CATEGORIES = [
  "company-context",
  "methodologies",
  "case-studies",
  "service-catalog",
  "evidence-library",
  "proposal-examples",
];

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

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const context = await getUserContext(request);
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = [];

    for (const category of CATEGORIES) {
      const dirPath = join(SOURCES_DIR, category);

      if (!existsSync(dirPath)) {
        continue;
      }

      const files = readdirSync(dirPath).filter((f) => f.endsWith(".md"));
      const fileInfos = [];

      for (const file of files) {
        const filePath = join(dirPath, file);
        const content = readFileSync(filePath, "utf-8");
        const { metadata, body } = extractFrontMatter(content);
        const title = extractTitle(body) || basename(file, ".md").replace(/-/g, " ");

        fileInfos.push({
          fileName: basename(file, ".md"),
          category,
          title,
          status: metadata.status || "UNVERIFIED",
          contentType: metadata.content_type,
          verifiedDate: metadata.verified_date,
        });
      }

      if (fileInfos.length > 0) {
        categories.push({
          name: category.replace(/-/g, " "),
          key: category,
          files: fileInfos,
        });
      }
    }

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Failed to load sources:", error);
    return NextResponse.json({ error: "Failed to load sources" }, { status: 500 });
  }
}
