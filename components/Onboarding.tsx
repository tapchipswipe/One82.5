import React, { useState } from 'react';
import { BUSINESS_TYPES } from '../constants';
import { BusinessType, UserRole } from '../types';
import { Store, Building2 } from 'lucide-react';

interface OnboardingProps {
  onComplete: (role: UserRole, data: { businessType?: BusinessType, orgName?: string }) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<UserRole | null>(null);

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleMerchantComplete = (type: BusinessType) => {
    if (role === 'merchant') {
      onComplete('merchant', { businessType: type });
    }
  };

  const handleISOComplete = (orgName: string) => {
    onComplete('iso', { orgName });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
            {step === 1 ? 'Welcome to One82' : role === 'merchant' ? 'Select Business Type' : 'ISO Setup'}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            {step === 1 ? 'How will you be using the platform?' :
              role === 'merchant' ? 'Tailor your AI analytics to your industry.' :
                'Enter your organization details for portfolio management.'}
          </p>
        </div>

        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <button
              onClick={() => handleRoleSelect('merchant')}
              className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all text-left group"
            >
              <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Store className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Merchant</h3>
              <p className="text-slate-500 dark:text-slate-400">
                I run a business and want to optimize inventory and sales.
              </p>
            </button>

            <button
              onClick={() => handleRoleSelect('iso')}
              className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-purple-500 hover:shadow-lg transition-all text-left group"
            >
              <div className="bg-purple-100 dark:bg-purple-900/30 w-16 h-16 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Building2 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">ISO / Agent</h3>
              <p className="text-slate-500 dark:text-slate-400">
                I manage a portfolio of merchants and want to analyze statements.
              </p>
            </button>
          </div>
        )}

        {step === 2 && role === 'merchant' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {BUSINESS_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => handleMerchantComplete(type.id as BusinessType)}
                className="relative group p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-md transition-all text-left"
              >
                <div className="text-3xl mb-3">{type.icon}</div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">
                  {type.label}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Optimized AI models for {type.label.toLowerCase()} metrics.
                </p>
              </button>
            ))}
          </div>
        )}

        {step === 2 && role === 'iso' && (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Organization Name
            </label>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleISOComplete(formData.get('orgName') as string || 'My ISO');
            }}>
              <input
                type="text"
                name="orgName"
                placeholder="e.g. Apex Payments"
                className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent dark:text-white mb-4 focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-colors">
                Complete Setup
              </button>
            </form>
          </div>
        )}

        {step === 2 && (
          <button onClick={() => setStep(1)} className="mt-6 text-slate-500 hover:text-slate-700 text-sm flex items-center justify-center w-full">
            ← Back to Role Selection
          </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;