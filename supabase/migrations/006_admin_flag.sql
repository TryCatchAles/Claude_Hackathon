-- ============================================================
-- 006_admin_flag.sql
-- Add is_admin flag to profiles.
-- Set this to true via the Supabase dashboard for admin users.
-- resolveDispute() checks this flag before allowing resolution.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;
