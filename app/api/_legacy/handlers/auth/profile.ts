import { parseBody, requireAuthorized, saveLoginUser, sendMethodNotAllowed, setApiResponseHeaders } from '../../../../../api/_lib/backend';

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

  const auth = await requireAuthorized(req, res);
  if (!auth) return;

  const body = await parseBody<Body>(req);
  const incoming = body?.user;

  if (!incoming || incoming.id !== auth.user.id) {
    res.status(400).json({ error: 'Invalid user payload.' });
    return;
  }

  const mergedUser = {
    ...auth.user,
    // 🛡️ Sentinel: Prevent mass assignment vulnerability by explicitly defining allowed fields
    name: incoming.name !== undefined ? incoming.name : auth.user.name,
    businessType: incoming.businessType !== undefined ? incoming.businessType : auth.user.businessType,
    organizationName: incoming.organizationName !== undefined ? incoming.organizationName : auth.user.organizationName,
    onboardingComplete: incoming.onboardingComplete !== undefined ? incoming.onboardingComplete : auth.user.onboardingComplete,
    id: auth.user.id,
    email: auth.user.email
  };

  const savedUser = await saveLoginUser(mergedUser, 'backend');
  res.status(200).json({ user: savedUser });
}

