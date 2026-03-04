create table if not exists public.one82_processor_connections (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.one82_tenants(tenant_id) on delete cascade,
  provider text not null,
  external_account_id text,
  status text not null default 'connected',
  last_synced_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, provider, external_account_id)
);

create index if not exists idx_one82_processor_connections_tenant_provider
on public.one82_processor_connections (tenant_id, provider);

create table if not exists public.one82_sync_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.one82_tenants(tenant_id) on delete cascade,
  provider text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'running',
  imported_count integer not null default 0,
  failed_count integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_one82_sync_runs_status check (status in ('running', 'completed', 'failed'))
);

create index if not exists idx_one82_sync_runs_tenant_started
on public.one82_sync_runs (tenant_id, started_at desc);

create index if not exists idx_one82_sync_runs_tenant_status
on public.one82_sync_runs (tenant_id, status);

create table if not exists public.one82_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.one82_tenants(tenant_id) on delete cascade,
  event_type text not null,
  entity_type text,
  entity_id text,
  actor_user_id text,
  occurred_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_one82_events_tenant_time
on public.one82_events (tenant_id, occurred_at desc);

create index if not exists idx_one82_events_tenant_event_type
on public.one82_events (tenant_id, event_type);

create index if not exists idx_one82_events_payload_gin
on public.one82_events using gin (payload jsonb_path_ops);

create or replace function public.one82_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- attach updated_at triggers

drop trigger if exists trg_one82_tenants_updated_at on public.one82_tenants;
create trigger trg_one82_tenants_updated_at
before update on public.one82_tenants
for each row execute function public.one82_set_updated_at();

drop trigger if exists trg_one82_merchants_updated_at on public.one82_merchants;
create trigger trg_one82_merchants_updated_at
before update on public.one82_merchants
for each row execute function public.one82_set_updated_at();

drop trigger if exists trg_one82_team_members_updated_at on public.one82_team_members;
create trigger trg_one82_team_members_updated_at
before update on public.one82_team_members
for each row execute function public.one82_set_updated_at();

drop trigger if exists trg_one82_processor_transactions_updated_at on public.one82_processor_transactions;
create trigger trg_one82_processor_transactions_updated_at
before update on public.one82_processor_transactions
for each row execute function public.one82_set_updated_at();

drop trigger if exists trg_one82_import_jobs_updated_at on public.one82_import_jobs;
create trigger trg_one82_import_jobs_updated_at
before update on public.one82_import_jobs
for each row execute function public.one82_set_updated_at();

drop trigger if exists trg_one82_rep_assignments_updated_at on public.one82_rep_assignments;
create trigger trg_one82_rep_assignments_updated_at
before update on public.one82_rep_assignments
for each row execute function public.one82_set_updated_at();

drop trigger if exists trg_one82_residual_snapshots_updated_at on public.one82_residual_snapshots;
create trigger trg_one82_residual_snapshots_updated_at
before update on public.one82_residual_snapshots
for each row execute function public.one82_set_updated_at();

drop trigger if exists trg_one82_processor_connections_updated_at on public.one82_processor_connections;
create trigger trg_one82_processor_connections_updated_at
before update on public.one82_processor_connections
for each row execute function public.one82_set_updated_at();

drop trigger if exists trg_one82_sync_runs_updated_at on public.one82_sync_runs;
create trigger trg_one82_sync_runs_updated_at
before update on public.one82_sync_runs
for each row execute function public.one82_set_updated_at();

-- tenant consistency validation for cross-table links

create or replace function public.one82_validate_tenant_consistency()
returns trigger
language plpgsql
as $$
declare
  linked_tenant text;
  v_team_member_id uuid;
  v_merchant_id uuid;
begin
  v_team_member_id := nullif(to_jsonb(new)->>'team_member_id', '')::uuid;
  v_merchant_id := nullif(to_jsonb(new)->>'merchant_id', '')::uuid;

  if tg_table_name = 'one82_rep_assignments' then
    select tenant_id into linked_tenant from public.one82_team_members where id = v_team_member_id;
    if linked_tenant is null or linked_tenant <> new.tenant_id then
      raise exception 'rep assignment tenant mismatch for team_member_id %', v_team_member_id;
    end if;

    select tenant_id into linked_tenant from public.one82_merchants where id = v_merchant_id;
    if linked_tenant is null or linked_tenant <> new.tenant_id then
      raise exception 'rep assignment tenant mismatch for merchant_id %', v_merchant_id;
    end if;
  elsif tg_table_name = 'one82_processor_transactions' and v_merchant_id is not null then
    select tenant_id into linked_tenant from public.one82_merchants where id = v_merchant_id;
    if linked_tenant is null or linked_tenant <> new.tenant_id then
      raise exception 'processor transaction tenant mismatch for merchant_id %', v_merchant_id;
    end if;
  elsif tg_table_name = 'one82_residual_snapshots' and v_team_member_id is not null then
    select tenant_id into linked_tenant from public.one82_team_members where id = v_team_member_id;
    if linked_tenant is null or linked_tenant <> new.tenant_id then
      raise exception 'residual snapshot tenant mismatch for team_member_id %', v_team_member_id;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_one82_rep_assignments_tenant_consistency on public.one82_rep_assignments;
create trigger trg_one82_rep_assignments_tenant_consistency
before insert or update on public.one82_rep_assignments
for each row execute function public.one82_validate_tenant_consistency();

drop trigger if exists trg_one82_processor_transactions_tenant_consistency on public.one82_processor_transactions;
create trigger trg_one82_processor_transactions_tenant_consistency
before insert or update on public.one82_processor_transactions
for each row execute function public.one82_validate_tenant_consistency();

drop trigger if exists trg_one82_residual_snapshots_tenant_consistency on public.one82_residual_snapshots;
create trigger trg_one82_residual_snapshots_tenant_consistency
before insert or update on public.one82_residual_snapshots
for each row execute function public.one82_validate_tenant_consistency();

-- additive guardrail constraints

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'chk_one82_merchants_health_score'
  ) then
    alter table public.one82_merchants
      add constraint chk_one82_merchants_health_score
      check (health_score is null or (health_score >= 0 and health_score <= 100));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_one82_merchants_bps'
  ) then
    alter table public.one82_merchants
      add constraint chk_one82_merchants_bps
      check (bps >= 0 and bps <= 2000);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_one82_merchants_per_tx_fee'
  ) then
    alter table public.one82_merchants
      add constraint chk_one82_merchants_per_tx_fee
      check (per_tx_fee >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_one82_processor_transactions_amount'
  ) then
    alter table public.one82_processor_transactions
      add constraint chk_one82_processor_transactions_amount
      check (amount >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_one82_residual_snapshots_period'
  ) then
    alter table public.one82_residual_snapshots
      add constraint chk_one82_residual_snapshots_period
      check (period_end >= period_start);
  end if;
end $$;

-- backfill tenants from existing state/auth data
insert into public.one82_tenants (tenant_id)
select distinct tenant_id
from (
  select tenant_id from public.one82_state
  union all
  select tenant_id from public.one82_login_sessions
) source_tenants
where tenant_id is not null and length(trim(tenant_id)) > 0
on conflict (tenant_id) do nothing;

-- backfill normalized processor transactions from tenant state payload
insert into public.one82_processor_transactions (
  tenant_id,
  source_transaction_id,
  occurred_at,
  amount,
  currency,
  status,
  customer,
  items,
  method,
  category,
  ingested_from,
  raw_payload
)
select
  st.tenant_id,
  coalesce(tx.elem->>'id', md5(st.tenant_id || '_' || tx.ordinality::text || '_' || coalesce(tx.elem->>'date', now()::text))),
  coalesce((tx.elem->>'date')::timestamptz, now()),
  coalesce((tx.elem->>'amount')::numeric, 0),
  'USD',
  coalesce(tx.elem->>'status', 'Completed'),
  tx.elem->>'customer',
  coalesce(tx.elem->'items', '[]'::jsonb),
  tx.elem->>'method',
  tx.elem->>'category',
  'state_backfill',
  tx.elem
from public.one82_state st,
  jsonb_array_elements(coalesce(st.payload->'transactions', '[]'::jsonb)) with ordinality as tx(elem, ordinality)
where not exists (
  select 1
  from public.one82_processor_transactions existing
  where existing.tenant_id = st.tenant_id
    and existing.source_transaction_id = coalesce(tx.elem->>'id', md5(st.tenant_id || '_' || tx.ordinality::text || '_' || coalesce(tx.elem->>'date', now()::text)))
);

-- backfill merchants from imported merchant rows in state payload
with merchant_source as (
  select distinct on (tenant_id, external_key)
    st.tenant_id,
    coalesce(m.elem->>'externalkey', m.elem->>'merchantid', m.elem->>'id', 'state_merchant_' || m.ordinality::text) as external_key,
    coalesce(m.elem->>'name', m.elem->>'merchantname', m.elem->>'company', 'Imported Merchant') as name,
    coalesce(m.elem->>'owner', m.elem->>'ownername') as owner_name,
    coalesce(m.elem->>'email', m.elem->>'owneremail', m.elem->>'contactemail') as email,
    coalesce(m.elem->>'phone', m.elem->>'contactphone') as phone,
    coalesce(m.elem->>'businesstype', m.elem->>'industry', m.elem->>'type') as business_type,
    coalesce(m.elem->>'status', 'Active') as status,
    m.elem as attributes
  from public.one82_state st,
    jsonb_array_elements(coalesce(st.payload->'importedMerchants', '[]'::jsonb)) with ordinality as m(elem, ordinality)
)
insert into public.one82_merchants (
  tenant_id,
  external_key,
  name,
  owner_name,
  email,
  phone,
  business_type,
  status,
  attributes
)
select
  src.tenant_id,
  src.external_key,
  src.name,
  src.owner_name,
  src.email,
  src.phone,
  src.business_type,
  src.status,
  src.attributes
from merchant_source src
where not exists (
  select 1
  from public.one82_merchants existing
  where existing.tenant_id = src.tenant_id
    and existing.external_key = src.external_key
);

with merchant_source as (
  select distinct on (tenant_id, external_key)
    st.tenant_id,
    coalesce(m.elem->>'externalkey', m.elem->>'merchantid', m.elem->>'id', 'state_merchant_' || m.ordinality::text) as external_key,
    coalesce(m.elem->>'name', m.elem->>'merchantname', m.elem->>'company', 'Imported Merchant') as name,
    coalesce(m.elem->>'owner', m.elem->>'ownername') as owner_name,
    coalesce(m.elem->>'email', m.elem->>'owneremail', m.elem->>'contactemail') as email,
    coalesce(m.elem->>'phone', m.elem->>'contactphone') as phone,
    coalesce(m.elem->>'businesstype', m.elem->>'industry', m.elem->>'type') as business_type,
    coalesce(m.elem->>'status', 'Active') as status,
    m.elem as attributes
  from public.one82_state st,
    jsonb_array_elements(coalesce(st.payload->'importedMerchants', '[]'::jsonb)) with ordinality as m(elem, ordinality)
)
update public.one82_merchants target
set
  name = src.name,
  owner_name = src.owner_name,
  email = src.email,
  phone = src.phone,
  business_type = src.business_type,
  status = src.status,
  attributes = src.attributes,
  updated_at = now()
from merchant_source src
where target.tenant_id = src.tenant_id
  and target.external_key = src.external_key;

-- backfill team members from imported team rows in state payload
with team_source as (
  select distinct on (tenant_id, external_key)
    st.tenant_id,
    coalesce(t.elem->>'externalkey', t.elem->>'memberid', t.elem->>'repid', t.elem->>'id', 'state_team_' || t.ordinality::text) as external_key,
    coalesce(t.elem->>'name', t.elem->>'repname', t.elem->>'membername', 'Team Member') as name,
    coalesce(t.elem->>'email', t.elem->>'repemail') as email,
    coalesce(t.elem->>'role', t.elem->>'memberrole', 'rep') as member_role,
    coalesce(t.elem->>'region', t.elem->>'territory') as region,
    t.elem as metrics
  from public.one82_state st,
    jsonb_array_elements(coalesce(st.payload->'importedTeam', '[]'::jsonb)) with ordinality as t(elem, ordinality)
)
insert into public.one82_team_members (
  tenant_id,
  external_key,
  name,
  email,
  member_role,
  region,
  metrics
)
select
  src.tenant_id,
  src.external_key,
  src.name,
  src.email,
  src.member_role,
  src.region,
  src.metrics
from team_source src
where not exists (
  select 1
  from public.one82_team_members existing
  where existing.tenant_id = src.tenant_id
    and existing.external_key = src.external_key
);

with team_source as (
  select distinct on (tenant_id, external_key)
    st.tenant_id,
    coalesce(t.elem->>'externalkey', t.elem->>'memberid', t.elem->>'repid', t.elem->>'id', 'state_team_' || t.ordinality::text) as external_key,
    coalesce(t.elem->>'name', t.elem->>'repname', t.elem->>'membername', 'Team Member') as name,
    coalesce(t.elem->>'email', t.elem->>'repemail') as email,
    coalesce(t.elem->>'role', t.elem->>'memberrole', 'rep') as member_role,
    coalesce(t.elem->>'region', t.elem->>'territory') as region,
    t.elem as metrics
  from public.one82_state st,
    jsonb_array_elements(coalesce(st.payload->'importedTeam', '[]'::jsonb)) with ordinality as t(elem, ordinality)
)
update public.one82_team_members target
set
  name = src.name,
  email = src.email,
  member_role = src.member_role,
  region = src.region,
  metrics = src.metrics,
  updated_at = now()
from team_source src
where target.tenant_id = src.tenant_id
  and target.external_key = src.external_key;

create or replace view public.one82_tenant_daily_metrics_v as
select
  tenant_id,
  date_trunc('day', occurred_at)::date as metric_date,
  count(*)::integer as transaction_count,
  sum(amount)::numeric(14,2) as total_volume,
  avg(amount)::numeric(14,2) as avg_ticket
from public.one82_processor_transactions
group by tenant_id, date_trunc('day', occurred_at)::date;

create or replace view public.one82_rep_profitability_v as
select
  rs.tenant_id,
  rs.team_member_id,
  tm.name as team_member_name,
  rs.period_start,
  rs.period_end,
  rs.gross_volume,
  rs.residual_amount,
  rs.support_cost,
  rs.net_profit
from public.one82_residual_snapshots rs
left join public.one82_team_members tm
  on tm.id = rs.team_member_id;

grant select on public.one82_tenant_daily_metrics_v to service_role;
grant select on public.one82_rep_profitability_v to service_role;

alter table public.one82_processor_connections enable row level security;
alter table public.one82_sync_runs enable row level security;
alter table public.one82_events enable row level security;

drop policy if exists "Service role full access" on public.one82_processor_connections;
create policy "Service role full access"
on public.one82_processor_connections
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role full access" on public.one82_sync_runs;
create policy "Service role full access"
on public.one82_sync_runs
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role full access" on public.one82_events;
create policy "Service role full access"
on public.one82_events
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
