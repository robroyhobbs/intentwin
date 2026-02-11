/**
 * Upload COM Systems research docs + capability PDF to the knowledge base
 * Run: npx tsx scripts/upload-com-systems-docs.ts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
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
  env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const COM_ORG_ID = "e0c3a510-8350-43cd-b0f6-3fa34c55b88e";
const USER_ID = "cfb2a693-a660-4970-af20-624360651edf";
const DOCS_DIR = "/Users/robroyhobbs/work/intent/prospects/com-systems";

interface DocToUpload {
  filePath: string;
  title: string;
  documentType: string;
  description: string;
  fileType: "md" | "txt" | "pdf";
  mimeType: string;
  serviceLine?: string;
  industry?: string;
}

const docs: DocToUpload[] = [
  {
    filePath: "/Users/robroyhobbs/Downloads/COM SYSTEMS_capability.pdf",
    title: "COM Systems Capability Statement",
    documentType: "capability",
    description: "Official COM Systems capability statement — SDVOSB, core services, past performance, NAICS codes",
    fileType: "pdf",
    mimeType: "application/pdf",
    industry: "public_sector",
  },
  {
    filePath: `${DOCS_DIR}/L1-research.md`,
    title: "COM Systems L1 Research — Full Profile",
    documentType: "other",
    description: "Comprehensive research on COM Systems Inc: company profile, capabilities, past performance, compliance frameworks, market context",
    fileType: "md",
    mimeType: "text/markdown",
    industry: "public_sector",
  },
  {
    filePath: `${DOCS_DIR}/draft-company-background.md`,
    title: "COM Systems — Company Background",
    documentType: "capability",
    description: "Proposal-ready company overview, mission, differentiators, and federal registration details",
    fileType: "md",
    mimeType: "text/markdown",
    industry: "public_sector",
  },
  {
    filePath: `${DOCS_DIR}/draft-capabilities-matrix.md`,
    title: "COM Systems — Capabilities Matrix",
    documentType: "capability",
    description: "Six service pillars with technologies, compliance mapping, and NAICS alignment",
    fileType: "md",
    mimeType: "text/markdown",
    industry: "public_sector",
  },
  {
    filePath: `${DOCS_DIR}/draft-case-studies.md`,
    title: "COM Systems — Case Studies",
    documentType: "case_study",
    description: "Three enriched case studies: DoS Wi-Fi, DEA Network Optimization, Secure Telecom",
    fileType: "md",
    mimeType: "text/markdown",
    industry: "public_sector",
  },
  {
    filePath: `${DOCS_DIR}/draft-methodology.md`,
    title: "COM Systems — Service Delivery Methodology",
    documentType: "methodology",
    description: "Six-phase delivery framework: Discover, Design, Deploy, Harden, Operate, Optimize",
    fileType: "md",
    mimeType: "text/markdown",
  },
  {
    filePath: `${DOCS_DIR}/draft-differentiators.md`,
    title: "COM Systems — Key Differentiators",
    documentType: "capability",
    description: "Six differentiators with competitive comparison — SDVOSB, CCIE, end-to-end, federal experience",
    fileType: "md",
    mimeType: "text/markdown",
    industry: "public_sector",
  },
  {
    filePath: `${DOCS_DIR}/draft-market-context.md`,
    title: "COM Systems — Federal IT Market Context 2026",
    documentType: "other",
    description: "Federal IT market trends, $13B+ cybersecurity market, SDVOSB expansion data",
    fileType: "md",
    mimeType: "text/markdown",
    industry: "public_sector",
  },
  {
    filePath: `${DOCS_DIR}/ref-nist-csf-2.0.md`,
    title: "Reference: NIST CSF 2.0 Framework",
    documentType: "methodology",
    description: "NIST Cybersecurity Framework 2.0 — 6 functions mapped to COM Systems capabilities",
    fileType: "md",
    mimeType: "text/markdown",
  },
  {
    filePath: `${DOCS_DIR}/ref-zero-trust-800-207.md`,
    title: "Reference: NIST SP 800-207 Zero Trust Architecture",
    documentType: "methodology",
    description: "Zero Trust Architecture tenets, components, and federal mandate context",
    fileType: "md",
    mimeType: "text/markdown",
  },
  {
    filePath: `${DOCS_DIR}/ref-cmmc-2.0.md`,
    title: "Reference: CMMC 2.0 Compliance Framework",
    documentType: "methodology",
    description: "CMMC 2.0 levels, phased timeline, and contractor certification requirements",
    fileType: "md",
    mimeType: "text/markdown",
  },
  {
    filePath: `${DOCS_DIR}/ref-nist-800-171.md`,
    title: "Reference: NIST SP 800-171 Rev 3",
    documentType: "methodology",
    description: "NIST 800-171 Rev 3 — 17 control families, Rev 2 to Rev 3 changes",
    fileType: "md",
    mimeType: "text/markdown",
  },
];

async function uploadDoc(doc: DocToUpload): Promise<boolean> {
  const fileName = basename(doc.filePath);
  const fileBuffer = readFileSync(doc.filePath);
  const id = randomUUID();
  const storagePath = `${COM_ORG_ID}/${doc.documentType}/${id}-${fileName}`;

  // Upload to storage
  const { error: uploadErr } = await supabase.storage
    .from("knowledge-base-documents")
    .upload(storagePath, fileBuffer, { contentType: doc.mimeType });

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
      file_type: doc.fileType,
      file_size_bytes: fileBuffer.length,
      storage_path: storagePath,
      mime_type: doc.mimeType,
      document_type: doc.documentType,
      industry: doc.industry || null,
      service_line: doc.serviceLine || null,
      uploaded_by: USER_ID,
      organization_id: COM_ORG_ID,
      processing_status: "pending",
    })
    .select()
    .single();

  if (dbErr || !record) {
    console.log(`  DB ERROR [${fileName}]: ${dbErr?.message}`);
    return false;
  }

  // Process (parse + embed)
  try {
    await processDocument(record.id);
    console.log(`  OK [${fileName}] → processed`);
    return true;
  } catch (err) {
    console.log(`  PROCESS ERROR [${fileName}]: ${err instanceof Error ? err.message : err}`);
    return false;
  }
}

async function main() {
  console.log(`=== Uploading ${docs.length} documents to COM Systems knowledge base ===\n`);

  let success = 0;
  let failed = 0;

  for (const doc of docs) {
    process.stdout.write(`Uploading: ${doc.title}...`);
    const ok = await uploadDoc(doc);
    if (ok) success++;
    else failed++;
  }

  console.log(`\n=== Done: ${success} uploaded, ${failed} failed ===`);

  // Verify
  const { data: allDocs } = await supabase
    .from("documents")
    .select("title, file_type, processing_status, chunk_count")
    .eq("organization_id", COM_ORG_ID)
    .order("created_at");

  console.log(`\nKnowledge Base (${allDocs?.length} documents):`);
  allDocs?.forEach((d) => {
    console.log(`  [${d.file_type}] ${d.title} — ${d.processing_status} (${d.chunk_count || 0} chunks)`);
  });
}

main().catch(console.error);
