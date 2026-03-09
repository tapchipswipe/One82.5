import React, { useState } from 'react';
import { Save, Bell, Monitor, User as UserIcon, Server, ShieldAlert, Database, Lock, BrainCircuit } from 'lucide-react';
import { StorageService } from '@/services/storage';
import { AppSettings, User } from '@/types';
import { BUSINESS_TYPES } from '@/constants';

const isTheme = (value: string): value is AppSettings['theme'] =>
    value === 'light' || value === 'dark';

const Settings: React.FC = () => {
    const [settings, setSettings] = useState<AppSettings>(() => {
        const stored = StorageService.getSettings();
        return {
            ...stored,
            theme: stored.theme === 'light' || stored.theme === 'dark' ? stored.theme : 'dark'
        };
    });
  const [user, setUser] = useState<User | null>(StorageService.getUser());
  const [saved, setSaved] = useState(false);

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
    const isMerchant = user.role === 'merchant';

  const getAIStyleLabel = (val: number) => {
      if (val < 30) return "Simplified & Concise";
      if (val > 70) return "Granular & Data-Driven";
      return "Balanced Analysis";
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your preferences, notifications, and account experience.</p>
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
                {isMerchant && (
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Business Type</label>
                        <select 
                            value={user.businessType}
                            onChange={(e) => setUser({ ...user, businessType: e.target.value as User['businessType'] })}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            {BUSINESS_TYPES.map(t => (
                                <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        </div>

        <hr className="border-slate-200 dark:border-slate-800" />

        {/* AI Analysis Style Section */}
        <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center">
                <BrainCircuit className="w-4 h-4 mr-2 text-primary-600" />
                AI Configuration (Response Style)
            </h3>
            <p className="text-xs text-slate-500 mb-2">Choose how granular you want the One82 AI responses to be across the app.</p>
            <p className="text-xs text-slate-500 mb-6">This does not change your source data. It only changes how AI explains the same data (concise vs detailed).</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">AI access is subscription-based for active accounts. One82 does not use or deduct AI credits.</p>
            
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

        {/* System Status Section */}
        <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                <Server className="w-4 h-4 mr-2" />
                System Trust Status
            </h3>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    <div className="p-3 flex items-start gap-3">
                        <Database className="w-4 h-4 text-green-600 mt-0.5" />
                        <div>
                            <span className="font-bold">Data Source:</span> Your current workspace mode controls whether dashboards use demo or auth/imported data.
                        </div>
                    </div>
                    <div className="p-3 flex items-start gap-3">
                        <ShieldAlert className="w-4 h-4 text-indigo-600 mt-0.5" />
                        <div>
                            <span className="font-bold">Security:</span> Integration keys are stored locally and used only for explicit integration actions.
                        </div>
                    </div>
                    <div className="p-3 flex items-start gap-3">
                        <Lock className="w-4 h-4 text-slate-600 dark:text-slate-300 mt-0.5" />
                        <div>
                            <span className="font-bold">Reliability:</span> If a live service is unavailable, One82 keeps core UX responsive with fallback behavior.
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <hr className="border-slate-200 dark:border-slate-800" />

        {isMerchant && null}

        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 text-xs text-slate-600 dark:text-slate-300">
            <p><span className="font-semibold">Credits:</span> Credits shown in legacy profile fields are informational demo metadata and do not gate core product usage.</p>
        </div>

        <hr className="border-slate-200 dark:border-slate-800" />

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

        <div className="flex items-center justify-between">
            <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
                    <BrainCircuit className="w-4 h-4 mr-2 text-primary-600" />
                    Show AI Confidence in Projections
                </label>
                <p className="text-xs text-slate-500 mt-1">Display confidence percentages on forecast and projection views.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.showAiConfidenceInProjections}
                    onChange={(e) => setSettings({ ...settings, showAiConfidenceInProjections: e.target.checked })}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
        </div>
        
        {/* Theme Preference */}
        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center">
                <Monitor className="w-4 h-4 mr-2" />
                Theme
            </label>
            <select 
                value={settings.theme}
                                onChange={(e) => {
                                    const nextTheme = e.target.value;
                                    if (!isTheme(nextTheme)) return;
                                    setSettings({ ...settings, theme: nextTheme });
                                }}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
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