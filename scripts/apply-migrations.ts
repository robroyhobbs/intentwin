/**
 * Apply migrations via Supabase SQL execution
 * Usage: npx tsx scripts/apply-migrations.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function applyMigration(supabase: ReturnType<typeof createClient>, migrationPath: string) {
  const sql = fs.readFileSync(migrationPath, "utf-8");
  const fileName = path.basename(migrationPath);

  console.log(`\nApplying: ${fileName}`);

  // Split by semicolons but be careful with function bodies
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith("--"));

  for (const statement of statements) {
    if (!statement || statement.startsWith("--")) continue;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).rpc("exec_sql", { sql_query: statement + ";" });
      if (error) {
        // Try direct execution for DDL
        console.log(`   Statement preview: ${statement.slice(0, 60)}...`);
        if (error.message.includes("already exists")) {
          console.log(`   ⚠️  Already exists, skipping`);
        } else {
          console.error(`   ❌ Error: ${error.message}`);
        }
      } else {
        console.log(`   ✓ Applied`);
      }
    } catch (e) {
      console.log(`   Statement: ${statement.slice(0, 80)}...`);
    }
  }
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const migrationsDir = path.join(process.cwd(), "supabase/migrations");
  const migrations = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith(".sql"))
    .sort();

  // Only apply the new migrations (00009 and 00010)
  const newMigrations = migrations.filter(m =>
    m.startsWith("00009") || m.startsWith("00010")
  );

  console.log("Migrations to apply:", newMigrations);

  for (const migration of newMigrations) {
    const fullPath = path.join(migrationsDir, migration);
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Processing: ${migration}`);
    console.log("=".repeat(60));

    const sql = fs.readFileSync(fullPath, "utf-8");
    console.log(`SQL length: ${sql.length} characters`);
  }

  console.log("\n⚠️  Please apply these migrations manually in Supabase Dashboard:");
  console.log("   1. Go to https://supabase.com/dashboard");
  console.log("   2. Select your project");
  console.log("   3. Go to SQL Editor");
  console.log("   4. Paste and run each migration file");
  console.log("\nMigration files:");
  for (const m of newMigrations) {
    console.log(`   - supabase/migrations/${m}`);
  }
}

main().catch(console.error);
