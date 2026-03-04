import {
  getAuthFromRequest,
  getStateForTenant,
  parseBody,
  saveStateForTenant,
  syncImportedRowsToDomain,
  setApiResponseHeaders,
  sendMethodNotAllowed,
  sendUnauthorized
} from '../_lib/backend.js';

export const config = { runtime: 'nodejs' };

type ImportRow = Record<string, string>;

type Body = {
  merchants?: ImportRow[];
  team?: ImportRow[];
};

export default async function handler(req: any, res: any) {
  setApiResponseHeaders(res);

  if (req.method !== 'GET' && req.method !== 'PUT') {
    sendMethodNotAllowed(res, ['GET', 'PUT']);
    return;
  }

  const auth = await getAuthFromRequest(req);
  if (!auth) {
    sendUnauthorized(res);
    return;
  }

  const state = await getStateForTenant(auth.session.tenantId);

  if (req.method === 'GET') {
    res.status(200).json({
      merchants: state.importedMerchants || [],
      team: state.importedTeam || []
    });
    return;
  }

  const body = await parseBody<Body>(req);
  const merchants = Array.isArray(body?.merchants) ? body.merchants : state.importedMerchants || [];
  const team = Array.isArray(body?.team) ? body.team : state.importedTeam || [];

  await saveStateForTenant(auth.session.tenantId, {
    ...state,
    importedMerchants: merchants,
    importedTeam: team
  } as any);

  try {
    await syncImportedRowsToDomain(auth.session.tenantId, merchants, team, auth.user.id);
  } catch {
  }

  res.status(200).json({ ok: true });
}
