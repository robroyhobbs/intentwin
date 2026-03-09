const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  // Try adding column via RPC (requires exec_sql function)
  const { error: rpcError } = await supabase.rpc('exec_sql', {
    query: 'ALTER TABLE proposal_sections ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;'
  });

  if (rpcError) {
    console.log('RPC not available:', rpcError.message);
    console.log('');
    console.log('Run this SQL in the Supabase dashboard SQL editor:');
    console.log('');
    console.log('ALTER TABLE proposal_sections ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;');
    console.log('');
    console.log("ALTER TABLE proposal_sections DROP CONSTRAINT IF EXISTS proposal_sections_section_type_check;");
    console.log("ALTER TABLE proposal_sections ADD CONSTRAINT proposal_sections_section_type_check CHECK (");
    console.log("  section_type = ANY (ARRAY['executive_summary','understanding','approach','methodology','team','case_studies','timeline','pricing','risk_mitigation','why_capgemini','why_us','appendix','cover_letter','compliance_matrix_section','exceptions_terms','rfp_task'])");
    console.log("  OR section_type LIKE 'custom_%'");
    console.log(");");
  } else {
    console.log('Column added successfully');
  }

  // Verify
  const { data, error } = await supabase.from('proposal_sections').select('id, metadata').limit(1);
  if (error) {
    console.log('Verification FAILED:', error.message);
  } else {
    console.log('Verification PASSED: metadata column exists');
  }
}

run().catch(e => console.error(e));
