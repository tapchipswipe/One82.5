import { clearSessionCookie, sendMethodNotAllowed } from '../_lib/backend';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    sendMethodNotAllowed(res, ['POST']);
    return;
  }

  clearSessionCookie(res);
  res.status(200).json({ ok: true });
}
