import { getAuthFromRequest, parseBody, saveLoginUser, sendMethodNotAllowed, sendUnauthorized, setApiResponseHeaders } from '../_lib/backend.js';

export const config = { runtime: 'nodejs' };

type Body = {
  user?: {
    id: string;
    email: string;
    name: string;
    role: 'merchant' | 'iso' | 'overseer';
    businessType?: string;
    organizationName?: string;
    onboardingComplete: boolean;
    credits: number;
    plan: 'Free' | 'Pro' | 'Enterprise';
  };
};

export default async function handler(req: any, res: any) {
  setApiResponseHeaders(res);

  if (req.method !== 'PUT') {
    sendMethodNotAllowed(res, ['PUT']);
    return;
  }

  const auth = await getAuthFromRequest(req);
  if (!auth) {
    sendUnauthorized(res);
    return;
  }

  const body = await parseBody<Body>(req);
  const incoming = body?.user;

  if (!incoming || incoming.id !== auth.user.id) {
    res.status(400).json({ error: 'Invalid user payload.' });
    return;
  }

  const mergedUser = {
    ...auth.user,
    ...incoming,
    id: auth.user.id,
    email: auth.user.email
  };

  const savedUser = await saveLoginUser(mergedUser, 'backend');
  res.status(200).json({ user: savedUser });
}
