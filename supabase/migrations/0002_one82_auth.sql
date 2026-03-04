create table if not exists public.one82_login_users (
  id text primary key,
  email text not null unique,
  name text not null,
  role text not null,
  business_type text,
  organization_name text,
  onboarding_complete boolean not null default false,
  credits integer not null default 0,
  plan text not null default 'Free',
  last_auth_mode text not null default 'backend',
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.one82_login_sessions (
  session_id text primary key,
  session_token text not null unique,
  user_id text not null references public.one82_login_users(id) on delete cascade,
  tenant_id text not null,
  role text not null,
  auth_mode text not null default 'backend',
  issued_at timestamptz not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_one82_login_sessions_user_id on public.one82_login_sessions(user_id);
create index if not exists idx_one82_login_sessions_expires_at on public.one82_login_sessions(expires_at);

alter table public.one82_login_users enable row level security;
alter table public.one82_login_sessions enable row level security;

drop policy if exists "Service role full access" on public.one82_login_users;
create policy "Service role full access"
on public.one82_login_users
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role full access" on public.one82_login_sessions;
create policy "Service role full access"
on public.one82_login_sessions
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
