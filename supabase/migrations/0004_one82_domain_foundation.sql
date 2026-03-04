create extension if not exists pgcrypto;

create table if not exists public.one82_tenants (
  tenant_id text primary key,
  name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.one82_merchants (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.one82_tenants(tenant_id) on delete cascade,
  external_key text,
  name text not null,
  owner_name text,
  email text,
  phone text,
  business_type text,
  status text not null default 'Active',
  monthly_volume numeric(14,2) not null default 0,
  bps integer not null default 0,
  per_tx_fee numeric(10,4) not null default 0,
  churn_risk text,
  trend text,
  health_score integer,
  mcc_code text,
  mcc_description text,
  address text,
  notes jsonb not null default '[]'::jsonb,
  attributes jsonb not null default '{}'::jsonb,
  last_transaction_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ux_one82_merchants_tenant_external_key
on public.one82_merchants (tenant_id, external_key)
where external_key is not null;

create index if not exists idx_one82_merchants_tenant_id
on public.one82_merchants (tenant_id);

create index if not exists idx_one82_merchants_tenant_status
on public.one82_merchants (tenant_id, status);

create index if not exists idx_one82_merchants_tenant_last_tx
on public.one82_merchants (tenant_id, last_transaction_at desc nulls last);

create table if not exists public.one82_team_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.one82_tenants(tenant_id) on delete cascade,
  external_key text,
  name text not null,
  email text,
  member_role text not null default 'rep',
  region text,
  is_active boolean not null default true,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ux_one82_team_members_tenant_external_key
on public.one82_team_members (tenant_id, external_key)
where external_key is not null;

create unique index if not exists ux_one82_team_members_tenant_email
on public.one82_team_members (tenant_id, email)
where email is not null;

create index if not exists idx_one82_team_members_tenant_id
on public.one82_team_members (tenant_id);

create table if not exists public.one82_processor_transactions (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.one82_tenants(tenant_id) on delete cascade,
  source_transaction_id text,
  merchant_id uuid references public.one82_merchants(id) on delete set null,
  occurred_at timestamptz not null,
  amount numeric(14,2) not null,
  currency text not null default 'USD',
  status text not null,
  customer text,
  items jsonb not null default '[]'::jsonb,
  method text,
  category text,
  processor text,
  ingested_from text not null default 'import',
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ux_one82_processor_transactions_tenant_source
on public.one82_processor_transactions (tenant_id, source_transaction_id)
where source_transaction_id is not null;

create index if not exists idx_one82_processor_transactions_tenant_time
on public.one82_processor_transactions (tenant_id, occurred_at desc);

create index if not exists idx_one82_processor_transactions_tenant_merchant_time
on public.one82_processor_transactions (tenant_id, merchant_id, occurred_at desc);

create index if not exists idx_one82_processor_transactions_tenant_status
on public.one82_processor_transactions (tenant_id, status);

create table if not exists public.one82_import_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.one82_tenants(tenant_id) on delete cascade,
  dataset_type text not null,
  source_filename text,
  row_count integer not null default 0,
  status text not null default 'completed',
  summary jsonb not null default '{}'::jsonb,
  created_by_user_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_one82_import_jobs_dataset_type
    check (dataset_type in ('transactions', 'merchants', 'team'))
);

create index if not exists idx_one82_import_jobs_tenant_created
on public.one82_import_jobs (tenant_id, created_at desc);

create index if not exists idx_one82_import_jobs_tenant_type
on public.one82_import_jobs (tenant_id, dataset_type);

create table if not exists public.one82_rep_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.one82_tenants(tenant_id) on delete cascade,
  team_member_id uuid not null references public.one82_team_members(id) on delete cascade,
  merchant_id uuid not null references public.one82_merchants(id) on delete cascade,
  is_primary boolean not null default false,
  assigned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, team_member_id, merchant_id)
);

create index if not exists idx_one82_rep_assignments_tenant_member
on public.one82_rep_assignments (tenant_id, team_member_id);

create index if not exists idx_one82_rep_assignments_tenant_merchant
on public.one82_rep_assignments (tenant_id, merchant_id);

create table if not exists public.one82_residual_snapshots (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.one82_tenants(tenant_id) on delete cascade,
  team_member_id uuid references public.one82_team_members(id) on delete set null,
  period_start date not null,
  period_end date not null,
  gross_volume numeric(14,2) not null default 0,
  residual_amount numeric(14,2) not null default 0,
  support_cost numeric(14,2) not null default 0,
  net_profit numeric(14,2) not null default 0,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, team_member_id, period_start, period_end)
);

create index if not exists idx_one82_residual_snapshots_tenant_period
on public.one82_residual_snapshots (tenant_id, period_start desc, period_end desc);

create index if not exists idx_one82_residual_snapshots_tenant_member_period
on public.one82_residual_snapshots (tenant_id, team_member_id, period_start desc);

create or replace function public.one82_ensure_tenant(p_tenant_id text)
returns void
language plpgsql
security definer
as $$
begin
  if p_tenant_id is null or length(trim(p_tenant_id)) = 0 then
    raise exception 'tenant_id is required';
  end if;

  insert into public.one82_tenants (tenant_id)
  values (p_tenant_id)
  on conflict (tenant_id) do nothing;
end;
$$;

grant execute on function public.one82_ensure_tenant(text) to service_role;

alter table public.one82_tenants enable row level security;
alter table public.one82_merchants enable row level security;
alter table public.one82_team_members enable row level security;
alter table public.one82_processor_transactions enable row level security;
alter table public.one82_import_jobs enable row level security;
alter table public.one82_rep_assignments enable row level security;
alter table public.one82_residual_snapshots enable row level security;

drop policy if exists "Service role full access" on public.one82_tenants;
create policy "Service role full access"
on public.one82_tenants
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role full access" on public.one82_merchants;
create policy "Service role full access"
on public.one82_merchants
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role full access" on public.one82_team_members;
create policy "Service role full access"
on public.one82_team_members
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role full access" on public.one82_processor_transactions;
create policy "Service role full access"
on public.one82_processor_transactions
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role full access" on public.one82_import_jobs;
create policy "Service role full access"
on public.one82_import_jobs
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role full access" on public.one82_rep_assignments;
create policy "Service role full access"
on public.one82_rep_assignments
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role full access" on public.one82_residual_snapshots;
create policy "Service role full access"
on public.one82_residual_snapshots
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
