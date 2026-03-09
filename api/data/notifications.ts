import { getStateForTenant, requireAuthorized, sendMethodNotAllowed, setApiResponseHeaders } from '../_lib/backend';

export const config = { runtime: 'nodejs' };

export default async function handler(req: any, res: any) {
  setApiResponseHeaders(res);

  if (req.method !== 'GET') {
    sendMethodNotAllowed(res, ['GET']);
    return;
  }

  const auth = await requireAuthorized(req, res);
  if (!auth) {
    return;
  }

  const state = await getStateForTenant(auth.session.tenantId);
  res.status(200).json({ notifications: state.notifications });
}
