# Key Rotation Runbook

**Reason:** The file `scripts/generate-proposal.mjs` (committed in `7565ecf`, deleted in `e407417`) contained hardcoded Supabase service role key and Anthropic API key. Although the file was deleted, **the keys remain in git history** and must be treated as compromised.

**Priority:** HIGH — the Supabase service role key bypasses RLS and grants full database access.

---

## Keys That MUST Be Rotated

### 1. Supabase Service Role Key (CRITICAL)

This key bypasses all Row-Level Security policies. Anyone with it has unrestricted read/write access to the entire database.

**Leaked value prefix:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzcXdpc2R1bXd1YmN0ZHdncHlpIi...`

**Steps:**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) > Project > Settings > API
2. Under **Service Role Key**, click "Generate new key" (or "Rotate key")
3. Copy the new key immediately — it won't be shown again
4. Update in **all** environments:
   - **Vercel:** Project Settings > Environment Variables > `SUPABASE_SERVICE_ROLE_KEY` (Production, Preview, Development)
   - **Local `.env.local`:** Update `SUPABASE_SERVICE_ROLE_KEY=<new-key>`
   - **Inngest Cloud** (if configured separately): Update the env var there too
5. Redeploy Vercel: `vercel deploy --prod` from project root
6. Verify: Hit any authenticated API route (e.g., `GET /api/proposals`) and confirm it returns data, not a 500

**Note:** Rotating the service role key does NOT affect the anon key or any existing user sessions. It only affects server-side admin operations.

### 2. Anthropic API Key (HIGH)

This key was used for Claude AI generation. It grants access to generate text on the account's billing.

**Leaked value prefix:** `sk-ant-api03-h41iKFLoxA67ba5LG...`

**Steps:**

1. Go to [Anthropic Console](https://console.anthropic.com/) > API Keys
2. Find and **revoke** the compromised key (the one starting with `sk-ant-api03-h41i`)
3. Create a new API key
4. This project has since migrated to Gemini for generation, so check if `ANTHROPIC_API_KEY` is still used anywhere:
   ```bash
   grep -r "ANTHROPIC_API_KEY\|anthropic" src/ --include="*.ts" --include="*.tsx" -l
   ```
5. If still referenced: update in Vercel + local `.env.local`
6. If NOT referenced: revoke and remove the env var entirely to reduce attack surface

---

## Keys to VERIFY (Not Leaked, But Good Hygiene)

These keys were NOT in the leaked script, but should be checked as part of the rotation exercise:

| Key | Where to rotate | Check interval |
|-----|----------------|----------------|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard > API | Only if compromised |
| `GEMINI_API_KEY` | Google AI Studio > API Keys | Quarterly |
| `VOYAGE_API_KEY` | Voyage AI Dashboard | Quarterly |
| `STRIPE_SECRET_KEY` | Stripe Dashboard > Developers > API Keys | Only if compromised |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard > Webhooks | When rotating Stripe keys |
| `OPENAI_API_KEY` | OpenAI Platform > API Keys | Quarterly |
| `GROQ_API_KEY` | Groq Console > API Keys | Quarterly |
| `MISTRAL_API_KEY` | Mistral Console > API Keys | Quarterly |
| `RESEND_API_KEY` | Resend Dashboard > API Keys | Quarterly |
| `CRON_SECRET` | Self-generated, update in Vercel | When rotating |

---

## Post-Rotation Verification Checklist

After rotating keys, verify each service still works:

- [ ] **Database:** `GET /api/proposals` returns 200 with data (tests Supabase service role key)
- [ ] **AI Generation:** Generate a test proposal section (tests Gemini API key)
- [ ] **Embeddings:** Upload a test document and verify chunks are created (tests Voyage API key)
- [ ] **Quality Review:** Trigger a quality review on a section (tests OpenAI/Groq/Mistral keys)
- [ ] **Billing:** Verify Stripe webhook endpoint responds to test event (tests Stripe keys)
- [ ] **Email:** Trigger a waitlist signup and verify email sends (tests Resend API key)
- [ ] **Tests:** Run `npm test` — all 541 tests should still pass (tests use mocks, not real keys)

---

## Preventing Future Leaks

1. **Pre-commit hook:** Add a secret scanning pre-commit hook (e.g., `gitleaks`, `trufflehog`, or GitHub's built-in secret scanning)
2. **Never hardcode keys in scripts:** Always use `process.env.KEY_NAME` or a `.env` file
3. **`.gitignore` coverage:** Verify `.env`, `.env.local`, `.env.*.local` are all in `.gitignore`
4. **Periodic git history scan:**
   ```bash
   # Scan for any remaining secrets in git history
   npx gitleaks detect --source . --verbose
   ```

---

## Cleaning Git History (Optional, Disruptive)

If you want to fully remove the leaked keys from git history:

```bash
# WARNING: This rewrites history. All collaborators must re-clone.
# Only do this if the repo is private and you accept the disruption.

# Option 1: BFG Repo Cleaner (recommended)
bfg --delete-files generate-proposal.mjs
git reflog expire --expire=now --all && git gc --prune=now --aggressive

# Option 2: git filter-repo
git filter-repo --path scripts/generate-proposal.mjs --invert-paths
```

**Important:** Even after cleaning history, if the repo was ever public or forked, the keys should still be considered compromised. Always rotate first, clean history second.
