-- Users table (extends Supabase auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  bio text,
  school text,
  degree text,
  hashtags text[] default '{}',
  is_verified boolean default false,
  status text default 'active' check (status in ('active','flagged','warning','temp_ban','tribunal','permanent_ban')),
  credits integer default 3,
  created_at timestamptz default now()
);

-- Skills
create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text
);

-- Sessions
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid references public.profiles(id),
  mentee_id uuid references public.profiles(id),
  zoom_meeting_id text,
  calendar_event_id text,
  scheduled_at timestamptz not null,
  duration_minutes integer not null,
  status text default 'pending' check (status in ('pending','active','completed','disputed','cancelled')),
  validated boolean default false,
  created_at timestamptz default now()
);

-- Ratings (one per session, mentee only)
create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid unique references public.sessions(id),
  mentee_id uuid references public.profiles(id),
  mentor_id uuid references public.profiles(id),
  score integer not null check (score between 1 and 5),
  created_at timestamptz default now()
);

-- Credits (earned only, never deducted)
create table public.credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  session_id uuid references public.sessions(id),
  rating_id uuid references public.ratings(id),
  amount integer not null,
  created_at timestamptz default now()
);

-- Disputes
create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id),
  filed_by uuid references public.profiles(id),
  reason text not null,
  status text default 'open' check (status in ('open','resolved','escalated')),
  created_at timestamptz default now()
);

-- Flags
create table public.flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  reason text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.ratings enable row level security;
alter table public.credits enable row level security;
alter table public.disputes enable row level security;
