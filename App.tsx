
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import StatementReader from './components/StatementReader';
import Onboarding from './components/Onboarding';
import Login from './components/Login';
import Settings from './components/Settings';
import DataChat from './components/DataChat';
import Forecast from './components/Forecast';
import Customers from './components/Customers';
import { StorageService } from './services/storage';
import { detectAnomalies } from './services/geminiService';
import { User, BusinessType } from './types';
import { THEME_COLORS } from './constants';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = StorageService.getUser();
    if (storedUser) setUser(storedUser);
    const settings = StorageService.getSettings();
    if (settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) setDarkMode(true);
    const root = document.documentElement;
    const colorSet = THEME_COLORS[settings.primaryColor || 'green'];
    Object.entries(colorSet).forEach(([shade, value]) => root.style.setProperty(`--color-primary-${shade}`, value));
    setLoading(false);
  }, []);

  // Step 7: Proactive AI Guardrails (Background Anomaly Monitor)
  useEffect(() => {
    if (!user) return;
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
  const handleOnboardingComplete = (type: BusinessType) => {
    if (user) {
        const updated = { ...user, businessType: type, onboardingComplete: true };
        setUser(updated);
        StorageService.saveUser(updated);
    }
  };

  if (loading) return null;
  if (!user) return <div className={darkMode ? 'dark' : ''}><Login onLogin={handleLogin} /></div>;
  if (!user.onboardingComplete) return <div className={darkMode ? 'dark' : ''}><Onboarding onComplete={handleOnboardingComplete} /></div>;

  return (
    <Layout activeView={activeView} onNavigate={setActiveView} darkMode={darkMode} toggleTheme={toggleTheme} businessType={user.businessType} onLogout={handleLogout}>
      {activeView === 'dashboard' && <Dashboard businessType={user.businessType} />}
      {activeView === 'transactions' && <Transactions />}
      {activeView === 'statements' && <StatementReader />}
      {activeView === 'settings' && <Settings />}
      {activeView === 'chat' && <DataChat />}
      {activeView === 'forecast' && <Forecast />}
      {activeView === 'customers' && <Customers />}
    </Layout>
  );
};

export default App;
