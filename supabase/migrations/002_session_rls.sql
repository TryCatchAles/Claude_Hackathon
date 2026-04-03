-- ============================================================
-- 002_session_rls.sql
-- Add update policies for sessions so participants can
-- validate and cancel through the normal user-scoped client.
--
-- Insert is intentionally excluded: createSession() uses the
-- service-role client (bypasses RLS) because it is called
-- server-side by the booking action, not directly by the user.
-- ============================================================

create policy "sessions: participants can update"
  on public.sessions for update
  using (
    auth.uid() = mentor_id or
    auth.uid() = mentee_id
  );
