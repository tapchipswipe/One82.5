import {
  buildMetrics,
  getAuthFromRequest,
  getStateForTenant,
  parseBody,
  saveStateForTenant,
  setApiResponseHeaders,
  sendMethodNotAllowed,
  sendUnauthorized
} from '../_lib/backend.js';

export const config = { runtime: 'nodejs' };

type Body = {
  commissionRuns?: unknown[];
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

  if (req.method === 'PUT') {
    const body = await parseBody<Body>(req);
    const commissionRuns = Array.isArray(body?.commissionRuns) ? body.commissionRuns : state.commissionRuns || [];

    await saveStateForTenant(auth.session.tenantId, {
      ...state,
      commissionRuns: commissionRuns as any[]
    } as any);

    res.status(200).json({ ok: true });
    return;
  }

  const metrics = buildMetrics(state.transactions as any[]);

  res.status(200).json({
    metrics,
    commissionRuns: state.commissionRuns || []
  });
}
