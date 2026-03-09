import {
  getStateForTenant,
  parseBody,
  requireAuthorized,
  saveStateForTenant,
  syncImportedRowsToDomain,
  setApiResponseHeaders,
  sendMethodNotAllowed
} from '../_lib/backend.js';

export const config = { runtime: 'nodejs' };

type ImportRow = Record<string, string>;

type Body = {
  merchants?: ImportRow[];
  team?: ImportRow[];
  onboardingDeals?: Array<{
    id: string;
    merchantName: string;
    merchantEmail: string;
    ownerRepName: string;
    processorTarget: 'stripe' | 'tsys' | 'fiserv' | 'worldpay' | 'global';
    status: 'draft' | 'validation-required' | 'ready-to-submit' | 'submitted';
    packageSummary: string;
    onboardingPackage?: {
      processorTarget: 'stripe' | 'tsys' | 'fiserv' | 'worldpay' | 'global';
      destinationSystem: 'stripe-underwriting' | 'tsys-boarding' | 'fiserv-boarding' | 'worldpay-boarding' | 'global-boarding';
      readiness: 'ready' | 'incomplete';
      missingFields: string[];
      generatedAt: number;
    };
    notes?: string;
    createdAt: number;
    updatedAt: number;
    submittedAt?: number;
  }>;
  merchantInvites?: Array<{
    id: string;
    merchantName: string;
    email: string;
    status: 'sent' | 'opened';
    strategy: 'csv-auto-invite' | 'invite-link';
    createdAt: number;
  }>;
  inviteStrategy?: 'csv-auto-invite' | 'invite-link';
};

export default async function handler(req: any, res: any) {
  setApiResponseHeaders(res);

  if (req.method !== 'GET' && req.method !== 'PUT') {
    sendMethodNotAllowed(res, ['GET', 'PUT']);
    return;
  }

  const auth = await requireAuthorized(req, res, ['iso', 'overseer']);
  if (!auth) {
    return;
  }

  const state = await getStateForTenant(auth.session.tenantId);

  if (req.method === 'GET') {
    res.status(200).json({
      merchants: state.importedMerchants || [],
      team: state.importedTeam || [],
      onboardingDeals: state.onboardingDeals || [],
      merchantInvites: state.merchantInvites || [],
      inviteStrategy: state.inviteStrategy || 'csv-auto-invite'
    });
    return;
  }

  const body = await parseBody<Body>(req);
  const merchants = Array.isArray(body?.merchants) ? body.merchants : state.importedMerchants || [];
  const team = Array.isArray(body?.team) ? body.team : state.importedTeam || [];
  const onboardingDeals = Array.isArray(body?.onboardingDeals) ? body.onboardingDeals : state.onboardingDeals || [];
  const merchantInvites = Array.isArray(body?.merchantInvites) ? body.merchantInvites : state.merchantInvites || [];
  const inviteStrategy = body?.inviteStrategy === 'invite-link' ? 'invite-link' : (state.inviteStrategy || 'csv-auto-invite');

  await saveStateForTenant(auth.session.tenantId, {
    ...state,
    importedMerchants: merchants,
    importedTeam: team,
    onboardingDeals,
    merchantInvites,
    inviteStrategy
  } as any);

  try {
    await syncImportedRowsToDomain(auth.session.tenantId, merchants, team, auth.user.id);
  } catch (error) {
    console.error('Failed to sync imported rows to domain tables:', error);
  }

  res.status(200).json({ ok: true });
}
