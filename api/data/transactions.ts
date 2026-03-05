import {
  getAuthFromRequest,
  getStateForTenant,
  parseBody,
  saveStateForTenant,
  syncTransactionsToDomain,
  setApiResponseHeaders,
  sendMethodNotAllowed,
  sendUnauthorized
} from '../_lib/backend.js';

export const config = { runtime: 'nodejs' };

type Body = {
  transactions?: unknown[];
};

export default async function handler(req: any, res: any) {
  setApiResponseHeaders(res);

  if (req.method !== 'GET' && req.method !== 'PUT') {
    sendMethodNotAllowed(res, ['GET', 'PUT']);
    return;
  }

  const auth = await getAuthFromRequest(req);
  if (!auth) {
    sendUnauthorized(res);
    return;
  }

  const state = await getStateForTenant(auth.session.tenantId);

  if (req.method === 'GET') {
    res.status(200).json({ transactions: state.transactions });
    return;
  }

  const body = await parseBody<Body>(req);
  const transactions = Array.isArray(body?.transactions) ? body.transactions : [];
  const updated = {
    ...state,
    transactions: transactions as any[]
  };

  await saveStateForTenant(auth.session.tenantId, updated as any);

  try {
    await syncTransactionsToDomain(auth.session.tenantId, updated.transactions as any[], auth.user.id, 'app');
  } catch (error) {
    console.error('Failed to sync transactions to domain tables:', error);
  }

  res.status(200).json({ ok: true });
}
