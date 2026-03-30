import {
  getStateForTenant,
  parseBody,
  requireAuthorized,
  saveStateForTenant,
  syncTransactionsToDomain,
  upsertProcessorConnection,
  insertSyncRun,
  setApiResponseHeaders,
  sendMethodNotAllowed
} from '../_lib/backend';

export const config = { runtime: 'nodejs' };

type Body = {
  transactions?: unknown[];
  buyRateProfiles?: unknown[];
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

  if (req.method === 'GET') {
    res.status(200).json({
      transactions: state.transactions,
      buyRateProfiles: state.buyRateProfiles || []
    });
    return;
  }

  const body = await parseBody<Body>(req);
  const transactions = Array.isArray(body?.transactions) ? body.transactions : state.transactions;
  const buyRateProfiles = Array.isArray(body?.buyRateProfiles) ? body.buyRateProfiles : state.buyRateProfiles || [];
  const updated = {
    ...state,
    transactions: transactions as any[],
    buyRateProfiles: buyRateProfiles as any[]
  };

  await saveStateForTenant(auth.session.tenantId, updated as any);

  try {
    await syncTransactionsToDomain(auth.session.tenantId, updated.transactions as any[], auth.user.id, 'app');
    // Write processor connection record and sync run audit entry
    const provider = (body as any)?.provider || 'app';
    await upsertProcessorConnection(auth.session.tenantId, provider);
    await insertSyncRun(auth.session.tenantId, provider, updated.transactions.length, 'completed');
  } catch (error) {
    console.error('Failed to sync transactions to domain tables:', error);
  }

  res.status(200).json({ ok: true });
}
