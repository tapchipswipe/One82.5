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

type TenantState = {
  transactions: Transaction[];
  notifications: AppNotification[];
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

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    title: 'Goal Update',
    message: 'You reached 42% of your monthly goal!',
    type: 'info',
    read: false,
    timestamp: Date.now()
  },
  {
    id: 'n2',
    title: 'Anomaly Detected',
    message: 'Unusual transaction volume on Tuesday.',
    type: 'alert',
    read: false,
    timestamp: Date.now() - 86_400_000
  }
];

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: 'seed_tx_1',
    date: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    amount: 125.5,
    status: 'Completed',
    customer: 'Demo Customer A',
    items: ['Service Plan'],
    method: 'Visa',
    category: 'Uncategorized'
  },
  {
    id: 'seed_tx_2',
    date: new Date(Date.now() - 86_400_000).toISOString(),
    amount: 89.99,
    status: 'Completed',
    customer: 'Demo Customer B',
    items: ['Inventory Item'],
    method: 'MasterCard',
    category: 'Uncategorized'
  },
  {
    id: 'seed_tx_3',
    date: new Date().toISOString(),
    amount: 45,
    status: 'Pending',
    customer: 'Demo Customer C',
    items: ['Deposit'],
    method: 'Square',
    category: 'Uncategorized'
  }
];

const OVERSEER_EMAIL = (process.env.VITE_OVERSEER_EMAIL || 'owner@one82.io').toLowerCase();
const SESSION_COOKIE = 'one82_backend_session';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STATE_TABLE = process.env.ONE82_SUPABASE_STATE_TABLE || 'one82_state';

const getMemoryStore = (): Map<string, TenantState> => {
  const globalValue = globalThis as typeof globalThis & { __one82MemStore?: Map<string, TenantState> };
  if (!globalValue.__one82MemStore) {
    globalValue.__one82MemStore = new Map<string, TenantState>();
  }
  return globalValue.__one82MemStore;
};

const defaultState = (): TenantState => ({
  transactions: DEFAULT_TRANSACTIONS,
  notifications: DEFAULT_NOTIFICATIONS
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

const toBase64 = (value: string): string => {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'utf8').toString('base64');
  }

  if (typeof btoa !== 'undefined') {
    if (typeof TextEncoder !== 'undefined') {
      const bytes = new TextEncoder().encode(value);
      let binary = '';
      for (const byte of bytes) {
        binary += String.fromCharCode(byte);
      }
      return btoa(binary);
    }
    return btoa(value);
  }

  throw new Error('No base64 encoder available in current runtime.');
};

const fromBase64 = (value: string): string => {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'base64').toString('utf8');
  }

  if (typeof atob !== 'undefined') {
    const binary = atob(value);
    if (typeof TextDecoder !== 'undefined') {
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    }
    return binary;
  }

  throw new Error('No base64 decoder available in current runtime.');
};

const base64UrlEncode = (value: string): string =>
  toBase64(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

const base64UrlDecode = (value: string): string => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return fromBase64(padded);
};

const createCookieSession = (user: User): AuthSession => {
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + 24 * 60 * 60 * 1000);
  return {
    sessionId: `backend_session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId: user.id,
    tenantId: user.organizationName || user.id,
    role: user.role,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString()
  };
};

const sessionCookieValue = (user: User, session: AuthSession): string => {
  const payload = JSON.stringify({ user, session });
  return base64UrlEncode(payload);
};

const parseSessionCookie = (encoded: string): { user: User; session: AuthSession } | null => {
  try {
    const decoded = base64UrlDecode(encoded);
    const parsed = JSON.parse(decoded) as { user: User; session: AuthSession };
    if (!parsed?.user || !parsed?.session) return null;
    if (new Date(parsed.session.expiresAt).getTime() < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
};

const roleFromEmail = (email: string): UserRole => {
  const normalized = email.toLowerCase();
  if (normalized === OVERSEER_EMAIL) return 'overseer';
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

const loadStateFromSupabase = async (tenantId: string): Promise<TenantState | null> => {
  if (!canUseSupabase) return null;

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
    notifications: Array.isArray(payload.notifications) ? payload.notifications : []
  };
};

const saveStateToSupabase = async (tenantId: string, state: TenantState): Promise<boolean> => {
  if (!canUseSupabase) return false;

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

const loadStateFromMemory = (tenantId: string): TenantState | null => {
  const store = getMemoryStore();
  return store.get(tenantId) || null;
};

const saveStateToMemory = (tenantId: string, state: TenantState): void => {
  const store = getMemoryStore();
  store.set(tenantId, state);
};

const normalizeState = (state: TenantState | null): TenantState => {
  if (!state) return defaultState();
  return {
    transactions: Array.isArray(state.transactions) ? state.transactions : [],
    notifications: Array.isArray(state.notifications) ? state.notifications : []
  };
};

export const getStateForTenant = async (tenantId: string): Promise<TenantState> => {
  const supabaseState = await loadStateFromSupabase(tenantId);
  if (supabaseState) return normalizeState(supabaseState);

  const memoryState = loadStateFromMemory(tenantId);
  return normalizeState(memoryState);
};

export const saveStateForTenant = async (tenantId: string, state: TenantState): Promise<void> => {
  const normalized = normalizeState(state);
  const saved = await saveStateToSupabase(tenantId, normalized);
  if (!saved) {
    saveStateToMemory(tenantId, normalized);
  }
};

export const setSessionCookie = (res: ResponseLike, user: User, session: AuthSession): void => {
  const encoded = sessionCookieValue(user, session);
  const cookie = `${SESSION_COOKIE}=${encodeURIComponent(encoded)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;
  res.setHeader('Set-Cookie', cookie);
};

export const clearSessionCookie = (res: ResponseLike): void => {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
};

export const getAuthFromRequest = (req: RequestLike): { user: User; session: AuthSession } | null => {
  const cookieHeader = Array.isArray(req.headers.cookie) ? req.headers.cookie.join('; ') : req.headers.cookie;
  const cookies = parseCookies(cookieHeader);
  const raw = cookies[SESSION_COOKIE];
  if (!raw) return null;
  return parseSessionCookie(raw);
};

export const getOrCreateLogin = async (email: string): Promise<{ user: User; session: AuthSession }> => {
  const user = createUser(email);
  const session = createCookieSession(user);
  const tenantId = session.tenantId;
  const existing = await getStateForTenant(tenantId);
  await saveStateForTenant(tenantId, existing);
  return { user, session };
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

export const sendMethodNotAllowed = (res: ResponseLike, allowed: string[]): void => {
  res.setHeader('Allow', allowed.join(', '));
  res.status(405).json({ error: 'Method not allowed.' });
};

export const sendUnauthorized = (res: ResponseLike): void => {
  res.status(401).json({ error: 'Unauthorized' });
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
