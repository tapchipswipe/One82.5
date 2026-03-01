import { getOrCreateLogin, parseBody, sendMethodNotAllowed, setSessionCookie } from '../_lib/backend';

export const config = { runtime: 'nodejs' };

type LoginBody = {
  email?: string;
  password?: string;
};

export default async function handler(req: any, res: any) {
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

    const { user, session } = await getOrCreateLogin(email);
    setSessionCookie(res, user, session);
    res.status(200).json({ user, session });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed.';
    res.status(500).json({ error: message });
  }
}
