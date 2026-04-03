-- ============================================================
-- 001_init.sql
-- Mentor-Mentee Skill Exchange Platform — initial schema
-- ============================================================

-- Extensions
create extension if not exists pgcrypto;

-- ============================================================
-- PROFILES
-- One row per auth user. id mirrors auth.users(id).
-- Stores reputation state, verification flags, and trust status.
-- Starting credits (3) live here as a cached balance.
-- The credits table is the source of truth for earned credits;
-- this column is updated by trigger on insert into credits.
-- ============================================================
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text,                          -- shown in UI, not searchable by name
  bio             text,
  school          text,
  degree          text,
  hashtags        text[]       default '{}',     -- skill tags, GIN-indexed for search
  email_verified  boolean      default false,
  phone_verified  boolean      default false,
  edu_email       boolean      default false,    -- school/work email boost
  status          text         default 'active'
                    check (status in (
                      'active',
                      'flagged',
                      'warning',
                      'temp_ban',
                      'tribunal',
                      'permanent_ban'
                    )),
  credits         integer      default 3 check (credits >= 0),
  created_at      timestamptz  default now(),
  updated_at      timestamptz  default now()
);

-- ============================================================
-- SKILLS
-- Canonical skill list. Used for search/matching via AI.
-- Users reference skills via profiles.hashtags (text[]) for
-- flexibility, but this table provides the canonical vocabulary.
-- ============================================================
create table public.skills (
  id          uuid  primary key default gen_random_uuid(),
  name        text  not null unique,
  category    text,
  created_at  timestamptz default now()
);

-- ============================================================
-- BOOKINGS
-- A scheduling agreement between a mentee and mentor.
-- Represents the intent and confirmation before the session.
-- Status tracks the lifecycle from request to confirmed/cancelled.
-- ============================================================
create table public.bookings (
  id            uuid        primary key default gen_random_uuid(),
  mentor_id     uuid        not null references public.profiles(id) on delete cascade,
  mentee_id     uuid        not null references public.profiles(id) on delete cascade,
  scheduled_at  timestamptz not null,
  duration_minutes integer  not null check (duration_minutes > 0),
  status        text        default 'pending'
                  check (status in (
                    'pending',
                    'confirmed',
                    'cancelled',
                    'completed'
                  )),
  message       text,       -- optional message from mentee to mentor
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),

  constraint no_self_booking check (mentor_id <> mentee_id)
);

-- ============================================================
-- SESSIONS
-- The actual meeting record created once a booking is confirmed.
-- Holds Google Meet / Calendar references and validation state.
-- This is the gating table for ratings and credits:
-- a session must be validated = true before either can proceed.
-- ============================================================
create table public.sessions (
  id                   uuid        primary key default gen_random_uuid(),
  booking_id           uuid        not null unique references public.bookings(id) on delete cascade,
  mentor_id            uuid        not null references public.profiles(id) on delete cascade,
  mentee_id            uuid        not null references public.profiles(id) on delete cascade,

  -- Google Calendar / Meet fields
  calendar_event_id    text,       -- Google Calendar event ID
  meet_meeting_code    text,       -- Google Meet meeting code (e.g. abc-defg-hij)

  -- Scheduling
  scheduled_at         timestamptz not null,
  duration_minutes     integer     not null check (duration_minutes > 0),

  -- Validation: set true once session is manually confirmed by participants
  validated            boolean     default false,
  validated_at         timestamptz,

  -- Lifecycle
  status               text        default 'pending'
                         check (status in (
                           'pending',
                           'active',
                           'completed',
                           'disputed',
                           'cancelled'
                         )),

  created_at           timestamptz default now(),
  updated_at           timestamptz default now(),

  constraint no_self_session check (mentor_id <> mentee_id)
);

-- ============================================================
-- RATINGS
-- Mentee rates mentor after a validated session.
-- Enforced: one rating per session (session_id unique).
-- Enforced: only scores 1–5.
-- Not enforced here that rater == mentee_id (handled in RLS + action).
-- ============================================================
create table public.ratings (
  id          uuid    primary key default gen_random_uuid(),
  session_id  uuid    not null unique references public.sessions(id) on delete cascade,
  mentor_id   uuid    not null references public.profiles(id) on delete cascade,
  mentee_id   uuid    not null references public.profiles(id) on delete cascade,
  score       integer not null check (score between 1 and 5),
  comment     text,
  created_at  timestamptz default now()
);

-- ============================================================
-- CREDITS
-- Append-only ledger of earned reputation credits.
-- Credits are NEVER deducted — amount must always be positive.
-- Each credit row is tied to a rating, which is tied to a session.
-- profiles.credits is a cached sum updated by trigger below.
-- ============================================================
create table public.credits (
  id          uuid    primary key default gen_random_uuid(),
  user_id     uuid    not null references public.profiles(id) on delete cascade,
  session_id  uuid    not null references public.sessions(id) on delete cascade,
  rating_id   uuid    not null unique references public.ratings(id) on delete cascade,
  amount      integer not null check (amount > 0),
  created_at  timestamptz default now()
);

-- ============================================================
-- DISPUTES
-- Filed by either party in a session after it completes.
-- Pauses credit award until resolved.
-- ============================================================
create table public.disputes (
  id          uuid  primary key default gen_random_uuid(),
  session_id  uuid  not null references public.sessions(id) on delete cascade,
  filed_by    uuid  not null references public.profiles(id) on delete cascade,
  reason      text  not null,
  status      text  default 'open'
                check (status in ('open', 'resolved', 'escalated')),
  resolution  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================
-- FLAGS
-- Trust/safety moderation markers set by admin or automated rules.
-- Normal users cannot write to this table (RLS: service_role only).
-- ============================================================
create table public.flags (
  id          uuid  primary key default gen_random_uuid(),
  user_id     uuid  not null references public.profiles(id) on delete cascade,
  reason      text  not null,
  severity    text  default 'low' check (severity in ('low', 'medium', 'high')),
  resolved    boolean default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Bookings: common query patterns
create index idx_bookings_mentor_id     on public.bookings(mentor_id);
create index idx_bookings_mentee_id     on public.bookings(mentee_id);
create index idx_bookings_scheduled_at  on public.bookings(scheduled_at);

-- Sessions: lookup by participant and validation state
create index idx_sessions_mentor_id     on public.sessions(mentor_id);
create index idx_sessions_mentee_id     on public.sessions(mentee_id);
create index idx_sessions_scheduled_at  on public.sessions(scheduled_at);
create index idx_sessions_validated     on public.sessions(validated);
create index idx_sessions_booking_id    on public.sessions(booking_id);

-- Ratings: mentor's rating history + per-session lookup
create index idx_ratings_mentor_id      on public.ratings(mentor_id);
create index idx_ratings_session_id     on public.ratings(session_id);

-- Credits: user credit history
create index idx_credits_user_id        on public.credits(user_id);

-- Disputes: per-session lookup
create index idx_disputes_session_id    on public.disputes(session_id);

-- Profiles: GIN index for hashtag (skill) array search
create index idx_profiles_hashtags      on public.profiles using gin(hashtags);

-- ============================================================
-- TRIGGER: auto-create profile on auth.users insert
-- Runs as security definer so it can write to public.profiles
-- regardless of the calling user's RLS context.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- TRIGGER: keep profiles.credits in sync with credits table
-- Increments cached balance when a credit row is inserted.
-- ============================================================
create or replace function public.sync_credit_balance()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles
  set credits = credits + new.amount
  where id = new.user_id;
  return new;
end;
$$;

create trigger on_credit_earned
  after insert on public.credits
  for each row execute function public.sync_credit_balance();

-- ============================================================
-- TRIGGER: block credit insert when session has an open dispute
-- Runs BEFORE INSERT so no credit row is ever written.
-- Raises an exception (P0001) that the application can catch.
-- ============================================================
create or replace function public.check_no_open_dispute_before_credit()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if exists (
    select 1
    from public.disputes
    where session_id = new.session_id
      and status = 'open'
  ) then
    raise exception
      'Cannot award credits for session "%": an open dispute exists.',
      new.session_id
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger enforce_no_credit_during_dispute
  before insert on public.credits
  for each row execute function public.check_no_open_dispute_before_credit();

-- ============================================================
-- TRIGGER: updated_at auto-maintenance
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_bookings_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

create trigger set_sessions_updated_at
  before update on public.sessions
  for each row execute function public.set_updated_at();

create trigger set_disputes_updated_at
  before update on public.disputes
  for each row execute function public.set_updated_at();

create trigger set_flags_updated_at
  before update on public.flags
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles  enable row level security;
alter table public.skills    enable row level security;
alter table public.bookings  enable row level security;
alter table public.sessions  enable row level security;
alter table public.ratings   enable row level security;
alter table public.credits   enable row level security;
alter table public.disputes  enable row level security;
alter table public.flags     enable row level security;

-- ------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------
create policy "profiles: users can read all profiles"
  on public.profiles for select
  using (true);                     -- mentors are discoverable by skill, not name

create policy "profiles: users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- No direct insert: handled by handle_new_user() trigger (security definer)
-- No direct delete: cascade from auth.users

-- ------------------------------------------------------------
-- skills
-- ------------------------------------------------------------
create policy "skills: anyone can read"
  on public.skills for select
  using (true);

-- Only service role can insert/modify skills (no user-facing policy needed)

-- ------------------------------------------------------------
-- bookings
-- ------------------------------------------------------------
create policy "bookings: participants can view"
  on public.bookings for select
  using (
    auth.uid() = mentor_id or
    auth.uid() = mentee_id
  );

create policy "bookings: mentee can create"
  on public.bookings for insert
  with check (auth.uid() = mentee_id);

create policy "bookings: participants can update"
  on public.bookings for update
  using (
    auth.uid() = mentor_id or
    auth.uid() = mentee_id
  );

-- ------------------------------------------------------------
-- sessions
-- ------------------------------------------------------------
create policy "sessions: participants can view"
  on public.sessions for select
  using (
    auth.uid() = mentor_id or
    auth.uid() = mentee_id
  );

-- Sessions are created by server-side actions (service role).
-- No user-facing insert policy; handled via security definer functions.

-- ------------------------------------------------------------
-- ratings
-- ------------------------------------------------------------
create policy "ratings: session participants can view"
  on public.ratings for select
  using (
    auth.uid() = mentor_id or
    auth.uid() = mentee_id
  );

create policy "ratings: only mentee for that session can insert"
  on public.ratings for insert
  with check (
    auth.uid() = mentee_id
    and exists (
      select 1 from public.sessions s
      where s.id = session_id
        and s.mentee_id = auth.uid()
        and s.mentor_id = mentor_id  -- rating must target the actual session mentor
        and s.validated = true
    )
  );

-- No update or delete — ratings are immutable once submitted

-- ------------------------------------------------------------
-- credits
-- ------------------------------------------------------------
create policy "credits: users can view own credits"
  on public.credits for select
  using (auth.uid() = user_id);

-- No user-facing insert: credits are minted by server-side actions only.
-- The service role inserts credits; users cannot mint their own.

-- ------------------------------------------------------------
-- disputes
-- ------------------------------------------------------------
create policy "disputes: session participants can view"
  on public.disputes for select
  using (
    exists (
      select 1 from public.sessions s
      where s.id = session_id
        and (s.mentor_id = auth.uid() or s.mentee_id = auth.uid())
    )
  );

create policy "disputes: session participants can file"
  on public.disputes for insert
  with check (
    auth.uid() = filed_by
    and exists (
      select 1 from public.sessions s
      where s.id = session_id
        and (s.mentor_id = auth.uid() or s.mentee_id = auth.uid())
    )
  );

-- Resolution updates handled by service role / admin only

-- ------------------------------------------------------------
-- flags
-- ------------------------------------------------------------
-- No user-facing policies: all flag operations are service_role only.
-- Normal authenticated users cannot read, insert, or modify flags.
