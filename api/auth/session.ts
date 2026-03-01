import { getAuthFromRequest, sendMethodNotAllowed, sendUnauthorized } from '../_lib/backend';

export const config = { runtime: 'nodejs' };

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

  res.status(200).json(auth);
}
