-- ============================================================
-- 003_fraud_columns.sql
-- Adds fraud_flags to ratings and trust_status to profiles.
-- Both columns are required by the fraud-detection flow in
-- src/actions/ratings.ts (detectFraud / submitRating).
-- ============================================================

-- ratings: store AI-generated fraud signal tags per submission
ALTER TABLE public.ratings
  ADD COLUMN IF NOT EXISTS fraud_flags text[] DEFAULT NULL;

-- profiles: separate trust-lifecycle field with the full set of
-- states used by the fraud agent and tribunal workflow.
-- Intentionally distinct from the existing `status` column so
-- that trust-safety state and general profile state can evolve
-- independently.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trust_status text NOT NULL DEFAULT 'active'
    CHECK (trust_status IN (
      'active',
      'flagged',
      'warning_issued',
      'temporary_ban',
      'tribunal_review',
      'permanent_ban'
    ));
