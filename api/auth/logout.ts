import { clearSessionCookie, revokeAuthFromRequest, sendMethodNotAllowed, setApiResponseHeaders } from '../_lib/backend.js';

export const config = { runtime: 'nodejs' };

export default async function handler(req: any, res: any) {
  setApiResponseHeaders(res);

  if (req.method !== 'POST') {
    sendMethodNotAllowed(res, ['POST']);
    return;
  }

  await revokeAuthFromRequest(req);
  clearSessionCookie(res);
  res.status(200).json({ ok: true });
}
