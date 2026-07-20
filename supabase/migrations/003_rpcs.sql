-- ============================================================
-- Papaw — Atomic RPCs (race-free counters/upserts)
-- ============================================================
--
-- Replaces read-modify-write patterns in lib/db-queries.ts that could lose
-- updates under concurrency:
--   * incrementMessageCount  (was: SELECT count → UPDATE count+1)
--   * updateTopicFrequency   (was: per-topic SELECT then UPDATE/INSERT, N+1 + racy)
--
-- Both run as single atomic statements server-side. Safe to run once; uses
-- CREATE OR REPLACE so re-running is idempotent.

-- Atomic message-count increment.
CREATE OR REPLACE FUNCTION increment_message_count(p_session_id uuid)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE sessions
     SET message_count = message_count + 1
   WHERE id = p_session_id;
$$;

-- Atomic upsert + increment for a batch of topics.
CREATE OR REPLACE FUNCTION increment_topic_frequency(p_profile_id uuid, p_topics text[])
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  t text;
BEGIN
  IF p_topics IS NULL THEN
    RETURN;
  END IF;

  FOREACH t IN ARRAY p_topics LOOP
    INSERT INTO topic_frequency (profile_id, topic, count, last_explored)
    VALUES (p_profile_id, t, 1, now())
    ON CONFLICT (profile_id, topic)
    DO UPDATE SET
      count = topic_frequency.count + 1,
      last_explored = now();
  END LOOP;
END;
$$;
