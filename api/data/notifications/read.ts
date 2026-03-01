import {
  getAuthFromRequest,
  getStateForTenant,
  saveStateForTenant,
  sendMethodNotAllowed,
  sendUnauthorized
} from '../../_lib/backend';

export const config = { runtime: 'nodejs' };

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    sendMethodNotAllowed(res, ['POST']);
    return;
  }

  const auth = getAuthFromRequest(req);
  if (!auth) {
    sendUnauthorized(res);
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
