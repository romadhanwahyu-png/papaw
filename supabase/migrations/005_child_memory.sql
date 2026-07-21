-- ============================================================
-- Papaw — Child Memory (durable facts Papaw remembers)
-- ============================================================
--
-- Stores stable facts about the child (interests, friends, school, pets,
-- preferences, recurring things) extracted from conversations, so Papaw feels
-- like he KNOWS the child across sessions. Facts are injected into the prompt.
-- Safe to run once; idempotent.

CREATE TABLE IF NOT EXISTS child_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  fact TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (profile_id, fact)
);

CREATE INDEX IF NOT EXISTS idx_child_memory_profile
  ON child_memory(profile_id, created_at DESC);

-- Consistent with 002: RLS on, no anon policies (server uses service role).
ALTER TABLE child_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_memory FORCE ROW LEVEL SECURITY;
