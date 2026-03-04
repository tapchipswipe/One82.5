import React, { useState } from 'react';
import { Save, User as UserIcon, Building2, Mail, Briefcase } from 'lucide-react';
import { BUSINESS_TYPES } from '../constants';
import { User } from '../types';

interface ProfileProps {
  user: User;
  onSaveProfile: (user: User) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onSaveProfile }) => {
  const [draft, setDraft] = useState<User>(user);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSaveProfile(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Profile</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Update account details for your role.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-5">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Display Name</label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              value={draft.email}
              readOnly
              className="w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400"
            />
          </div>
        </div>

        {draft.role === 'merchant' && (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Business Type</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={draft.businessType}
                onChange={(e) => setDraft({ ...draft, businessType: e.target.value as User['businessType'] })}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
              >
                {BUSINESS_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {(draft.role === 'iso' || draft.role === 'overseer') && (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Organization</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={draft.organizationName || ''}
                onChange={(e) => setDraft({ ...draft, organizationName: e.target.value })}
                placeholder="Organization name"
                className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={handleSave}
            className="flex items-center justify-center px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all"
          >
            <Save className="w-4 h-4 mr-2" />
            {saved ? 'Saved' : 'Save Profile'}
          </button>
          {saved && <p className="text-xs text-green-600 mt-2">Profile updated.</p>}
        </div>
      </div>
    </div>
  );
};

export default Profile;
