-- Client-heavy access foundations:
-- - Create tenant membership mapping tied to auth.users
-- - Add tenant-aware RLS for authenticated clients
-- - Keep service_role full access for backend/admin tasks

create extension if not exists pgcrypto;

-- Membership: which Supabase-auth user belongs to which tenant.
create table if not exists public.one82_tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.one82_tenants(tenant_id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id),
  constraint chk_one82_tenant_members_role check (role in ('owner', 'admin', 'member', 'viewer'))
);

create index if not exists idx_one82_tenant_members_user_id
on public.one82_tenant_members (user_id);

create index if not exists idx_one82_tenant_members_tenant_id
on public.one82_tenant_members (tenant_id);

alter table public.one82_tenant_members enable row level security;

-- Updated-at trigger (reuse if already defined).
do $$
begin
  if not exists (
    select 1
    from pg_proc
    where proname = 'one82_set_updated_at'
      and pg_function_is_visible(oid)
  ) then
    create or replace function public.one82_set_updated_at()
    returns trigger
    language plpgsql
    as $fn$
    begin
      new.updated_at := now();
      return new;
    end;
    $fn$;
  end if;
end $$;

drop trigger if exists trg_one82_tenant_members_updated_at on public.one82_tenant_members;
create trigger trg_one82_tenant_members_updated_at
before update on public.one82_tenant_members
for each row execute function public.one82_set_updated_at();

-- Helper: does current user belong to tenant?
create or replace function public.one82_is_tenant_member(p_tenant_id text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.one82_tenant_members m
    where m.tenant_id = p_tenant_id
      and m.user_id = auth.uid()
  );
$$;

-- Bootstrap RPC: create a tenant for the current user and attach membership.
-- Uses tenant_id = auth.uid()::text by default (simple, deterministic).
create or replace function public.one82_bootstrap_tenant(p_name text default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_tenant_id text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  v_tenant_id := v_user_id::text;

  insert into public.one82_tenants (tenant_id, name)
  values (v_tenant_id, nullif(trim(p_name), ''))
  on conflict (tenant_id) do update
    set name = coalesce(public.one82_tenants.name, excluded.name),
        updated_at = now();

  insert into public.one82_tenant_members (tenant_id, user_id, role)
  values (v_tenant_id, v_user_id, 'owner')
  on conflict (tenant_id, user_id) do nothing;

  return v_tenant_id;
end;
$$;

grant execute on function public.one82_bootstrap_tenant(text) to authenticated;

-- Policies: tenant membership table
drop policy if exists "Service role full access" on public.one82_tenant_members;
create policy "Service role full access"
on public.one82_tenant_members
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Members can read own memberships" on public.one82_tenant_members;
create policy "Members can read own memberships"
on public.one82_tenant_members
for select
using (user_id = auth.uid());

drop policy if exists "Members can leave tenants" on public.one82_tenant_members;
create policy "Members can leave tenants"
on public.one82_tenant_members
for delete
using (user_id = auth.uid() and role <> 'owner');

-- Policies: tenants
drop policy if exists "Tenant members can read tenant" on public.one82_tenants;
create policy "Tenant members can read tenant"
on public.one82_tenants
for select
using (public.one82_is_tenant_member(tenant_id));

-- Keep existing service_role policy (created in prior migrations).

-- Domain tables: allow authenticated tenant members to operate within their tenant.
-- This is intentionally permissive for a client-heavy app; tighten per-route later if needed.

-- Merchants
drop policy if exists "Tenant members access" on public.one82_merchants;
create policy "Tenant members access"
on public.one82_merchants
for all
using (public.one82_is_tenant_member(tenant_id))
with check (public.one82_is_tenant_member(tenant_id));

-- Team members
drop policy if exists "Tenant members access" on public.one82_team_members;
create policy "Tenant members access"
on public.one82_team_members
for all
using (public.one82_is_tenant_member(tenant_id))
with check (public.one82_is_tenant_member(tenant_id));

-- Processor transactions
drop policy if exists "Tenant members access" on public.one82_processor_transactions;
create policy "Tenant members access"
on public.one82_processor_transactions
for all
using (public.one82_is_tenant_member(tenant_id))
with check (public.one82_is_tenant_member(tenant_id));

-- Import jobs
drop policy if exists "Tenant members access" on public.one82_import_jobs;
create policy "Tenant members access"
on public.one82_import_jobs
for all
using (public.one82_is_tenant_member(tenant_id))
with check (public.one82_is_tenant_member(tenant_id));

-- Rep assignments
drop policy if exists "Tenant members access" on public.one82_rep_assignments;
create policy "Tenant members access"
on public.one82_rep_assignments
for all
using (public.one82_is_tenant_member(tenant_id))
with check (public.one82_is_tenant_member(tenant_id));

-- Residual snapshots
drop policy if exists "Tenant members access" on public.one82_residual_snapshots;
create policy "Tenant members access"
on public.one82_residual_snapshots
for all
using (public.one82_is_tenant_member(tenant_id))
with check (public.one82_is_tenant_member(tenant_id));

-- Ops tables
drop policy if exists "Tenant members access" on public.one82_processor_connections;
create policy "Tenant members access"
on public.one82_processor_connections
for all
using (public.one82_is_tenant_member(tenant_id))
with check (public.one82_is_tenant_member(tenant_id));

drop policy if exists "Tenant members access" on public.one82_sync_runs;
create policy "Tenant members access"
on public.one82_sync_runs
for all
using (public.one82_is_tenant_member(tenant_id))
with check (public.one82_is_tenant_member(tenant_id));

drop policy if exists "Tenant members access" on public.one82_events;
create policy "Tenant members access"
on public.one82_events
for all
using (public.one82_is_tenant_member(tenant_id))
with check (public.one82_is_tenant_member(tenant_id));

-- Legacy tenant state table (jsonb payload)
drop policy if exists "Tenant members access" on public.one82_state;
create policy "Tenant members access"
on public.one82_state
for all
using (public.one82_is_tenant_member(tenant_id))
with check (public.one82_is_tenant_member(tenant_id));

