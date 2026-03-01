create table if not exists public.one82_state (
  tenant_id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.one82_state enable row level security;

drop policy if exists "Service role full access" on public.one82_state;
create policy "Service role full access"
on public.one82_state
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
