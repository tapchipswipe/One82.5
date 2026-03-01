import { User, AppSettings, Transaction, DailyMetric, Review, AppNotification, CreditLog, ActionPlan } from '../types';
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
  ACTION_PLANS: 'one82_action_plans'
};

const DATA_API_BASE = (import.meta.env.VITE_DATA_API_BASE || '').replace(/\/$/, '');

const getDataApiUrl = (path: string): string => {
  if (!DATA_API_BASE) return path;
  return `${DATA_API_BASE}${path}`;
};

const isBackendMode = (mode: DataMode): boolean => mode === 'backend';
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

export const StorageService = {
  isBackendDataEnabled: (): boolean => BACKEND_DATA_ENABLED,

  getDataMode: (): DataMode => {
    const mode = localStorage.getItem(STORAGE_KEYS.DATA_MODE);
    return normalizeDataMode(mode === 'backend' ? 'backend' : 'demo');
  },

  setDataMode: (mode: DataMode): void => {
    localStorage.setItem(STORAGE_KEYS.DATA_MODE, normalizeDataMode(mode));
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
      StorageService.saveTransactions(transactions);
      return transactions;
    } catch {
      return StorageService.getTransactions();
    }
  },

  saveTransactions: (transactions: Transaction[]): void => {
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
      localStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(metrics));
      return metrics;
    } catch {
      return StorageService.getMetrics();
    }
  },

  // Reviews
  getReviews: (): Review[] => {
    const data = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    return data ? JSON.parse(data) : MOCK_REVIEWS;
  },

  // Notifications
  getNotifications: (): AppNotification[] => {
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
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
      return notifications;
    } catch {
      return StorageService.getNotifications();
    }
  },

  markNotificationsRead: (): void => {
     const notifs = StorageService.getNotifications().map(n => ({...n, read: true}));
     localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
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
  }
};