import { User, AppSettings, Transaction, DailyMetric, Review, AppNotification, CreditLog, ActionPlan, UserRole, SmartTask, CalendarEvent } from '../types';
import { MOCK_METRICS, MOCK_TRANSACTIONS, MOCK_REVIEWS } from '../constants';

type DataMode = 'demo' | 'backend';
const BACKEND_DATA_ENABLED = import.meta.env.VITE_ENABLE_BACKEND_DATA === 'true';

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
  CALENDAR_EVENTS: 'one82_calendar_events',
  IMPORTED_MERCHANTS: 'one82_imported_merchants',
  IMPORTED_TEAM: 'one82_imported_team'
};

const RUNTIME_CACHE: {
  transactions?: Transaction[];
  metrics?: DailyMetric[];
  reviews?: Review[];
  notifications?: AppNotification[];
  calendarEvents?: CalendarEvent[];
  importedMerchants?: Array<Record<string, string>>;
  importedTeam?: Array<Record<string, string>>;
} = {};

const DATA_API_BASE = (import.meta.env.VITE_DATA_API_BASE || '').replace(/\/$/, '');

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
  revenueGoal: 10000,
  notifications: true,
  theme: 'system',
  primaryColor: 'green',
  aiResponseStyle: 50 // Default to Balanced
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

      RUNTIME_CACHE.transactions = [];
      RUNTIME_CACHE.metrics = [];
      RUNTIME_CACHE.notifications = [];
      RUNTIME_CACHE.reviews = [];
      RUNTIME_CACHE.calendarEvents = [];
      RUNTIME_CACHE.importedMerchants = [];
      RUNTIME_CACHE.importedTeam = [];
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
          id: Date.now().toString() + Math.random().toString().slice(2, 5),
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
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
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
      await fetch(getDataApiUrl('/api/data/notifications/read'), {
        method: 'POST'
      });
    } catch {
      // Preserve local read state as fallback in backend mode.
    }
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
      };

      const merchants = Array.isArray(payload.merchants) ? payload.merchants : [];
      const team = Array.isArray(payload.team) ? payload.team : [];

      if (shouldPersistBusinessDataLocally()) {
        localStorage.setItem(STORAGE_KEYS.IMPORTED_MERCHANTS, JSON.stringify(merchants));
        localStorage.setItem(STORAGE_KEYS.IMPORTED_TEAM, JSON.stringify(team));
      } else {
        RUNTIME_CACHE.importedMerchants = merchants;
        RUNTIME_CACHE.importedTeam = team;
      }

      return { merchants, team };
    } catch {
      return {
        merchants: StorageService.getImportedMerchants(),
        team: StorageService.getImportedTeam()
      };
    }
  },

  saveImportedDataResolved: async (payload: { merchants?: Array<Record<string, string>>; team?: Array<Record<string, string>> }): Promise<void> => {
    const existingMerchants = StorageService.getImportedMerchants();
    const existingTeam = StorageService.getImportedTeam();
    const merchants = Array.isArray(payload.merchants) ? payload.merchants : existingMerchants;
    const team = Array.isArray(payload.team) ? payload.team : existingTeam;

    if (shouldPersistBusinessDataLocally()) {
      localStorage.setItem(STORAGE_KEYS.IMPORTED_MERCHANTS, JSON.stringify(merchants));
      localStorage.setItem(STORAGE_KEYS.IMPORTED_TEAM, JSON.stringify(team));
    } else {
      RUNTIME_CACHE.importedMerchants = merchants;
      RUNTIME_CACHE.importedTeam = team;
    }

    const mode = StorageService.getDataMode();
    if (!BACKEND_DATA_ENABLED || !isBackendMode(mode)) {
      return;
    }

    try {
      await fetch(getDataApiUrl('/api/data/imports'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchants, team })
      });
    } catch {
      // Preserve runtime/browser state fallback in case backend request fails.
    }
  }
};