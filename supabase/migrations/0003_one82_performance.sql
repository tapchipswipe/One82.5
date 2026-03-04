create index if not exists idx_one82_state_updated_at_desc
on public.one82_state (updated_at desc);

create index if not exists idx_one82_login_sessions_tenant_id
on public.one82_login_sessions (tenant_id);

create index if not exists idx_one82_login_sessions_active_expires_at
on public.one82_login_sessions (expires_at)
where revoked_at is null;

create index if not exists idx_one82_login_sessions_active_session_token
on public.one82_login_sessions (session_token)
where revoked_at is null;

create or replace function public.one82_prune_old_sessions()
returns bigint
language plpgsql
security definer
as $$
declare
  removed_count bigint;
begin
  delete from public.one82_login_sessions
  where expires_at < now() - interval '1 day'
     or (revoked_at is not null and revoked_at < now() - interval '1 day');

  get diagnostics removed_count = row_count;
  return removed_count;
end;
$$;

grant execute on function public.one82_prune_old_sessions() to service_role;
