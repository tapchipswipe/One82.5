import {
  buildMetrics,
  getStateForTenant,
  parseBody,
  requireAuthorized,
  saveStateForTenant,
  upsertResidualSnapshot,
  setApiResponseHeaders,
  sendMethodNotAllowed
} from '../_lib/backend';
import { env } from '../../config/env';

export const config = { runtime: 'nodejs' };

const SUPABASE_URL = env.supabase.url;
const SUPABASE_SERVICE_ROLE_KEY = env.supabase.serviceRoleKey;
const PROCESSOR_TRANSACTIONS_TABLE = env.tables.processorTransactions;
const canUseSupabase = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

type DailyMetric = {
  date: string;
  revenue: number;
  transactions: number;
};

type ProcessorTxRow = {
  occurred_at: string;
  amount: string | number;
};

type Body = {
  commissionRuns?: unknown[];
};

/**
 * Fetches daily metrics from the `one82_processor_transactions` domain table
 * (not the state blob), so rollups are accurate and consistent with the DB.
 */
const buildMetricsFromDomain = async (tenantId: string): Promise<DailyMetric[] | null> => {
  if (!canUseSupabase) return null;

  const url = `${SUPABASE_URL}/rest/v1/${PROCESSOR_TRANSACTIONS_TABLE}?tenant_id=eq.${encodeURIComponent(tenantId)}&select=occurred_at,amount&order=occurred_at.asc&limit=5000`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY || '',
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY || ''}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) return null;

  const rows = (await response.json()) as ProcessorTxRow[];
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const map = new Map<string, DailyMetric>();
  for (const row of rows) {
    const date = new Date(row.occurred_at);
    if (Number.isNaN(date.getTime())) continue;
    const key = date.toISOString().slice(0, 10);
    const current = map.get(key) || { date: key, revenue: 0, transactions: 0 };
    current.revenue += Number(row.amount) || 0;
    current.transactions += 1;
    map.set(key, current);
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
};

export default async function handler(req: any, res: any) {
  setApiResponseHeaders(res);

  if (req.method !== 'GET' && req.method !== 'PUT') {
    sendMethodNotAllowed(res, ['GET', 'PUT']);
    return;
  }

  const auth = await requireAuthorized(req, res);
  if (!auth) {
    return;
  }

  const state = await getStateForTenant(auth.session.tenantId);

  if (req.method === 'PUT') {
    const body = await parseBody<Body>(req);
    const incomingRuns = Array.isArray(body?.commissionRuns) ? body.commissionRuns : null;
    const commissionRuns = incomingRuns ?? state.commissionRuns ?? [];

    await saveStateForTenant(auth.session.tenantId, {
      ...state,
      commissionRuns: commissionRuns as any[]
    } as any);

    // Write residual snapshots for any finalized commission runs (Gap 4)
    if (incomingRuns) {
      const finalizedRuns = (commissionRuns as any[]).filter((r: any) => r.status === 'finalized');
      for (const run of finalizedRuns) {
        const period = String(run.period || '');
        const [year, month] = period.split('-');
        if (!year || !month) continue;
        const periodStart = `${year}-${month}-01`;
        const periodEnd = new Date(Number(year), Number(month), 0).toISOString().slice(0, 10);

        // Group by rep to write per-rep snapshots
        const repMap = new Map<string, { volume: number; residual: number; payout: number }>();
        for (const line of (run.lineItems || []) as any[]) {
          const repName = String(line.repName || 'Unassigned');
          const current = repMap.get(repName) || { volume: 0, residual: 0, payout: 0 };
          current.volume += Number(line.volume) || 0;
          current.residual += Number(line.residualRevenue) || 0;
          current.payout += Number(line.payout) || 0;
          repMap.set(repName, current);
        }

        for (const [repName, totals] of repMap.entries()) {
          try {
            await upsertResidualSnapshot(
              auth.session.tenantId,
              null, // team_member_id FK — null until rep UUIDs are linked
              periodStart,
              periodEnd,
              totals.volume,
              totals.residual,
              totals.payout,
              totals.residual - totals.payout,
              { repName, runId: run.id, period }
            );
          } catch {
            // Non-fatal; state already saved above
          }
        }
      }
    }

    res.status(200).json({ ok: true });
    return;
  }

  // GET — try domain table first, fall back to state blob
  let metrics: DailyMetric[];
  try {
    const domainMetrics = await buildMetricsFromDomain(auth.session.tenantId);
    metrics = domainMetrics && domainMetrics.length > 0
      ? domainMetrics
      : buildMetrics(state.transactions as any[]);
  } catch {
    metrics = buildMetrics(state.transactions as any[]);
  }

  res.status(200).json({
    metrics,
    commissionRuns: state.commissionRuns || []
  });
}
