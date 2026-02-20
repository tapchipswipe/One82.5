
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import StatementReader from './components/StatementReader';
import Onboarding from './components/Onboarding';
import ISODashboard from './components/ISODashboard';
import InventoryManager from './components/InventoryManager';
import Login from './components/Login';
import Settings from './components/Settings';
import DataChat from './components/DataChat';
import Forecast from './components/Forecast';
import Customers from './components/Customers';
import MerchantLedger from './components/MerchantLedger';
import Integrations from './components/Integrations';
import Profitability from './components/Profitability';
import { StorageService } from './services/storage';
import { detectAnomalies } from './services/geminiService';
import { SimulationService } from './services/simulationService';
import { User, BusinessType, UserRole } from './types';
import { THEME_COLORS } from './constants';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const merchants = SimulationService.generatePortfolio();

  useEffect(() => {
    try {
      const storedUser = StorageService.getUser();
      if (storedUser) setUser(storedUser);
      const settings = StorageService.getSettings();
      if (settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) setDarkMode(true);
      const root = document.documentElement;
      const colorSet = THEME_COLORS[settings.primaryColor || 'green'];
      Object.entries(colorSet).forEach(([shade, value]) => root.style.setProperty(`--color-primary-${shade}`, value));
    } catch (e) {
      console.error("Initialization Failed:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Step 7: Proactive AI Guardrails (Background Anomaly Monitor) - MERCHANTS ONLY
  useEffect(() => {
    if (!user || user.role !== 'merchant') return;
    const monitor = async () => {
      const transactions = StorageService.getTransactions();
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
  const handleLogin = (u: User) => setUser(u);
  const handleLogout = () => { StorageService.clearUser(); setUser(null); };

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
  if (!user) return <div className={darkMode ? 'dark' : ''}><Login onLogin={handleLogin} /></div>;
  if (!user.onboardingComplete) return <div className={darkMode ? 'dark' : ''}><Onboarding onComplete={handleOnboardingComplete} /></div>;

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
          {activeView === 'settings' && <Settings />}
          {activeView === 'chat' && <DataChat />}
          {activeView === 'forecast' && <Forecast />}
          {activeView === 'customers' && <Customers />}
          {activeView === 'inventory' && <InventoryManager />}
        </>
      )}

      {user.role === 'iso' && (
        <>
          {activeView === 'dashboard' && <ISODashboard />}
          {activeView === 'statements' && <StatementReader />}
          {activeView === 'portfolio' && <div className="p-6"><MerchantLedger merchants={merchants} /></div>}
          {activeView === 'profitability' && <Profitability />}
          {activeView === 'integrations' && <Integrations />}
          {activeView === 'settings' && <Settings />}
          {/* Fallback */}
          {!['dashboard', 'statements', 'portfolio', 'profitability', 'integrations', 'settings'].includes(activeView) && <ISODashboard />}
        </>
      )}

      {/* Fallback for safety */}
      {user.role === 'admin' && activeView === 'statements' && <StatementReader />}
    </Layout>
  );
};

export default App;
