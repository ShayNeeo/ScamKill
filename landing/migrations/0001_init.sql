-- ScamKill landing / auth / leads schema (Cloudflare D1, SQLite).
-- Mirrors src/db/schema.ts. Apply with:
--   pnpm db:migrate:local
--   pnpm db:migrate:remote

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);

CREATE TABLE IF NOT EXISTS family_leads (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'family',
  city TEXT,
  consent INTEGER NOT NULL DEFAULT 1,
  source TEXT NOT NULL DEFAULT 'landing',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS family_leads_created_at_idx ON family_leads (created_at);

CREATE TABLE IF NOT EXISTS scam_reports (
  id TEXT PRIMARY KEY NOT NULL,
  reporter_name TEXT,
  phone_number TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'phone',
  category TEXT NOT NULL DEFAULT 'unknown',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS scam_reports_phone_idx ON scam_reports (phone_number);
