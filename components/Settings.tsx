import React, { useState, useEffect } from 'react';
import { Save, Bell, DollarSign, Monitor, User as UserIcon, Palette, History, Zap, Server, ExternalLink, ShieldAlert, Database, CreditCard, Lock, BrainCircuit } from 'lucide-react';
import { StorageService } from '../services/storage';
import { AppSettings, User, CreditLog } from '../types';
import { THEME_COLORS, BUSINESS_TYPES } from '../constants';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(StorageService.getSettings());
  const [user, setUser] = useState<User | null>(StorageService.getUser());
  const [creditLogs, setCreditLogs] = useState<CreditLog[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setCreditLogs(StorageService.getCreditLogs());
  }, []);

  const handleSave = () => {
    StorageService.saveSettings(settings);
    if (user) StorageService.saveUser(user);
    
    // Force reload to apply theme variables effectively or trigger context update
    setSaved(true);
    setTimeout(() => {
        setSaved(false);
        window.location.reload();
    }, 1000);
  };

  if (!user) return null;

  const getAIStyleLabel = (val: number) => {
      if (val < 30) return "Simplified & Concise";
      if (val > 70) return "Granular & Data-Driven";
      return "Balanced Analysis";
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your preferences, billing, and business goals.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
        
        {/* Profile Section */}
        <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                <UserIcon className="w-4 h-4 mr-2" />
                Business Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Business Name</label>
                    <input 
                        type="text" 
                        value={user.name}
                        onChange={(e) => setUser({...user, name: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Business Type</label>
                    <select 
                        value={user.businessType}
                        onChange={(e) => setUser({...user, businessType: e.target.value as any})}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        {BUSINESS_TYPES.map(t => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>

        <hr className="border-slate-200 dark:border-slate-800" />

        {/* AI Analysis Style Section */}
        <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center">
                <BrainCircuit className="w-4 h-4 mr-2 text-primary-600" />
                AI Analysis Personality
            </h3>
            <p className="text-xs text-slate-500 mb-6">Choose how granular you want the One82 AI responses to be across the app.</p>
            
            <div className="space-y-4 px-2">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Concise</span>
                    <span className="text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-3 py-1 rounded-full border border-primary-100 dark:border-primary-800">
                        {getAIStyleLabel(settings.aiResponseStyle)}
                    </span>
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Granular</span>
                </div>
                <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={settings.aiResponseStyle}
                    onChange={(e) => setSettings({...settings, aiResponseStyle: parseInt(e.target.value)})}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="text-[10px] text-slate-500">Plain English summary, easy to read.</div>
                    <div className="text-[10px] text-slate-500">The standard mix of metrics and takeaways.</div>
                    <div className="text-[10px] text-slate-500">Heavy on percentages, jargon, and deep trends.</div>
                </div>
            </div>
        </div>

        <hr className="border-slate-200 dark:border-slate-800" />

        {/* Architecture Checklist Section */}
        <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                <Server className="w-4 h-4 mr-2" />
                Production Readiness Checklist
            </h3>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    <div className="p-3 flex items-start gap-3">
                        <Database className="w-4 h-4 text-yellow-600 mt-0.5" />
                        <div>
                            <span className="font-bold">Persistence:</span> Browser Storage. 
                            <span className="opacity-70 ml-1">Recommend moving to Postgres.</span>
                        </div>
                    </div>
                    <div className="p-3 flex items-start gap-3">
                        <ShieldAlert className="w-4 h-4 text-red-600 mt-0.5" />
                        <div>
                            <span className="font-bold">API Security:</span> Client-side Calls. 
                            <span className="opacity-70 ml-1">Recommend backend proxy.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <hr className="border-slate-200 dark:border-slate-800" />

        {/* Theme Color */}
         <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                <Palette className="w-4 h-4 mr-2" />
                Interface Color
            </h3>
            <div className="flex gap-4">
                {(Object.keys(THEME_COLORS) as Array<keyof typeof THEME_COLORS>).map(color => (
                    <button
                        key={color}
                        onClick={() => setSettings({...settings, primaryColor: color})}
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                            settings.primaryColor === color ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: `rgb(${THEME_COLORS[color][500]})` }}
                    >
                        {settings.primaryColor === color && <div className="w-2 h-2 bg-white rounded-full" />}
                    </button>
                ))}
            </div>
        </div>

        <hr className="border-slate-200 dark:border-slate-800" />

        {/* Revenue Goal */}
        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Monthly Revenue Goal
            </label>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input 
                    type="number" 
                    value={settings.revenueGoal}
                    onChange={(e) => setSettings({...settings, revenueGoal: Number(e.target.value)})}
                    className="w-full pl-8 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                />
            </div>
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between">
            <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
                    <Bell className="w-4 h-4 mr-2" />
                    Email Notifications
                </label>
                <p className="text-xs text-slate-500 mt-1">Receive weekly summary reports.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={settings.notifications}
                    onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
        </div>
        
        {/* Theme Preference */}
        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center">
                <Monitor className="w-4 h-4 mr-2" />
                Dark Mode
            </label>
            <select 
                value={settings.theme}
                onChange={(e) => setSettings({...settings, theme: e.target.value as any})}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System Default</option>
            </select>
        </div>

        <div className="pt-4">
            <button 
                onClick={handleSave}
                className="flex items-center justify-center px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all"
            >
                <Save className="w-4 h-4 mr-2" />
                {saved ? 'Saved!' : 'Save Changes'}
            </button>
            {saved && <p className="text-center text-xs text-green-600 mt-2">Changes saved. Reloading...</p>}
        </div>

      </div>
    </div>
  );
};

export default Settings;