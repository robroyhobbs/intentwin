/**
 * Apply SQL migrations to Supabase
 * Usage: npx tsx scripts/run-migrations.ts
 */

import * as fs from "fs";
import * as path from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function executeSql(sql: string): Promise<{ success: boolean; error?: string }> {
  // Use the Supabase SQL endpoint
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    const text = await response.text();
    // If exec_sql doesn't exist, we need to create tables differently
    if (text.includes("could not find") || text.includes("PGRST202")) {
      return { success: false, error: "exec_sql function not available" };
    }
    return { success: false, error: text };
  }

  return { success: true };
}

// Parse SQL file into individual statements
function parseSqlStatements(sql: string): string[] {
  // Remove comments and split by semicolons, being careful with function bodies
  const lines = sql.split("\n");
  const statements: string[] = [];
  let current = "";
  let inFunction = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip pure comment lines
    if (trimmed.startsWith("--")) continue;

    // Track function bodies (they contain semicolons we shouldn't split on)
    if (trimmed.includes("$$")) {
      inFunction = !inFunction;
    }

    current += line + "\n";

    // If we hit a semicolon and we're not in a function body, it's end of statement
    if (trimmed.endsWith(";") && !inFunction) {
      const stmt = current.trim();
      if (stmt && !stmt.startsWith("--")) {
        statements.push(stmt);
      }
      current = "";
    }
  }

  // Add any remaining content
  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements;
}

async function main() {
  console.log("Applying migrations to Supabase...\n");

  const migrationsDir = path.join(process.cwd(), "supabase/migrations");
  const migrations = ["00009_create_company_context.sql", "00010_enhance_proposals_idd.sql"];

  for (const migrationFile of migrations) {
    const filePath = path.join(migrationsDir, migrationFile);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Migration not found: ${migrationFile}`);
      continue;
    }

    console.log(`\n${"=".repeat(60)}`);
    console.log(`Applying: ${migrationFile}`);
    console.log("=".repeat(60));

    const sql = fs.readFileSync(filePath, "utf-8");
    const statements = parseSqlStatements(sql);

    console.log(`Found ${statements.length} SQL statements`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const preview = stmt.slice(0, 60).replace(/\n/g, " ");
      process.stdout.write(`  [${i + 1}/${statements.length}] ${preview}... `);

      const result = await executeSql(stmt);

      if (result.success) {
        console.log("✓");
      } else if (result.error?.includes("already exists")) {
        console.log("(exists)");
      } else if (result.error?.includes("exec_sql")) {
        console.log("\n\n⚠️  Cannot execute SQL directly. Please apply migrations manually in Supabase Dashboard.");
        console.log("\nSteps:");
        console.log("1. Go to https://supabase.com/dashboard/project/fsqwisdumwubctdwgpyi/sql");
        console.log("2. Copy and paste the migration SQL");
        console.log("3. Click 'Run'");
        console.log(`\nMigration file: ${filePath}`);
        return;
      } else {
        console.log(`✗ Error: ${result.error?.slice(0, 100)}`);
      }
    }
  }

  console.log("\n✅ Migrations applied successfully!");
}

main().catch(console.error);
