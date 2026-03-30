import { requireAuthorized, sendMethodNotAllowed, setApiResponseHeaders } from '../../../../../api/_lib/backend';

export default async function handler(req: any, res: any) {
  setApiResponseHeaders(res);

  if (req.method !== 'GET') {
    sendMethodNotAllowed(res, ['GET']);
    return;
  }

  const auth = await requireAuthorized(req, res);
  if (!auth) return;

  res.status(200).json(auth);
}

