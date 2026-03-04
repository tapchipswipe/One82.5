import {
  buildMetrics,
  getAuthFromRequest,
  getStateForTenant,
  setApiResponseHeaders,
  sendMethodNotAllowed,
  sendUnauthorized
} from '../_lib/backend.js';

export const config = { runtime: 'nodejs' };

export default async function handler(req: any, res: any) {
  setApiResponseHeaders(res);

  if (req.method !== 'GET') {
    sendMethodNotAllowed(res, ['GET']);
    return;
  }

  const auth = await getAuthFromRequest(req);
  if (!auth) {
    sendUnauthorized(res);
    return;
  }

  const state = await getStateForTenant(auth.session.tenantId);
  const metrics = buildMetrics(state.transactions as any[]);

  res.status(200).json({ metrics });
}
