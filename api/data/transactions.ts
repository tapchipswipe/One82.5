import {
  getAuthFromRequest,
  getStateForTenant,
  parseBody,
  saveStateForTenant,
  sendMethodNotAllowed,
  sendUnauthorized
} from '../_lib/backend';

type Body = {
  transactions?: unknown[];
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    sendMethodNotAllowed(res, ['GET', 'PUT']);
    return;
  }

  const auth = getAuthFromRequest(req);
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
  res.status(200).json({ ok: true });
}
