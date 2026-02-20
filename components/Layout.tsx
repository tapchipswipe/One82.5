
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, CreditCard, FileText, Settings, Menu, Moon, Sun,
  LogOut, MessageSquare, Briefcase, TrendingUp, Users, Mic, Package
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { AppNotification, User, UserRole } from '../types';
import LiveAssistant from './LiveAssistant';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onNavigate: (view: string) => void;
  darkMode: boolean;
  toggleTheme: () => void;
  role?: UserRole; // Added role prop
  businessType?: string;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({
  children, activeView, onNavigate, darkMode, toggleTheme, role, businessType, onLogout
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLive, setShowLive] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [user, setUser] = useState<User | null>(StorageService.getUser());

  useEffect(() => {
    setNotifications(StorageService.getNotifications());
    const update = () => setUser(StorageService.getUser());
    window.addEventListener('user-update', update);
    return () => window.removeEventListener('user-update', update);
  }, []);

  const NavItem = ({ view, icon: Icon, label }: { view: string, icon: any, label: string }) => {
    return (
      <button
        onClick={() => { onNavigate(view); setIsSidebarOpen(false); }}
        className={`flex items-center w-full px-4 py-3 mb-1 text-sm font-medium transition-colors rounded-lg group ${activeView === view ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
      >
        <Icon className={`w-5 h-5 mr-3 ${activeView === view ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`} />
        {label}
      </button>
    );
  };

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'dark' : ''}`}>
      {showLive && <LiveAssistant onClose={() => setShowLive(false)} />}

      {isSidebarOpen && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-200 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center h-16 px-6 border-b border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg mr-3">1</div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">One82</span>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />

            {/* Merchant Navigation */}
            {role === 'merchant' && (
              <>
                <NavItem view="forecast" icon={TrendingUp} label="Forecast" />
                <NavItem view="chat" icon={MessageSquare} label="Ask AI" />
                <NavItem view="transactions" icon={CreditCard} label="Transactions" />
                <NavItem view="customers" icon={Users} label="Customers" />
                <NavItem view="inventory" icon={Package} label="Inventory" />
              </>
            )}

            {/* ISO Navigation */}
            {role === 'iso' && (
              <>
                <NavItem view="statements" icon={FileText} label="Statement Goldmine" />
                <NavItem view="portfolio" icon={Briefcase} label="Merchants" />
              </>
            )}

            <NavItem view="settings" icon={Settings} label="Settings" />
          </nav>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-500">Credits</span>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{user?.credits}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{user?.plan} Tier</div>
            </div>

            <button onClick={() => setShowLive(true)} className="flex items-center justify-center w-full px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
              <Mic className="w-4 h-4 mr-2" /> Voice Assistant
            </button>

            <button onClick={onLogout} className="flex items-center w-full px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              <LogOut className="w-5 h-5 mr-3" /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-col flex-1 w-0 overflow-hidden bg-slate-50 dark:bg-black">
        <header className="flex items-center justify-between h-16 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm relative z-10">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-500 rounded-md lg:hidden hover:bg-slate-100 dark:hover:bg-slate-800">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <button onClick={toggleTheme} className="p-2 text-slate-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-slate-900 dark:text-white">{user?.name}</div>
                <div className="text-xs text-slate-500 uppercase">{role || 'User'}</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300">
                {user?.name.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
