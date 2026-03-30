import { StorageService } from './storage';
import { AuthLoginInput, AuthLoginResult, AuthMode, AuthSession, User } from '@/types';

const readEnv = (key: string): string | undefined => {
  const viteEnv = (typeof import.meta !== 'undefined' && (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env)
    ? (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
    : undefined;
  return viteEnv?.[key] ?? process.env[key];
};

const AUTH_SESSION_KEY = 'one82_auth_session';
const AUTH_API_BASE = (readEnv('VITE_AUTH_API_BASE') || '').replace(/\/$/, '');
const OVERSEER_EMAIL = (readEnv('VITE_OVERSEER_EMAIL') || 'owner@one82.io').toLowerCase();

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

const loginViaBackendApi = async (email: string, password: string): Promise<AuthLoginResult> => {
  const response = await fetch(getApiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, mode: 'backend' satisfies AuthMode })
  });

  if (!response.ok) {
    try {
      const errorPayload = await response.json() as { error?: string };
      throw new Error(errorPayload.error || 'Auth login failed. Verify Supabase auth backend configuration.');
    } catch {
      throw new Error('Auth login failed. Verify Supabase auth backend configuration.');
    }
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

export const AuthService = {
  isBackendEnabled: (): boolean => true,

  getOverseerEmail: (): string => OVERSEER_EMAIL,

  bootstrap: async (): Promise<{ user: User | null; session: AuthSession | null; mode: AuthMode }> => {
    try {
      const response = await fetch(getApiUrl('/api/auth/session'));
      if (!response.ok) {
        return { user: null, session: null, mode: 'backend' };
      }

      const payload = await response.json();
      const user = payload.user as User | undefined;
      const session = payload.session as AuthSession | undefined;

      if (user && session) {
        StorageService.saveUser(user);
        sessionStorage.save(session);
        return { user, session, mode: 'backend' };
      }
    } catch {
      return { user: null, session: null, mode: 'backend' };
    }

    return { user: null, session: null, mode: 'backend' };
  },

  login: async ({ email, password, mode }: AuthLoginInput): Promise<AuthLoginResult> => {
    void mode;
    return loginViaBackendApi(email, password);
  },

  saveUserProfile: async (user: User, mode: AuthMode): Promise<User> => {
    void mode;

    const response = await fetch(getApiUrl('/api/auth/profile'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user })
    });

    if (!response.ok) {
      throw new Error('Failed to persist user profile.');
    }

    const payload = await response.json() as { user?: User };
    const savedUser = payload.user || user;
    StorageService.saveUser(savedUser);
    return savedUser;
  },

  logout: async (mode: AuthMode): Promise<void> => {
    void mode;
    try {
      await fetch(getApiUrl('/api/auth/logout'), { method: 'POST' });
    } catch {
      // Best effort logout
    }

    StorageService.clearUser();
    sessionStorage.clear();
  }
};
