import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  // Step 1: Try to create the user with admin API
  // If the trigger fails, we catch it here
  console.log("Step 1: Attempting user creation...");
  
  const { data: existingUsers, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 100 });
  
  if (listErr) {
    console.error("Failed to list users:", listErr.message);
    return;
  }
  
  // Check if user already exists
  const existing = existingUsers?.users?.find(u => u.email === "som@thecomsystems.com");
  if (existing) {
    console.log("User already exists:", existing.id);
    console.log("Updating profile and org link...");
    
    // Link to COM Systems org
    const { error: profileErr } = await supabase
      .from("profiles")
      .upsert({
        id: existing.id,
        full_name: "Som Sengmany",
        organization_id: "e0c3a510-8350-43cd-b0f6-3fa34c55b88e",
        role: "admin",
      }, { onConflict: "id" });
    
    if (profileErr) {
      console.error("Profile update error:", profileErr.message);
    } else {
      console.log("Profile linked to COM Systems org!");
    }
    return;
  }

  // Try creating user — if trigger fails, we'll handle manually
  console.log("Creating user...");
  const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
    email: "som@thecomsystems.com",
    password: "COMSystems2026!",
    email_confirm: true,
    user_metadata: { full_name: "Som Sengmany" }
  });
  
  if (createErr) {
    console.error("User creation failed:", createErr.message);
    console.log("\nAttempting workaround: disable trigger, create user, restore trigger...");
    
    // Try to use postgres function to temporarily disable trigger
    // First, let's see what functions we have available
    const { data: funcs, error: funcErr } = await supabase
      .from("pg_catalog.pg_proc")
      .select("proname")
      .ilike("proname", "%handle_new_user%");
    
    console.log("Functions found:", funcs, funcErr?.message);
    return;
  }
  
  console.log("User created:", newUser.user?.id);
  
  // Link to COM Systems org 
  const { error: profileErr } = await supabase
    .from("profiles")
    .update({
      organization_id: "e0c3a510-8350-43cd-b0f6-3fa34c55b88e",
    })
    .eq("id", newUser.user!.id);
  
  if (profileErr) {
    console.error("Profile org link error:", profileErr.message);
  } else {
    console.log("User linked to COM Systems org!");
  }
}

main().catch(console.error);
