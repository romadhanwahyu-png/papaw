-- ============================================================
-- Papaw — Row Level Security (deny-all for anon/authenticated)
-- ============================================================
--
-- Papaw has no end-user auth. All legitimate data access happens server-side
-- through the Supabase SERVICE ROLE key (see lib/supabase-server.ts), which
-- BYPASSES RLS entirely. Enabling RLS with no permissive policies therefore:
--   * keeps every server route working (service role bypasses RLS), and
--   * denies all access to the public `anon` / `authenticated` roles,
--     closing the latent hole where a leaked anon key would expose every row.
--
-- If a browser client with the anon key is ever reintroduced, add explicit,
-- scoped policies here — do NOT disable RLS.
--
-- Safe to run once against production. Idempotent-ish: ENABLE is harmless if
-- already enabled; policy DROP guards allow re-running.

ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges           ENABLE ROW LEVEL SECURITY;
ALTER TABLE whispers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_frequency  ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights       ENABLE ROW LEVEL SECURITY;

-- Force RLS even for the table owner, so nothing accidentally bypasses it
-- except the service_role (which is exempt by design).
ALTER TABLE profiles         FORCE ROW LEVEL SECURITY;
ALTER TABLE sessions         FORCE ROW LEVEL SECURITY;
ALTER TABLE messages         FORCE ROW LEVEL SECURITY;
ALTER TABLE badges           FORCE ROW LEVEL SECURITY;
ALTER TABLE whispers         FORCE ROW LEVEL SECURITY;
ALTER TABLE topic_frequency  FORCE ROW LEVEL SECURITY;
ALTER TABLE highlights       FORCE ROW LEVEL SECURITY;

-- No CREATE POLICY statements: with RLS enabled and zero policies, the anon
-- and authenticated roles are denied all row access by default. The service
-- role used by the server is unaffected.
