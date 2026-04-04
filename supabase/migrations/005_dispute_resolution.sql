-- ============================================================
-- 005_dispute_resolution.sql
-- Extends the disputes table to support the full resolution
-- lifecycle and adds a low-rating counter to profiles for
-- the trust-state machine.
-- ============================================================

-- disputes: record which side the resolution favors.
-- NULL while the dispute is open or escalated; set on resolve.
--   'favor_mentor'  → mentor wins; credit is granted if score qualifies
--   'favor_mentee'  → mentee wins; credit remains permanently blocked
ALTER TABLE public.disputes
  ADD COLUMN IF NOT EXISTS resolved_in_favor_of text
    CHECK (resolved_in_favor_of IN ('favor_mentor', 'favor_mentee'));

-- disputes: timestamp of resolution for audit trail.
ALTER TABLE public.disputes
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz DEFAULT NULL;

-- profiles: rolling count of low ratings received in the last 30 days.
-- Updated by the trust helper (checkAndUpdateTrustStatus) each time a
-- score <= 2 rating is submitted against this user.  Stored as a cached
-- count so the trust helper does not need a full table scan on every call.
--
-- Thresholds (documented here and in src/actions/trust.ts):
--   >= 3 low ratings in 30 days  → trust_status escalated to 'flagged'
--   >= 5 low ratings in 30 days  → trust_status escalated to 'warning_issued'
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS low_rating_count_30d integer NOT NULL DEFAULT 0
    CHECK (low_rating_count_30d >= 0);
