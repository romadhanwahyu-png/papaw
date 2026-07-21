-- ============================================================
-- Papaw — Lightweight username + PIN login
-- ============================================================
--
-- Lets a profile be recovered/accessed on any device (new device, cleared
-- cache) without Google/email. localStorage still keeps the kid signed in
-- day-to-day; these are only used to log back in.
--
-- Both columns are NULLable so existing profiles keep working until credentials
-- are set (in Settings). username is unique (Postgres allows multiple NULLs).
-- pin_hash stores "salt:scrypt" — never a plaintext PIN.
-- Safe to run once; idempotent.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS pin_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username
  ON profiles (username)
  WHERE username IS NOT NULL;
