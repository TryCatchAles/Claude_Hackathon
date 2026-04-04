-- ============================================================
-- 004_missing_session_columns.sql
-- Add columns that are referenced in sessions.ts and
-- src/types/index.ts but were absent from the initial schema.
--
-- conference_record_id  — Google Meet conference record identifier,
--   passed by bookings.ts after the Meet call ends.
-- actual_duration_minutes — set when a session is marked completed,
--   may differ from the originally booked duration.
-- ============================================================

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS conference_record_id    text    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS actual_duration_minutes integer DEFAULT NULL;
