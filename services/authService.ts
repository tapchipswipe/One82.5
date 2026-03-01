import { StorageService } from './storage';
import { AuthLoginInput, AuthLoginResult, AuthMode, AuthSession, User } from '../types';

const AUTH_MODE_KEY = 'one82_auth_mode';
const AUTH_SESSION_KEY = 'one82_auth_session';
const AUTH_API_BASE = (import.meta.env.VITE_AUTH_API_BASE || '').replace(/\/$/, '');
const BACKEND_AUTH_ENABLED = import.meta.env.VITE_ENABLE_BACKEND_AUTH === 'true';
const OVERSEER_EMAIL = (import.meta.env.VITE_OVERSEER_EMAIL || 'owner@one82.io').toLowerCase();

const sessionStorage = {
  get: (): AuthSession | null => {
    const data = localStorage.getItem(AUTH_SESSION_KEY);
    return data ? JSON.parse(data) : null;
  },
  save: (session: AuthSession): void => {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  },
  clear: (): void => {
    localStorage.removeItem(AUTH_SESSION_KEY);
  }
};

const getApiUrl = (path: string): string => {
  if (!AUTH_API_BASE) return path;
  return `${AUTH_API_BASE}${path}`;
};

const normalizeAuthMode = (mode: AuthMode): AuthMode => {
  if (!BACKEND_AUTH_ENABLED) return 'demo';
  return mode === 'backend' ? 'backend' : 'demo';
};

const isOverseerEmail = (email: string): boolean => email.toLowerCase() === OVERSEER_EMAIL;

const createDemoSession = (user: User): AuthSession => {
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + 24 * 60 * 60 * 1000);
  return {
    sessionId: `demo_session_${Date.now()}`,
    userId: user.id,
    tenantId: user.organizationName || user.id,
    role: user.role,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString()
  };
};

const loginWithDemo = (email: string): AuthLoginResult => {
  const normalizedEmail = email.trim().toLowerCase();
  let user = StorageService.getUser();

  if (isOverseerEmail(normalizedEmail)) {
    user = {
      id: 'owner_overseer',
      email: normalizedEmail,
      name: 'Program Owner',
      role: 'overseer',
      onboardingComplete: true,
      credits: 9999,
      plan: 'Enterprise'
    };

    StorageService.saveUser(user);
    const session = createDemoSession(user);
    sessionStorage.save(session);
    return { user, session, mode: 'demo' };
  }

  if (!user || user.email !== normalizedEmail) {
    user = {
      id: `u_${Date.now()}`,
      email: normalizedEmail,
      name: normalizedEmail.split('@')[0] || 'User',
      role: normalizedEmail.includes('iso') ? 'iso' : 'merchant',
      businessType: undefined,
      onboardingComplete: normalizedEmail.includes('iso'),
      credits: 50,
      plan: 'Free'
    };

    if (user.role === 'iso') {
      user.organizationName = 'Demo ISO';
    }
  }

  StorageService.saveUser(user);
  const session = createDemoSession(user);
  sessionStorage.save(session);

  return { user, session, mode: 'demo' };
};

const loginWithBackend = async (email: string, password: string): Promise<AuthLoginResult> => {
  const response = await fetch(getApiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    throw new Error('Backend sign-in failed. Use Demo Mode or verify auth API availability.');
  }

  const payload = await response.json();
  const user = payload.user as User;
  const session = payload.session as AuthSession;

  if (!user || !session) {
    throw new Error('Invalid auth response from backend.');
  }

  StorageService.saveUser(user);
  sessionStorage.save(session);

  return { user, session, mode: 'backend' };
};

const getPreferredMode = (): AuthMode => {
  const mode = localStorage.getItem(AUTH_MODE_KEY);
  if (!mode && BACKEND_AUTH_ENABLED) {
    return 'backend';
  }
  return normalizeAuthMode(mode === 'backend' ? 'backend' : 'demo');
};

const setPreferredMode = (mode: AuthMode): void => {
  localStorage.setItem(AUTH_MODE_KEY, normalizeAuthMode(mode));
};

export const AuthService = {
  isBackendEnabled: (): boolean => BACKEND_AUTH_ENABLED,

  getOverseerEmail: (): string => OVERSEER_EMAIL,

  getPreferredMode,

  setPreferredMode,

  bootstrap: async (): Promise<{ user: User | null; session: AuthSession | null; mode: AuthMode }> => {
    const mode = normalizeAuthMode(getPreferredMode());

    if (mode === 'backend') {
      try {
        const response = await fetch(getApiUrl('/api/auth/session'));
        if (!response.ok) {
          return { user: null, session: null, mode };
        }

        const payload = await response.json();
        const user = payload.user as User | undefined;
        const session = payload.session as AuthSession | undefined;

        if (user && session) {
          StorageService.saveUser(user);
          sessionStorage.save(session);
          return { user, session, mode };
        }
      } catch {
        return { user: null, session: null, mode };
      }

      return { user: null, session: null, mode };
    }

    const user = StorageService.getUser();
    const existing = sessionStorage.get();
    const session = user ? (existing || createDemoSession(user)) : null;
    if (session) {
      sessionStorage.save(session);
    }
    return { user, session, mode };
  },

  login: async ({ email, password, mode }: AuthLoginInput): Promise<AuthLoginResult> => {
    const normalizedMode = normalizeAuthMode(mode);
    setPreferredMode(normalizedMode);

    if (normalizedMode === 'backend') {
      return loginWithBackend(email, password);
    }

    return loginWithDemo(email);
  },

  logout: async (mode: AuthMode): Promise<void> => {
    const normalizedMode = normalizeAuthMode(mode);

    if (normalizedMode === 'backend') {
      try {
        await fetch(getApiUrl('/api/auth/logout'), { method: 'POST' });
      } catch {
        // Best effort logout
      }
    }

    StorageService.clearUser();
    sessionStorage.clear();
  }
};
