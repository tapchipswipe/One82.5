
import React, { useState, useEffect, Suspense, lazy, useCallback, useRef } from 'react';
import Layout from './components/Layout';
import Onboarding from './components/Onboarding';
import Login from './components/Login';
import MarketingLayout from './components/marketing/MarketingLayout';
import { StorageService } from './services/storage';
import { AuthService } from './services/authService';
import { detectAnomalies } from './services/geminiService';
import { SimulationService } from './services/simulationService';
import { User, BusinessType, MerchantInviteStrategy, UserRole, AuthMode, Transaction } from './types';
import { ENABLE_EXPERIMENTAL, THEME_COLORS } from './constants';

const loadDashboard = () => import('./components/Dashboard');
const loadTransactions = () => import('./components/Transactions');
const loadStatementReader = () => import('./components/StatementReader');
const loadISODashboard = () => import('./components/ISODashboard');
const loadInventoryIntelligence = () => import('./components/InventoryIntelligence');
const loadSettings = () => import('./components/Settings');
const loadDataChat = () => import('./components/DataChat');
const loadForecast = () => import('./components/Forecast');
const loadCalendarPlanner = () => import('./components/CalendarPlanner');
const loadCustomers = () => import('./components/Customers');
const loadMerchantLedger = () => import('./components/MerchantLedger');
const loadIntegrations = () => import('./components/Integrations');
const loadProfitability = () => import('./components/Profitability');
const loadExperimental = () => import('./components/Experimental');
const loadTeam = () => import('./components/Team');
const loadCashFlowForecastDemo = () => import('./components/experimental/CashFlowForecastDemo');
const loadHomePage = () => import('./components/marketing/HomePage');
const loadFeaturesPage = () => import('./components/marketing/FeaturesPage');
const loadPricingPage = () => import('./components/marketing/PricingPage');
const loadOverseerDashboard = () => import('./components/OverseerDashboard');
const loadProfile = () => import('./components/Profile');

const Dashboard = lazy(loadDashboard);
const Transactions = lazy(loadTransactions);
const StatementReader = lazy(loadStatementReader);
const ISODashboard = lazy(loadISODashboard);
const InventoryIntelligence = lazy(loadInventoryIntelligence);
const Settings = lazy(loadSettings);
const DataChat = lazy(loadDataChat);
const Forecast = lazy(loadForecast);
const CalendarPlanner = lazy(loadCalendarPlanner);
const Customers = lazy(loadCustomers);
const MerchantLedger = lazy(loadMerchantLedger);
const Integrations = lazy(loadIntegrations);
const Profitability = lazy(loadProfitability);
const Experimental = lazy(loadExperimental);
const Team = lazy(loadTeam);
const CashFlowForecastDemo = lazy(loadCashFlowForecastDemo);
const HomePage = lazy(loadHomePage);
const FeaturesPage = lazy(loadFeaturesPage);
const PricingPage = lazy(loadPricingPage);
const OverseerDashboard = lazy(loadOverseerDashboard);
const Profile = lazy(loadProfile);

const PREFETCH_BY_ROLE: Record<UserRole, Record<string, Array<() => Promise<unknown>>>> = {
  merchant: {
    dashboard: [loadTransactions, loadInventoryIntelligence, loadCustomers],
    transactions: [loadDashboard, loadDataChat, loadForecast],
    inventory: [loadTransactions, loadForecast],
    chat: [loadDashboard, loadTransactions],
    forecast: [loadDashboard, loadCalendarPlanner],
    calendar: [loadForecast, loadDashboard],
    customers: [loadTransactions, loadDashboard],
    profile: [loadSettings],
    settings: [loadProfile]
  },
  iso: {
    dashboard: [loadStatementReader, loadMerchantLedger, loadProfitability],
    statements: [loadMerchantLedger, loadProfitability],
    portfolio: [loadProfitability, loadTeam],
    profitability: [loadMerchantLedger, loadIntegrations],
    team: [loadIntegrations, loadProfile],
    integrations: [loadDashboard, loadStatementReader],
    profile: [loadSettings],
    settings: [loadProfile]
  },
  overseer: {
    dashboard: [loadProfile, loadSettings],
    profile: [loadSettings, loadOverseerDashboard],
    settings: [loadProfile, loadOverseerDashboard]
  }
};

const PREFETCH_BY_MARKETING_PAGE: Record<'home' | 'features' | 'pricing', Array<() => Promise<unknown>>> = {
  home: [loadFeaturesPage, loadPricingPage],
  features: [loadPricingPage, loadHomePage],
  pricing: [loadFeaturesPage, loadHomePage]
};

const VIEW_LOADERS: Record<string, () => Promise<unknown>> = {
  dashboard: loadDashboard,
  transactions: loadTransactions,
  statements: loadStatementReader,
  inventory: loadInventoryIntelligence,
  settings: loadSettings,
  chat: loadDataChat,
  forecast: loadForecast,
  calendar: loadCalendarPlanner,
  customers: loadCustomers,
  portfolio: loadMerchantLedger,
  integrations: loadIntegrations,
  profitability: loadProfitability,
  experimental: loadExperimental,
  team: loadTeam,
  'exp-cashflow': loadCashFlowForecastDemo,
  profile: loadProfile
};

type NavigationPerfSample = {
  timestamp: number;
  role: UserRole;
  fromView: string;
  toView: string;
  durationMs: number;
  prefetched: boolean;
};

const NAVIGATION_PERF_KEY = 'one82_navigation_perf_samples';
const NAVIGATION_PERF_SAMPLE_LIMIT = 500;

const appendNavigationPerfSample = (sample: NavigationPerfSample): void => {
  try {
    const raw = localStorage.getItem(NAVIGATION_PERF_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const existing: NavigationPerfSample[] = Array.isArray(parsed) ? parsed : [];
    const next = [...existing.slice(-(NAVIGATION_PERF_SAMPLE_LIMIT - 1)), sample];
    localStorage.setItem(NAVIGATION_PERF_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('one82-navigation-perf'));
  } catch {
    // Ignore storage errors so UI flow is never blocked by instrumentation.
  }
};

const LoadingView: React.FC = () => (
  <div className="p-6 text-sm text-slate-500 dark:text-slate-400">Loading...</div>
);

const buildPortfolioFromTransactions = (transactions: Transaction[]) => {
  const grouped = new Map<string, Transaction[]>();

  transactions.forEach((transaction) => {
    const customer = transaction.customer || 'Imported Merchant';
    const current = grouped.get(customer) || [];
    current.push(transaction);
    grouped.set(customer, current);
  });

  return Array.from(grouped.entries()).map(([name, records], index) => {
    const monthlyVolume = records.reduce((sum, record) => sum + (Number(record.amount) || 0), 0);
    const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const lastTransaction = sorted.length > 0 ? new Date(sorted[sorted.length - 1].date).getTime() : Date.now();
    const firstHalf = sorted.slice(0, Math.max(1, Math.floor(sorted.length / 2))).reduce((sum, record) => sum + record.amount, 0);
    const secondHalf = sorted.slice(Math.max(1, Math.floor(sorted.length / 2))).reduce((sum, record) => sum + record.amount, 0);
    const trend = secondHalf > firstHalf ? 'up' : secondHalf < firstHalf ? 'down' : 'flat';
    const riskLevel = trend === 'down' ? 'Medium' : 'Low';
    const churnRisk = trend === 'down' ? 'Medium' : 'Low';
    const volumeHistory = Array.from({ length: 6 }, (_, offset) => {
      const start = Math.floor((offset * records.length) / 6);
      const end = Math.floor(((offset + 1) * records.length) / 6);
      const slice = records.slice(start, Math.max(end, start + 1));
      return Math.round(slice.reduce((sum, record) => sum + record.amount, 0));
    });

    return {
      id: `imported_${index}_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
      name,
      businessType: 'Service' as BusinessType,
      monthlyVolume: Math.round(monthlyVolume),
      churnRisk,
      trend,
      lastTransaction,
      bps: 35,
      perTxFee: 0.1,
      status: 'Active' as const,
      mccCode: '0000',
      mccDescription: 'Imported Merchant',
      riskLevel,
      volumeHistory,
      ownerName: `${name} Owner`,
      email: `owner+${index}@imported.one82`,
      phone: '(000) 000-0000',
      address: 'Imported via CSV',
      since: new Date().toISOString().slice(0, 10),
      notes: [
        {
          id: `note_${index}`,
          date: new Date().toISOString().slice(0, 10),
          author: 'Import Hub',
          text: 'Generated from imported transactions.'
        }
      ],
      healthScore: trend === 'down' ? 58 : 78
    };
  });
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>('demo');
  const [marketingPage, setMarketingPage] = useState<'home' | 'features' | 'pricing' | null>('home');
  const [showTrial, setShowTrial] = useState(false);
  const pendingNavigationRef = useRef<{ fromView: string; toView: string; requestedAt: number } | null>(null);
  const prefetchedViewsRef = useRef(new Set<string>());
  const merchants = authMode === 'demo'
    ? SimulationService.generatePortfolio()
    : buildPortfolioFromTransactions(StorageService.getTransactions());
  const resolveDataMode = (mode: AuthMode): 'backend' | 'demo' => {
    if (!StorageService.isBackendDataEnabled()) return 'demo';
    return mode === 'backend' ? 'backend' : 'demo';
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        const { user: bootstrappedUser, mode } = await AuthService.bootstrap();
        setAuthMode(mode);
        StorageService.setDataMode(resolveDataMode(mode));

        if (bootstrappedUser) {
          setUser(bootstrappedUser);
          setMarketingPage(null);
        } else {
          setMarketingPage('home');
        }

        const settings = StorageService.getSettings();
        if (settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) setDarkMode(true);
        const root = document.documentElement;
        const colorSet = THEME_COLORS[settings.primaryColor || 'charcoal'] as Record<string, string>;
        Object.entries(colorSet).forEach(([shade, value]) => root.style.setProperty(`--color-primary-${shade}`, value));
      } catch (e) {
        console.error("Initialization Failed:", e);
      } finally {
        setLoading(false);
      }
    };

    void initialize();
  }, []);

  useEffect(() => {
    if (!user) return;
    const byRole = PREFETCH_BY_ROLE[user.role];
    const prefetchers = byRole[activeView] || byRole.dashboard || [];
    if (prefetchers.length === 0) return;

    const timer = window.setTimeout(() => {
      prefetchers.forEach((prefetcher) => {
        void prefetcher().catch(() => undefined);
      });
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [activeView, user]);

  useEffect(() => {
    if (user || !marketingPage) return;
    const prefetchers = PREFETCH_BY_MARKETING_PAGE[marketingPage] || [];
    if (prefetchers.length === 0) return;

    const timer = window.setTimeout(() => {
      prefetchers.forEach((prefetcher) => {
        void prefetcher().catch(() => undefined);
      });
    }, 800);

    return () => window.clearTimeout(timer);
  }, [marketingPage, user]);

  const handlePrefetchView = useCallback((view: string) => {
    if (!user) return;
    const byRole = PREFETCH_BY_ROLE[user.role] || {};
    const primaryLoader = VIEW_LOADERS[view];
    const adjacentLoaders = byRole[view] || [];
    const prefetchers = primaryLoader ? [primaryLoader, ...adjacentLoaders] : adjacentLoaders;
    prefetchedViewsRef.current.add(view);

    prefetchers.forEach((prefetcher) => {
      void prefetcher().catch(() => undefined);
    });
  }, [user]);

  const handleNavigate = useCallback((view: string) => {
    if (view === activeView) return;
    pendingNavigationRef.current = {
      fromView: activeView,
      toView: view,
      requestedAt: performance.now()
    };
    setActiveView(view);
  }, [activeView]);

  useEffect(() => {
    if (!user) return;
    const pending = pendingNavigationRef.current;
    if (!pending || pending.toView !== activeView) return;

    const durationMs = Math.round(performance.now() - pending.requestedAt);
    const sample: NavigationPerfSample = {
      timestamp: Date.now(),
      role: user.role,
      fromView: pending.fromView,
      toView: pending.toView,
      durationMs,
      prefetched: prefetchedViewsRef.current.has(pending.toView)
    };

    appendNavigationPerfSample(sample);
    pendingNavigationRef.current = null;

    if (import.meta.env.DEV) {
      console.debug('[perf] navigation', sample);
    }
  }, [activeView, user]);

  // Step 7: Proactive AI Guardrails (Background Anomaly Monitor) - MERCHANTS ONLY
  useEffect(() => {
    if (!user || user.role !== 'merchant') return;
    const monitor = async () => {
      const transactions = await StorageService.getTransactionsResolved();
      const anomaly = await detectAnomalies(transactions);
      if (anomaly) {
        const notifs = StorageService.getNotifications();
        const newNotif = {
          id: `anomaly_${Date.now()}`,
          title: anomaly.title,
          message: anomaly.message,
          type: 'alert' as const,
          read: false,
          timestamp: Date.now()
        };
        localStorage.setItem('one82_notifications', JSON.stringify([newNotif, ...notifs]));
        window.dispatchEvent(new Event('user-update')); // Trigger UI refresh
      }
    };

    const interval = setInterval(monitor, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [user]);

  const toggleTheme = () => setDarkMode(!darkMode);
  const handleLogin = (u: User, mode: AuthMode) => {
    setAuthMode(mode);
    StorageService.setDataMode(resolveDataMode(mode));
    setUser(u);
  };
  const handleLogout = () => {
    void AuthService.logout(authMode);
    StorageService.setDataMode(resolveDataMode(authMode));
    setUser(null);
  };

  const handleMarketingNavigate = (page: 'home' | 'features' | 'pricing' | 'login' | 'trial') => {
    if (page === 'login') {
      setMarketingPage(null);
      setShowTrial(false);
    } else if (page === 'trial') {
      setMarketingPage(null);
      setShowTrial(true);
    } else {
      setMarketingPage(page);
      setShowTrial(false);
    }
  };

  const handleOnboardingComplete = (role: UserRole, data: { businessType?: BusinessType, orgName?: string, inviteStrategy?: MerchantInviteStrategy }) => {
    if (user) {
      const updated: User = {
        ...user,
        role: role,
        onboardingComplete: true,
        businessType: data.businessType,
        organizationName: data.orgName
      };
      setUser(updated);
      StorageService.saveUser(updated);
      if (role === 'iso' && data.inviteStrategy) {
        StorageService.saveMerchantInviteStrategy(data.inviteStrategy);
      }
      void AuthService.saveUserProfile(updated, authMode).catch((error) => {
        console.error('Failed to persist onboarding profile:', error);
      });
    }
  };

  const handleSaveProfile = (updatedUser: User) => {
    setUser(updatedUser);
    StorageService.saveUser(updatedUser);
    window.dispatchEvent(new Event('user-update'));
    void AuthService.saveUserProfile(updatedUser, authMode).catch((error) => {
      console.error('Failed to persist profile update:', error);
    });
  };

  if (loading) return null;
  
  // Marketing pages for non-logged-in users
  if (!user && marketingPage) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <MarketingLayout activePage={marketingPage} onNavigate={handleMarketingNavigate}>
          <Suspense fallback={<LoadingView />}>
            {marketingPage === 'home' && <HomePage onNavigate={handleMarketingNavigate} />}
            {marketingPage === 'features' && <FeaturesPage onNavigate={handleMarketingNavigate} />}
            {marketingPage === 'pricing' && <PricingPage onNavigate={handleMarketingNavigate} />}
          </Suspense>
        </MarketingLayout>
      </div>
    );
  }
  
  if (!user) return <div className={darkMode ? 'dark' : ''}><Login onLogin={handleLogin} showTrialMode={showTrial} onBackToHome={() => setMarketingPage('home')} initialAuthMode={showTrial ? 'backend' : authMode} /></div>;
  if (!user.onboardingComplete && user.role !== 'overseer') return <div className={darkMode ? 'dark' : ''}><Onboarding onComplete={handleOnboardingComplete} /></div>;

  return (
    <Layout
      activeView={activeView}
      onNavigate={handleNavigate}
      onPrefetchView={handlePrefetchView}
      darkMode={darkMode}
      toggleTheme={toggleTheme}
      role={user.role}
      businessType={user.businessType || 'Retail'} // Fallback for ISOs
      onLogout={handleLogout}
    >
      <Suspense fallback={<LoadingView />}>
        {user.role === 'merchant' && (
          <>
            {activeView === 'dashboard' && <Dashboard businessType={user.businessType!} />}
            {activeView === 'transactions' && <Transactions />}
            {activeView === 'inventory' && <InventoryIntelligence />}
            {activeView === 'settings' && <Settings />}
            {activeView === 'chat' && <DataChat />}
            {activeView === 'forecast' && <Forecast />}
            {activeView === 'calendar' && <CalendarPlanner />}
            {activeView === 'customers' && <Customers />}
            {activeView === 'profile' && <Profile user={user} onSaveProfile={handleSaveProfile} />}
            {ENABLE_EXPERIMENTAL && activeView === 'exp-cashflow' && <div className="p-6"><CashFlowForecastDemo /></div>}
            {ENABLE_EXPERIMENTAL && activeView === 'experimental' && <Experimental role={user.role} />}
          </>
        )}

        {user.role === 'iso' && (
          <>
            {activeView === 'dashboard' && <ISODashboard />}
            {activeView === 'statements' && <StatementReader />}
            {activeView === 'portfolio' && <div className="p-6"><MerchantLedger merchants={merchants} /></div>}
            {activeView === 'profitability' && <Profitability />}
            {activeView === 'team' && <Team onNavigate={handleNavigate} />}
            {activeView === 'integrations' && <Integrations />}
            {activeView === 'profile' && <Profile user={user} onSaveProfile={handleSaveProfile} />}
            {ENABLE_EXPERIMENTAL && activeView === 'experimental' && <Experimental role={user.role} />}
            {activeView === 'settings' && <Settings />}
            {!['dashboard', 'statements', 'portfolio', 'profitability', 'team', 'integrations', 'experimental', 'settings', 'profile'].includes(activeView) && <ISODashboard />}
          </>
        )}

        {user.role === 'overseer' && (
          <>
            {activeView === 'dashboard' && <OverseerDashboard />}
            {activeView === 'profile' && <Profile user={user} onSaveProfile={handleSaveProfile} />}
            {activeView === 'settings' && <Settings />}
            {!['dashboard', 'settings', 'profile'].includes(activeView) && <OverseerDashboard />}
          </>
        )}
      </Suspense>
    </Layout>
  );
};

export default App;
