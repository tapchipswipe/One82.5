import { requireAuthorized, setApiResponseHeaders, sendMethodNotAllowed } from '../_lib/backend.js';
import { env } from '../../config/env.js';

export const config = { runtime: 'nodejs' };

const SUPABASE_URL = env.supabase.url;
const SUPABASE_SERVICE_ROLE_KEY = env.supabase.serviceRoleKey;
const SYNC_RUNS_TABLE = env.tables.syncRuns;
const EVENTS_TABLE = env.tables.events;

const canUseSupabase = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

const getSupabaseHeaders = (): Record<string, string> => ({
  apikey: SUPABASE_SERVICE_ROLE_KEY || '',
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY || ''}`,
  'Content-Type': 'application/json'
});

const toLimit = (value: unknown): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 25;
  return Math.max(1, Math.min(200, Math.floor(parsed)));
};

export default async function handler(req: any, res: any) {
  setApiResponseHeaders(res);

  if (req.method !== 'GET') {
    sendMethodNotAllowed(res, ['GET']);
    return;
  }

  const auth = await requireAuthorized(req, res, ['iso', 'overseer']);
  if (!auth) {
    return;
  }

  if (!canUseSupabase) {
    res.status(503).json({ error: 'Supabase is not configured.' });
    return;
  }

  const limit = toLimit(req.query?.limit);
  const requestedScope = typeof req.query?.scope === 'string' ? req.query.scope : 'tenant';
  const useGlobalScope = requestedScope === 'all' && auth.user.role === 'overseer';
  const tenantFilter = useGlobalScope
    ? ''
    : `tenant_id=eq.${encodeURIComponent(auth.session.tenantId)}&`;
  const tenantId = useGlobalScope ? null : auth.session.tenantId;

  const syncRunsUrl = `${SUPABASE_URL}/rest/v1/${SYNC_RUNS_TABLE}?${tenantFilter}select=id,tenant_id,provider,started_at,completed_at,status,imported_count,failed_count,error_message,metadata,created_at,updated_at&order=started_at.desc&limit=${limit}`;
  const eventsUrl = `${SUPABASE_URL}/rest/v1/${EVENTS_TABLE}?${tenantFilter}select=id,tenant_id,event_type,entity_type,entity_id,actor_user_id,occurred_at,payload,created_at&order=occurred_at.desc&limit=${limit}`;

  const [syncRunsResponse, eventsResponse] = await Promise.all([
    fetch(syncRunsUrl, {
      method: 'GET',
      headers: getSupabaseHeaders()
    }),
    fetch(eventsUrl, {
      method: 'GET',
      headers: getSupabaseHeaders()
    })
  ]);

  const syncRuns = syncRunsResponse.ok ? await syncRunsResponse.json() : [];
  const events = eventsResponse.ok ? await eventsResponse.json() : [];

  const nowMs = Date.now();
  const dayAgoMs = nowMs - 24 * 60 * 60 * 1000;
  const latestSync = Array.isArray(syncRuns) && syncRuns.length > 0 ? syncRuns[0] : null;
  const failedSyncRuns = Array.isArray(syncRuns)
    ? syncRuns.filter((run: any) => run?.status === 'failed').length
    : 0;
  const runningSyncRuns = Array.isArray(syncRuns)
    ? syncRuns.filter((run: any) => run?.status === 'running').length
    : 0;
  const events24h = Array.isArray(events)
    ? events.filter((event: any) => {
        const occurredAt = new Date(event?.occurred_at || 0).getTime();
        return Number.isFinite(occurredAt) && occurredAt >= dayAgoMs;
      }).length
    : 0;
  const latestEvent = Array.isArray(events) && events.length > 0 ? events[0] : null;
  const uniqueTenantIds = new Set<string>();

  if (Array.isArray(syncRuns)) {
    syncRuns.forEach((run: any) => {
      if (typeof run?.tenant_id === 'string' && run.tenant_id.trim().length > 0) {
        uniqueTenantIds.add(run.tenant_id);
      }
    });
  }

  if (Array.isArray(events)) {
    events.forEach((event: any) => {
      if (typeof event?.tenant_id === 'string' && event.tenant_id.trim().length > 0) {
        uniqueTenantIds.add(event.tenant_id);
      }
    });
  }

  res.status(200).json({
    scope: useGlobalScope ? 'global' : 'tenant',
    tenantCount: uniqueTenantIds.size,
    tenantId,
    summary: {
      latestSyncStatus: latestSync?.status || 'none',
      latestSyncAt: latestSync?.started_at || null,
      failedSyncRuns,
      runningSyncRuns,
      events24h,
      latestEventType: latestEvent?.event_type || null,
      latestEventAt: latestEvent?.occurred_at || null
    },
    syncRuns,
    events
  });
}
