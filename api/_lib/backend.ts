import { env } from '../../config/env';

type UserRole = 'merchant' | 'iso' | 'overseer';

type User = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  businessType?: string;
  organizationName?: string;
  onboardingComplete: boolean;
  credits: number;
  plan: 'Free' | 'Pro' | 'Enterprise';
};

type AuthSession = {
  sessionId: string;
  userId: string;
  tenantId: string;
  role: UserRole;
  issuedAt: string;
  expiresAt: string;
};

type AuthMode = 'demo' | 'backend';
type AuthContext = {
  user: User;
  session: AuthSession;
};

type AppNotification = {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'alert' | 'success';
  read: boolean;
  timestamp: number;
};

type Transaction = {
  id: string;
  date: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed';
  customer: string;
  items: string[];
  method: 'Visa' | 'MasterCard' | 'Amex' | 'Square' | 'Stripe' | 'Cash' | 'Apple Pay' | 'Wire';
  category:
  | 'Inventory'
  | 'Utilities'
  | 'Payroll'
  | 'Marketing'
  | 'Software'
  | 'Rent'
  | 'Miscellaneous'
  | 'Uncategorized';
};

type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  note?: string;
  impactDirection: 'up' | 'down' | 'neutral';
  impactPercent: number;
  createdAt: number;
  updatedAt: number;
};

type MerchantInvite = {
  id: string;
  merchantName: string;
  email: string;
  status: 'sent' | 'opened';
  strategy: 'csv-auto-invite' | 'invite-link';
  createdAt: number;
};

type OnboardingDeal = {
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
};

type CommissionLineItem = {
  id: string;
  repName: string;
  merchantName: string;
  volume: number;
  residualRevenue: number;
  commissionRate: number;
  payout: number;
  exception?: string;
};

type CommissionRun = {
  id: string;
  period: string;
  status: 'draft' | 'finalized';
  createdAt: number;
  finalizedAt?: number;
  totalPayout: number;
  lineItems: CommissionLineItem[];
};

type BuyRateProfile = {
  id: string;
  merchantName: string;
  processorTarget: 'stripe' | 'tsys' | 'fiserv' | 'worldpay' | 'global';
  buyRateBps: number;
  markupBps: number;
  serviceFeeMonthly: number;
  updatedAt: number;
};

type TenantState = {
  transactions: Transaction[];
  notifications: AppNotification[];
  calendarEvents: CalendarEvent[];
  importedMerchants: Array<Record<string, string>>;
  importedTeam: Array<Record<string, string>>;
  merchantInvites: MerchantInvite[];
  inviteStrategy: 'csv-auto-invite' | 'invite-link';
  onboardingDeals: OnboardingDeal[];
  commissionRuns: CommissionRun[];
  buyRateProfiles: BuyRateProfile[];
};

type DailyMetric = {
  date: string;
  revenue: number;
  transactions: number;
};

type RequestLike = {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
};

type ResponseLike = {
  status: (code: number) => ResponseLike;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string | string[]) => void;
  end: (body?: string) => void;
};

type CachePolicy = 'no-store' | 'public-short';

const DEFAULT_NOTIFICATIONS: AppNotification[] = [];

const DEFAULT_TRANSACTIONS: Transaction[] = [];

const OVERSEER_EMAIL = env.app.overseerEmail;
const SESSION_COOKIE = 'one82_backend_session';
const SUPABASE_URL = env.supabase.url;
const SUPABASE_SERVICE_ROLE_KEY = env.supabase.serviceRoleKey;
const SUPABASE_ANON_KEY = env.supabase.anonKey;
const STATE_TABLE = env.tables.state;
const LOGIN_USERS_TABLE = env.tables.loginUsers;
const LOGIN_SESSIONS_TABLE = env.tables.loginSessions;
const TENANTS_TABLE = env.tables.tenants;
const MERCHANTS_TABLE = env.tables.merchants;
const TEAM_MEMBERS_TABLE = env.tables.teamMembers;
const PROCESSOR_TRANSACTIONS_TABLE = env.tables.processorTransactions;
const IMPORT_JOBS_TABLE = env.tables.importJobs;
const PROCESSOR_CONNECTIONS_TABLE = env.tables.syncRuns.replace('sync_runs', 'processor_connections');
const SYNC_RUNS_TABLE = env.tables.syncRuns;
const RESIDUAL_SNAPSHOTS_TABLE = 'one82_residual_snapshots';

const defaultState = (): TenantState => ({
  transactions: DEFAULT_TRANSACTIONS,
  notifications: DEFAULT_NOTIFICATIONS,
  calendarEvents: [],
  importedMerchants: [],
  importedTeam: [],
  merchantInvites: [],
  inviteStrategy: 'csv-auto-invite',
  onboardingDeals: [],
  commissionRuns: [],
  buyRateProfiles: []
});

const parseCookies = (cookieHeader?: string): Record<string, string> => {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce<Record<string, string>>((acc, part) => {
    const [key, ...rest] = part.trim().split('=');
    if (!key || rest.length === 0) return acc;
    acc[key] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
};

const tenantIdForUser = (user: User): string => {
  const email = user.email.trim().toLowerCase();
  if (email === 'demo-iso@one82.io') return 'tenant_demo_iso';
  if (email === 'demo-merchant@one82.io') return 'tenant_demo_merchant';
  return user.id;
};

const createCookieSession = (user: User): AuthSession => {
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + 24 * 60 * 60 * 1000);
  const tenantId = tenantIdForUser(user);

  if (typeof crypto === 'undefined' || !('randomUUID' in crypto)) {
    throw new Error('Secure random generation is unavailable in this environment.');
  }

  return {
    sessionId: `backend_session_${(crypto as any).randomUUID()}`,
    userId: user.id,
    tenantId,
    role: user.role,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString()
  };
};

const createSessionToken = (): string => {
  if (typeof crypto === 'undefined' || !('randomUUID' in crypto)) {
    throw new Error('Secure random generation is unavailable in this environment.');
  }

  return `st_${(crypto as any).randomUUID()}`;
};

const roleFromEmail = (email: string): UserRole => {
  const normalized = email.toLowerCase();
  if (normalized === OVERSEER_EMAIL) return 'overseer';
  if (normalized === 'demo-merchant@one82.io') return 'merchant';
  if (normalized === 'demo-iso@one82.io') return 'iso';
  if (normalized.includes('iso')) return 'iso';
  return 'merchant';
};

const idFromEmail = (email: string): string => {
  const normalized = email.trim().toLowerCase();
  let hash = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 31 + normalized.charCodeAt(index)) >>> 0;
  }
  return `u_${hash.toString(16)}`;
};

const getNameFromEmail = (email: string): string => {
  const [namePart] = email.split('@');
  return namePart || 'User';
};

const createUser = (email: string): User => {
  const normalized = email.trim().toLowerCase();
  const role = roleFromEmail(normalized);

  if (role === 'overseer') {
    return {
      id: 'owner_overseer',
      email: normalized,
      name: 'Program Owner',
      role,
      onboardingComplete: true,
      credits: 9999,
      plan: 'Enterprise'
    };
  }

  const user: User = {
    id: idFromEmail(normalized),
    email: normalized,
    name: getNameFromEmail(normalized),
    role,
    onboardingComplete: role === 'iso',
    credits: 50,
    plan: 'Free'
  };

  if (role === 'iso') {
    user.organizationName = 'Demo ISO';
  }

  return user;
};

const getSupabaseHeaders = (): Record<string, string> => ({
  apikey: SUPABASE_SERVICE_ROLE_KEY || '',
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY || ''}`,
  'Content-Type': 'application/json'
});

const canUseSupabase = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
const ALL_USER_ROLES: readonly UserRole[] = ['merchant', 'iso', 'overseer'];
const canUseSupabaseAuth = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const verifySupabaseCredentials = async (email: string, password: string): Promise<boolean> => {
  if (!canUseSupabaseAuth) {
    throw new Error('Supabase auth verification is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.');
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY || '',
      Authorization: `Bearer ${SUPABASE_ANON_KEY || ''}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    if (env.runtimeMode === 'development') {
      try {
        const payloadText = await response.text();
        console.warn('[auth] Supabase credential verification failed', {
          status: response.status,
          body: payloadText.slice(0, 500)
        });
      } catch {
        // ignore
      }
    }
    return false;
  }

  const payload = (await response.json()) as { user?: { email?: string } };
  const verifiedEmail = payload?.user?.email?.trim().toLowerCase();
  return Boolean(verifiedEmail && verifiedEmail === email.trim().toLowerCase());
};

type LoginUserRow = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  business_type?: string | null;
  organization_name?: string | null;
  onboarding_complete: boolean;
  credits: number;
  plan: User['plan'];
  last_auth_mode?: AuthMode;
};

type LoginSessionRow = {
  session_id: string;
  session_token: string;
  user_id: string;
  tenant_id: string;
  role: UserRole;
  auth_mode: AuthMode;
  issued_at: string;
  expires_at: string;
  revoked_at?: string | null;
};

const requireSupabase = (): void => {
  if (!canUseSupabase) {
    throw new Error('Supabase auth storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
};

const toLoginUserRow = (user: User, mode: AuthMode): LoginUserRow => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  business_type: user.businessType ?? null,
  organization_name: user.organizationName ?? null,
  onboarding_complete: user.onboardingComplete,
  credits: user.credits,
  plan: user.plan,
  last_auth_mode: mode
});

const toUserFromRow = (row: LoginUserRow): User => ({
  id: row.id,
  email: row.email,
  name: row.name,
  role: row.role,
  businessType: row.business_type ?? undefined,
  organizationName: row.organization_name ?? undefined,
  onboardingComplete: Boolean(row.onboarding_complete),
  credits: Number(row.credits) || 0,
  plan: row.plan
});

const upsertLoginUser = async (user: User, mode: AuthMode): Promise<User> => {
  requireSupabase();

  const upsertUrl = `${SUPABASE_URL}/rest/v1/${LOGIN_USERS_TABLE}?on_conflict=email&select=id,email,name,role,business_type,organization_name,onboarding_complete,credits,plan,last_auth_mode`;
  const payload = {
    ...toLoginUserRow(user, mode),
    last_login_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const response = await fetch(upsertUrl, {
    method: 'POST',
    headers: {
      ...getSupabaseHeaders(),
      Prefer: 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify([payload])
  });

  if (!response.ok) {
    throw new Error('Failed to persist login user in Supabase.');
  }

  const rows = (await response.json()) as LoginUserRow[];
  const row = rows?.[0];
  if (!row) {
    throw new Error('Supabase did not return persisted login user.');
  }

  return toUserFromRow(row);
};

const createLoginSession = async (user: User, mode: AuthMode): Promise<{ session: AuthSession; sessionToken: string }> => {
  requireSupabase();

  const session = createCookieSession(user);
  const sessionToken = createSessionToken();
  const row: LoginSessionRow = {
    session_id: session.sessionId,
    session_token: sessionToken,
    user_id: session.userId,
    tenant_id: session.tenantId,
    role: session.role,
    auth_mode: mode,
    issued_at: session.issuedAt,
    expires_at: session.expiresAt,
    revoked_at: null
  };

  const insertUrl = `${SUPABASE_URL}/rest/v1/${LOGIN_SESSIONS_TABLE}`;
  const response = await fetch(insertUrl, {
    method: 'POST',
    headers: {
      ...getSupabaseHeaders(),
      Prefer: 'return=minimal'
    },
    body: JSON.stringify([row])
  });

  if (!response.ok) {
    throw new Error('Failed to persist login session in Supabase.');
  }

  return { session, sessionToken };
};

const getSessionByToken = async (sessionToken: string): Promise<LoginSessionRow | null> => {
  requireSupabase();

  const nowIso = new Date().toISOString();
  const query = `${SUPABASE_URL}/rest/v1/${LOGIN_SESSIONS_TABLE}?session_token=eq.${encodeURIComponent(sessionToken)}&revoked_at=is.null&expires_at=gte.${encodeURIComponent(nowIso)}&select=session_id,session_token,user_id,tenant_id,role,auth_mode,issued_at,expires_at,revoked_at&limit=1`;
  const response = await fetch(query, {
    method: 'GET',
    headers: getSupabaseHeaders()
  });

  if (!response.ok) {
    return null;
  }

  const rows = (await response.json()) as LoginSessionRow[];
  const row = rows?.[0] || null;
  if (!row) return null;
  if (row.revoked_at) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  return row;
};

const getUserById = async (userId: string): Promise<User | null> => {
  requireSupabase();

  const query = `${SUPABASE_URL}/rest/v1/${LOGIN_USERS_TABLE}?id=eq.${encodeURIComponent(userId)}&select=id,email,name,role,business_type,organization_name,onboarding_complete,credits,plan,last_auth_mode&limit=1`;
  const response = await fetch(query, {
    method: 'GET',
    headers: getSupabaseHeaders()
  });

  if (!response.ok) {
    return null;
  }

  const rows = (await response.json()) as LoginUserRow[];
  const row = rows?.[0];
  return row ? toUserFromRow(row) : null;
};

const getUserByEmail = async (email: string): Promise<User | null> => {
  requireSupabase();

  const query = `${SUPABASE_URL}/rest/v1/${LOGIN_USERS_TABLE}?email=eq.${encodeURIComponent(email.trim().toLowerCase())}&select=id,email,name,role,business_type,organization_name,onboarding_complete,credits,plan,last_auth_mode&limit=1`;
  const response = await fetch(query, {
    method: 'GET',
    headers: getSupabaseHeaders()
  });

  if (!response.ok) {
    return null;
  }

  const rows = (await response.json()) as LoginUserRow[];
  const row = rows?.[0];
  return row ? toUserFromRow(row) : null;
};

const revokeSessionByToken = async (sessionToken: string): Promise<void> => {
  requireSupabase();

  const updateUrl = `${SUPABASE_URL}/rest/v1/${LOGIN_SESSIONS_TABLE}?session_token=eq.${encodeURIComponent(sessionToken)}&revoked_at=is.null`;
  await fetch(updateUrl, {
    method: 'PATCH',
    headers: {
      ...getSupabaseHeaders(),
      Prefer: 'return=minimal'
    },
    body: JSON.stringify({ revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
  });
};

const loadStateFromSupabase = async (tenantId: string): Promise<TenantState | null> => {
  requireSupabase();

  const query = `${SUPABASE_URL}/rest/v1/${STATE_TABLE}?tenant_id=eq.${encodeURIComponent(tenantId)}&select=payload&limit=1`;
  const response = await fetch(query, {
    method: 'GET',
    headers: getSupabaseHeaders()
  });

  if (!response.ok) {
    return null;
  }

  const rows = (await response.json()) as Array<{ payload?: TenantState }>;
  const payload = rows?.[0]?.payload;
  if (!payload) return null;

  return {
    transactions: Array.isArray(payload.transactions) ? payload.transactions : [],
    notifications: Array.isArray(payload.notifications) ? payload.notifications : [],
    calendarEvents: Array.isArray(payload.calendarEvents) ? payload.calendarEvents : [],
    importedMerchants: Array.isArray(payload.importedMerchants) ? payload.importedMerchants : [],
    importedTeam: Array.isArray(payload.importedTeam) ? payload.importedTeam : [],
    merchantInvites: Array.isArray(payload.merchantInvites) ? payload.merchantInvites : [],
    inviteStrategy: payload.inviteStrategy === 'invite-link' ? 'invite-link' : 'csv-auto-invite',
    onboardingDeals: Array.isArray(payload.onboardingDeals) ? payload.onboardingDeals : [],
    commissionRuns: Array.isArray(payload.commissionRuns) ? payload.commissionRuns : [],
    buyRateProfiles: Array.isArray(payload.buyRateProfiles) ? payload.buyRateProfiles : []
  };
};

const saveStateToSupabase = async (tenantId: string, state: TenantState): Promise<boolean> => {
  requireSupabase();

  const upsertUrl = `${SUPABASE_URL}/rest/v1/${STATE_TABLE}?on_conflict=tenant_id`;
  const response = await fetch(upsertUrl, {
    method: 'POST',
    headers: {
      ...getSupabaseHeaders(),
      Prefer: 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify([
      {
        tenant_id: tenantId,
        payload: state,
        updated_at: new Date().toISOString()
      }
    ])
  });

  return response.ok;
};

const ensureTenantExists = async (tenantId: string): Promise<void> => {
  requireSupabase();

  const rpcUrl = `${SUPABASE_URL}/rest/v1/rpc/one82_ensure_tenant`;
  await fetch(rpcUrl, {
    method: 'POST',
    headers: {
      ...getSupabaseHeaders(),
      Prefer: 'return=minimal'
    },
    body: JSON.stringify({ p_tenant_id: tenantId })
  });

  const upsertUrl = `${SUPABASE_URL}/rest/v1/${TENANTS_TABLE}?on_conflict=tenant_id`;
  await fetch(upsertUrl, {
    method: 'POST',
    headers: {
      ...getSupabaseHeaders(),
      Prefer: 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify([
      {
        tenant_id: tenantId,
        updated_at: new Date().toISOString()
      }
    ])
  });
};

const normalizeKey = (value: string): string => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');

const getRowField = (row: Record<string, string>, keys: string[]): string => {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return '';
};

const toMerchantRows = (tenantId: string, rows: Array<Record<string, string>>) => {
  return rows
    .map((row, index) => {
      const name = getRowField(row, ['name', 'merchantname', 'company', 'businessname']);
      if (!name) return null;

      const email = getRowField(row, ['email', 'owneremail', 'contactemail']) || null;
      const phone = getRowField(row, ['phone', 'contactphone']) || null;
      const externalKeyField = getRowField(row, ['externalkey', 'merchantid', 'id']);
      const externalKey = externalKeyField || `imp_m_${normalizeKey(name)}_${index}`;

      return {
        tenant_id: tenantId,
        external_key: externalKey,
        name,
        owner_name: getRowField(row, ['owner', 'ownername', 'contactname']) || null,
        email,
        phone,
        business_type: getRowField(row, ['businesstype', 'industry', 'type']) || null,
        status: getRowField(row, ['status']) || 'Active',
        monthly_volume: Number(getRowField(row, ['monthlyvolume', 'volume', 'amount'])) || 0,
        churn_risk: getRowField(row, ['churnrisk', 'risk']) || null,
        trend: getRowField(row, ['trend']) || null,
        updated_at: new Date().toISOString(),
        attributes: row
      };
    })
    .filter((value): value is NonNullable<typeof value> => Boolean(value));
};

const toTeamMemberRows = (tenantId: string, rows: Array<Record<string, string>>) => {
  return rows
    .map((row, index) => {
      const name = getRowField(row, ['name', 'repname', 'membername']);
      if (!name) return null;

      const email = getRowField(row, ['email', 'repemail']) || null;
      const externalKeyField = getRowField(row, ['externalkey', 'memberid', 'repid', 'id']);
      const externalKey = externalKeyField || `imp_t_${normalizeKey(name)}_${index}`;

      return {
        tenant_id: tenantId,
        external_key: externalKey,
        name,
        email,
        member_role: getRowField(row, ['role', 'memberrole']) || 'rep',
        region: getRowField(row, ['region', 'territory']) || null,
        is_active: true,
        updated_at: new Date().toISOString(),
        metrics: row
      };
    })
    .filter((value): value is NonNullable<typeof value> => Boolean(value));
};

const toProcessorTransactionRows = (tenantId: string, transactions: Transaction[], ingestedFrom: string) => {
  return transactions.map((transaction) => ({
    tenant_id: tenantId,
    source_transaction_id: transaction.id || null,
    occurred_at: new Date(transaction.date).toISOString(),
    amount: Number(transaction.amount) || 0,
    currency: 'USD',
    status: transaction.status,
    customer: transaction.customer || null,
    items: Array.isArray(transaction.items) ? transaction.items : [],
    method: transaction.method || null,
    category: transaction.category || null,
    processor: null,
    ingested_from: ingestedFrom,
    raw_payload: transaction,
    updated_at: new Date().toISOString()
  }));
};

const insertImportJob = async (
  tenantId: string,
  datasetType: 'transactions' | 'merchants' | 'team',
  rowCount: number,
  userId?: string,
  summary?: Record<string, unknown>
): Promise<void> => {
  if (!canUseSupabase) return;

  const url = `${SUPABASE_URL}/rest/v1/${IMPORT_JOBS_TABLE}`;
  await fetch(url, {
    method: 'POST',
    headers: {
      ...getSupabaseHeaders(),
      Prefer: 'return=minimal'
    },
    body: JSON.stringify([
      {
        tenant_id: tenantId,
        dataset_type: datasetType,
        row_count: rowCount,
        status: 'completed',
        created_by_user_id: userId || null,
        summary: summary || {},
        updated_at: new Date().toISOString()
      }
    ])
  });
};

export const syncImportedRowsToDomain = async (
  tenantId: string,
  merchants: Array<Record<string, string>>,
  team: Array<Record<string, string>>,
  userId?: string
): Promise<void> => {
  if (!canUseSupabase) return;

  await ensureTenantExists(tenantId);

  const merchantRows = toMerchantRows(tenantId, merchants);
  if (merchantRows.length > 0) {
    const url = `${SUPABASE_URL}/rest/v1/${MERCHANTS_TABLE}?on_conflict=tenant_id,external_key`;
    await fetch(url, {
      method: 'POST',
      headers: {
        ...getSupabaseHeaders(),
        Prefer: 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify(merchantRows)
    });
  }

  const teamRows = toTeamMemberRows(tenantId, team);
  if (teamRows.length > 0) {
    const url = `${SUPABASE_URL}/rest/v1/${TEAM_MEMBERS_TABLE}?on_conflict=tenant_id,external_key`;
    await fetch(url, {
      method: 'POST',
      headers: {
        ...getSupabaseHeaders(),
        Prefer: 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify(teamRows)
    });
  }

  if (merchants.length > 0) {
    await insertImportJob(tenantId, 'merchants', merchants.length, userId, { synced: merchantRows.length });
  }

  if (team.length > 0) {
    await insertImportJob(tenantId, 'team', team.length, userId, { synced: teamRows.length });
  }
};

export const syncTransactionsToDomain = async (
  tenantId: string,
  transactions: Transaction[],
  userId?: string,
  ingestedFrom = 'import'
): Promise<void> => {
  requireSupabase();
  if (!Array.isArray(transactions) || transactions.length === 0) return;

  await ensureTenantExists(tenantId);

  const txRows = toProcessorTransactionRows(tenantId, transactions, ingestedFrom);
  const url = `${SUPABASE_URL}/rest/v1/${PROCESSOR_TRANSACTIONS_TABLE}?on_conflict=tenant_id,source_transaction_id`;
  await fetch(url, {
    method: 'POST',
    headers: {
      ...getSupabaseHeaders(),
      Prefer: 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify(txRows)
  });

  await insertImportJob(tenantId, 'transactions', transactions.length, userId, { ingestedFrom });
};

const normalizeState = (state: TenantState | null): TenantState => {
  if (!state) return defaultState();
  return {
    transactions: Array.isArray(state.transactions) ? state.transactions : [],
    notifications: Array.isArray(state.notifications) ? state.notifications : [],
    calendarEvents: Array.isArray(state.calendarEvents) ? state.calendarEvents : [],
    importedMerchants: Array.isArray(state.importedMerchants) ? state.importedMerchants : [],
    importedTeam: Array.isArray(state.importedTeam) ? state.importedTeam : [],
    merchantInvites: Array.isArray(state.merchantInvites) ? state.merchantInvites : [],
    inviteStrategy: state.inviteStrategy === 'invite-link' ? 'invite-link' : 'csv-auto-invite',
    onboardingDeals: Array.isArray(state.onboardingDeals) ? state.onboardingDeals : [],
    commissionRuns: Array.isArray(state.commissionRuns) ? state.commissionRuns : [],
    buyRateProfiles: Array.isArray(state.buyRateProfiles) ? state.buyRateProfiles : []
  };
};

export const getStateForTenant = async (tenantId: string): Promise<TenantState> => {
  requireSupabase();
  const supabaseState = await loadStateFromSupabase(tenantId);
  return normalizeState(supabaseState);
};

export const saveStateForTenant = async (tenantId: string, state: TenantState): Promise<void> => {
  requireSupabase();
  const normalized = normalizeState(state);
  const saved = await saveStateToSupabase(tenantId, normalized);
  if (!saved) throw new Error('Failed to persist tenant state in Supabase.');
};

export const setSessionCookie = (res: ResponseLike, sessionToken: string): void => {
  const secure = env.isProduction ? '; Secure' : '';
  const cookie = `${SESSION_COOKIE}=${encodeURIComponent(sessionToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${secure}`;
  res.setHeader('Set-Cookie', cookie);
};

export const clearSessionCookie = (res: ResponseLike): void => {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
};

export const getAuthFromRequest = async (req: RequestLike): Promise<AuthContext | null> => {
  if (!canUseSupabase) return null;

  const cookieHeader = Array.isArray(req.headers.cookie) ? req.headers.cookie.join('; ') : req.headers.cookie;
  const cookies = parseCookies(cookieHeader);
  const sessionToken = cookies[SESSION_COOKIE];
  if (!sessionToken) return null;

  const sessionRow = await getSessionByToken(sessionToken);
  if (!sessionRow) return null;

  const user = await getUserById(sessionRow.user_id);
  if (!user) return null;

  const session: AuthSession = {
    sessionId: sessionRow.session_id,
    userId: sessionRow.user_id,
    tenantId: sessionRow.tenant_id,
    role: sessionRow.role,
    issuedAt: sessionRow.issued_at,
    expiresAt: sessionRow.expires_at
  };

  return { user, session };
};

export const revokeAuthFromRequest = async (req: RequestLike): Promise<void> => {
  if (!canUseSupabase) return;

  const cookieHeader = Array.isArray(req.headers.cookie) ? req.headers.cookie.join('; ') : req.headers.cookie;
  const cookies = parseCookies(cookieHeader);
  const sessionToken = cookies[SESSION_COOKIE];
  if (!sessionToken) return;

  await revokeSessionByToken(sessionToken);
};

export const getOrCreateLogin = async (email: string, mode: AuthMode): Promise<{ user: User; session: AuthSession; sessionToken: string }> => {
  const existingUser = await getUserByEmail(email);
  const sourceUser = existingUser || createUser(email);
  const user = await upsertLoginUser(sourceUser, mode);
  const { session, sessionToken } = await createLoginSession(user, mode);
  const tenantId = session.tenantId;
  const existing = await getStateForTenant(tenantId);
  await saveStateForTenant(tenantId, existing);
  return { user, session, sessionToken };
};

export const saveLoginUser = async (user: User, mode: AuthMode): Promise<User> => {
  return upsertLoginUser(user, mode);
};

export const parseBody = async <T>(req: RequestLike): Promise<T | null> => {
  if (req.body == null) return null;
  if (typeof req.body === 'object') {
    return req.body as T;
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as T;
    } catch {
      return null;
    }
  }
  return null;
};

export const setApiResponseHeaders = (res: ResponseLike, cachePolicy: CachePolicy = 'no-store'): void => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (cachePolicy === 'public-short') {
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=120');
    return;
  }

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
};

export const sendMethodNotAllowed = (res: ResponseLike, allowed: string[]): void => {
  res.setHeader('Allow', allowed.join(', '));
  res.status(405).json({ error: 'Method not allowed.' });
};

export const sendUnauthorized = (res: ResponseLike): void => {
  res.status(401).json({ error: 'Unauthorized' });
};

export const sendForbidden = (res: ResponseLike): void => {
  res.status(403).json({ error: 'Forbidden' });
};

export const requireAuthorized = async (
  req: RequestLike,
  res: ResponseLike,
  allowedRoles: readonly UserRole[] = ALL_USER_ROLES
): Promise<AuthContext | null> => {
  const auth = await getAuthFromRequest(req);
  if (!auth) {
    sendUnauthorized(res);
    return null;
  }

  if (!allowedRoles.includes(auth.user.role)) {
    sendForbidden(res);
    return null;
  }

  return auth;
};

export const buildMetrics = (transactions: Transaction[]): DailyMetric[] => {
  const map = new Map<string, DailyMetric>();

  for (const transaction of transactions) {
    const date = new Date(transaction.date);
    if (Number.isNaN(date.getTime())) continue;
    const key = date.toISOString().slice(0, 10);
    const current = map.get(key) || { date: key, revenue: 0, transactions: 0 };
    current.revenue += Number(transaction.amount) || 0;
    current.transactions += 1;
    map.set(key, current);
  }

  return Array.from(map.values()).sort((left, right) => left.date.localeCompare(right.date));
};

export const upsertProcessorConnection = async (
  tenantId: string,
  provider: string,
  externalAccountId?: string
): Promise<void> => {
  if (!canUseSupabase) return;

  await ensureTenantExists(tenantId);

  const url = `${SUPABASE_URL}/rest/v1/${PROCESSOR_CONNECTIONS_TABLE}?on_conflict=tenant_id,provider,external_account_id`;
  await fetch(url, {
    method: 'POST',
    headers: {
      ...getSupabaseHeaders(),
      Prefer: 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify([{
      tenant_id: tenantId,
      provider,
      external_account_id: externalAccountId || null,
      status: 'connected',
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
  });
};

export const insertSyncRun = async (
  tenantId: string,
  provider: string,
  importedCount: number,
  status: 'completed' | 'failed' = 'completed',
  errorMessage?: string
): Promise<void> => {
  if (!canUseSupabase) return;

  await ensureTenantExists(tenantId);

  const now = new Date().toISOString();
  const url = `${SUPABASE_URL}/rest/v1/${SYNC_RUNS_TABLE}`;
  await fetch(url, {
    method: 'POST',
    headers: {
      ...getSupabaseHeaders(),
      Prefer: 'return=minimal'
    },
    body: JSON.stringify([{
      tenant_id: tenantId,
      provider,
      started_at: now,
      completed_at: now,
      status,
      imported_count: importedCount,
      failed_count: 0,
      error_message: errorMessage || null,
      updated_at: now
    }])
  });
};

export const upsertResidualSnapshot = async (
  tenantId: string,
  teamMemberId: string | null,
  periodStart: string,
  periodEnd: string,
  grossVolume: number,
  residualAmount: number,
  supportCost: number,
  netProfit: number,
  summary: Record<string, unknown> = {}
): Promise<void> => {
  if (!canUseSupabase) return;

  await ensureTenantExists(tenantId);

  const url = `${SUPABASE_URL}/rest/v1/${RESIDUAL_SNAPSHOTS_TABLE}?on_conflict=tenant_id,team_member_id,period_start,period_end`;
  await fetch(url, {
    method: 'POST',
    headers: {
      ...getSupabaseHeaders(),
      Prefer: 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify([{
      tenant_id: tenantId,
      team_member_id: teamMemberId || null,
      period_start: periodStart,
      period_end: periodEnd,
      gross_volume: grossVolume,
      residual_amount: residualAmount,
      support_cost: supportCost,
      net_profit: netProfit,
      summary,
      updated_at: new Date().toISOString()
    }])
  });
};
