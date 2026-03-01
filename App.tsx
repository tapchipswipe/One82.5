
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import StatementReader from './components/StatementReader';
import Onboarding from './components/Onboarding';
import ISODashboard from './components/ISODashboard';
import InventoryManager from './components/InventoryManager';
import InventoryIntelligence from './components/InventoryIntelligence';
import Login from './components/Login';
import Settings from './components/Settings';
import DataChat from './components/DataChat';
import Forecast from './components/Forecast';
import Customers from './components/Customers';
import MerchantLedger from './components/MerchantLedger';
import Integrations from './components/Integrations';
import Profitability from './components/Profitability';
import Experimental from './components/Experimental';
import Team from './components/Team';
import CashFlowForecastDemo from './components/experimental/CashFlowForecastDemo';
import MarketingLayout from './components/marketing/MarketingLayout';
import HomePage from './components/marketing/HomePage';
import FeaturesPage from './components/marketing/FeaturesPage';
import PricingPage from './components/marketing/PricingPage';
import OverseerDashboard from './components/OverseerDashboard';
import { StorageService } from './services/storage';
import { AuthService } from './services/authService';
import { detectAnomalies } from './services/geminiService';
import { SimulationService } from './services/simulationService';
import { User, BusinessType, UserRole, AuthMode } from './types';
import { ENABLE_EXPERIMENTAL, THEME_COLORS } from './constants';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>('demo');
  const [marketingPage, setMarketingPage] = useState<'home' | 'features' | 'pricing' | null>('home');
  const [showTrial, setShowTrial] = useState(false);
  const merchants = SimulationService.generatePortfolio();

  useEffect(() => {
    const initialize = async () => {
      try {
        const { user: bootstrappedUser, mode } = await AuthService.bootstrap();
        setAuthMode(mode);
        StorageService.setDataMode(mode === 'backend' ? 'backend' : 'demo');

        if (bootstrappedUser) {
          setUser(bootstrappedUser);
          setMarketingPage(null);
        } else {
          setMarketingPage('home');
        }

        const settings = StorageService.getSettings();
        if (settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) setDarkMode(true);
        const root = document.documentElement;
        const colorSet = THEME_COLORS[settings.primaryColor || 'charcoal'];
        Object.entries(colorSet).forEach(([shade, value]) => root.style.setProperty(`--color-primary-${shade}`, value));
      } catch (e) {
        console.error("Initialization Failed:", e);
      } finally {
        setLoading(false);
      }
    };

    void initialize();
  }, []);

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
    StorageService.setDataMode(mode === 'backend' ? 'backend' : 'demo');
    setUser(u);
  };
  const handleLogout = () => {
    void AuthService.logout(authMode);
    StorageService.setDataMode('demo');
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

  const handleOnboardingComplete = (role: UserRole, data: { businessType?: BusinessType, orgName?: string }) => {
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
    }
  };

  if (loading) return null;
  
  // Marketing pages for non-logged-in users
  if (!user && marketingPage) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <MarketingLayout activePage={marketingPage} onNavigate={handleMarketingNavigate}>
          {marketingPage === 'home' && <HomePage onNavigate={handleMarketingNavigate} />}
          {marketingPage === 'features' && <FeaturesPage onNavigate={handleMarketingNavigate} />}
          {marketingPage === 'pricing' && <PricingPage onNavigate={handleMarketingNavigate} />}
        </MarketingLayout>
      </div>
    );
  }
  
  if (!user) return <div className={darkMode ? 'dark' : ''}><Login onLogin={handleLogin} showTrialMode={showTrial} onBackToHome={() => setMarketingPage('home')} initialAuthMode={authMode} /></div>;
  if (!user.onboardingComplete && user.role !== 'overseer') return <div className={darkMode ? 'dark' : ''}><Onboarding onComplete={handleOnboardingComplete} /></div>;

  return (
    <Layout
      activeView={activeView}
      onNavigate={setActiveView}
      darkMode={darkMode}
      toggleTheme={toggleTheme}
      role={user.role}
      businessType={user.businessType || 'Retail'} // Fallback for ISOs
      onLogout={handleLogout}
    >
      {user.role === 'merchant' && (
        <>
          {activeView === 'dashboard' && <Dashboard businessType={user.businessType!} />}
          {activeView === 'transactions' && <Transactions />}
          {activeView === 'inventory' && <InventoryIntelligence />}
          {activeView === 'settings' && <Settings />}
          {activeView === 'chat' && <DataChat />}
          {activeView === 'forecast' && <Forecast />}
          {activeView === 'customers' && <Customers />}
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
          {activeView === 'team' && <Team onNavigate={setActiveView} />}
          {activeView === 'integrations' && <Integrations />}
          {ENABLE_EXPERIMENTAL && activeView === 'experimental' && <Experimental role={user.role} />}
          {activeView === 'settings' && <Settings />}
          {/* Fallback */}
          {!['dashboard', 'statements', 'portfolio', 'profitability', 'team', 'integrations', 'experimental', 'settings'].includes(activeView) && <ISODashboard />}
        </>
      )}

      {user.role === 'overseer' && (
        <>
          {activeView === 'dashboard' && <OverseerDashboard />}
          {activeView === 'settings' && <Settings />}
          {!['dashboard', 'settings'].includes(activeView) && <OverseerDashboard />}
        </>
      )}
    </Layout>
  );
};

export default App;
