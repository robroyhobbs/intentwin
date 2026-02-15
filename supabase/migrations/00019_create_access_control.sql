-- Access control: email allowlist + waitlist
-- Manages who can sign up and who is waiting for access

-- Allowed emails: only these can create accounts
CREATE TABLE IF NOT EXISTS allowed_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  added_by text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Waitlist signups: people requesting access
CREATE TABLE IF NOT EXISTS waitlist_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text,
  company text,
  created_at timestamptz DEFAULT now()
);

-- RLS: only service role can read/write these tables
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_signups ENABLE ROW LEVEL SECURITY;

-- No public access — only admin/service role
DROP POLICY IF EXISTS "Service role only" ON allowed_emails;
CREATE POLICY "Service role only" ON allowed_emails
  FOR ALL USING (false);

DROP POLICY IF EXISTS "Service role only" ON waitlist_signups;
CREATE POLICY "Service role only" ON waitlist_signups
  FOR ALL USING (false);
