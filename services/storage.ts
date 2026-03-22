import { User, AppSettings, Transaction, DailyMetric, Review, AppNotification, CreditLog, ActionPlan, UserRole, SmartTask, CalendarEvent, MerchantInvite, MerchantInviteStrategy, ImportAuditEntry, OnboardingDeal, CommissionRun, BuyRateProfile } from '@/types';
import { MOCK_METRICS, MOCK_TRANSACTIONS, MOCK_REVIEWS } from '@/constants';
import { MerchantNote } from '@/services/simulationService';

const readEnv = (key: string): string | undefined => {
  const viteEnv = (typeof import.meta !== 'undefined' && (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env)
    ? (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
    : undefined;
  return viteEnv?.[key] ?? process.env[key];
};

type DataMode = 'demo' | 'backend';
const BACKEND_DATA_ENABLED = readEnv('VITE_ENABLE_BACKEND_DATA') === 'true';

// Simulated Database Keys
const STORAGE_KEYS = {
  USER: 'one82_user',
  SETTINGS: 'one82_settings',
  TRANSACTIONS: 'one82_transactions',
  METRICS: 'one82_metrics',
  REVIEWS: 'one82_reviews',
  NOTIFICATIONS: 'one82_notifications',
  CREDIT_LOGS: 'one82_credit_logs',
  AI_CACHE: 'one82_ai_cache',
  DATA_MODE: 'one82_data_mode',
  ACTION_PLANS: 'one82_action_plans',
  SMART_TASKS: 'one82_smart_tasks',
  SMART_TASKS_SEEDED: 'one82_smart_tasks_seeded',
  MERCHANT_NOTES: 'one82_merchant_notes',
  AI_LAST_RUNS: 'one82_ai_last_runs',
  IMPORT_AUDIT_LOG: 'one82_import_audit_log',
  CALENDAR_EVENTS: 'one82_calendar_events',
  IMPORTED_MERCHANTS: 'one82_imported_merchants',
  IMPORTED_TEAM: 'one82_imported_team',
  MERCHANT_INVITES: 'one82_merchant_invites',
  MERCHANT_INVITE_STRATEGY: 'one82_merchant_invite_strategy',
  ONBOARDING_DEALS: 'one82_onboarding_deals',
  COMMISSION_RUNS: 'one82_commission_runs',
  BUY_RATE_PROFILES: 'one82_buy_rate_profiles'
};

const RUNTIME_CACHE: {
  transactions?: Transaction[];
  metrics?: DailyMetric[];
  reviews?: Review[];
  notifications?: AppNotification[];
  calendarEvents?: CalendarEvent[];
  importedMerchants?: Array<Record<string, string>>;
  importedTeam?: Array<Record<string, string>>;
  merchantInvites?: MerchantInvite[];
  merchantInviteStrategy?: MerchantInviteStrategy;
  importAuditLog?: ImportAuditEntry[];
  onboardingDeals?: OnboardingDeal[];
  commissionRuns?: CommissionRun[];
  buyRateProfiles?: BuyRateProfile[];
} = {};

const DATA_API_BASE = (readEnv('VITE_DATA_API_BASE') || '').replace(/\/$/, '');

const getDataApiUrl = (path: string): string => {
  if (!DATA_API_BASE) return path;
  return `${DATA_API_BASE}${path}`;
};

const isBackendMode = (mode: DataMode): boolean => mode === 'backend';
const isStrictBackendDataMode = (): boolean => BACKEND_DATA_ENABLED && StorageService.getDataMode() === 'backend';
const shouldPersistBusinessDataLocally = (): boolean => !isStrictBackendDataMode();
const normalizeDataMode = (mode: DataMode): DataMode => {
  if (!BACKEND_DATA_ENABLED) return 'demo';
  return mode === 'backend' ? 'backend' : 'demo';
};

const DEFAULT_SETTINGS: AppSettings = {
  notifications: true,
  theme: 'dark',
  primaryColor: 'green',
  aiResponseStyle: 50, // Default to Balanced
  showAiConfidenceInProjections: true
};

const getTaskScopeKey = (role: UserRole): string => {
  const user = StorageService.getUser();
  const identity = user?.id || user?.email || 'guest';
  return `${identity}::${role}`;
};

const getCalendarScopeKey = (role: UserRole): string => {
  const user = StorageService.getUser();
  const identity = user?.id || user?.email || 'guest';
  return `${identity}::${role}`;
};

const getInviteScopeKey = (): string => {
  const user = StorageService.getUser();
  const identity = user?.id || user?.email || 'guest';
  return `${identity}::iso`;
};

const getImportAuditScopeKey = (): string => {
  const user = StorageService.getUser();
  const identity = user?.id || user?.email || 'guest';
  return `${identity}::imports`;
};

const getIsoOpsScopeKey = (): string => {
  const user = StorageService.getUser();
  const identity = user?.id || user?.email || 'guest';
  return `${identity}::iso_ops`;
};

const getMerchantNotesScopeKey = (): string => {
  const user = StorageService.getUser();
  const identity = user?.id || user?.email || 'guest';
  return `${identity}::merchant_notes`;
};

export const StorageService = {
  isBackendDataEnabled: (): boolean => BACKEND_DATA_ENABLED,

  getDataMode: (): DataMode => {
    const mode = localStorage.getItem(STORAGE_KEYS.DATA_MODE);
    return normalizeDataMode(mode === 'backend' ? 'backend' : 'demo');
  },

  setDataMode: (mode: DataMode): void => {
    const normalized = normalizeDataMode(mode);
    localStorage.setItem(STORAGE_KEYS.DATA_MODE, normalized);

    if (normalized === 'backend') {
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
      localStorage.removeItem(STORAGE_KEYS.METRICS);
      localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
      localStorage.removeItem(STORAGE_KEYS.REVIEWS);
      localStorage.removeItem(STORAGE_KEYS.CALENDAR_EVENTS);
      localStorage.removeItem(STORAGE_KEYS.IMPORTED_MERCHANTS);
      localStorage.removeItem(STORAGE_KEYS.IMPORTED_TEAM);
      localStorage.removeItem(STORAGE_KEYS.MERCHANT_INVITES);
      localStorage.removeItem(STORAGE_KEYS.IMPORT_AUDIT_LOG);
      localStorage.removeItem(STORAGE_KEYS.ONBOARDING_DEALS);
      localStorage.removeItem(STORAGE_KEYS.COMMISSION_RUNS);
      localStorage.removeItem(STORAGE_KEYS.BUY_RATE_PROFILES);

      RUNTIME_CACHE.transactions = [];
      RUNTIME_CACHE.metrics = [];
      RUNTIME_CACHE.notifications = [];
      RUNTIME_CACHE.reviews = [];
      RUNTIME_CACHE.calendarEvents = [];
      RUNTIME_CACHE.importedMerchants = [];
      RUNTIME_CACHE.importedTeam = [];
      RUNTIME_CACHE.merchantInvites = [];
      RUNTIME_CACHE.importAuditLog = [];
      RUNTIME_CACHE.onboardingDeals = [];
      RUNTIME_CACHE.commissionRuns = [];
      RUNTIME_CACHE.buyRateProfiles = [];
    }
  },

  // User / Auth
  getUser: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  },
  
  saveUser: (user: User): void => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  updateCredits: (amount: number, reason: string): number => {
      const user = StorageService.getUser();
      if (!user) return 0;
      
      // Prevent going below 0
      const newBalance = Math.max(0, user.credits - amount);
      user.credits = newBalance;
      StorageService.saveUser(user);

      // Log history
      const logs = StorageService.getCreditLogs();
      const newLog: CreditLog = {
          id: Date.now().toString() + window.crypto.randomUUID().replace(/-/g, '').slice(0, 8),
          action: reason,
          amount: amount,
          timestamp: Date.now()
      };
      // Keep last 50 logs
      const updatedLogs = [newLog, ...logs].slice(0, 50);
      localStorage.setItem(STORAGE_KEYS.CREDIT_LOGS, JSON.stringify(updatedLogs));
      
      // Dispatch event for UI updates
      window.dispatchEvent(new Event('user-update'));
      
      return newBalance;
  },

  getCreditLogs: (): CreditLog[] => {
      const data = localStorage.getItem(STORAGE_KEYS.CREDIT_LOGS);
      return data ? JSON.parse(data) : [];
  },

  hasCredits: (cost: number): boolean => {
      const user = StorageService.getUser();
      return user ? user.credits >= cost : false;
  },

  clearUser: (): void => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.CREDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.AI_CACHE);
  },

  // Settings
  getSettings: (): AppSettings => {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) return DEFAULT_SETTINGS;

    try {
      const parsed = JSON.parse(data) as Partial<AppSettings>;
      return {
        ...DEFAULT_SETTINGS,
        ...parsed
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings: (settings: AppSettings): void => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  // Transactions
  getTransactions: (): Transaction[] => {
    if (isStrictBackendDataMode()) {
      return RUNTIME_CACHE.transactions || [];
    }

    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : MOCK_TRANSACTIONS.map(t => ({...t, category: 'Uncategorized'}));
  },

  getTransactionsResolved: async (): Promise<Transaction[]> => {
    const mode = StorageService.getDataMode();
    if (!BACKEND_DATA_ENABLED || !isBackendMode(mode)) return StorageService.getTransactions();

    try {
      const response = await fetch(getDataApiUrl('/api/data/transactions'));
      if (!response.ok) {
        return StorageService.getTransactions();
      }

      const payload = await response.json();
      const transactions = (payload.transactions || []) as Transaction[];

      if (shouldPersistBusinessDataLocally()) {
        StorageService.saveTransactions(transactions);
      } else {
        RUNTIME_CACHE.transactions = transactions;
      }

      return transactions;
    } catch {
      return StorageService.getTransactions();
    }
  },

  saveTransactions: (transactions: Transaction[]): void => {
    if (!shouldPersistBusinessDataLocally()) {
      RUNTIME_CACHE.transactions = transactions;
      return;
    }

    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  saveTransactionsResolved: async (transactions: Transaction[]): Promise<void> => {
    StorageService.saveTransactions(transactions);

    const mode = StorageService.getDataMode();
    if (!BACKEND_DATA_ENABLED || !isBackendMode(mode)) return;

    try {
      await fetch(getDataApiUrl('/api/data/transactions'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions })
      });
    } catch {
      // Preserve local state as fallback in backend mode.
    }
  },

  addTransaction: (transaction: Transaction): void => {
    const current = StorageService.getTransactions();
    StorageService.saveTransactions([transaction, ...current]);
  },

  // Metrics
  getMetrics: (): DailyMetric[] => {
    if (isStrictBackendDataMode()) {
      return RUNTIME_CACHE.metrics || [];
    }

    const data = localStorage.getItem(STORAGE_KEYS.METRICS);
    return data ? JSON.parse(data) : MOCK_METRICS;
  },

  getMetricsResolved: async (): Promise<DailyMetric[]> => {
    const mode = StorageService.getDataMode();
    if (!BACKEND_DATA_ENABLED || !isBackendMode(mode)) return StorageService.getMetrics();

    try {
      const response = await fetch(getDataApiUrl('/api/data/metrics'));
      if (!response.ok) {
        return StorageService.getMetrics();
      }

      const payload = await response.json();
      const metrics = (payload.metrics || []) as DailyMetric[];

      if (shouldPersistBusinessDataLocally()) {
        localStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(metrics));
      } else {
        RUNTIME_CACHE.metrics = metrics;
      }

      return metrics;
    } catch {
      return StorageService.getMetrics();
    }
  },

  // Reviews
  getReviews: (): Review[] => {
    if (isStrictBackendDataMode()) {
      return RUNTIME_CACHE.reviews || [];
    }

    const data = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    return data ? JSON.parse(data) : MOCK_REVIEWS;
  },

  // Notifications
  getNotifications: (): AppNotification[] => {
    if (isStrictBackendDataMode()) {
      return RUNTIME_CACHE.notifications || [];
    }

    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    // Return mock notifications if empty for demo
    if (!data) {
        return [
            { id: 'n1', title: 'Goal Update', message: 'You reached 42% of your monthly goal!', type: 'info', read: false, timestamp: Date.now() },
            { id: 'n2', title: 'Anomaly Detected', message: 'Unusual transaction volume on Tuesday.', type: 'alert', read: false, timestamp: Date.now() - 86400000 }
        ];
    }
    return JSON.parse(data);
  },

  getNotificationsResolved: async (): Promise<AppNotification[]> => {
    const mode = StorageService.getDataMode();
    if (!BACKEND_DATA_ENABLED || !isBackendMode(mode)) return StorageService.getNotifications();

    try {
      const response = await fetch(getDataApiUrl('/api/data/notifications'));
      if (!response.ok) {
        return StorageService.getNotifications();
      }

      const payload = await response.json();
      const notifications = (payload.notifications || []) as AppNotification[];

      if (shouldPersistBusinessDataLocally()) {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
      } else {
        RUNTIME_CACHE.notifications = notifications;
      }

      return notifications;
    } catch {
      return StorageService.getNotifications();
    }
  },

  markNotificationsRead: (): void => {
     const notifs = StorageService.getNotifications().map(n => ({...n, read: true}));

     if (shouldPersistBusinessDataLocally()) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
      return;
     }

     RUNTIME_CACHE.notifications = notifs;
  },

  markNotificationsReadResolved: async (): Promise<void> => {
    StorageService.markNotificationsRead();

    const mode = StorageService.getDataMode();
    if (!BACKEND_DATA_ENABLED || !isBackendMode(mode)) return;

    try {
      await fetch(getDataApiUrl('/api/data/notifications'), {
        method: 'POST'
      });
    } catch {
      // Preserve local read state as fallback in backend mode.
    }
  },

  addNotification: (notification: { title: string; message: string; type: AppNotification['type'] }): AppNotification => {
    const nextNotification: AppNotification = {
      id: `n_${Date.now()}_${window.crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      read: false,
      timestamp: Date.now()
    };

    const current = StorageService.getNotifications();
    const next = [nextNotification, ...current].slice(0, 100);

    if (shouldPersistBusinessDataLocally()) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(next));
    } else {
      RUNTIME_CACHE.notifications = next;
    }

    window.dispatchEvent(new Event('user-update'));
    return nextNotification;
  },

  // AI Cache Management
  getCachedInsight: (key: string): string | null => {
    const cache = localStorage.getItem(STORAGE_KEYS.AI_CACHE);
    if (!cache) return null;
    const parsed = JSON.parse(cache);
    return parsed[key] || null;
  },

  setCachedInsight: (key: string, value: string): void => {
    const cache = localStorage.getItem(STORAGE_KEYS.AI_CACHE);
    const parsed = cache ? JSON.parse(cache) : {};
    parsed[key] = value;
    localStorage.setItem(STORAGE_KEYS.AI_CACHE, JSON.stringify(parsed));
  },

  clearCachedInsight: (key: string): void => {
    const cache = localStorage.getItem(STORAGE_KEYS.AI_CACHE);
    if (!cache) return;
    const parsed = JSON.parse(cache);
    delete parsed[key];
    localStorage.setItem(STORAGE_KEYS.AI_CACHE, JSON.stringify(parsed));
  },

  getAiLastRunAt: (surface: string): number | null => {
    const data = localStorage.getItem(STORAGE_KEYS.AI_LAST_RUNS);
    if (!data) return null;

    const parsed = JSON.parse(data) as Record<string, number>;
    const value = parsed[surface];
    return Number.isFinite(value) ? value : null;
  },

  setAiLastRunAt: (surface: string, timestamp = Date.now()): void => {
    const data = localStorage.getItem(STORAGE_KEYS.AI_LAST_RUNS);
    const parsed = data ? (JSON.parse(data) as Record<string, number>) : {};
    parsed[surface] = timestamp;
    localStorage.setItem(STORAGE_KEYS.AI_LAST_RUNS, JSON.stringify(parsed));
  },

  // Shared Action Plans (Experimental)
  getActionPlans: (): ActionPlan[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ACTION_PLANS);
    return data ? JSON.parse(data) : [];
  },

  saveActionPlans: (plans: ActionPlan[]): void => {
    localStorage.setItem(STORAGE_KEYS.ACTION_PLANS, JSON.stringify(plans));
    window.dispatchEvent(new Event('one82_action_plans_update'));
  },

  getSmartTasks: (role: UserRole): SmartTask[] => {
    const data = localStorage.getItem(STORAGE_KEYS.SMART_TASKS);
    if (!data) return [];

    const allTasks = JSON.parse(data) as Record<string, SmartTask[]>;
    return allTasks[getTaskScopeKey(role)] || [];
  },

  saveSmartTasks: (role: UserRole, tasks: SmartTask[]): void => {
    const data = localStorage.getItem(STORAGE_KEYS.SMART_TASKS);
    const allTasks = data ? (JSON.parse(data) as Record<string, SmartTask[]>) : {};
    allTasks[getTaskScopeKey(role)] = tasks;
    localStorage.setItem(STORAGE_KEYS.SMART_TASKS, JSON.stringify(allTasks));
  },

  hasSeededSmartTasks: (role: UserRole): boolean => {
    const data = localStorage.getItem(STORAGE_KEYS.SMART_TASKS_SEEDED);
    if (!data) return false;

    const seededByScope = JSON.parse(data) as Record<string, boolean>;
    return seededByScope[getTaskScopeKey(role)] === true;
  },

  markSmartTasksSeeded: (role: UserRole): void => {
    const data = localStorage.getItem(STORAGE_KEYS.SMART_TASKS_SEEDED);
    const seededByScope = data ? (JSON.parse(data) as Record<string, boolean>) : {};
    seededByScope[getTaskScopeKey(role)] = true;
    localStorage.setItem(STORAGE_KEYS.SMART_TASKS_SEEDED, JSON.stringify(seededByScope));
  },

  getMerchantNotes: (merchantId: string, fallbackNotes: MerchantNote[] = []): MerchantNote[] => {
    const data = localStorage.getItem(STORAGE_KEYS.MERCHANT_NOTES);
    if (!data) return fallbackNotes;

    const allNotes = JSON.parse(data) as Record<string, Record<string, MerchantNote[]>>;
    const scopedNotes = allNotes[getMerchantNotesScopeKey()] || {};
    return scopedNotes[merchantId] || fallbackNotes;
  },

  saveMerchantNotes: (merchantId: string, notes: MerchantNote[]): void => {
    const data = localStorage.getItem(STORAGE_KEYS.MERCHANT_NOTES);
    const allNotes = data ? (JSON.parse(data) as Record<string, Record<string, MerchantNote[]>>) : {};
    const scopeKey = getMerchantNotesScopeKey();
    const scopedNotes = allNotes[scopeKey] || {};
    scopedNotes[merchantId] = notes;
    allNotes[scopeKey] = scopedNotes;
    localStorage.setItem(STORAGE_KEYS.MERCHANT_NOTES, JSON.stringify(allNotes));
  },

  getCalendarEvents: (role: UserRole): CalendarEvent[] => {
    if (isStrictBackendDataMode()) {
      return (RUNTIME_CACHE.calendarEvents || []).sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    }

    const data = localStorage.getItem(STORAGE_KEYS.CALENDAR_EVENTS);
    if (!data) return [];

    const allEvents = JSON.parse(data) as Record<string, CalendarEvent[]>;
    return (allEvents[getCalendarScopeKey(role)] || []).sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  },

  saveCalendarEvents: (role: UserRole, events: CalendarEvent[]): void => {
    if (!shouldPersistBusinessDataLocally()) {
      RUNTIME_CACHE.calendarEvents = events;
      window.dispatchEvent(new Event('one82_calendar_events_update'));
      return;
    }

    const data = localStorage.getItem(STORAGE_KEYS.CALENDAR_EVENTS);
    const allEvents = data ? (JSON.parse(data) as Record<string, CalendarEvent[]>) : {};
    allEvents[getCalendarScopeKey(role)] = events;
    localStorage.setItem(STORAGE_KEYS.CALENDAR_EVENTS, JSON.stringify(allEvents));
    window.dispatchEvent(new Event('one82_calendar_events_update'));
  },

  getCalendarEventsResolved: async (role: UserRole): Promise<CalendarEvent[]> => {
    const mode = StorageService.getDataMode();
    if (!BACKEND_DATA_ENABLED || !isBackendMode(mode)) return StorageService.getCalendarEvents(role);

    try {
      const response = await fetch(getDataApiUrl('/api/data/calendar'));
      if (!response.ok) {
        return StorageService.getCalendarEvents(role);
      }

      const payload = await response.json() as { events?: CalendarEvent[] };
      const events = Array.isArray(payload.events) ? payload.events : [];

      if (shouldPersistBusinessDataLocally()) {
        StorageService.saveCalendarEvents(role, events);
      } else {
        RUNTIME_CACHE.calendarEvents = events;
      }

      return events;
    } catch {
      return StorageService.getCalendarEvents(role);
    }
  },

  saveCalendarEventsResolved: async (role: UserRole, events: CalendarEvent[]): Promise<void> => {
    StorageService.saveCalendarEvents(role, events);

    const mode = StorageService.getDataMode();
    if (!BACKEND_DATA_ENABLED || !isBackendMode(mode)) return;

    try {
      await fetch(getDataApiUrl('/api/data/calendar'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events })
      });
    } catch {
      // Preserve local/runtime state as fallback in backend mode.
    }
  },

  getImportedMerchants: (): Array<Record<string, string>> => {
    if (isStrictBackendDataMode()) {
      return RUNTIME_CACHE.importedMerchants || [];
    }

    const data = localStorage.getItem(STORAGE_KEYS.IMPORTED_MERCHANTS);
    return data ? JSON.parse(data) : [];
  },

  getImportedTeam: (): Array<Record<string, string>> => {
    if (isStrictBackendDataMode()) {
      return RUNTIME_CACHE.importedTeam || [];
    }

    const data = localStorage.getItem(STORAGE_KEYS.IMPORTED_TEAM);
    return data ? JSON.parse(data) : [];
  },

  getImportedDataResolved: async (): Promise<{ merchants: Array<Record<string, string>>; team: Array<Record<string, string>> }> => {
    const mode = StorageService.getDataMode();
    if (!BACKEND_DATA_ENABLED || !isBackendMode(mode)) {
      return {
        merchants: StorageService.getImportedMerchants(),
        team: StorageService.getImportedTeam()
      };
    }

    try {
      const response = await fetch(getDataApiUrl('/api/data/imports'));
      if (!response.ok) {
        return {
          merchants: StorageService.getImportedMerchants(),
          team: StorageService.getImportedTeam()
        };
      }

      const payload = await response.json() as {
        merchants?: Array<Record<string, string>>;
        team?: Array<Record<string, string>>;
        merchantInvites?: MerchantInvite[];
        inviteStrategy?: MerchantInviteStrategy;
      };

      const merchants = Array.isArray(payload.merchants) ? payload.merchants : [];
      const team = Array.isArray(payload.team) ? payload.team : [];
      const merchantInvites = Array.isArray(payload.merchantInvites) ? payload.merchantInvites : [];
      const inviteStrategy = payload.inviteStrategy === 'invite-link' ? 'invite-link' : 'csv-auto-invite';

      if (shouldPersistBusinessDataLocally()) {
        localStorage.setItem(STORAGE_KEYS.IMPORTED_MERCHANTS, JSON.stringify(merchants));
        localStorage.setItem(STORAGE_KEYS.IMPORTED_TEAM, JSON.stringify(team));
        const inviteData = localStorage.getItem(STORAGE_KEYS.MERCHANT_INVITES);
        const allInvites = inviteData ? (JSON.parse(inviteData) as Record<string, MerchantInvite[]>) : {};
        allInvites[getInviteScopeKey()] = merchantInvites;
        localStorage.setItem(STORAGE_KEYS.MERCHANT_INVITES, JSON.stringify(allInvites));
        localStorage.setItem(STORAGE_KEYS.MERCHANT_INVITE_STRATEGY, inviteStrategy);
      } else {
        RUNTIME_CACHE.importedMerchants = merchants;
        RUNTIME_CACHE.importedTeam = team;
        RUNTIME_CACHE.merchantInvites = merchantInvites;
        RUNTIME_CACHE.merchantInviteStrategy = inviteStrategy;
      }

      return { merchants, team };
    } catch {
      return {
        merchants: StorageService.getImportedMerchants(),
        team: StorageService.getImportedTeam()
      };
    }
  },

  saveImportedDataResolved: async (payload: {
    merchants?: Array<Record<string, string>>;
    team?: Array<Record<string, string>>;
    merchantInvites?: MerchantInvite[];
    inviteStrategy?: MerchantInviteStrategy;
  }): Promise<void> => {
    const existingMerchants = StorageService.getImportedMerchants();
    const existingTeam = StorageService.getImportedTeam();
    const existingInvites = StorageService.getMerchantInvites();
    const merchants = Array.isArray(payload.merchants) ? payload.merchants : existingMerchants;
    const team = Array.isArray(payload.team) ? payload.team : existingTeam;
    const merchantInvites = Array.isArray(payload.merchantInvites) ? payload.merchantInvites : existingInvites;
    const inviteStrategy = payload.inviteStrategy === 'invite-link' ? 'invite-link' : StorageService.getMerchantInviteStrategy();

    if (shouldPersistBusinessDataLocally()) {
      localStorage.setItem(STORAGE_KEYS.IMPORTED_MERCHANTS, JSON.stringify(merchants));
      localStorage.setItem(STORAGE_KEYS.IMPORTED_TEAM, JSON.stringify(team));
      const inviteData = localStorage.getItem(STORAGE_KEYS.MERCHANT_INVITES);
      const allInvites = inviteData ? (JSON.parse(inviteData) as Record<string, MerchantInvite[]>) : {};
      allInvites[getInviteScopeKey()] = merchantInvites;
      localStorage.setItem(STORAGE_KEYS.MERCHANT_INVITES, JSON.stringify(allInvites));
      localStorage.setItem(STORAGE_KEYS.MERCHANT_INVITE_STRATEGY, inviteStrategy);
    } else {
      RUNTIME_CACHE.importedMerchants = merchants;
      RUNTIME_CACHE.importedTeam = team;
      RUNTIME_CACHE.merchantInvites = merchantInvites;
      RUNTIME_CACHE.merchantInviteStrategy = inviteStrategy;
    }

    const mode = StorageService.getDataMode();
    if (!BACKEND_DATA_ENABLED || !isBackendMode(mode)) {
      return;
    }

    try {
      await fetch(getDataApiUrl('/api/data/imports'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchants, team, merchantInvites, inviteStrategy })
      });
    } catch {
      // Preserve runtime/browser state fallback in case backend request fails.
    }
  },

  getMerchantInviteStrategy: (): MerchantInviteStrategy => {
    if (isStrictBackendDataMode()) {
      return RUNTIME_CACHE.merchantInviteStrategy === 'invite-link' ? 'invite-link' : 'csv-auto-invite';
    }

    const value = localStorage.getItem(STORAGE_KEYS.MERCHANT_INVITE_STRATEGY);
    return value === 'invite-link' ? 'invite-link' : 'csv-auto-invite';
  },

  saveMerchantInviteStrategy: (strategy: MerchantInviteStrategy): void => {
    localStorage.setItem(STORAGE_KEYS.MERCHANT_INVITE_STRATEGY, strategy);
    if (!shouldPersistBusinessDataLocally()) {
      RUNTIME_CACHE.merchantInviteStrategy = strategy;
    }
  },

  getMerchantInvites: (): MerchantInvite[] => {
    if (isStrictBackendDataMode()) {
      return RUNTIME_CACHE.merchantInvites || [];
    }

    const data = localStorage.getItem(STORAGE_KEYS.MERCHANT_INVITES);
    if (!data) return [];
    const allInvites = JSON.parse(data) as Record<string, MerchantInvite[]>;
    return allInvites[getInviteScopeKey()] || [];
  },

  saveMerchantInvites: (invites: MerchantInvite[]): void => {
    if (!shouldPersistBusinessDataLocally()) {
      RUNTIME_CACHE.merchantInvites = invites;
      return;
    }

    const data = localStorage.getItem(STORAGE_KEYS.MERCHANT_INVITES);
    const allInvites = data ? (JSON.parse(data) as Record<string, MerchantInvite[]>) : {};
    allInvites[getInviteScopeKey()] = invites;
    localStorage.setItem(STORAGE_KEYS.MERCHANT_INVITES, JSON.stringify(allInvites));
  },

  getOnboardingDeals: (): OnboardingDeal[] => {
    if (isStrictBackendDataMode()) {
      return (RUNTIME_CACHE.onboardingDeals || []).sort((a, b) => b.updatedAt - a.updatedAt);
    }

    const data = localStorage.getItem(STORAGE_KEYS.ONBOARDING_DEALS);
    if (!data) return [];
    const allDeals = JSON.parse(data) as Record<string, OnboardingDeal[]>;
    return (allDeals[getIsoOpsScopeKey()] || []).sort((a, b) => b.updatedAt - a.updatedAt);
  },

  getOnboardingDealsResolved: async (): Promise<OnboardingDeal[]> => {
    const mode = StorageService.getDataMode();
    if (!BACKEND_DATA_ENABLED || !isBackendMode(mode)) return StorageService.getOnboardingDeals();

    try {
      const response = await fetch(getDataApiUrl('/api/data/imports'));
      if (!response.ok) {
        return StorageService.getOnboardingDeals();
      }

      const payload = await response.json() as { onboardingDeals?: OnboardingDeal[] };
      const onboardingDeals = Array.isArray(payload.onboardingDeals) ? payload.onboardingDeals : [];

      if (!shouldPersistBusinessDataLocally()) {
        RUNTIME_CACHE.onboardingDeals = onboardingDeals;
      } else {
        StorageService.saveOnboardingDeals(onboardingDeals);
      }

      return onboardingDeals;
    } catch {
      return StorageService.getOnboardingDeals();
    }
  },

  saveOnboardingDeals: (deals: OnboardingDeal[]): void => {
    const sortedDeals = [...deals].sort((a, b) => b.updatedAt - a.updatedAt);
    if (!shouldPersistBusinessDataLocally()) {
      RUNTIME_CACHE.onboardingDeals = sortedDeals;
      return;
    }

    const data = localStorage.getItem(STORAGE_KEYS.ONBOARDING_DEALS);
    const allDeals = data ? (JSON.parse(data) as Record<string, OnboardingDeal[]>) : {};
    allDeals[getIsoOpsScopeKey()] = sortedDeals;
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_DEALS, JSON.stringify(allDeals));
  },

  saveOnboardingDealsResolved: async (deals: OnboardingDeal[]): Promise<void> => {
    StorageService.saveOnboardingDeals(deals);

    const mode = StorageService.getDataMode();
    if (!BACKEND_DATA_ENABLED || !isBackendMode(mode)) return;

    try {
      await fetch(getDataApiUrl('/api/data/imports'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboardingDeals: deals })
      });
    } catch {
      // Preserve runtime/browser state fallback in case backend request fails.
    }
  },

  addOnboardingDeal: (dealInput: Omit<OnboardingDeal, 'id' | 'createdAt' | 'updatedAt'>): OnboardingDeal => {
    const now = Date.now();
    const nextDeal: OnboardingDeal = {
      id: `deal_${now}_${window.crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`,
      createdAt: now,
      updatedAt: now,
      ...dealInput
    };

    const current = StorageService.getOnboardingDeals();
    StorageService.saveOnboardingDeals([nextDeal, ...current]);
    return nextDeal;
  },

  updateOnboardingDealStatus: (dealId: string, status: OnboardingDeal['status']): void => {
    const current = StorageService.getOnboardingDeals();
    const now = Date.now();
    const updated = current.map((deal) => {
      if (deal.id !== dealId) return deal;
      return {
        ...deal,
        status,
        updatedAt: now,
        submittedAt: status === 'submitted' ? now : deal.submittedAt
      };
    });
    StorageService.saveOnboardingDeals(updated);
  },

  getCommissionRuns: (): CommissionRun[] => {
    if (isStrictBackendDataMode()) {
      return (RUNTIME_CACHE.commissionRuns || []).sort((a, b) => b.createdAt - a.createdAt);
    }

    const data = localStorage.getItem(STORAGE_KEYS.COMMISSION_RUNS);
    if (!data) return [];
    const allRuns = JSON.parse(data) as Record<string, CommissionRun[]>;
    return (allRuns[getIsoOpsScopeKey()] || []).sort((a, b) => b.createdAt - a.createdAt);
  },

  getCommissionRunsResolved: async (): Promise<CommissionRun[]> => {
    const mode = StorageService.getDataMode();
    if (!BACKEND_DATA_ENABLED || !isBackendMode(mode)) return StorageService.getCommissionRuns();

    try {
      const response = await fetch(getDataApiUrl('/api/data/metrics'));
      if (!response.ok) {
        return StorageService.getCommissionRuns();
      }

      const payload = await response.json() as { commissionRuns?: CommissionRun[] };
      const commissionRuns = Array.isArray(payload.commissionRuns) ? payload.commissionRuns : [];

      if (!shouldPersistBusinessDataLocally()) {
        RUNTIME_CACHE.commissionRuns = commissionRuns;
      } else {
        StorageService.saveCommissionRuns(commissionRuns);
      }

      return commissionRuns;
    } catch {
      return StorageService.getCommissionRuns();
    }
  },

  saveCommissionRuns: (runs: CommissionRun[]): void => {
    const sortedRuns = [...runs].sort((a, b) => b.createdAt - a.createdAt);
    if (!shouldPersistBusinessDataLocally()) {
      RUNTIME_CACHE.commissionRuns = sortedRuns;
      return;
    }

    const data = localStorage.getItem(STORAGE_KEYS.COMMISSION_RUNS);
    const allRuns = data ? (JSON.parse(data) as Record<string, CommissionRun[]>) : {};
    allRuns[getIsoOpsScopeKey()] = sortedRuns;
    localStorage.setItem(STORAGE_KEYS.COMMISSION_RUNS, JSON.stringify(allRuns));
  },

  saveCommissionRunsResolved: async (runs: CommissionRun[]): Promise<void> => {
    StorageService.saveCommissionRuns(runs);

    const mode = StorageService.getDataMode();
    if (!BACKEND_DATA_ENABLED || !isBackendMode(mode)) return;

    try {
      await fetch(getDataApiUrl('/api/data/metrics'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionRuns: runs })
      });
    } catch {
      // Preserve runtime/browser state fallback in case backend request fails.
    }
  },

  upsertCommissionRun: (run: CommissionRun): void => {
    const current = StorageService.getCommissionRuns();
    const withoutCurrent = current.filter((existing) => existing.id !== run.id);
    StorageService.saveCommissionRuns([run, ...withoutCurrent]);
  },

  getBuyRateProfiles: (): BuyRateProfile[] => {
    if (isStrictBackendDataMode()) {
      return (RUNTIME_CACHE.buyRateProfiles || []).sort((a, b) => b.updatedAt - a.updatedAt);
    }

    const data = localStorage.getItem(STORAGE_KEYS.BUY_RATE_PROFILES);
    if (!data) return [];
    const allProfiles = JSON.parse(data) as Record<string, BuyRateProfile[]>;
    return (allProfiles[getIsoOpsScopeKey()] || []).sort((a, b) => b.updatedAt - a.updatedAt);
  },

  getBuyRateProfilesResolved: async (): Promise<BuyRateProfile[]> => {
    const mode = StorageService.getDataMode();
    if (!BACKEND_DATA_ENABLED || !isBackendMode(mode)) return StorageService.getBuyRateProfiles();

    try {
      const response = await fetch(getDataApiUrl('/api/data/transactions'));
      if (!response.ok) {
        return StorageService.getBuyRateProfiles();
      }

      const payload = await response.json() as { buyRateProfiles?: BuyRateProfile[] };
      const buyRateProfiles = Array.isArray(payload.buyRateProfiles) ? payload.buyRateProfiles : [];

      if (!shouldPersistBusinessDataLocally()) {
        RUNTIME_CACHE.buyRateProfiles = buyRateProfiles;
      } else {
        StorageService.saveBuyRateProfiles(buyRateProfiles);
      }

      return buyRateProfiles;
    } catch {
      return StorageService.getBuyRateProfiles();
    }
  },

  saveBuyRateProfiles: (profiles: BuyRateProfile[]): void => {
    const sortedProfiles = [...profiles].sort((a, b) => b.updatedAt - a.updatedAt);
    if (!shouldPersistBusinessDataLocally()) {
      RUNTIME_CACHE.buyRateProfiles = sortedProfiles;
      return;
    }

    const data = localStorage.getItem(STORAGE_KEYS.BUY_RATE_PROFILES);
    const allProfiles = data ? (JSON.parse(data) as Record<string, BuyRateProfile[]>) : {};
    allProfiles[getIsoOpsScopeKey()] = sortedProfiles;
    localStorage.setItem(STORAGE_KEYS.BUY_RATE_PROFILES, JSON.stringify(allProfiles));
  },

  saveBuyRateProfilesResolved: async (profiles: BuyRateProfile[]): Promise<void> => {
    StorageService.saveBuyRateProfiles(profiles);

    const mode = StorageService.getDataMode();
    if (!BACKEND_DATA_ENABLED || !isBackendMode(mode)) return;

    try {
      await fetch(getDataApiUrl('/api/data/transactions'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyRateProfiles: profiles })
      });
    } catch {
      // Preserve runtime/browser state fallback in case backend request fails.
    }
  },

  upsertBuyRateProfile: (profileInput: Omit<BuyRateProfile, 'id' | 'updatedAt'>): BuyRateProfile => {
    const current = StorageService.getBuyRateProfiles();
    const existing = current.find((profile) => profile.merchantName === profileInput.merchantName);
    const nextProfile: BuyRateProfile = {
      id: existing?.id || `buyrate_${Date.now()}_${window.crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`,
      updatedAt: Date.now(),
      ...profileInput
    };
    const remaining = current.filter((profile) => profile.id !== nextProfile.id);
    StorageService.saveBuyRateProfiles([nextProfile, ...remaining]);
    return nextProfile;
  },

  getImportAuditLog: (): ImportAuditEntry[] => {
    if (isStrictBackendDataMode()) {
      return (RUNTIME_CACHE.importAuditLog || []).sort((a, b) => b.createdAt - a.createdAt);
    }

    const data = localStorage.getItem(STORAGE_KEYS.IMPORT_AUDIT_LOG);
    if (!data) return [];
    const allEntries = JSON.parse(data) as Record<string, ImportAuditEntry[]>;
    return (allEntries[getImportAuditScopeKey()] || []).sort((a, b) => b.createdAt - a.createdAt);
  },

  saveImportAuditLog: (entries: ImportAuditEntry[]): void => {
    if (!shouldPersistBusinessDataLocally()) {
      RUNTIME_CACHE.importAuditLog = entries;
      window.dispatchEvent(new Event('one82_import_audit_update'));
      return;
    }

    const data = localStorage.getItem(STORAGE_KEYS.IMPORT_AUDIT_LOG);
    const allEntries = data ? (JSON.parse(data) as Record<string, ImportAuditEntry[]>) : {};
    allEntries[getImportAuditScopeKey()] = entries;
    localStorage.setItem(STORAGE_KEYS.IMPORT_AUDIT_LOG, JSON.stringify(allEntries));
    window.dispatchEvent(new Event('one82_import_audit_update'));
  },

  appendImportAuditLogEntry: (entry: Omit<ImportAuditEntry, 'id' | 'createdAt'>): void => {
    const current = StorageService.getImportAuditLog();
    const nextEntry: ImportAuditEntry = {
      id: `import_audit_${Date.now()}_${window.crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`,
      createdAt: Date.now(),
      ...entry
    };
    const updated = [nextEntry, ...current].slice(0, 100);
    StorageService.saveImportAuditLog(updated);
  }
};