-- ============================================================
-- Papaw — Initial Database Schema
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_name TEXT NOT NULL,
  papaw_name TEXT NOT NULL DEFAULT 'Papaw',
  default_language TEXT NOT NULL DEFAULT 'mix' CHECK (default_language IN ('id', 'en', 'mix')),
  parent_view_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  message_count INTEGER NOT NULL DEFAULT 0,
  mission_state JSONB
);

CREATE INDEX IF NOT EXISTS idx_sessions_profile ON sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(profile_id, started_at DESC);

-- ============================================================
-- Messages
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('child', 'papaw')),
  content TEXT NOT NULL,
  topic_tags TEXT[] DEFAULT '{}',
  is_critical_topic BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_profile_time ON messages(session_id, created_at DESC);

-- ============================================================
-- Badges
-- ============================================================
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL,
  title TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🏅',
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, badge_key)
);

CREATE INDEX IF NOT EXISTS idx_badges_profile ON badges(profile_id);

-- ============================================================
-- Whispers (Papa → Papaw → Child)
-- ============================================================
CREATE TABLE IF NOT EXISTS whispers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whispers_pending ON whispers(profile_id, delivered_at) WHERE delivered_at IS NULL;

-- ============================================================
-- Topic Frequency (aggregated)
-- ============================================================
CREATE TABLE IF NOT EXISTS topic_frequency (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  last_explored TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, topic)
);

CREATE INDEX IF NOT EXISTS idx_topic_freq_profile ON topic_frequency(profile_id);

-- ============================================================
-- Highlights (auto-extracted notable moments)
-- ============================================================
CREATE TABLE IF NOT EXISTS highlights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  highlight_type TEXT NOT NULL CHECK (highlight_type IN ('curious_question', 'cute_moment', 'deep_thinking')),
  excerpt TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_highlights_profile ON highlights(profile_id, created_at DESC);
