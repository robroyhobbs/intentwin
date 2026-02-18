const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";

interface EmbeddingResponse {
  data: Array<{ embedding: number[] }>;
  usage: { total_tokens: number };
}

export async function generateEmbeddings(
  texts: string[],
  inputType: "document" | "query" = "document"
): Promise<number[][]> {
  const model = (process.env.EMBEDDING_MODEL || "voyage-3").trim();
  const apiKey = process.env.VOYAGE_API_KEY;

  if (!apiKey) {
    throw new Error("VOYAGE_API_KEY is not set");
  }

  // Batch in groups of 128 (Voyage API limit)
  const batchSize = 128;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        const response = await fetch(VOYAGE_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            input: batch,
            input_type: inputType,
          }),
        });

        if (response.status === 429) {
          // Rate limited — exponential backoff
          const waitMs = Math.pow(2, retries) * 1000;
          await new Promise((r) => setTimeout(r, waitMs));
          retries++;
          continue;
        }

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(
            `Voyage API error (${response.status}): ${errorBody}`
          );
        }

        const data: EmbeddingResponse = await response.json();
        allEmbeddings.push(...data.data.map((d) => d.embedding));
        break;
      } catch (error) {
        if (retries >= maxRetries - 1) throw error;
        retries++;
        await new Promise((r) => setTimeout(r, Math.pow(2, retries) * 1000));
      }
    }
  }

  return allEmbeddings;
}

export async function generateQueryEmbedding(
  query: string
): Promise<number[]> {
  const embeddings = await generateEmbeddings([query], "query");
  return embeddings[0];
}
