
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, CreditCard, FileText, Settings, Menu, Moon, Sun,
  LogOut, MessageSquare, Briefcase, TrendingUp, Users, Mic, Plug2,
  DollarSign, Zap, Bell, ChevronRight, Package
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
  role?: UserRole;
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

  const NavItem = ({ view, icon: Icon, label }: { view: string; icon: any; label: string }) => {
    const isActive = activeView === view;
    return (
      <button
        onClick={() => { onNavigate(view); setIsSidebarOpen(false); }}
        className={`relative flex items-center w-full px-3 py-2.5 mb-0.5 text-sm font-medium rounded-lg transition-all duration-150 group ${isActive
            ? 'bg-gray-900 text-white'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
      >
        <Icon className={`w-4 h-4 mr-3 flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
        <span className="flex-1 text-left">{label}</span>
        {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
      </button>
    );
  };

  const NavSection = ({ label }: { label: string }) => (
    <p className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'dark' : ''}`}>
      {showLive && <LiveAssistant onClose={() => setShowLive(false)} />}

      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-60 flex flex-col
        bg-white border-r border-gray-200
        transform transition-transform duration-200 ease-in-out
        lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center h-16 px-5 border-b border-gray-200">
          <img 
            src="/logos/one82-logo-white-centered-v2.png" 
            alt="ONE82" 
            className="h-10 w-10 object-contain"
          />
          <span className="ml-3 text-gray-900 font-bold text-lg tracking-tight">ONE82</span>
          <span className="ml-2 text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-wide">
            {role === 'iso' ? 'ISO' : 'Pro'}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto scrollbar-none">
          <NavSection label="Overview" />
          <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />

          {role === 'merchant' && (
            <>
              <NavSection label="Business" />
              <NavItem view="forecast" icon={TrendingUp} label="Forecast" />
              <NavItem view="chat" icon={MessageSquare} label="Ask AI" />
              <NavItem view="transactions" icon={CreditCard} label="Transactions" />
              <NavItem view="customers" icon={Users} label="Customers" />
              <NavItem view="inventory" icon={Package} label="Inventory AI" />
            </>
          )}

          {role === 'iso' && (
            <>
              <NavSection label="Portfolio" />
              <NavItem view="statements" icon={FileText} label="Statement Analysis" />
              <NavItem view="portfolio" icon={Briefcase} label="Merchants" />
              <NavItem view="profitability" icon={DollarSign} label="Profitability" />
              <NavSection label="Settings" />
              <NavItem view="integrations" icon={Plug2} label="Integrations" />
            </>
          )}

          <NavItem view="settings" icon={Settings} label="Settings" />
        </nav>

        {/* Bottom panel */}
        <div className="p-3 border-t border-gray-200 space-y-2">
          {/* Voice assistant button */}
          <button
            onClick={() => setShowLive(true)}
            className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-bold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors gap-2"
          >
            <Mic className="w-4 h-4" /> Voice Assistant
          </button>

          {/* User card */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors cursor-default">
            <div className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-700 flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">{user?.plan} · {user?.credits} credits</p>
            </div>
            <button onClick={onLogout} className="text-gray-400 hover:text-gray-600 transition-colors" title="Sign out">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden bg-gray-50 dark:bg-gray-50">
        {/* Top bar */}
        <header className="flex items-center justify-between h-14 px-5 bg-white border-b border-gray-200 shadow-sm relative z-10">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-gray-500 rounded-lg lg:hidden hover:bg-gray-100"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {unreadCount > 0 && (
              <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
            )}

            <div className="flex items-center gap-2 pl-2 border-l border-gray-200 ml-1">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold text-gray-900">{user?.name}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">{role || 'User'}</p>
              </div>
              <div className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-700">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
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
