import { encodingForModel } from "js-tiktoken";
import type { ParsedSection } from "./parser";

export interface Chunk {
  content: string;
  chunkIndex: number;
  sectionHeading: string | null;
  pageNumber?: number;
  slideNumber?: number;
  tokenCount: number;
}

const TARGET_CHUNK_SIZE = 512;
const CHUNK_OVERLAP = 50;
const MIN_CHUNK_SIZE = 100;
const MAX_CHUNK_SIZE = 1024;

let encoder: ReturnType<typeof encodingForModel> | null = null;

function getEncoder() {
  if (!encoder) {
    encoder = encodingForModel("gpt-4o");
  }
  return encoder;
}

function countTokens(text: string): number {
  return getEncoder().encode(text).length;
}

export function chunkSections(sections: ParsedSection[]): Chunk[] {
  const chunks: Chunk[] = [];
  let globalIndex = 0;

  for (const section of sections) {
    const fullText = section.heading
      ? `${section.heading}\n\n${section.content}`
      : section.content;

    const tokenCount = countTokens(fullText);

    if (tokenCount <= MAX_CHUNK_SIZE) {
      // Section fits in one chunk
      if (tokenCount >= MIN_CHUNK_SIZE) {
        chunks.push({
          content: fullText,
          chunkIndex: globalIndex++,
          sectionHeading: section.heading,
          pageNumber: section.pageNumber,
          slideNumber: section.slideNumber,
          tokenCount,
        });
      } else if (fullText.trim().length > 0) {
        // Small section — still include it but mark it
        chunks.push({
          content: fullText,
          chunkIndex: globalIndex++,
          sectionHeading: section.heading,
          pageNumber: section.pageNumber,
          slideNumber: section.slideNumber,
          tokenCount,
        });
      }
    } else {
      // Section too large — split with sliding window
      const words = fullText.split(/\s+/);
      let start = 0;

      while (start < words.length) {
        // Find the end of this chunk by token count
        let end = start;
        let chunkText = "";

        while (end < words.length) {
          const candidate = words.slice(start, end + 1).join(" ");
          const tokens = countTokens(candidate);
          if (tokens > TARGET_CHUNK_SIZE && end > start) {
            break;
          }
          chunkText = candidate;
          end++;
        }

        const tokens = countTokens(chunkText);
        if (chunkText.trim().length > 0) {
          chunks.push({
            content: chunkText,
            chunkIndex: globalIndex++,
            sectionHeading: section.heading,
            pageNumber: section.pageNumber,
            slideNumber: section.slideNumber,
            tokenCount: tokens,
          });
        }

        // Overlap: step back by CHUNK_OVERLAP tokens worth of words
        const overlapWords = Math.max(
          1,
          Math.floor((CHUNK_OVERLAP / TARGET_CHUNK_SIZE) * (end - start))
        );
        start = Math.max(start + 1, end - overlapWords);
      }
    }
  }

  return chunks;
}
