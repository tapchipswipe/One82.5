import { buildMetrics, getAuthFromRequest, getStateForTenant, sendMethodNotAllowed, sendUnauthorized } from '../_lib/backend';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    sendMethodNotAllowed(res, ['GET']);
    return;
  }

  const auth = getAuthFromRequest(req);
  if (!auth) {
    sendUnauthorized(res);
    return;
  }

  const state = await getStateForTenant(auth.session.tenantId);
  const metrics = buildMetrics(state.transactions as any[]);

  res.status(200).json({ metrics });
}
