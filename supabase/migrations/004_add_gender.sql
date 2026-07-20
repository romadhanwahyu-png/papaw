-- ============================================================
-- Papaw — Add child_gender to profiles
-- ============================================================
--
-- Papaw was guessing the child's gender (and getting it wrong). Store it so the
-- prompt can address the child correctly. Existing profiles default to
-- 'unspecified' — Papaw then stays gender-neutral until it's set in Settings.
-- Safe to run once; idempotent via IF NOT EXISTS.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS child_gender TEXT NOT NULL DEFAULT 'unspecified'
  CHECK (child_gender IN ('male', 'female', 'unspecified'));
