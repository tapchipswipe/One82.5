import {
  getOrCreateLogin,
  parseBody,
  sendMethodNotAllowed,
  setApiResponseHeaders,
  setSessionCookie,
  verifySupabaseCredentials
} from '../_lib/backend.js';

export const config = { runtime: 'nodejs' };

type LoginBody = {
  email?: string;
  password?: string;
  mode?: 'demo' | 'backend';
};

export default async function handler(req: any, res: any) {
  setApiResponseHeaders(res);

  try {
    if (req.method !== 'POST') {
      sendMethodNotAllowed(res, ['POST']);
      return;
    }

    const body = await parseBody<LoginBody>(req);
    const email = body?.email?.trim().toLowerCase();

    if (!email) {
      res.status(400).json({ error: 'Email is required.' });
      return;
    }

    const mode = body?.mode === 'demo' ? 'demo' : 'backend';

    if (mode === 'backend') {
      const password = body?.password || '';
      if (!password) {
        res.status(400).json({ error: 'Password is required for Auth Login.' });
        return;
      }

      const isValid = await verifySupabaseCredentials(email, password);
      if (!isValid) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }
    }

    const { user, session, sessionToken } = await getOrCreateLogin(email, mode);
    setSessionCookie(res, sessionToken);
    res.status(200).json({ user, session });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed.';
    res.status(500).json({ error: message });
  }
}
