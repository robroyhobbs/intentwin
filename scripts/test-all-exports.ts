/**
 * Test all proposal export formats against the running dev server
 *
 * Usage: npx tsx scripts/test-all-exports.ts
 * Requires: dev server running on localhost:3000
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(import.meta.dirname || __dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq === -1) continue;
  env[t.slice(0, eq)] = t.slice(eq + 1);
}

const PROPOSAL_ID = "55bad88f-2aa7-42a3-8e38-0bb1f931216f";
const BASE_URL = "http://localhost:3000";
const FORMATS = ["html", "docx", "pptx", "slides", "pdf"] as const;

async function getAuthToken(): Promise<string> {
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: "som@thecomsystems.com",
    password: "COMSystems2026!",
  });
  if (error) throw new Error(`Auth failed: ${error.message}`);
  return data.session!.access_token;
}

async function testExport(format: string, token: string): Promise<void> {
  const start = Date.now();
  console.log(`\n  Testing ${format.toUpperCase()}...`);

  try {
    const response = await fetch(`${BASE_URL}/api/proposals/${PROPOSAL_ID}/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ format }),
    });

    const elapsed = Date.now() - start;
    const text = await response.text();

    if (!response.ok) {
      console.log(`  ✗ ${format.toUpperCase()} FAILED (${response.status}) [${elapsed}ms]`);
      console.log(`    Response: ${text.substring(0, 200)}`);
      return;
    }

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.log(`  ✗ ${format.toUpperCase()} returned invalid JSON [${elapsed}ms]`);
      console.log(`    Response starts with: "${text.substring(0, 50)}..."`);
      return;
    }

    if (data.downloadUrl) {
      console.log(`  ✓ ${format.toUpperCase()} OK [${elapsed}ms]`);
      console.log(`    File: ${data.fileName}`);
      console.log(`    URL: ${data.downloadUrl.substring(0, 80)}...`);
    } else {
      console.log(`  ✗ ${format.toUpperCase()} missing downloadUrl [${elapsed}ms]`);
      console.log(`    Response: ${JSON.stringify(data).substring(0, 200)}`);
    }
  } catch (err) {
    const elapsed = Date.now() - start;
    console.log(`  ✗ ${format.toUpperCase()} ERROR [${elapsed}ms]`);
    console.log(`    ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function main() {
  console.log("=== Export Format Test Suite ===");
  console.log(`Proposal: ${PROPOSAL_ID}`);

  // Check server health
  try {
    const health = await fetch(`${BASE_URL}/api/health`);
    if (!health.ok) throw new Error("unhealthy");
    console.log("Server: ✓ running\n");
  } catch {
    console.error("Server not running. Start with: npm run dev");
    process.exit(1);
  }

  const token = await getAuthToken();
  console.log("Auth: ✓ token obtained");

  // Test each format sequentially
  for (const format of FORMATS) {
    await testExport(format, token);
  }

  console.log("\n=== Done ===");
}

main().catch(console.error);
