import {
  getStateForTenant,
  requireAuthorized,
  saveStateForTenant,
  sendMethodNotAllowed,
  setApiResponseHeaders
} from '../_lib/backend';

export const config = { runtime: 'nodejs' };

export default async function handler(req: any, res: any) {
  setApiResponseHeaders(res);

  if (req.method !== 'GET' && req.method !== 'POST') {
    sendMethodNotAllowed(res, ['GET', 'POST']);
    return;
  }

  const auth = await requireAuthorized(req, res);
  if (!auth) {
    return;
  }

  if (req.method === 'GET') {
    const state = await getStateForTenant(auth.session.tenantId);
    res.status(200).json({ notifications: state.notifications });
    return;
  }

  const state = await getStateForTenant(auth.session.tenantId);
  const notifications = (state.notifications || []).map((notification: any) => ({
    ...notification,
    read: true
  }));

  await saveStateForTenant(auth.session.tenantId, {
    ...state,
    notifications
  } as any);

  res.status(200).json({ ok: true });
}
