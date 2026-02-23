/**
 * Upload real RFP PDFs to COM Systems knowledge base
 *
 * Uploads 5 PDF files, creates document records, and processes them
 * through the parse→chunk→embed pipeline.
 *
 * Usage: npx tsx scripts/upload-rfp-pdfs.ts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync, statSync } from "fs";
import { resolve, basename } from "path";
import { randomUUID } from "crypto";
import { processDocument } from "../src/lib/documents/pipeline";

const envPath = resolve(import.meta.dirname || __dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx);
  const value = trimmed.slice(eqIdx + 1);
  env[key] = value;
  // Also set in process.env so createAdminClient() and embeddings work
  process.env[key] = value;
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  },
);

interface PdfToUpload {
  filePath: string;
  title: string;
  documentType: string;
  description: string;
}

const PDF_DIR = resolve(process.env.HOME || "~", "downloads/sample-rfps-real");

const pdfs: PdfToUpload[] = [
  {
    filePath: `${PDF_DIR}/COM Systems - The County of Amelia RFP.pdf`,
    title: "County of Amelia — IT Infrastructure RFP (2023)",
    documentType: "rfp",
    description:
      "County of Amelia RFP for IT infrastructure assessment and managed services. COM Systems response includes network assessment methodology, SLA structure, and pricing approach.",
  },
  {
    filePath: `${PDF_DIR}/COM Systems Inc._RFP_GMU-RB0607-25.pdf`,
    title: "George Mason University — IT Managed Services RFP (2025)",
    documentType: "rfp",
    description:
      "George Mason University RFP for comprehensive IT managed services. Most detailed COM Systems response with key personnel, technical approach, past performance, and staffing plan.",
  },
  {
    filePath: `${PDF_DIR}/COM Systems Inc._Town of Orange_RFP_ORIGINAL.pdf`,
    title: "Town of Orange — IT Services RFP (2020)",
    documentType: "rfp",
    description:
      "Town of Orange RFP for IT services including STORM platform deployment, network management, and cybersecurity. Includes SLA commitments and service delivery methodology.",
  },
  {
    filePath: `${PDF_DIR}/COM_Systems_RFP.pdf`,
    title: "COM Systems — General RFP Response Template",
    documentType: "rfp",
    description:
      "COM Systems general RFP response covering company capabilities, service offerings, and technical approach for government IT engagements.",
  },
  {
    filePath: `${PDF_DIR}/thecomsystems_capability.pdf`,
    title: "COM Systems — Capability Statement",
    documentType: "capability",
    description:
      "Official COM Systems Inc capability statement. SDVOSB/SWaM certification, core competencies, past performance highlights, NAICS codes, and contract vehicle information.",
  },
];

async function uploadPdf(
  doc: PdfToUpload,
  orgId: string,
  userId: string,
): Promise<boolean> {
  const fileName = basename(doc.filePath);

  if (!existsSync(doc.filePath)) {
    console.log(`  SKIP [${fileName}]: File not found`);
    return false;
  }

  const fileBuffer = readFileSync(doc.filePath);
  const fileSize = statSync(doc.filePath).size;
  const id = randomUUID();
  const storagePath = `${orgId}/${doc.documentType}/${id}-${fileName}`;

  // Upload to Supabase storage
  const { error: uploadErr } = await supabase.storage
    .from("knowledge-base-documents")
    .upload(storagePath, fileBuffer, { contentType: "application/pdf" });

  if (uploadErr) {
    console.log(`  STORAGE ERROR [${fileName}]: ${uploadErr.message}`);
    return false;
  }

  // Create document record
  const { data: record, error: dbErr } = await supabase
    .from("documents")
    .insert({
      title: doc.title,
      description: doc.description,
      file_name: fileName,
      file_type: "pdf",
      file_size_bytes: fileSize,
      storage_path: storagePath,
      mime_type: "application/pdf",
      document_type: doc.documentType,
      industry: "public_sector",
      uploaded_by: userId,
      organization_id: orgId,
      processing_status: "pending",
    })
    .select("id")
    .single();

  if (dbErr || !record) {
    console.log(`  DB ERROR [${fileName}]: ${dbErr?.message}`);
    return false;
  }

  // Process through pipeline (parse → chunk → embed)
  try {
    await processDocument(record.id);
    console.log(`  OK [${fileName}] → processed`);
    return true;
  } catch (err) {
    console.log(
      `  PROCESS ERROR [${fileName}]: ${err instanceof Error ? err.message : err}`,
    );
    // Mark as failed so it can be retried
    await supabase
      .from("documents")
      .update({ processing_status: "failed" })
      .eq("id", record.id);
    return false;
  }
}

async function main() {
  console.log("=== Upload RFP PDFs to COM Systems Knowledge Base ===\n");

  // Resolve org
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", "com-systems-inc")
    .single();

  if (!org) {
    console.error(
      "ERROR: COM Systems org not found. Run seed-com-systems-demo.ts first.",
    );
    process.exit(1);
  }

  // Resolve user
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("organization_id", org.id)
    .limit(1)
    .single();

  if (!profile) {
    console.error("ERROR: No user found for COM Systems org.");
    process.exit(1);
  }

  const orgId = org.id;
  const userId = profile.id;
  console.log(`Org ID: ${orgId}`);
  console.log(`User ID: ${userId}\n`);

  // Step 1: Clear existing documents and chunks for this org
  console.log("Step 1: Clearing existing documents...");

  // Delete chunks first (FK constraint)
  const { data: existingDocs } = await supabase
    .from("documents")
    .select("id")
    .eq("organization_id", orgId);

  if (existingDocs && existingDocs.length > 0) {
    const docIds = existingDocs.map((d: { id: string }) => d.id);
    const { error: chunkDelErr } = await supabase
      .from("document_chunks")
      .delete()
      .in("document_id", docIds);
    if (chunkDelErr)
      console.log(`  Warning: ${chunkDelErr.message}`);

    const { error: docDelErr } = await supabase
      .from("documents")
      .delete()
      .eq("organization_id", orgId);
    if (docDelErr)
      console.log(`  Warning: ${docDelErr.message}`);

    console.log(`  Cleared ${existingDocs.length} existing documents + chunks`);
  } else {
    console.log("  No existing documents");
  }

  // Step 2: Upload PDFs
  console.log(`\nStep 2: Uploading ${pdfs.length} PDFs...\n`);

  let success = 0;
  let failed = 0;

  for (const pdf of pdfs) {
    console.log(`Uploading: ${pdf.title}`);
    const ok = await uploadPdf(pdf, orgId, userId);
    if (ok) success++;
    else failed++;
    console.log(""); // blank line between uploads
  }

  console.log(`=== Done: ${success} uploaded, ${failed} failed ===`);

  // Verify
  const { data: allDocs } = await supabase
    .from("documents")
    .select("title, file_type, processing_status")
    .eq("organization_id", orgId)
    .order("created_at");

  console.log(`\nKnowledge Base (${allDocs?.length} documents):`);
  allDocs?.forEach(
    (d: { title: string; file_type: string; processing_status: string }) => {
      console.log(`  [${d.file_type}] ${d.title} — ${d.processing_status}`);
    },
  );

  // Count total chunks
  const { count } = await supabase
    .from("document_chunks")
    .select("id", { count: "exact", head: true })
    .in(
      "document_id",
      (allDocs || []).map(() => ""),
    );

  // Get chunk count via docs
  const { data: docsWithChunks } = await supabase
    .from("documents")
    .select("chunk_count")
    .eq("organization_id", orgId);

  const totalChunks = (docsWithChunks || []).reduce(
    (sum: number, d: { chunk_count: number | null }) => sum + (d.chunk_count || 0),
    0,
  );
  console.log(`\nTotal chunks: ${totalChunks}`);
}

main().catch(console.error);
